'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User, Customer, Product, CallLog, Order, HistoryLog, CustomerTier, TIER_CALL_DAYS, OrderStatus } from '@/types'
import { generateId, addDays } from './utils'
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_CALL_LOGS, MOCK_ORDERS, MOCK_HISTORY } from './mock-data'

interface AppState {
  currentUser: User | null
  users: User[]
  customers: Customer[]
  products: Product[]
  callLogs: CallLog[]
  orders: Order[]
  history: HistoryLog[]
  isLoading: boolean
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_DATA'; payload: Partial<AppState> }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_CALL_LOG'; payload: CallLog }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_HISTORY'; payload: HistoryLog }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: AppState = {
  currentUser: null,
  users: [],
  customers: [],
  products: [],
  callLogs: [],
  orders: [],
  history: [],
  isLoading: true,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER': return { ...state, currentUser: action.payload }
    case 'SET_DATA': return { ...state, ...action.payload }
    case 'ADD_USER': return { ...state, users: [...state.users, action.payload] }
    case 'UPDATE_USER': return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) }
    case 'DELETE_USER': return { ...state, users: state.users.filter(u => u.id !== action.payload) }
    case 'ADD_CUSTOMER': return { ...state, customers: [action.payload, ...state.customers] }
    case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload) }
    case 'ADD_PRODUCT': return { ...state, products: [action.payload, ...state.products] }
    case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) }
    case 'ADD_CALL_LOG': return { ...state, callLogs: [action.payload, ...state.callLogs] }
    case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders] }
    case 'UPDATE_ORDER': return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? action.payload : o) }
    case 'ADD_HISTORY': return { ...state, history: [action.payload, ...state.history] }
    case 'SET_LOADING': return { ...state, isLoading: action.payload }
    default: return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  addHistory: (eventType: HistoryLog['eventType'], description: string, relatedId?: string, relatedType?: string) => void
  completeCall: (customerId: string, result: CallLog['result'], notes: string, followUpAt?: string, orderItems?: Order['items'], discount?: number) => void
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string) => void
} | null>(null)

const STORAGE_KEY = 'crm_data'

function loadData(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function saveData(state: AppState) {
  try {
    const { currentUser, isLoading, ...data } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const stored = localStorage.getItem('crm_user')
    if (stored) {
      try { dispatch({ type: 'SET_USER', payload: JSON.parse(stored) }) } catch {}
    }
    const saved = loadData()
    dispatch({
      type: 'SET_DATA',
      payload: {
        users: saved.users?.length ? saved.users : MOCK_USERS,
        customers: saved.customers?.length ? saved.customers : MOCK_CUSTOMERS,
        products: saved.products?.length ? saved.products : MOCK_PRODUCTS,
        callLogs: saved.callLogs?.length ? saved.callLogs : MOCK_CALL_LOGS,
        orders: saved.orders?.length ? saved.orders : MOCK_ORDERS,
        history: saved.history?.length ? saved.history : MOCK_HISTORY,
      },
    })
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  useEffect(() => {
    if (!state.isLoading) saveData(state)
  }, [state])

  async function login(email: string, password: string): Promise<boolean> {
    const user = state.users.find(u => u.email === email && u.password === password)
    if (!user) return false
    const safe = { ...user, password: undefined }
    dispatch({ type: 'SET_USER', payload: safe })
    localStorage.setItem('crm_user', JSON.stringify(safe))
    return true
  }

  function logout() {
    localStorage.removeItem('crm_user')
    dispatch({ type: 'SET_USER', payload: null })
  }

  function addHistory(eventType: HistoryLog['eventType'], description: string, relatedId?: string, relatedType?: string) {
    if (!state.currentUser) return
    const log: HistoryLog = {
      id: generateId(),
      eventType,
      description,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      relatedId,
      relatedType,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_HISTORY', payload: log })
  }

  function completeCall(
    customerId: string,
    result: CallLog['result'],
    notes: string,
    followUpAt?: string,
    orderItems?: Order['items'],
    discount = 0
  ) {
    if (!state.currentUser) return
    const customer = state.customers.find(c => c.id === customerId)
    if (!customer) return

    const callLog: CallLog = {
      id: generateId(),
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      telesaleId: state.currentUser.id,
      telesaleName: state.currentUser.name,
      result,
      notes,
      followUpAt,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_CALL_LOG', payload: callLog })
    addHistory('call_made', `โทรหา ${customer.name} — ${result === 'closed' ? 'ปิดได้' : result === 'follow_up' ? 'Follow Up' : result === 'no_answer' ? 'ไม่รับโทร' : 'ไม่สนใจ'}`, callLog.id, 'call_log')

    // Recalculate next call date
    const tier: CustomerTier = customer.tier
    const nextCallAt = result === 'follow_up' && followUpAt
      ? followUpAt
      : addDays(new Date(), TIER_CALL_DAYS[tier])

    const updatedCustomer: Customer = {
      ...customer,
      lastCallAt: new Date().toISOString(),
      nextCallAt,
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer })

    // Create order if closed
    if (result === 'closed' && orderItems && orderItems.length > 0) {
      const totalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0)
      const order: Order = {
        id: generateId(),
        customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        telesaleId: state.currentUser.id,
        telesaleName: state.currentUser.name,
        status: 'pending_pack',
        items: orderItems,
        totalAmount,
        discount,
        callLogId: callLog.id,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_ORDER', payload: order })
      addHistory('order_created', `สร้างออเดอร์ลูกค้า ${customer.name} ยอด ${(totalAmount - discount).toLocaleString()} บาท`, order.id, 'order')
    }
  }

  function updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string) {
    if (!state.currentUser) return
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return

    const updated: Order = {
      ...order,
      status,
      trackingNumber: trackingNumber ?? order.trackingNumber,
      packingId: state.currentUser.role === 'packing' ? state.currentUser.id : order.packingId,
      packingName: state.currentUser.role === 'packing' ? state.currentUser.name : order.packingName,
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'UPDATE_ORDER', payload: updated })

    const eventMap: Record<string, HistoryLog['eventType']> = {
      packing: 'order_packed',
      shipped: 'order_shipped',
      delivered: 'order_delivered',
      returned: 'order_returned',
    }
    const labelMap: Record<string, string> = {
      packing: 'กำลังแพ็กสินค้า',
      shipped: `จัดส่งแล้ว เลขพัสดุ ${trackingNumber ?? ''}`,
      delivered: 'ส่งสำเร็จ',
      returned: 'คืนสินค้า',
    }
    if (eventMap[status]) {
      addHistory(eventMap[status], `${labelMap[status]} ออเดอร์ ${order.customerName}`, orderId, 'order')
    }

    // Update customer stats on delivered/returned
    if (status === 'delivered' || status === 'returned') {
      const customer = state.customers.find(c => c.id === order.customerId)
      if (!customer) return
      const newTotal = status === 'delivered' ? customer.totalOrders + 1 : customer.totalOrders
      const newAmount = status === 'delivered' ? customer.totalAmount + (order.totalAmount - order.discount) : customer.totalAmount
      const successRate = Math.round((newTotal / Math.max(newTotal + (status === 'returned' ? 1 : 0), 1)) * 100)
      const newTier: CustomerTier = successRate >= 85 && newTotal >= 5 ? 'vip' : newTotal >= 2 ? 'warm' : 'cold'
      const tierChanged = newTier !== customer.tier
      dispatch({
        type: 'UPDATE_CUSTOMER', payload: {
          ...customer,
          totalOrders: newTotal,
          totalAmount: newAmount,
          successRate,
          tier: newTier,
          updatedAt: new Date().toISOString(),
        }
      })
      if (tierChanged) addHistory('customer_tier_changed', `${customer.name} เปลี่ยนระดับเป็น ${newTier.toUpperCase()}`, customer.id, 'customer')
    }
  }

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout, addHistory, completeCall, updateOrderStatus }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function useCurrentUser() {
  return useApp().state.currentUser
}
