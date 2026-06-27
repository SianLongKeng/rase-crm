/* ============================================================
 * USER ROLES (5 → 4 roles: merged Packing + Checker)
 * ============================================================ */
export type UserRole = 'owner' | 'admin' | 'telesale' | 'packing'

export const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'เจ้าของ',
  admin: 'แอดมิน',
  telesale: 'เทเลเซล',
  packing: 'แพ็คสินค้า',
}

/* ============================================================
 * PERMISSIONS (granular checkbox system)
 * ============================================================ */
export type Permission =
  // Dashboard & reports
  | 'view_dashboard'
  | 'view_sales_report'
  | 'view_profit_report'
  | 'view_commission_report'
  // Customers & orders
  | 'view_customers'
  | 'edit_customers'
  | 'delete_customers'
  | 'view_all_orders'
  | 'view_own_orders'
  | 'edit_orders'
  | 'delete_orders'
  // Packing & shipping
  | 'view_shipping'
  | 'update_shipping_status'
  | 'confirm_delivered'
  | 'cancel_orders'
  // Finance & commission
  | 'view_own_commission'
  | 'view_all_commission'
  | 'view_cost'
  | 'view_profit'
  // Settings
  | 'manage_members'
  | 'manage_permissions'
  | 'manage_settings'
  | 'view_activity_log'

export const PERMISSION_GROUPS: { key: string; label: string; perms: { key: Permission; label: string }[] }[] = [
  {
    key: 'dashboard',
    label: 'แดชบอร์ดและรายงาน',
    perms: [
      { key: 'view_dashboard', label: 'ดูแดชบอร์ด' },
      { key: 'view_sales_report', label: 'ดูรายงานยอดขาย' },
      { key: 'view_profit_report', label: 'ดูรายงานกำไร' },
      { key: 'view_commission_report', label: 'ดูรายงานค่าคอมมิชชั่น' },
    ],
  },
  {
    key: 'customers',
    label: 'ลูกค้าและออเดอร์',
    perms: [
      { key: 'view_customers', label: 'ดูข้อมูลลูกค้า' },
      { key: 'edit_customers', label: 'เพิ่ม/แก้ไขข้อมูลลูกค้า' },
      { key: 'delete_customers', label: 'ลบข้อมูลลูกค้า' },
      { key: 'view_all_orders', label: 'ดูออเดอร์ทั้งหมด' },
      { key: 'view_own_orders', label: 'ดูออเดอร์ที่ตนปิด' },
      { key: 'edit_orders', label: 'แก้ไขออเดอร์' },
      { key: 'delete_orders', label: 'ลบออเดอร์' },
    ],
  },
  {
    key: 'shipping',
    label: 'การจัดส่งและแพ็ค',
    perms: [
      { key: 'view_shipping', label: 'ดูข้อมูลการจัดส่ง' },
      { key: 'update_shipping_status', label: 'อัปเดตสถานะพัสดุ' },
      { key: 'confirm_delivered', label: 'ยืนยันส่งสำเร็จ (Delivered)' },
      { key: 'cancel_orders', label: 'ยกเลิกออเดอร์' },
    ],
  },
  {
    key: 'finance',
    label: 'การเงินและค่าคอม',
    perms: [
      { key: 'view_own_commission', label: 'ดูค่าคอมมิชชั่นของตนเอง' },
      { key: 'view_all_commission', label: 'ดูค่าคอมมิชชั่นทั้งหมด' },
      { key: 'view_cost', label: 'ดูต้นทุนสินค้า' },
      { key: 'view_profit', label: 'ดูข้อมูลกำไร' },
    ],
  },
  {
    key: 'system',
    label: 'ตั้งค่าและระบบ',
    perms: [
      { key: 'manage_members', label: 'จัดการสมาชิก' },
      { key: 'manage_permissions', label: 'ตั้งค่าสิทธิ์การใช้งาน' },
      { key: 'manage_settings', label: 'ตั้งค่าระบบ' },
      { key: 'view_activity_log', label: 'ดูประวัติกิจกรรม (Log)' },
    ],
  },
]

/** Default permissions per role */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'view_dashboard', 'view_sales_report', 'view_profit_report', 'view_commission_report',
    'view_customers', 'edit_customers', 'delete_customers',
    'view_all_orders', 'view_own_orders', 'edit_orders', 'delete_orders',
    'view_shipping', 'update_shipping_status', 'confirm_delivered', 'cancel_orders',
    'view_own_commission', 'view_all_commission', 'view_cost', 'view_profit',
    'manage_members', 'manage_permissions', 'manage_settings', 'view_activity_log',
  ],
  admin: [
    'view_dashboard', 'view_sales_report', 'view_commission_report',
    'view_customers', 'edit_customers',
    'view_all_orders', 'edit_orders',
    'view_shipping', 'update_shipping_status', 'confirm_delivered', 'cancel_orders',
    'view_own_commission',
    'manage_members',
  ],
  telesale: [
    'view_customers', 'edit_customers',
    'view_own_orders',
    'view_own_commission',
  ],
  packing: [
    'view_shipping', 'update_shipping_status', 'confirm_delivered', 'cancel_orders',
  ],
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  phone?: string
  password?: string
  commissionRate?: number
  permissions?: Permission[]    // override default role perms; if undefined uses DEFAULT_ROLE_PERMISSIONS
  active?: boolean
}

export function hasPermission(user: User | null | undefined, p: Permission): boolean {
  if (!user) return false
  const perms = user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role] ?? []
  return perms.includes(p)
}

/* ============================================================
 * CUSTOMER GRADE
 * ============================================================ */
export type CustomerGrade = 'A' | 'B' | 'C' | 'D'

export const GRADE_LABEL: Record<CustomerGrade, string> = {
  A: 'Grade A', B: 'Grade B', C: 'Grade C', D: 'Grade D',
}
export const GRADE_TITLE: Record<CustomerGrade, string> = {
  A: 'ลูกค้าประจำ', B: 'ลูกค้าทั่วไป', C: 'ลูกค้าใหม่', D: 'ลูกค้าเสี่ยง',
}
export const GRADE_DESCRIPTION: Record<CustomerGrade, string> = {
  A: 'ส่งสำเร็จ ≥ 5 ครั้ง',
  B: 'ส่งสำเร็จ 1–4 ครั้ง',
  C: 'ยังไม่เคยส่งสำเร็จ',
  D: 'ตีกลับ ≥ 2 ครั้ง',
}
export const GRADE_COLOR: Record<CustomerGrade, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  B: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
  C: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  D: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700',
}
export const GRADE_EMOJI: Record<CustomerGrade, string> = { A: '🏆', B: '💎', C: '🆕', D: '⚠️' }
export const GRADE_CALL_DAYS: Record<CustomerGrade, number> = { A: 21, B: 30, C: 45, D: 60 }
export const GRADE_CARD_LIMIT: Record<CustomerGrade, number> = { A: 70, B: 35, C: 60, D: 40 }
export const GRADE_COMMISSION_RATE: Record<CustomerGrade, number> = { A: 7, B: 5, C: 4, D: 3 }
/** ยอดซื้อสะสมขั้นต่ำ (บาท) ต่อเกรด — null = ไม่ใช้ในการคำนวณ */
export const GRADE_MIN_PURCHASE: Record<CustomerGrade, number | null> = { A: null, B: null, C: null, D: null }

/** เกณฑ์ตัวเลขที่ใช้คำนวณเกรด */
export interface GradeThresholds {
  /** A = ส่งสำเร็จ ≥ N ครั้ง */
  aDelivered: number
  /** B = ส่งสำเร็จ ≥ N ครั้ง (และน้อยกว่า aDelivered) */
  bDelivered: number
  /** D = ตีกลับ ≥ N ครั้ง */
  dReturned: number
}

export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  aDelivered: 5,
  bDelivered: 1,
  dReturned: 2,
}

export interface GradeSettings {
  callDays: Record<CustomerGrade, number>
  cardLimit: Record<CustomerGrade, number>
  commissionRate: Record<CustomerGrade, number>
  /** ยอดซื้อสะสมขั้นต่ำ (บาท) — null = ไม่ใช้ในการคำนวณเกรด */
  minPurchase: Record<CustomerGrade, number | null>
  /** ☑ ไม่นำเข้าคิวโทรอัตโนมัติ — Grade D = true เป็นค่าเริ่มต้น */
  excludeFromQueue: Record<CustomerGrade, boolean>
  /** เกณฑ์ตัวเลขที่ใช้คำนวณเกรด (ส่งสำเร็จ/ตีกลับ) */
  thresholds: GradeThresholds
}

export const DEFAULT_GRADE_SETTINGS: GradeSettings = {
  callDays: { ...GRADE_CALL_DAYS },
  cardLimit: { ...GRADE_CARD_LIMIT },
  commissionRate: { ...GRADE_COMMISSION_RATE },
  minPurchase: { ...GRADE_MIN_PURCHASE },
  excludeFromQueue: { A: false, B: false, C: false, D: true },
  thresholds: { ...DEFAULT_GRADE_THRESHOLDS },
}

/* ============================================================
 * CUSTOMER ACTIVITY STATUS (auto-computed, separate from Grade)
 * ============================================================ */
export type CustomerActivityStatus = 'active' | 'inactive' | 'returned'

export const ACTIVITY_STATUS_LABEL: Record<CustomerActivityStatus, string> = {
  active: 'Active', inactive: 'Inactive', returned: 'Returned',
}
export const ACTIVITY_STATUS_TITLE: Record<CustomerActivityStatus, string> = {
  active: 'ใช้งานอยู่', inactive: 'ไม่เคลื่อนไหว', returned: 'พัสดุตีกลับ',
}
export const ACTIVITY_STATUS_DESCRIPTION: Record<CustomerActivityStatus, string> = {
  active: 'มีการซื้อภายใน 180 วัน',
  inactive: 'ไม่มีการซื้อเกิน 180 วัน',
  returned: 'มีออเดอร์ตีกลับล่าสุด',
}
export const ACTIVITY_STATUS_COLOR: Record<CustomerActivityStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  returned: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
}
export const ACTIVITY_STATUS_EMOJI: Record<CustomerActivityStatus, string> = {
  active: '🟢', inactive: '⚪', returned: '🔴',
}

export const ACTIVITY_INACTIVE_DAYS = 180

/**
 * คำนวณเกรดลูกค้า — Calculation Priority (ลำดับใน code ต้องเช็ค D ก่อน):
 *  1. ตีกลับ ≥ dReturned ครั้ง → D
 *  2. ส่งสำเร็จ ≥ aDelivered ครั้ง → A
 *  3. ส่งสำเร็จ ≥ bDelivered ครั้ง → B
 *  4. ยังไม่เคยส่งสำเร็จ → C
 * เกณฑ์ทั้งหมดอ่านจาก settings.thresholds — กำหนดได้จากหน้า Admin
 */
export function computeCustomerGrade(opts: {
  deliveredCount: number
  returnedCount: number
  totalAmount: number
  settings?: GradeSettings
}): CustomerGrade {
  const { deliveredCount, returnedCount, totalAmount, settings } = opts
  const minPurchase = settings?.minPurchase ?? DEFAULT_GRADE_SETTINGS.minPurchase
  const th = settings?.thresholds ?? DEFAULT_GRADE_THRESHOLDS

  if (returnedCount >= th.dReturned) return 'D'
  if (deliveredCount >= th.aDelivered) {
    if (minPurchase.A != null && totalAmount < minPurchase.A) {
      if (minPurchase.B != null && totalAmount < minPurchase.B) return 'C'
      return 'B'
    }
    return 'A'
  }
  if (deliveredCount >= th.bDelivered) {
    if (minPurchase.B != null && totalAmount < minPurchase.B) return 'C'
    return 'B'
  }
  return 'C'
}

/**
 * คำนวณสถานะลูกค้า (Active / Inactive / Returned) จากข้อมูลคำสั่งซื้อ
 */
export function computeCustomerActivityStatus(opts: {
  lastDeliveredAt?: string | null
  lastReturnedAt?: string | null
  /** วันที่ใช้เปรียบเทียบ (default: ตอนนี้) */
  now?: Date
}): CustomerActivityStatus {
  const { lastDeliveredAt, lastReturnedAt } = opts
  const now = opts.now ?? new Date()

  // ตีกลับล่าสุดต้องใหม่กว่าส่งสำเร็จล่าสุด → returned
  const lastDelivered = lastDeliveredAt ? new Date(lastDeliveredAt).getTime() : 0
  const lastReturned = lastReturnedAt ? new Date(lastReturnedAt).getTime() : 0
  if (lastReturned > 0 && lastReturned >= lastDelivered) return 'returned'

  if (lastDelivered === 0) return 'inactive'
  const daysSince = (now.getTime() - lastDelivered) / 86400000
  return daysSince <= ACTIVITY_INACTIVE_DAYS ? 'active' : 'inactive'
}

/* ============================================================
 * SHIPPING PROFILE — กำหนดค่าส่ง+COD ต่อกลุ่มสินค้า
 * ============================================================ */
export interface ShippingProfile {
  id: string
  name: string                           // เช่น "เมล็ดพันธุ์", "สินค้าสุขภาพ/ทั่วไป"
  shippingFee: number                    // บาท
  codPercent: number                     // %
  productIds: string[]                   // สินค้าที่ใช้โปรไฟล์นี้
  createdAt: string
}

export interface ResolvedShipping {
  profileId?: string
  profileName?: string
  shippingFee: number                    // บาท
  codPercent: number                     // %
  codBaht: number                        // บาท (คำนวณจาก totalAmount × %)
}

/**
 * Resolve order shipping by picking the most expensive profile
 * applicable to any item. If multiple profiles apply, pick highest shippingFee.
 */
export function resolveOrderShipping(
  itemProductIds: string[],
  profiles: ShippingProfile[],
  totalAmount: number,
): ResolvedShipping {
  const applicable = profiles.filter(p =>
    p.productIds.some(pid => itemProductIds.includes(pid))
  )
  if (applicable.length === 0) {
    return { shippingFee: 0, codPercent: 0, codBaht: 0 }
  }
  // Pick profile with the highest shippingFee
  const chosen = applicable.reduce((max, p) => p.shippingFee > max.shippingFee ? p : max, applicable[0])
  return {
    profileId: chosen.id,
    profileName: chosen.name,
    shippingFee: chosen.shippingFee,
    codPercent: chosen.codPercent,
    codBaht: Math.round((totalAmount * chosen.codPercent) / 100),
  }
}

/* ============================================================
 * CUSTOMER
 * ============================================================ */
export type CustomerStatus = 'new' | 'follow_up' | 'closed' | 'lost'

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  new: 'ใหม่', follow_up: 'นัดหมาย', closed: 'ปิดได้', lost: 'หลุด',
}

export const CUSTOMER_STATUS_COLOR: Record<CustomerStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-slate-100 text-slate-600',
}

export interface AddressDetail {
  /** full street address line */
  line?: string
  subDistrict?: string  // ตำบล
  district?: string     // อำเภอ
  province?: string     // จังหวัด
  postalCode?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  line?: string
  address?: string                     // legacy/free-form
  addressDetail?: AddressDetail        // structured
  grade: CustomerGrade
  status?: CustomerStatus
  tags?: string[]
  ownerId?: string
  ownerName?: string
  totalOrders: number                  // = จำนวนออเดอร์ส่งสำเร็จ (delivered)
  totalAmount: number
  successRate: number
  cancelCount?: number                 // จำนวนยกเลิก
  returnedCount?: number               // จำนวนตีกลับ (สะสม)
  lastDeliveredAt?: string             // วันที่ส่งสำเร็จล่าสุด
  lastReturnedAt?: string              // วันที่ตีกลับล่าสุด
  lastCallAt?: string
  nextCallAt?: string
  nextCallNote?: string
  notes?: string
  createdAt: string
  updatedAt: string
  /** Customer info edit history (visible to Admin/Owner only) */
  editHistory?: EditHistoryEntry[]
}

export interface EditHistoryEntry {
  id: string
  at: string                           // ISO date
  userId: string
  userName: string
  field: string                        // e.g. "เบอร์โทร", "ที่อยู่"
  from: string
  to: string
}

/* ============================================================
 * PRODUCT
 * ============================================================ */
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock'

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'พร้อมขาย', inactive: 'ปิดการขาย', out_of_stock: 'สินค้าหมด',
}
export const PRODUCT_STATUS_COLOR: Record<ProductStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
  out_of_stock: 'bg-red-100 text-red-700',
}

export type CommissionMode = 'flat' | 'percent'

export interface ProductCommission {
  mode: CommissionMode
  /** value: if mode=flat, baht; if mode=percent, %  */
  value: number
  /** Special promotional commission */
  special?: {
    value: number
    startAt: string
    endAt: string
  }
}

export interface Product {
  id: string
  name: string
  sku?: string
  category?: string
  /** @deprecated brand field removed in v2 */
  brand?: string
  description?: string
  imageUrl?: string
  price: number                        // selling price
  cost: number                         // COGS
  /** ค่าส่งสินค้า (บาท ต่อชิ้น) */
  shippingFee?: number
  /** COD % — เป็น % ของราคาขาย (เช่น 1 = 1% ของ price) */
  codFee?: number
  /** ค่าแพ็ค/อื่นๆ (บาท ต่อชิ้น) */
  packingFee?: number
  commission?: ProductCommission
  unit: string
  stockQty?: number
  lowStockThreshold?: number
  status: ProductStatus
  createdAt: string
  updatedAt?: string
}

/** Compute COD fee in baht from product (codFee field is a percent of price) */
export function productCodFeeBaht(p: Product): number {
  return p.codFee ? (p.price * p.codFee) / 100 : 0
}

/** Compute gross profit per unit */
export function productGrossProfit(p: Product): number {
  return p.price - p.cost
}

/** Compute net profit per unit (after all overheads + commission) */
export function productNetProfit(p: Product): number {
  const gross = productGrossProfit(p)
  const overhead = (p.shippingFee ?? 0) + productCodFeeBaht(p) + (p.packingFee ?? 0)
  const comm = computeCommission(p)
  return gross - overhead - comm
}

/** Compute commission amount per unit given product config */
export function computeCommission(p: Product, atDate?: Date): number {
  const c = p.commission
  if (!c) return 0
  const now = atDate ?? new Date()
  // Special period override
  if (c.special && c.special.startAt && c.special.endAt) {
    const start = new Date(c.special.startAt)
    const end = new Date(c.special.endAt)
    if (now >= start && now <= end) {
      return c.mode === 'percent' ? (p.price * c.special.value) / 100 : c.special.value
    }
  }
  return c.mode === 'percent' ? (p.price * c.value) / 100 : c.value
}

/* ============================================================
 * CALL LOG
 * ============================================================ */
export type CallResult = 'closed' | 'follow_up' | 'no_answer' | 'not_interested'

export const CALL_RESULT_LABEL: Record<CallResult, string> = {
  closed: 'ปิดได้', follow_up: 'Follow Up', no_answer: 'ไม่รับโทร', not_interested: 'ไม่สนใจ',
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

/* ============================================================
 * ORDER
 * ============================================================ */
export type OrderStatus =
  | 'wait_pack'       // รอแพ็ค
  | 'in_myorder'      // นำเข้า My Order แล้ว (รอแพ็ค+ส่ง)
  | 'shipping'        // กรอกเลขพัสดุ จัดส่งแล้ว รอ Checker
  | 'delivered'       // ลูกค้ารับสินค้าสำเร็จ
  | 'returned'        // ตีกลับ
  | 'cancelled'       // ยกเลิก

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  wait_pack: 'รอแพ็ค',
  in_myorder: 'นำเข้าระบบแล้ว',
  shipping: 'กำลังจัดส่ง',
  delivered: 'ส่งสำเร็จ',
  returned: 'ตีกลับ',
  cancelled: 'ยกเลิก',
}

export const ORDER_STATUS_SHORT: Record<OrderStatus, string> = {
  wait_pack: 'WAIT_PACK',
  in_myorder: 'IN_MYORDER',
  shipping: 'SHIPPING',
  delivered: 'DELIVERED',
  returned: 'RETURNED',
  cancelled: 'CANCELLED',
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  wait_pack:  'bg-yellow-100 text-yellow-800 border border-yellow-200',
  in_myorder: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  shipping:   'bg-blue-100 text-blue-700 border border-blue-200',
  delivered:  'bg-green-100 text-green-800 border border-green-200',
  returned:   'bg-red-100 text-red-700 border border-red-200',
  cancelled:  'bg-slate-100 text-slate-700 border border-slate-200',
}

export type Carrier = 'flash' | 'kerry' | 'jt' | 'thaipost' | 'myorder' | 'other'

export const CARRIER_LABEL: Record<Carrier, string> = {
  flash: 'Flash Express',
  kerry: 'KEX',
  jt: 'J&T Express',
  thaipost: 'ไปรษณีย์ไทย',
  myorder: 'MyOrder',
  other: 'อื่นๆ',
}

export const CARRIER_COLOR: Record<Carrier, string> = {
  flash: 'bg-yellow-100 text-yellow-800',
  kerry: 'bg-orange-100 text-orange-800',
  jt: 'bg-red-100 text-red-800',
  thaipost: 'bg-blue-100 text-blue-800',
  myorder: 'bg-violet-100 text-violet-800',
  other: 'bg-slate-100 text-slate-700',
}

export interface OrderItem {
  productId: string
  productName: string
  price: number
  cost: number
  quantity: number
  subtotal: number
}

/** Order's overridden shipping info (separate from Customer's master record) */
export interface OrderShippingInfo {
  recipientName?: string
  recipientPhone?: string
  addressLine?: string
  subDistrict?: string
  district?: string
  province?: string
  postalCode?: string
}

export type PaymentMethod = 'cod' | 'transfer' | 'card' | 'other'
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: 'COD',
  transfer: 'โอนเงิน',
  card: 'บัตรเครดิต',
  other: 'อื่นๆ',
}

export interface Order {
  id: string                           // ORD680527-001 OR external Order No. from MyOrder
  /** Shipping profile resolved at order creation (locked) */
  shippingProfileId?: string
  shippingProfileName?: string
  /** Real shipping fee entered by packer (overrides standard) */
  realShippingFee?: number
  /** Real COD fee in baht entered by packer (overrides standard codBaht) */
  realCodBaht?: number
  /** If true, use real values for profit calc instead of standard */
  useRealForProfit?: boolean
  /** Standard COD in baht (snapshot at order time) */
  standardCodBaht?: number
  customerId: string
  customerName: string
  customerPhone: string
  customerAddress?: string             // legacy
  /** Shipping info for THIS order (may override customer's master info) */
  shipping?: OrderShippingInfo
  telesaleId: string
  telesaleName: string
  packingId?: string
  packingName?: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  totalCost: number
  discount: number
  shippingFee?: number
  codFee?: number
  carrier?: Carrier
  trackingNumber?: string
  notes?: string
  callLogId?: string
  commissionAmount?: number
  returnReason?: string
  createdAt: string
  updatedAt: string
  copiedAt?: string                    // when packer pressed "คัดลอกข้อมูล"
  shippedAt?: string
  deliveredAt?: string
  returnedAt?: string
  cancelledAt?: string
  cancelReason?: string
  /** Edit history for THIS order (shipping info changes) */
  editHistory?: EditHistoryEntry[]
  /** Source channel/page (e.g. "เกษตรออนไลน์") */
  channel?: string
  /** Payment method */
  paymentMethod?: PaymentMethod
  /** Total weight in kg (for shipping calc) */
  weightKg?: number
  /** Who created the order in source system */
  createdByName?: string
  /** Source system (e.g. "MyOrder") */
  source?: string
}

/* ============================================================
 * HISTORY LOG (system-wide)
 * ============================================================ */
export type HistoryEventType =
  | 'customer_added'
  | 'customer_assigned'
  | 'customer_edited'
  | 'customer_grade_changed'
  | 'call_made'
  | 'order_created'
  | 'order_copied'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_returned'
  | 'order_cancelled'
  | 'product_changed'
  | 'commission_paid'
  | 'member_added'
  | 'member_edited'
  | 'permission_changed'

export const HISTORY_EVENT_LABEL: Record<HistoryEventType, string> = {
  customer_added: 'เพิ่มลูกค้าใหม่',
  customer_assigned: 'กำหนดเจ้าของดูแล',
  customer_edited: 'แก้ไขข้อมูลลูกค้า',
  customer_grade_changed: 'เปลี่ยน Grade',
  call_made: 'โทรหาลูกค้า',
  order_created: 'สร้างออเดอร์',
  order_copied: 'คัดลอกข้อมูล',
  order_shipped: 'จัดส่งแล้ว',
  order_delivered: 'ส่งสำเร็จ',
  order_returned: 'ตีกลับ',
  order_cancelled: 'ยกเลิกออเดอร์',
  product_changed: 'แก้ไขสินค้า',
  commission_paid: 'จ่ายค่าคอม',
  member_added: 'เพิ่มสมาชิก',
  member_edited: 'แก้ไขสมาชิก',
  permission_changed: 'เปลี่ยนสิทธิ์',
}

export const HISTORY_EVENT_COLOR: Record<HistoryEventType, string> = {
  customer_added: 'bg-blue-100 text-blue-700',
  customer_assigned: 'bg-cyan-100 text-cyan-700',
  customer_edited: 'bg-cyan-100 text-cyan-700',
  customer_grade_changed: 'bg-yellow-100 text-yellow-700',
  call_made: 'bg-slate-100 text-slate-700',
  order_created: 'bg-green-100 text-green-700',
  order_copied: 'bg-cyan-100 text-cyan-700',
  order_shipped: 'bg-purple-100 text-purple-700',
  order_delivered: 'bg-green-200 text-green-800',
  order_returned: 'bg-red-100 text-red-700',
  order_cancelled: 'bg-slate-100 text-slate-700',
  product_changed: 'bg-slate-100 text-slate-600',
  commission_paid: 'bg-emerald-100 text-emerald-800',
  member_added: 'bg-violet-100 text-violet-700',
  member_edited: 'bg-violet-100 text-violet-700',
  permission_changed: 'bg-violet-100 text-violet-700',
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
