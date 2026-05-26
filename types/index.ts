export type UserRole = 'owner' | 'telesale' | 'packing'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  password?: string
}

export type CustomerTier = 'vip' | 'warm' | 'cold'

export const TIER_LABEL: Record<CustomerTier, string> = {
  vip: 'VIP',
  warm: 'WARM',
  cold: 'COLD',
}

export const TIER_COLOR: Record<CustomerTier, string> = {
  vip: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  warm: 'bg-orange-100 text-orange-800 border-orange-300',
  cold: 'bg-blue-100 text-blue-700 border-blue-300',
}

export const TIER_CALL_DAYS: Record<CustomerTier, number> = {
  vip: 21,
  warm: 30,
  cold: 45,
}

export interface Customer {
  id: string
  name: string
  phone: string
  address?: string
  tier: CustomerTier
  totalOrders: number
  totalAmount: number
  successRate: number  // %
  lastCallAt?: string
  nextCallAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock'

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'พร้อมขาย',
  inactive: 'ปิดการขาย',
  out_of_stock: 'สินค้าหมด',
}

export const PRODUCT_STATUS_COLOR: Record<ProductStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
  out_of_stock: 'bg-red-100 text-red-700',
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  unit: string
  status: ProductStatus
  createdAt: string
}

export type CallResult = 'closed' | 'follow_up' | 'no_answer' | 'not_interested'

export const CALL_RESULT_LABEL: Record<CallResult, string> = {
  closed: 'ปิดได้',
  follow_up: 'Follow Up',
  no_answer: 'ไม่รับโทร',
  not_interested: 'ไม่สนใจ',
}

export const CALL_RESULT_COLOR: Record<CallResult, string> = {
  closed: 'bg-green-100 text-green-800',
  follow_up: 'bg-yellow-100 text-yellow-800',
  no_answer: 'bg-slate-100 text-slate-600',
  not_interested: 'bg-red-100 text-red-700',
}

export interface CallLog {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  telesaleId: string
  telesaleName: string
  result: CallResult
  notes?: string
  followUpAt?: string
  createdAt: string
}

export type OrderStatus = 'pending_pack' | 'packing' | 'shipped' | 'delivered' | 'returned'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_pack: 'รอแพ็ก',
  packing: 'กำลังแพ็ก',
  shipped: 'จัดส่งแล้ว',
  delivered: 'สำเร็จ',
  returned: 'คืนสินค้า',
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending_pack: 'bg-yellow-100 text-yellow-800',
  packing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  returned: 'bg-red-100 text-red-700',
}

export interface OrderItem {
  productId: string
  productName: string
  price: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  telesaleId: string
  telesaleName: string
  packingId?: string
  packingName?: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  discount: number
  trackingNumber?: string
  notes?: string
  callLogId?: string
  createdAt: string
  updatedAt: string
}

export type HistoryEventType =
  | 'customer_added'
  | 'call_made'
  | 'order_created'
  | 'order_packed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_returned'
  | 'customer_tier_changed'
  | 'product_changed'

export const HISTORY_EVENT_LABEL: Record<HistoryEventType, string> = {
  customer_added: 'เพิ่มลูกค้าใหม่',
  call_made: 'โทรหาลูกค้า',
  order_created: 'สร้างออเดอร์',
  order_packed: 'แพ็กสินค้าแล้ว',
  order_shipped: 'จัดส่งแล้ว',
  order_delivered: 'ส่งสำเร็จ',
  order_returned: 'คืนสินค้า',
  customer_tier_changed: 'เปลี่ยนระดับลูกค้า',
  product_changed: 'แก้ไขสินค้า',
}

export const HISTORY_EVENT_COLOR: Record<HistoryEventType, string> = {
  customer_added: 'bg-blue-100 text-blue-700',
  call_made: 'bg-slate-100 text-slate-700',
  order_created: 'bg-green-100 text-green-700',
  order_packed: 'bg-orange-100 text-orange-700',
  order_shipped: 'bg-purple-100 text-purple-700',
  order_delivered: 'bg-green-200 text-green-800',
  order_returned: 'bg-red-100 text-red-700',
  customer_tier_changed: 'bg-yellow-100 text-yellow-700',
  product_changed: 'bg-slate-100 text-slate-600',
}

export interface HistoryLog {
  id: string
  eventType: HistoryEventType
  description: string
  userId: string
  userName: string
  relatedId?: string
  relatedType?: string
  createdAt: string
}
