'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import {
  User, UserRole, Customer, Product, CallLog, Order, OrderItem, HistoryLog,
  CustomerGrade, GRADE_CALL_DAYS, GRADE_COMMISSION_RATE,
  OrderStatus, Carrier, OrderShippingInfo, EditHistoryEntry,
  PaymentMethod, GradeSettings, DEFAULT_GRADE_SETTINGS,
  ShippingProfile, resolveOrderShipping,
  computeCommission, computeCustomerGrade,
} from '@/types'
import { generateId, addDays } from './utils'
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_CALL_LOGS, MOCK_ORDERS, MOCK_HISTORY, MOCK_SHIPPING_PROFILES } from './mock-data'
import { supabase, isSupabaseEnabled } from './supabase'
import * as ds from './data-service'

interface AppState {
  currentUser: User | null
  users: User[]
  customers: Customer[]
  products: Product[]
  callLogs: CallLog[]
  orders: Order[]
  history: HistoryLog[]
  gradeSettings: GradeSettings
  shippingProfiles: ShippingProfile[]
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
  | { type: 'BULK_ADD_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_CALL_LOG'; payload: CallLog }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_HISTORY'; payload: HistoryLog }
  | { type: 'SET_GRADE_SETTINGS'; payload: GradeSettings }
  | { type: 'ADD_SHIPPING_PROFILE'; payload: ShippingProfile }
  | { type: 'UPDATE_SHIPPING_PROFILE'; payload: ShippingProfile }
  | { type: 'DELETE_SHIPPING_PROFILE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE_DATA'; payload: Partial<AppState> }

const initialState: AppState = {
  currentUser: null, users: [], customers: [], products: [], callLogs: [], orders: [], history: [],
  gradeSettings: DEFAULT_GRADE_SETTINGS,
  shippingProfiles: [],
  isLoading: true,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER': return { ...state, currentUser: action.payload }
    case 'SET_DATA': return { ...state, ...action.payload }
    case 'ADD_USER': return state.users.some(u => u.id === action.payload.id) ? state : { ...state, users: [...state.users, action.payload] }
    case 'UPDATE_USER': return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) }
    case 'DELETE_USER': return { ...state, users: state.users.filter(u => u.id !== action.payload) }
    case 'ADD_CUSTOMER': return state.customers.some(c => c.id === action.payload.id) ? state : { ...state, customers: [action.payload, ...state.customers] }
    case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload) }
    case 'BULK_ADD_CUSTOMERS': {
      const existingIds = new Set(state.customers.map(c => c.id))
      const newOnes = action.payload.filter(c => !existingIds.has(c.id))
      return { ...state, customers: [...newOnes, ...state.customers] }
    }
    case 'ADD_PRODUCT': return state.products.some(p => p.id === action.payload.id) ? state : { ...state, products: [action.payload, ...state.products] }
    case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) }
    case 'ADD_CALL_LOG': return state.callLogs.some(c => c.id === action.payload.id) ? state : { ...state, callLogs: [action.payload, ...state.callLogs] }
    case 'ADD_ORDER': return state.orders.some(o => o.id === action.payload.id) ? state : { ...state, orders: [action.payload, ...state.orders] }
    case 'UPDATE_ORDER': return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? action.payload : o) }
    case 'ADD_HISTORY': return state.history.some(h => h.id === action.payload.id) ? state : { ...state, history: [action.payload, ...state.history] }
    case 'SET_GRADE_SETTINGS': return { ...state, gradeSettings: action.payload }
    case 'ADD_SHIPPING_PROFILE': return state.shippingProfiles.some(p => p.id === action.payload.id) ? state : { ...state, shippingProfiles: [...state.shippingProfiles, action.payload] }
    case 'UPDATE_SHIPPING_PROFILE': return { ...state, shippingProfiles: state.shippingProfiles.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_SHIPPING_PROFILE': return { ...state, shippingProfiles: state.shippingProfiles.filter(p => p.id !== action.payload) }
    case 'SET_LOADING': return { ...state, isLoading: action.payload }
    case 'RESTORE_DATA': return { ...state, ...action.payload }
    default: return state
  }
}

export interface OrderImportRow {
  /** External Order No. (e.g. from MyOrder); if provided used as order id */
  externalId?: string
  channel?: string
  orderDate?: string                   // ISO or DD/MM/YYYY [HH:MM]
  name: string
  phone: string
  address?: string
  productSku?: string
  productName: string
  price: number
  cost?: number
  quantity?: number
  weightKg?: number
  discount?: number
  shippingFee?: number
  carrier?: Carrier
  trackingNumber?: string
  status?: OrderStatus
  paymentMethod?: PaymentMethod
  totalAmount?: number                 // raw "ยอดเงิน" from file (overrides price*qty if provided)
  telesaleName?: string
  createdByName?: string
  source?: string
  notes?: string
}

interface AppCtx {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  addHistory: (eventType: HistoryLog['eventType'], description: string, relatedId?: string, relatedType?: string) => void

  /** Complete a call. If closed + items, creates Order in wait_pack with optional shipping override. */
  completeCall: (opts: {
    customerId: string
    result: CallLog['result']
    notes: string
    followUpAt?: string
    items?: OrderItem[]
    discount?: number
    /** Override shipping for THIS order only */
    shippingOverride?: OrderShippingInfo
    /** If true, also save this shipping info as customer's latest data */
    saveAsCustomerLatest?: boolean
  }) => void

  /** Generic status update with extras */
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    extras?: {
      trackingNumber?: string; carrier?: Carrier;
      returnReason?: string; cancelReason?: string;
      shippingFee?: number;
      realShippingFee?: number; realCodBaht?: number; useRealForProfit?: boolean;
    }
  ) => void

  /** Packer pressed "คัดลอกข้อมูล" → transitions WAIT_PACK → IN_MYORDER and returns copy text */
  copyOrderData: (orderId: string) => string

  assignOwner: (customerId: string, ownerId: string | null) => void
  setCustomerGrade: (customerId: string, grade: CustomerGrade) => void
  /** Update customer + record edit history */
  updateCustomerWithHistory: (customerId: string, changes: Partial<Customer>) => void

  bulkImportCustomers: (rows: Array<Partial<Customer> & { name: string; phone: string }>) => number
  bulkImportOrders: (rows: OrderImportRow[]) => { orders: number; newCustomers: number }
  updateGradeSettings: (settings: GradeSettings) => void
  recalculateAllGrades: () => { updated: number; total: number }

  saveShippingProfile: (profile: ShippingProfile) => void
  deleteShippingProfile: (id: string) => void
}

const AppContext = createContext<AppCtx | null>(null)
const STORAGE_KEY = 'crm_data'

/* eslint-disable @typescript-eslint/no-explicit-any */
function migrate(data: any): Partial<AppState> {
  if (!data || typeof data !== 'object') return {}

  // Users: auto-merge missing demo accounts + drop "checker" role → "packing"
  if (Array.isArray(data.users)) {
    data.users = data.users.map((u: any) => {
      if (u.role === 'checker') u.role = 'packing'
      return u
    })
    const existingEmails = new Set(data.users.map((u: any) => (u.email ?? '').toLowerCase()))
    const missing = MOCK_USERS.filter(m => !existingEmails.has(m.email.toLowerCase()))
    if (missing.length) data.users = [...data.users, ...missing]
  }

  // Customers: tier → grade
  if (Array.isArray(data.customers)) {
    data.customers = data.customers.map((c: any) => {
      if (!c.grade && c.tier) {
        const map: Record<string, CustomerGrade> = { vip: 'A', warm: 'B', cold: 'D' }
        c.grade = map[c.tier as string] ?? 'D'
      }
      if (!c.grade) c.grade = 'D'
      delete c.tier
      return c
    })
  }

  // Products: ensure cost field
  if (Array.isArray(data.products)) {
    data.products = data.products.map((p: any) => ({
      ...p,
      cost: typeof p.cost === 'number' ? p.cost : Math.round((p.price ?? 0) * 0.4),
    }))
  }

  // Orders: pending_pack → wait_pack, shipping_check → shipping
  if (Array.isArray(data.orders)) {
    data.orders = data.orders.map((o: any) => {
      if (o.status === 'pending_pack') o.status = 'wait_pack'
      if (o.status === 'shipped') o.status = 'shipping'
      if (o.status === 'shipping_check') o.status = 'shipping'
      if (!Array.isArray(o.items)) o.items = []
      o.items = o.items.map((i: any) => ({ ...i, cost: typeof i.cost === 'number' ? i.cost : 0 }))
      if (typeof o.totalCost !== 'number') {
        o.totalCost = o.items.reduce((s: number, i: any) => s + (i.cost ?? 0) * (i.quantity ?? 0), 0)
      }
      return o
    })
  }

  return data as Partial<AppState>
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function loadData(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrate(JSON.parse(raw))
  } catch {}
  return {}
}

function saveData(state: AppState) {
  try {
    const data = {
      users: state.users, customers: state.customers, products: state.products,
      callLogs: state.callLogs, orders: state.orders, history: state.history,
      gradeSettings: state.gradeSettings,
      shippingProfiles: state.shippingProfiles,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// Legacy helper — kept for backward compat. New logic uses computeCustomerGrade from @/types.
function deriveGrade(
  deliveredCount: number,
  returnedCount: number,
  totalAmount: number,
  settings?: GradeSettings,
): CustomerGrade {
  return computeCustomerGrade({ deliveredCount, returnedCount, totalAmount, settings })
}

/** Generate human-readable order ID: ORD680527-001 (Thai year + month-day + sequence) */
function nextOrderId(existing: Order[]): string {
  const now = new Date()
  const yy = String((now.getFullYear() + 543) % 1000).padStart(3, '0') // BE year last 3 digits
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const prefix = `ORD${yy}${mm}${dd}`
  const todayOrders = existing.filter(o => o.id.startsWith(prefix))
  const seq = String(todayOrders.length + 1).padStart(3, '0')
  return `${prefix}-${seq}`
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatchRaw] = useReducer(reducer, initialState)
  // Surfaces a red banner when a Supabase write fails (instead of failing silently)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Wrap dispatch to also persist changes to Supabase (fire-and-forget)
  const dispatch = useCallback((action: AppAction) => {
    dispatchRaw(action)
    if (!isSupabaseEnabled() || !supabase) return
    ;(async () => {
      try {
        switch (action.type) {
          case 'ADD_PRODUCT':
          case 'UPDATE_PRODUCT':
            await ds.upsertProduct(action.payload); break
          case 'DELETE_PRODUCT':
            await ds.deleteProduct(action.payload); break
          case 'ADD_CUSTOMER':
          case 'UPDATE_CUSTOMER':
            await ds.upsertCustomer(action.payload); break
          case 'DELETE_CUSTOMER':
            await ds.deleteCustomer(action.payload); break
          case 'BULK_ADD_CUSTOMERS':
            await ds.bulkInsertCustomers(action.payload); break
          case 'ADD_CALL_LOG':
            await ds.insertCallLog(action.payload); break
          case 'ADD_ORDER':
          case 'UPDATE_ORDER':
            await ds.upsertOrder(action.payload); break
          case 'ADD_HISTORY':
            await ds.insertHistory(action.payload); break
          case 'ADD_SHIPPING_PROFILE':
          case 'UPDATE_SHIPPING_PROFILE':
            await ds.upsertShippingProfile(action.payload); break
          case 'DELETE_SHIPPING_PROFILE':
            await ds.deleteShippingProfile(action.payload); break
          case 'SET_GRADE_SETTINGS':
            await ds.updateGradeSettings(action.payload); break
          case 'UPDATE_USER':
            await ds.updateUserProfile(action.payload); break
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn('Supabase persist failed:', action.type, e)
        setSyncError(`บันทึกลงระบบไม่สำเร็จ (${action.type}): ${msg}`)
      }
    })()
  }, [])

  useEffect(() => {
    let cleanupChannel: (() => void) | null = null
    async function init() {
      // ─── Auth: prefer Supabase session ───
      if (isSupabaseEnabled() && supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profile) {
            const supaUser: User = {
              id: session.user.id,
              name: profile.name ?? session.user.email?.split('@')[0] ?? 'User',
              email: session.user.email ?? '',
              role: (profile.role ?? 'telesale') as UserRole,
              department: profile.department ?? undefined,
              phone: profile.phone ?? undefined,
              commissionRate: profile.commission_rate ?? undefined,
              permissions: profile.permissions ?? undefined,
              active: profile.active !== false,
            }
            dispatchRaw({ type: 'SET_USER', payload: supaUser })
            localStorage.setItem('crm_user', JSON.stringify(supaUser))
          }
        }
        // Subscribe to auth state changes for cross-tab sync
        supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT') {
            localStorage.removeItem('crm_user')
            dispatchRaw({ type: 'SET_USER', payload: null })
          }
        })

        // ─── Data: load from Supabase ───
        const snapshot = await ds.loadAllData()
        if (snapshot) {
          dispatchRaw({
            type: 'SET_DATA',
            payload: {
              users: snapshot.users.length ? snapshot.users : MOCK_USERS,
              customers: snapshot.customers,
              products: snapshot.products,
              callLogs: snapshot.callLogs,
              orders: snapshot.orders,
              history: snapshot.history,
              gradeSettings: snapshot.gradeSettings,
              shippingProfiles: snapshot.shippingProfiles,
            },
          })
        }

        // ─── Realtime: subscribe to all data tables ───
        const channel = supabase.channel('cnp-crm-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
            if (payload.eventType === 'INSERT') dispatchRaw({ type: 'ADD_CUSTOMER', payload: ds.rowToCustomer(payload.new) })
            else if (payload.eventType === 'UPDATE') dispatchRaw({ type: 'UPDATE_CUSTOMER', payload: ds.rowToCustomer(payload.new) })
            else if (payload.eventType === 'DELETE') dispatchRaw({ type: 'DELETE_CUSTOMER', payload: (payload.old as { id: string }).id })
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
            if (payload.eventType === 'INSERT') dispatchRaw({ type: 'ADD_PRODUCT', payload: ds.rowToProduct(payload.new) })
            else if (payload.eventType === 'UPDATE') dispatchRaw({ type: 'UPDATE_PRODUCT', payload: ds.rowToProduct(payload.new) })
            else if (payload.eventType === 'DELETE') dispatchRaw({ type: 'DELETE_PRODUCT', payload: (payload.old as { id: string }).id })
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            if (payload.eventType === 'INSERT') dispatchRaw({ type: 'ADD_ORDER', payload: ds.rowToOrder(payload.new) })
            else if (payload.eventType === 'UPDATE') dispatchRaw({ type: 'UPDATE_ORDER', payload: ds.rowToOrder(payload.new) })
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_logs' }, (payload) => {
            dispatchRaw({ type: 'ADD_CALL_LOG', payload: ds.rowToCallLog(payload.new) })
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'history_logs' }, (payload) => {
            dispatchRaw({ type: 'ADD_HISTORY', payload: ds.rowToHistory(payload.new) })
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'shipping_profiles' }, (payload) => {
            if (payload.eventType === 'INSERT') dispatchRaw({ type: 'ADD_SHIPPING_PROFILE', payload: ds.rowToShippingProfile(payload.new) })
            else if (payload.eventType === 'UPDATE') dispatchRaw({ type: 'UPDATE_SHIPPING_PROFILE', payload: ds.rowToShippingProfile(payload.new) })
            else if (payload.eventType === 'DELETE') dispatchRaw({ type: 'DELETE_SHIPPING_PROFILE', payload: (payload.old as { id: string }).id })
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'grade_settings' }, (payload) => {
            if (payload.new) dispatchRaw({ type: 'SET_GRADE_SETTINGS', payload: ds.rowToGradeSettings(payload.new) })
          })
          .subscribe()

        // Cleanup on unmount
        cleanupChannel = () => {
          supabase?.removeChannel(channel)
        }
      } else {
        // ─── Fallback: localStorage user + mock data ───
        const stored = localStorage.getItem('crm_user')
        if (stored) {
          try { dispatchRaw({ type: 'SET_USER', payload: JSON.parse(stored) }) } catch {}
        }
        const saved = loadData()
        dispatchRaw({
          type: 'SET_DATA',
          payload: {
            users: saved.users?.length ? saved.users : MOCK_USERS,
            customers: saved.customers?.length ? saved.customers : MOCK_CUSTOMERS,
            products: saved.products?.length ? saved.products : MOCK_PRODUCTS,
            callLogs: saved.callLogs?.length ? saved.callLogs : MOCK_CALL_LOGS,
            orders: saved.orders?.length ? saved.orders : MOCK_ORDERS,
            history: saved.history?.length ? saved.history : MOCK_HISTORY,
            gradeSettings: saved.gradeSettings ?? DEFAULT_GRADE_SETTINGS,
            shippingProfiles: saved.shippingProfiles?.length ? saved.shippingProfiles : MOCK_SHIPPING_PROFILES,
          },
        })
      }
      dispatchRaw({ type: 'SET_LOADING', payload: false })
    }
    init()
    return () => { if (cleanupChannel) cleanupChannel() }
  }, [])

  useEffect(() => {
    // Only persist to localStorage in mock mode; Supabase is source of truth otherwise
    if (!state.isLoading && !isSupabaseEnabled()) saveData(state)
  }, [state])

  async function login(email: string, password: string): Promise<boolean> {
    // ─── Supabase Auth (if configured) ───
    if (isSupabaseEnabled() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) return false

      // Fetch profile from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      const supaUser: User = {
        id: data.user.id,
        name: profile?.name ?? data.user.email?.split('@')[0] ?? 'User',
        email: data.user.email ?? email,
        role: (profile?.role ?? 'telesale') as UserRole,
        department: profile?.department ?? undefined,
        phone: profile?.phone ?? undefined,
        commissionRate: profile?.commission_rate ?? undefined,
        permissions: profile?.permissions ?? undefined,
        active: profile?.active !== false,
      }
      dispatch({ type: 'SET_USER', payload: supaUser })
      localStorage.setItem('crm_user', JSON.stringify(supaUser))
      return true
    }

    // ─── Fallback: mock auth (localStorage only) ───
    const user = state.users.find(u => u.email === email && u.password === password)
    if (!user) return false
    const safe = { ...user, password: undefined }
    dispatch({ type: 'SET_USER', payload: safe })
    localStorage.setItem('crm_user', JSON.stringify(safe))
    return true
  }

  async function logout() {
    if (isSupabaseEnabled() && supabase) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('crm_user')
    dispatch({ type: 'SET_USER', payload: null })
  }

  function addHistory(eventType: HistoryLog['eventType'], description: string, relatedId?: string, relatedType?: string) {
    if (!state.currentUser) return
    const log: HistoryLog = {
      id: generateId(), eventType, description,
      userId: state.currentUser.id, userName: state.currentUser.name,
      relatedId, relatedType, createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_HISTORY', payload: log })
  }

  function assignOwner(customerId: string, ownerId: string | null) {
    const customer = state.customers.find(c => c.id === customerId)
    if (!customer) return
    const owner = ownerId ? state.users.find(u => u.id === ownerId) : null
    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: { ...customer, ownerId: owner?.id, ownerName: owner?.name, updatedAt: new Date().toISOString() },
    })
    addHistory('customer_assigned',
      owner ? `กำหนด ${customer.name} → ${owner.name}` : `ยกเลิกเจ้าของดูแล ${customer.name}`,
      customerId, 'customer'
    )
  }

  function setCustomerGrade(customerId: string, grade: CustomerGrade) {
    const customer = state.customers.find(c => c.id === customerId)
    if (!customer || customer.grade === grade) return
    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: { ...customer, grade, nextCallAt: customer.nextCallAt ?? addDays(new Date(), GRADE_CALL_DAYS[grade]), updatedAt: new Date().toISOString() },
    })
    addHistory('customer_grade_changed', `${customer.name} เปลี่ยน Grade เป็น ${grade}`, customerId, 'customer')
  }

  function updateCustomerWithHistory(customerId: string, changes: Partial<Customer>) {
    if (!state.currentUser) return
    const customer = state.customers.find(c => c.id === customerId)
    if (!customer) return

    const trackable: Array<{ key: keyof Customer; label: string }> = [
      { key: 'name', label: 'ชื่อ' },
      { key: 'phone', label: 'เบอร์โทร' },
      { key: 'address', label: 'ที่อยู่' },
      { key: 'line', label: 'Line' },
      { key: 'notes', label: 'หมายเหตุ' },
    ]
    const entries: EditHistoryEntry[] = []
    for (const { key, label } of trackable) {
      const oldVal = String(customer[key] ?? '')
      const newVal = String(changes[key] ?? oldVal)
      if (changes[key] !== undefined && oldVal !== newVal) {
        entries.push({
          id: generateId(), at: new Date().toISOString(),
          userId: state.currentUser.id, userName: state.currentUser.name,
          field: label, from: oldVal || '-', to: newVal || '-',
        })
      }
    }
    const updated: Customer = {
      ...customer,
      ...changes,
      editHistory: [...(customer.editHistory ?? []), ...entries],
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'UPDATE_CUSTOMER', payload: updated })
    if (entries.length) {
      addHistory('customer_edited', `แก้ไขข้อมูล ${customer.name}: ${entries.map(e => e.field).join(', ')}`, customerId, 'customer')
    }
  }

  function completeCall(opts: {
    customerId: string
    result: CallLog['result']
    notes: string
    followUpAt?: string
    items?: OrderItem[]
    discount?: number
    shippingOverride?: OrderShippingInfo
    saveAsCustomerLatest?: boolean
  }) {
    if (!state.currentUser) return
    const customer = state.customers.find(c => c.id === opts.customerId)
    if (!customer) return

    const callLog: CallLog = {
      id: generateId(), customerId: customer.id,
      customerName: customer.name, customerPhone: customer.phone,
      telesaleId: state.currentUser.id, telesaleName: state.currentUser.name,
      result: opts.result, notes: opts.notes, followUpAt: opts.followUpAt,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_CALL_LOG', payload: callLog })

    const resultLabel =
      opts.result === 'closed' ? 'ปิดได้' :
      opts.result === 'follow_up' ? 'Follow Up' :
      opts.result === 'no_answer' ? 'ไม่รับสาย' : 'ไม่สนใจ'
    addHistory('call_made', `โทรหา ${customer.name} — ${resultLabel}`, callLog.id, 'call_log')

    const nextCallAt = opts.result === 'follow_up' && opts.followUpAt
      ? opts.followUpAt
      : addDays(new Date(), state.gradeSettings.callDays[customer.grade])

    let updatedCustomer: Customer = {
      ...customer,
      ownerId: customer.ownerId ?? state.currentUser.id,
      ownerName: customer.ownerName ?? state.currentUser.name,
      lastCallAt: new Date().toISOString(),
      nextCallAt,
      updatedAt: new Date().toISOString(),
    }

    // If saving shipping override as customer's latest data
    if (opts.shippingOverride && opts.saveAsCustomerLatest) {
      const s = opts.shippingOverride
      const newAddress = [s.addressLine, s.subDistrict, s.district, s.province, s.postalCode].filter(Boolean).join(' ').trim()
      const editEntries: EditHistoryEntry[] = []
      if (s.recipientName && s.recipientName !== customer.name) {
        editEntries.push({
          id: generateId(), at: new Date().toISOString(), userId: state.currentUser.id, userName: state.currentUser.name,
          field: 'ชื่อ', from: customer.name, to: s.recipientName,
        })
      }
      if (s.recipientPhone && s.recipientPhone !== customer.phone) {
        editEntries.push({
          id: generateId(), at: new Date().toISOString(), userId: state.currentUser.id, userName: state.currentUser.name,
          field: 'เบอร์โทร', from: customer.phone, to: s.recipientPhone,
        })
      }
      if (newAddress && newAddress !== (customer.address ?? '')) {
        editEntries.push({
          id: generateId(), at: new Date().toISOString(), userId: state.currentUser.id, userName: state.currentUser.name,
          field: 'ที่อยู่', from: customer.address || '-', to: newAddress,
        })
      }
      updatedCustomer = {
        ...updatedCustomer,
        name: s.recipientName ?? updatedCustomer.name,
        phone: s.recipientPhone ?? updatedCustomer.phone,
        address: newAddress || updatedCustomer.address,
        addressDetail: {
          line: s.addressLine, subDistrict: s.subDistrict, district: s.district,
          province: s.province, postalCode: s.postalCode,
        },
        editHistory: [...(customer.editHistory ?? []), ...editEntries],
      }
      if (editEntries.length) {
        addHistory('customer_edited', `แก้ไขข้อมูล ${customer.name} จากออเดอร์ใหม่`, customer.id, 'customer')
      }
    }
    dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer })

    if (opts.result === 'closed' && opts.items && opts.items.length > 0) {
      const totalAmount = opts.items.reduce((s, i) => s + i.subtotal, 0)
      const totalCost = opts.items.reduce((s, i) => s + i.cost * i.quantity, 0)
      const itemProductIds = opts.items.map(i => i.productId)
      const resolved = resolveOrderShipping(itemProductIds, state.shippingProfiles, totalAmount - (opts.discount ?? 0))
      const order: Order = {
        id: nextOrderId(state.orders),
        customerId: customer.id,
        customerName: opts.shippingOverride?.recipientName ?? customer.name,
        customerPhone: opts.shippingOverride?.recipientPhone ?? customer.phone,
        customerAddress: customer.address,
        shipping: opts.shippingOverride,
        telesaleId: state.currentUser.id,
        telesaleName: state.currentUser.name,
        status: 'wait_pack',
        items: opts.items,
        totalAmount,
        totalCost,
        discount: opts.discount ?? 0,
        // shipping profile snapshot
        shippingProfileId: resolved.profileId,
        shippingProfileName: resolved.profileName,
        shippingFee: resolved.shippingFee,
        standardCodBaht: resolved.codBaht,
        callLogId: callLog.id,
        notes: opts.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_ORDER', payload: order })
      addHistory('order_created', `สร้างออเดอร์ ${order.id} ลูกค้า ${customer.name} ยอด ${(totalAmount - (opts.discount ?? 0)).toLocaleString()} บาท`, order.id, 'order')
    }
  }

  function copyOrderData(orderId: string): string {
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return ''
    const ship = order.shipping
    const name = ship?.recipientName ?? order.customerName
    const phone = ship?.recipientPhone ?? order.customerPhone
    const addr = [ship?.addressLine, ship?.subDistrict, ship?.district, ship?.province, ship?.postalCode].filter(Boolean).join(' ') || order.customerAddress || ''
    const productSummary = order.items.map(i => `${i.productName} x${i.quantity}`).join(' + ')
    const codAmount = order.totalAmount - order.discount

    const lines = [
      `ชื่อ: ${name}`,
      `เบอร์: ${phone}`,
      `ที่อยู่: ${addr}`,
      `สินค้า: ${productSummary}`,
      `ยอด COD: ${codAmount.toLocaleString()} บาท`,
    ]
    if (order.notes && order.notes.trim()) {
      lines.push(`หมายเหตุ: ${order.notes.trim()}`)
    }
    const text = lines.join('\n')

    // Auto-transition wait_pack → in_myorder on copy
    if (order.status === 'wait_pack') {
      const updated: Order = {
        ...order,
        status: 'in_myorder',
        copiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      dispatch({ type: 'UPDATE_ORDER', payload: updated })
      addHistory('order_copied', `คัดลอกข้อมูล ${order.id} (${order.customerName})`, order.id, 'order')
    }

    return text
  }

  function updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    extras: {
      trackingNumber?: string; carrier?: Carrier;
      returnReason?: string; cancelReason?: string;
      shippingFee?: number;
      realShippingFee?: number; realCodBaht?: number; useRealForProfit?: boolean;
    } = {}
  ) {
    if (!state.currentUser) return
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return

    const isPacker = state.currentUser.role === 'packing'
    const now = new Date().toISOString()

    const updated: Order = {
      ...order,
      status,
      trackingNumber: extras.trackingNumber ?? order.trackingNumber,
      carrier: extras.carrier ?? order.carrier,
      shippingFee: extras.shippingFee ?? order.shippingFee,
      realShippingFee: extras.realShippingFee ?? order.realShippingFee,
      realCodBaht: extras.realCodBaht ?? order.realCodBaht,
      useRealForProfit: extras.useRealForProfit ?? order.useRealForProfit,
      returnReason: extras.returnReason ?? order.returnReason,
      cancelReason: extras.cancelReason ?? order.cancelReason,
      packingId: isPacker && !order.packingId ? state.currentUser.id : order.packingId,
      packingName: isPacker && !order.packingName ? state.currentUser.name : order.packingName,
      shippedAt: status === 'shipping' ? now : order.shippedAt,
      deliveredAt: status === 'delivered' ? now : order.deliveredAt,
      returnedAt: status === 'returned' ? now : order.returnedAt,
      cancelledAt: status === 'cancelled' ? now : order.cancelledAt,
      updatedAt: now,
    }

    // Compute commission on first transition to delivered
    if (status === 'delivered' && !order.commissionAmount) {
      // Try product-level commission first; fallback to telesale rate × net
      const telesale = state.users.find(u => u.id === order.telesaleId)
      let comm = 0
      let usedProductCommission = false
      for (const item of order.items) {
        const product = state.products.find(p => p.id === item.productId)
        if (product?.commission) {
          comm += computeCommission(product) * item.quantity
          usedProductCommission = true
        }
      }
      if (!usedProductCommission) {
        const customer = state.customers.find(c => c.id === order.customerId)
        const grade = customer?.grade ?? 'D'
        const rate = telesale?.commissionRate ?? GRADE_COMMISSION_RATE[grade]
        const net = order.totalAmount - order.discount
        comm = Math.round((net * rate) / 100)
      }
      updated.commissionAmount = Math.round(comm)
    }

    dispatch({ type: 'UPDATE_ORDER', payload: updated })

    const eventMap: Partial<Record<OrderStatus, HistoryLog['eventType']>> = {
      shipping: 'order_shipped',
      delivered: 'order_delivered',
      returned: 'order_returned',
      cancelled: 'order_cancelled',
    }
    const labelMap: Partial<Record<OrderStatus, string>> = {
      shipping: `จัดส่งแล้ว เลขพัสดุ ${extras.trackingNumber ?? order.trackingNumber ?? ''}`,
      delivered: 'ส่งสำเร็จ',
      returned: `ตีกลับ${extras.returnReason ? ` (${extras.returnReason})` : ''}`,
      cancelled: `ยกเลิก${extras.cancelReason ? ` (${extras.cancelReason})` : ''}`,
    }
    if (eventMap[status]) {
      addHistory(eventMap[status]!, `${labelMap[status]} ออเดอร์ ${order.id} (${order.customerName})`, orderId, 'order')
    }

    if (status === 'delivered' && updated.commissionAmount && !order.commissionAmount) {
      addHistory('commission_paid', `จ่ายค่าคอม ฿${updated.commissionAmount.toLocaleString()} ให้ ${order.telesaleName}`, orderId, 'order')
    }

    // Update customer stats on delivered/returned/cancelled
    if (status === 'delivered' || status === 'returned' || status === 'cancelled') {
      const customer = state.customers.find(c => c.id === order.customerId)
      if (!customer) return
      const newTotal = status === 'delivered' ? customer.totalOrders + 1 : customer.totalOrders
      const newAmount = status === 'delivered' ? customer.totalAmount + (order.totalAmount - order.discount) : customer.totalAmount
      const newCancel = status === 'cancelled' ? (customer.cancelCount ?? 0) + 1 : (customer.cancelCount ?? 0)
      const newReturned = status === 'returned' ? (customer.returnedCount ?? 0) + 1 : (customer.returnedCount ?? 0)
      const denom = newTotal + newReturned
      const successRate = denom > 0 ? Math.round((newTotal / denom) * 100) : 0
      const newGrade = deriveGrade(newTotal, newReturned, newAmount, state.gradeSettings)
      const gradeChanged = newGrade !== customer.grade
      dispatch({
        type: 'UPDATE_CUSTOMER',
        payload: {
          ...customer,
          totalOrders: newTotal,
          totalAmount: newAmount,
          successRate,
          cancelCount: newCancel,
          returnedCount: newReturned,
          lastDeliveredAt: status === 'delivered' ? now : customer.lastDeliveredAt,
          lastReturnedAt: status === 'returned' ? now : customer.lastReturnedAt,
          grade: newGrade,
          updatedAt: now,
        }
      })
      if (gradeChanged) {
        addHistory('customer_grade_changed', `${customer.name} เปลี่ยน Grade เป็น ${newGrade}`, customer.id, 'customer')
      }
    }
  }

  function bulkImportCustomers(rows: Array<Partial<Customer> & { name: string; phone: string }>): number {
    const now = new Date().toISOString()
    const existingPhones = new Set(state.customers.map(c => c.phone.replace(/\D/g, '')))
    const newCustomers: Customer[] = []
    for (const r of rows) {
      const phoneKey = (r.phone ?? '').replace(/\D/g, '')
      if (!phoneKey || existingPhones.has(phoneKey)) continue
      existingPhones.add(phoneKey)
      newCustomers.push({
        id: generateId(),
        name: r.name.trim(),
        phone: r.phone.trim(),
        address: r.address,
        grade: r.grade ?? 'D',
        ownerId: r.ownerId,
        ownerName: r.ownerName,
        totalOrders: r.totalOrders ?? 0, totalAmount: r.totalAmount ?? 0, successRate: r.successRate ?? 0,
        lastOrderDate: r.lastOrderDate,
        nextCallAt: r.nextCallAt ?? addDays(new Date(), GRADE_CALL_DAYS[r.grade ?? 'D']),
        notes: r.notes,
        createdAt: now, updatedAt: now,
      })
    }
    if (newCustomers.length) {
      dispatch({ type: 'BULK_ADD_CUSTOMERS', payload: newCustomers })
      addHistory('customer_added', `นำเข้าลูกค้าใหม่ ${newCustomers.length} ราย`)
    }
    return newCustomers.length
  }

  function bulkImportOrders(rows: OrderImportRow[]): { orders: number; newCustomers: number } {
    if (!state.currentUser) return { orders: 0, newCustomers: 0 }
    const nowIso = new Date().toISOString()
    const customersByPhone = new Map(state.customers.map(c => [c.phone.replace(/\D/g, ''), c]))
    const existingOrderIds = new Set(state.orders.map(o => o.id))
    const productsByName = new Map(state.products.map(p => [p.name.trim().toLowerCase(), p]))
    const productsBySku = new Map(state.products.filter(p => p.sku).map(p => [p.sku!.toLowerCase(), p]))

    const newCustomers: Customer[] = []
    const newOrders: Order[] = []
    let orderCounter = state.orders.length

    for (const r of rows) {
      const phoneKey = (r.phone ?? '').replace(/\D/g, '')
      if (!phoneKey || !r.name?.trim() || !r.productName?.trim()) continue
      const qty = r.quantity && r.quantity > 0 ? r.quantity : 1
      const totalRaw = r.totalAmount && r.totalAmount > 0 ? r.totalAmount : r.price * qty
      const unitPrice = r.price > 0 ? r.price : (totalRaw / qty)
      if (!(unitPrice > 0)) continue

      let customer = customersByPhone.get(phoneKey)
      if (!customer) {
        customer = {
          id: generateId(), name: r.name.trim(), phone: r.phone.trim(), address: r.address,
          grade: 'D', totalOrders: 0, totalAmount: 0, successRate: 0,
          nextCallAt: addDays(r.orderDate ? new Date(r.orderDate) : new Date(), GRADE_CALL_DAYS['D']),
          notes: r.notes, createdAt: nowIso, updatedAt: nowIso,
        }
        customersByPhone.set(phoneKey, customer)
        newCustomers.push(customer)
      }

      const matchedProduct =
        (r.productSku && productsBySku.get(r.productSku.toLowerCase())) ||
        productsByName.get(r.productName.trim().toLowerCase()) || null
      const itemCost = r.cost ?? matchedProduct?.cost ?? 0
      const subtotal = unitPrice * qty

      const items: OrderItem[] = [{
        productId: matchedProduct?.id ?? `imported-${r.productSku ?? r.productName.trim()}`,
        productName: matchedProduct?.name ?? r.productName.trim(),
        price: unitPrice, cost: itemCost, quantity: qty, subtotal,
      }]

      const telesale = r.telesaleName
        ? state.users.find(u => u.role === 'telesale' && u.name.includes(r.telesaleName!.trim()))
        : null
      const telesaleId = telesale?.id ?? state.currentUser.id
      const telesaleNameOut = telesale?.name ?? state.currentUser.name

      const hasTracking = !!r.trackingNumber?.trim()
      const explicitStatus = r.status
      const status: OrderStatus = explicitStatus ?? (hasTracking ? 'shipping' : 'wait_pack')

      // Decide order id — prefer externalId from MyOrder if present and not duplicate
      let id: string
      if (r.externalId && !existingOrderIds.has(r.externalId)) {
        id = r.externalId
      } else {
        orderCounter++
        const now = new Date()
        const yy = String((now.getFullYear() + 543) % 1000).padStart(3, '0')
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const dd = String(now.getDate()).padStart(2, '0')
        id = `ORD${yy}${mm}${dd}-${String(orderCounter).padStart(3, '0')}`
      }
      existingOrderIds.add(id)

      const orderCreatedAt = r.orderDate || nowIso

      newOrders.push({
        id,
        customerId: customer.id, customerName: customer.name, customerPhone: customer.phone,
        customerAddress: customer.address,
        telesaleId, telesaleName: telesaleNameOut,
        status, items,
        totalAmount: totalRaw, totalCost: itemCost * qty, discount: r.discount ?? 0,
        shippingFee: r.shippingFee,
        carrier: r.carrier, trackingNumber: hasTracking ? r.trackingNumber!.trim() : undefined,
        channel: r.channel, paymentMethod: r.paymentMethod, weightKg: r.weightKg,
        createdByName: r.createdByName, source: r.source ?? 'MyOrder',
        notes: r.notes, createdAt: orderCreatedAt, updatedAt: nowIso,
        shippedAt: (status === 'shipping' || status === 'delivered' || status === 'returned') ? (hasTracking ? orderCreatedAt : undefined) : undefined,
        deliveredAt: status === 'delivered' ? nowIso : undefined,
        returnedAt: status === 'returned' ? nowIso : undefined,
      })
    }

    // Recompute purchase stats for every customer that received a new order
    // (order count, total spend, success rate, last order date) — otherwise the
    // orders show in history but the customer's stat tiles stay at 0.
    const affectedIds = new Set(newOrders.map(o => o.customerId))
    const ordersByCustomer = new Map<string, Order[]>()
    for (const o of [...state.orders, ...newOrders]) {
      if (!affectedIds.has(o.customerId)) continue
      const arr = ordersByCustomer.get(o.customerId) ?? []
      arr.push(o)
      ordersByCustomer.set(o.customerId, arr)
    }
    const recomputeStats = (base: Customer): Customer => {
      const os = ordersByCustomer.get(base.id) ?? []
      const valid = os.filter(o => o.status !== 'cancelled' && o.status !== 'returned')
      const returnedCount = os.filter(o => o.status === 'returned').length
      const totalAmount = valid.reduce((s, o) => s + (o.totalAmount - (o.discount ?? 0)), 0)
      const denom = valid.length + returnedCount
      const successRate = denom > 0 ? Math.round((valid.length / denom) * 100) : 0
      const lastOrderDate = os.map(o => o.createdAt).sort().at(-1) ?? base.lastOrderDate
      return { ...base, totalOrders: valid.length, totalAmount, successRate, returnedCount, lastOrderDate, updatedAt: nowIso }
    }
    for (let i = 0; i < newCustomers.length; i++) {
      if (affectedIds.has(newCustomers[i].id)) newCustomers[i] = recomputeStats(newCustomers[i])
    }
    const customerUpdates = state.customers.filter(c => affectedIds.has(c.id)).map(recomputeStats)

    // Update local state immediately
    if (newCustomers.length) dispatchRaw({ type: 'BULK_ADD_CUSTOMERS', payload: newCustomers })
    for (const o of newOrders) dispatchRaw({ type: 'ADD_ORDER', payload: o })
    for (const c of customerUpdates) dispatchRaw({ type: 'UPDATE_CUSTOMER', payload: c })

    // Persist to Supabase in the RIGHT ORDER: customers first, then orders
    // (orders have a foreign key to customers — inserting an order before its
    // customer exists fails with FK error 23503 and would be lost silently).
    if (isSupabaseEnabled() && supabase) {
      void (async () => {
        try {
          if (newCustomers.length) await ds.bulkInsertCustomers(newCustomers)
          if (newOrders.length) await ds.bulkInsertOrders(newOrders)
          for (const c of customerUpdates) await ds.upsertCustomer(c)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          console.warn('Supabase persist failed: bulkImportOrders', e)
          setSyncError(`นำเข้าออเดอร์ — บันทึกลงระบบไม่สำเร็จ: ${msg}`)
        }
      })()
    }

    if (newOrders.length) {
      addHistory('order_created', `นำเข้าออเดอร์ ${newOrders.length} รายการ (ลูกค้าใหม่ ${newCustomers.length})`)
    }
    return { orders: newOrders.length, newCustomers: newCustomers.length }
  }

  function updateGradeSettings(settings: GradeSettings) {
    dispatch({ type: 'SET_GRADE_SETTINGS', payload: settings })
    addHistory('permission_changed', 'แก้ไขการตั้งค่าเกรดลูกค้า')
  }

  /**
   * คำนวณเกรดลูกค้าทุกคนใหม่ตามเกณฑ์ปัจจุบัน + นับ delivered/returned จากออเดอร์จริง
   * เซฟลง DB เฉพาะคนที่เกรดเปลี่ยน
   */
  function recalculateAllGrades(): { updated: number; total: number } {
    const now = new Date().toISOString()
    let updated = 0
    for (const c of state.customers) {
      const myOrders = state.orders.filter(o => o.customerId === c.id)
      const delivered = myOrders.filter(o => o.status === 'delivered')
      const returned = myOrders.filter(o => o.status === 'returned')
      const deliveredCount = delivered.length
      const returnedCount = returned.length
      const totalAmount = delivered.reduce((s, o) => s + (o.totalAmount - o.discount), 0)
      const lastDelivered = delivered
        .map(o => o.deliveredAt ?? o.updatedAt)
        .filter(Boolean)
        .sort()
        .at(-1)
      const lastReturned = returned
        .map(o => o.returnedAt ?? o.updatedAt)
        .filter(Boolean)
        .sort()
        .at(-1)
      const newGrade = computeCustomerGrade({
        deliveredCount, returnedCount, totalAmount, settings: state.gradeSettings,
      })
      const denom = deliveredCount + returnedCount
      const successRate = denom > 0 ? Math.round((deliveredCount / denom) * 100) : 0
      const changed =
        newGrade !== c.grade ||
        (c.returnedCount ?? 0) !== returnedCount ||
        (c.totalOrders ?? 0) !== deliveredCount ||
        c.lastDeliveredAt !== lastDelivered ||
        c.lastReturnedAt !== lastReturned
      if (!changed) continue
      updated++
      dispatch({
        type: 'UPDATE_CUSTOMER',
        payload: {
          ...c,
          totalOrders: deliveredCount,
          totalAmount,
          successRate,
          returnedCount,
          lastDeliveredAt: lastDelivered ?? c.lastDeliveredAt,
          lastReturnedAt: lastReturned ?? c.lastReturnedAt,
          grade: newGrade,
          updatedAt: now,
        }
      })
      if (newGrade !== c.grade) {
        addHistory('customer_grade_changed', `${c.name} เปลี่ยน Grade เป็น ${newGrade} (recalculate)`, c.id, 'customer')
      }
    }
    if (updated > 0) {
      addHistory('permission_changed', `คำนวณเกรดใหม่ทั้งระบบ — อัปเดต ${updated}/${state.customers.length} คน`)
    }
    return { updated, total: state.customers.length }
  }

  function saveShippingProfile(profile: ShippingProfile) {
    const exists = state.shippingProfiles.find(p => p.id === profile.id)
    dispatch({ type: exists ? 'UPDATE_SHIPPING_PROFILE' : 'ADD_SHIPPING_PROFILE', payload: profile })
    addHistory('permission_changed', `${exists ? 'แก้ไข' : 'เพิ่ม'}โปรไฟล์ค่าส่ง: ${profile.name} (฿${profile.shippingFee} · COD ${profile.codPercent}%)`)
  }

  function deleteShippingProfile(id: string) {
    const profile = state.shippingProfiles.find(p => p.id === id)
    dispatch({ type: 'DELETE_SHIPPING_PROFILE', payload: id })
    if (profile) addHistory('permission_changed', `ลบโปรไฟล์ค่าส่ง: ${profile.name}`)
  }

  return (
    <AppContext.Provider value={{
      state, dispatch, login, logout, addHistory,
      completeCall, updateOrderStatus, copyOrderData,
      assignOwner, setCustomerGrade, updateCustomerWithHistory,
      bulkImportCustomers, bulkImportOrders, updateGradeSettings, recalculateAllGrades,
      saveShippingProfile, deleteShippingProfile,
    }}>
      {children}
      {syncError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[92%] bg-red-600 text-white rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg leading-none">⚠️</span>
          <div className="flex-1 text-sm">
            <p className="font-bold">บันทึกลงระบบไม่สำเร็จ</p>
            <p className="text-red-100 text-xs mt-0.5 break-all">{syncError}</p>
            <p className="text-red-100 text-[11px] mt-1 opacity-80">ข้อมูลอาจยังไม่ถูกบันทึก — ลองใหม่อีกครั้ง หรือแจ้งผู้ดูแล</p>
          </div>
          <button onClick={() => setSyncError(null)} aria-label="ปิด" className="text-white/80 hover:text-white text-lg leading-none">✕</button>
        </div>
      )}
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
