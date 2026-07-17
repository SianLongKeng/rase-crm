/**
 * Supabase Data Service
 *
 * Translates between camelCase (TS) and snake_case (Postgres),
 * provides CRUD helpers for all entities, and a single loadAllData()
 * to bootstrap the app state from Supabase.
 */
import { supabase } from './supabase'
import {
  Customer, Product, Order, CallLog, HistoryLog, User, ShippingProfile,
  GradeSettings, DEFAULT_GRADE_SETTINGS, UserRole, CustomerGrade,
  CustomerStatus, OrderStatus, ProductStatus, CallResult,
} from '@/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

// ===== USERS / PROFILES =====
export function profileToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    department: row.department ?? undefined,
    phone: row.phone ?? undefined,
    commissionRate: row.commission_rate ?? undefined,
    permissions: row.permissions ?? undefined,
    active: row.active !== false,
  }
}

export function userToProfileInsert(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department ?? null,
    phone: u.phone ?? null,
    commission_rate: u.commissionRate ?? null,
    permissions: u.permissions ?? [],
    active: u.active !== false,
  }
}

// ===== PRODUCTS =====
export function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku ?? undefined,
    category: row.category ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    price: Number(row.price ?? 0),
    cost: Number(row.cost ?? 0),
    packingFee: row.packing_fee != null ? Number(row.packing_fee) : undefined,
    commission: row.commission ?? undefined,
    unit: row.unit ?? 'ชิ้น',
    stockQty: row.stock_qty ?? undefined,
    lowStockThreshold: row.low_stock_threshold ?? undefined,
    status: (row.status ?? 'active') as ProductStatus,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? undefined,
  }
}
export function productToRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku ?? null,
    category: p.category ?? null,
    description: p.description ?? null,
    image_url: p.imageUrl ?? null,
    price: p.price,
    cost: p.cost,
    packing_fee: p.packingFee ?? null,
    commission: p.commission ?? null,
    unit: p.unit,
    stock_qty: p.stockQty ?? 0,
    low_stock_threshold: p.lowStockThreshold ?? 0,
    status: p.status,
    updated_at: new Date().toISOString(),
  }
}

// ===== SHIPPING PROFILES =====
export function rowToShippingProfile(row: any): ShippingProfile {
  return {
    id: row.id,
    name: row.name,
    shippingFee: Number(row.shipping_fee ?? 0),
    codPercent: Number(row.cod_percent ?? 0),
    productIds: row.product_ids ?? [],
    createdAt: row.created_at ?? new Date().toISOString(),
  }
}
export function shippingProfileToRow(p: ShippingProfile) {
  return {
    id: p.id,
    name: p.name,
    shipping_fee: p.shippingFee,
    cod_percent: p.codPercent,
    product_ids: p.productIds,
  }
}

// ===== CUSTOMERS =====
export function rowToCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    line: row.line ?? undefined,
    address: row.address ?? undefined,
    addressDetail: row.address_detail ?? undefined,
    grade: (row.grade ?? 'D') as CustomerGrade,
    status: row.status ? (row.status as CustomerStatus) : undefined,
    tags: row.tags ?? [],
    ownerId: row.owner_id ?? undefined,
    ownerName: row.owner_name ?? undefined,
    totalOrders: row.total_orders ?? 0,
    totalAmount: Number(row.total_amount ?? 0),
    successRate: row.success_rate ?? 0,
    cancelCount: row.cancel_count ?? 0,
    returnedCount: row.returned_count ?? 0,
    lastDeliveredAt: row.last_delivered_at ?? undefined,
    lastReturnedAt: row.last_returned_at ?? undefined,
    lastCallAt: row.last_call_at ?? undefined,
    lastOrderDate: row.last_order_date ?? undefined,
    nextCallAt: row.next_call_at ?? undefined,
    nextCallNote: row.next_call_note ?? undefined,
    notes: row.notes ?? undefined,
    editHistory: row.edit_history ?? [],
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }
}
export function customerToRow(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    line: c.line ?? null,
    address: c.address ?? null,
    address_detail: c.addressDetail ?? null,
    grade: c.grade,
    status: c.status ?? null,
    tags: c.tags ?? [],
    owner_id: c.ownerId ?? null,
    owner_name: c.ownerName ?? null,
    total_orders: c.totalOrders ?? 0,
    total_amount: c.totalAmount ?? 0,
    success_rate: c.successRate ?? 0,
    cancel_count: c.cancelCount ?? 0,
    returned_count: c.returnedCount ?? 0,
    last_delivered_at: c.lastDeliveredAt ?? null,
    last_returned_at: c.lastReturnedAt ?? null,
    last_call_at: c.lastCallAt ?? null,
    last_order_date: c.lastOrderDate ?? null,
    next_call_at: c.nextCallAt ?? null,
    next_call_note: c.nextCallNote ?? null,
    notes: c.notes ?? null,
    edit_history: c.editHistory ?? [],
    updated_at: new Date().toISOString(),
  }
}

// ===== CALL LOGS =====
export function rowToCallLog(row: any): CallLog {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    telesaleId: row.telesale_id,
    telesaleName: row.telesale_name,
    result: row.result as CallResult,
    notes: row.notes ?? undefined,
    followUpAt: row.follow_up_at ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  }
}
export function callLogToRow(c: CallLog) {
  return {
    id: c.id,
    customer_id: c.customerId,
    customer_name: c.customerName,
    customer_phone: c.customerPhone,
    telesale_id: c.telesaleId,
    telesale_name: c.telesaleName,
    result: c.result,
    notes: c.notes ?? null,
    follow_up_at: c.followUpAt ?? null,
  }
}

// ===== ORDERS =====
export function rowToOrder(row: any): Order {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address ?? undefined,
    shipping: row.shipping ?? undefined,
    telesaleId: row.telesale_id,
    telesaleName: row.telesale_name,
    packingId: row.packing_id ?? undefined,
    packingName: row.packing_name ?? undefined,
    status: (row.status ?? 'wait_pack') as OrderStatus,
    items: row.items ?? [],
    totalAmount: Number(row.total_amount ?? 0),
    totalCost: Number(row.total_cost ?? 0),
    discount: Number(row.discount ?? 0),
    shippingFee: row.shipping_fee != null ? Number(row.shipping_fee) : undefined,
    codFee: row.cod_fee != null ? Number(row.cod_fee) : undefined,
    carrier: row.carrier ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    notes: row.notes ?? undefined,
    callLogId: row.call_log_id ?? undefined,
    commissionAmount: row.commission_amount != null ? Number(row.commission_amount) : undefined,
    returnReason: row.return_reason ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
    copiedAt: row.copied_at ?? undefined,
    shippedAt: row.shipped_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    returnedAt: row.returned_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    shippingProfileId: row.shipping_profile_id ?? undefined,
    shippingProfileName: row.shipping_profile_name ?? undefined,
    realShippingFee: row.real_shipping_fee != null ? Number(row.real_shipping_fee) : undefined,
    realCodBaht: row.real_cod_baht != null ? Number(row.real_cod_baht) : undefined,
    useRealForProfit: row.use_real_for_profit ?? undefined,
    standardCodBaht: row.standard_cod_baht != null ? Number(row.standard_cod_baht) : undefined,
    channel: row.channel ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
    createdByName: row.created_by_name ?? undefined,
    source: row.source ?? undefined,
    editHistory: row.edit_history ?? [],
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }
}
export function orderToRow(o: Order) {
  return {
    id: o.id,
    customer_id: o.customerId,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    customer_address: o.customerAddress ?? null,
    shipping: o.shipping ?? null,
    telesale_id: o.telesaleId,
    telesale_name: o.telesaleName,
    packing_id: o.packingId ?? null,
    packing_name: o.packingName ?? null,
    status: o.status,
    items: o.items,
    total_amount: o.totalAmount,
    total_cost: o.totalCost,
    discount: o.discount,
    shipping_fee: o.shippingFee ?? null,
    cod_fee: o.codFee ?? null,
    carrier: o.carrier ?? null,
    tracking_number: o.trackingNumber ?? null,
    notes: o.notes ?? null,
    call_log_id: o.callLogId ?? null,
    commission_amount: o.commissionAmount ?? null,
    return_reason: o.returnReason ?? null,
    cancel_reason: o.cancelReason ?? null,
    copied_at: o.copiedAt ?? null,
    shipped_at: o.shippedAt ?? null,
    delivered_at: o.deliveredAt ?? null,
    returned_at: o.returnedAt ?? null,
    cancelled_at: o.cancelledAt ?? null,
    shipping_profile_id: o.shippingProfileId ?? null,
    shipping_profile_name: o.shippingProfileName ?? null,
    real_shipping_fee: o.realShippingFee ?? null,
    real_cod_baht: o.realCodBaht ?? null,
    use_real_for_profit: o.useRealForProfit ?? null,
    standard_cod_baht: o.standardCodBaht ?? null,
    channel: o.channel ?? null,
    payment_method: o.paymentMethod ?? null,
    weight_kg: o.weightKg ?? null,
    created_by_name: o.createdByName ?? null,
    source: o.source ?? null,
    edit_history: o.editHistory ?? [],
    updated_at: new Date().toISOString(),
  }
}

// ===== HISTORY LOG =====
export function rowToHistory(row: any): HistoryLog {
  return {
    id: row.id,
    eventType: row.event_type,
    description: row.description,
    userId: row.user_id ?? '',
    userName: row.user_name ?? '',
    relatedId: row.related_id ?? undefined,
    relatedType: row.related_type ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  }
}
export function historyToRow(h: HistoryLog) {
  return {
    id: h.id,
    event_type: h.eventType,
    description: h.description,
    user_id: h.userId || null,
    user_name: h.userName,
    related_id: h.relatedId ?? null,
    related_type: h.relatedType ?? null,
  }
}

// ===== GRADE SETTINGS =====
export function rowToGradeSettings(row: any): GradeSettings {
  if (!row) return DEFAULT_GRADE_SETTINGS
  return {
    callDays: row.call_days ?? DEFAULT_GRADE_SETTINGS.callDays,
    cardLimit: row.card_limit ?? DEFAULT_GRADE_SETTINGS.cardLimit,
    commissionRate: row.commission_rate ?? DEFAULT_GRADE_SETTINGS.commissionRate,
    minPurchase: row.min_purchase ?? DEFAULT_GRADE_SETTINGS.minPurchase,
    excludeFromQueue: row.exclude_from_queue ?? DEFAULT_GRADE_SETTINGS.excludeFromQueue,
    thresholds: row.thresholds ?? DEFAULT_GRADE_SETTINGS.thresholds,
  }
}

// ============================================================
// LOAD ALL DATA from Supabase
// ============================================================
export interface AppSnapshot {
  users: User[]
  customers: Customer[]
  products: Product[]
  callLogs: CallLog[]
  orders: Order[]
  history: HistoryLog[]
  shippingProfiles: ShippingProfile[]
  gradeSettings: GradeSettings
}

export async function loadAllData(): Promise<AppSnapshot | null> {
  if (!supabase) return null

  const [
    profiles,
    products,
    customers,
    callLogs,
    orders,
    history,
    shippingProfiles,
    gradeSettings,
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('call_logs').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('history_logs').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('shipping_profiles').select('*'),
    supabase.from('grade_settings').select('*').eq('id', 1).maybeSingle(),
  ])

  return {
    users: profiles.data?.map(profileToUser) ?? [],
    products: products.data?.map(rowToProduct) ?? [],
    customers: customers.data?.map(rowToCustomer) ?? [],
    callLogs: callLogs.data?.map(rowToCallLog) ?? [],
    orders: orders.data?.map(rowToOrder) ?? [],
    history: history.data?.map(rowToHistory) ?? [],
    shippingProfiles: shippingProfiles.data?.map(rowToShippingProfile) ?? [],
    gradeSettings: rowToGradeSettings(gradeSettings.data),
  }
}

// ============================================================
// CRUD helpers — used by store actions
// All return Promise so store can await + handle errors
// ============================================================

export async function upsertProduct(p: Product) {
  if (!supabase) return
  await supabase.from('products').upsert(productToRow(p))
}
export async function deleteProduct(id: string) {
  if (!supabase) return
  await supabase.from('products').delete().eq('id', id)
}

export async function upsertCustomer(c: Customer) {
  if (!supabase) return
  await supabase.from('customers').upsert(customerToRow(c))
}
export async function deleteCustomer(id: string) {
  if (!supabase) return
  await supabase.from('customers').delete().eq('id', id)
}
export async function bulkInsertCustomers(customers: Customer[]) {
  if (!supabase || customers.length === 0) return
  await supabase.from('customers').insert(customers.map(customerToRow))
}

export async function insertCallLog(c: CallLog) {
  if (!supabase) return
  await supabase.from('call_logs').insert(callLogToRow(c))
}

export async function upsertOrder(o: Order) {
  if (!supabase) return
  await supabase.from('orders').upsert(orderToRow(o))
}
export async function bulkInsertOrders(orders: Order[]) {
  if (!supabase || orders.length === 0) return
  await supabase.from('orders').insert(orders.map(orderToRow))
}

export async function insertHistory(h: HistoryLog) {
  if (!supabase) return
  await supabase.from('history_logs').insert(historyToRow(h))
}

export async function upsertShippingProfile(p: ShippingProfile) {
  if (!supabase) return
  await supabase.from('shipping_profiles').upsert(shippingProfileToRow(p))
}
export async function deleteShippingProfile(id: string) {
  if (!supabase) return
  await supabase.from('shipping_profiles').delete().eq('id', id)
}

export async function updateGradeSettings(g: GradeSettings) {
  if (!supabase) return
  await supabase.from('grade_settings').upsert({
    id: 1,
    call_days: g.callDays,
    card_limit: g.cardLimit,
    commission_rate: g.commissionRate,
    min_purchase: g.minPurchase,
    exclude_from_queue: g.excludeFromQueue,
    thresholds: g.thresholds,
    updated_at: new Date().toISOString(),
  })
}

export async function updateUserProfile(u: User) {
  if (!supabase) return
  await supabase.from('profiles').update({
    name: u.name,
    role: u.role,
    department: u.department ?? null,
    phone: u.phone ?? null,
    commission_rate: u.commissionRate ?? null,
    permissions: u.permissions ?? [],
    active: u.active !== false,
  }).eq('id', u.id)
}

// ============================================================
// SEED — populate empty Supabase with mock data on first run
// ============================================================
export async function seedIfEmpty(mockData: {
  products: Product[]
  customers: Customer[]
  shippingProfiles: ShippingProfile[]
  callLogs: CallLog[]
  orders: Order[]
  history: HistoryLog[]
}) {
  if (!supabase) return false

  // Check if products table is empty
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  if (count && count > 0) return false  // already has data

  // Seed in dependency order
  if (mockData.products.length) {
    await supabase.from('products').insert(mockData.products.map(productToRow))
  }
  if (mockData.shippingProfiles.length) {
    await supabase.from('shipping_profiles').insert(mockData.shippingProfiles.map(shippingProfileToRow))
  }
  if (mockData.customers.length) {
    await supabase.from('customers').insert(mockData.customers.map(customerToRow))
  }
  // Skip call_logs and orders if they reference users not in profiles
  // (safer to start fresh on those)

  return true
}
