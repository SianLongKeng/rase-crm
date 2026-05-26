import { User, Customer, Product, CallLog, Order, HistoryLog } from '@/types'
import { addDays } from './utils'

const now = new Date().toISOString()
const d = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString()

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'คุณนา เจ้าของ', email: 'owner@rase.co.th', role: 'owner', password: '1234' },
  { id: 'u2', name: 'สมศักดิ์ เทเล', email: 'tele1@rase.co.th', role: 'telesale', password: '1234' },
  { id: 'u3', name: 'มานี เทเล', email: 'tele2@rase.co.th', role: 'telesale', password: '1234' },
  { id: 'u4', name: 'สมหมาย แพ็ก', email: 'pack1@rase.co.th', role: 'packing', password: '1234' },
]

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'วิตามิน C 1000mg', description: 'เสริมภูมิคุ้มกัน', price: 590, unit: 'กล่อง', status: 'active', createdAt: now },
  { id: 'p2', name: 'คอลลาเจนไตรเปปไทด์', description: 'บำรุงผิว ข้อต่อ', price: 1290, unit: 'กล่อง', status: 'active', createdAt: now },
  { id: 'p3', name: 'โอเมก้า 3 Fish Oil', description: 'บำรุงสมองและหัวใจ', price: 790, unit: 'กล่อง', status: 'active', createdAt: now },
  { id: 'p4', name: 'โปรตีนชง Whey', description: 'เสริมกล้ามเนื้อ', price: 1890, unit: 'ถุง', status: 'active', createdAt: now },
  { id: 'p5', name: 'ครีมกันแดด SPF50', description: 'ปกป้องผิว', price: 490, unit: 'หลอด', status: 'out_of_stock', createdAt: now },
]

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'คุณวิภา สุขใจ', phone: '081-234-5678', address: 'กรุงเทพฯ', tier: 'vip', totalOrders: 12, totalAmount: 18500, successRate: 92, lastCallAt: d(-20), nextCallAt: d(1), notes: 'ชอบวิตามิน C และคอลลาเจน', createdAt: d(-180), updatedAt: d(-1) },
  { id: 'c2', name: 'คุณสมชาย ดีใจ', phone: '082-345-6789', address: 'เชียงใหม่', tier: 'vip', totalOrders: 8, totalAmount: 12000, successRate: 88, lastCallAt: d(-21), nextCallAt: d(0), notes: '', createdAt: d(-150), updatedAt: d(-2) },
  { id: 'c3', name: 'คุณนิตยา แสนดี', phone: '083-456-7890', address: 'ขอนแก่น', tier: 'warm', totalOrders: 4, totalAmount: 5200, successRate: 70, lastCallAt: d(-29), nextCallAt: d(1), notes: 'สนใจโปรตีนชง', createdAt: d(-120), updatedAt: d(-3) },
  { id: 'c4', name: 'คุณประเสริฐ มั่งมี', phone: '084-567-8901', address: 'นครราชสีมา', tier: 'warm', totalOrders: 3, totalAmount: 3800, successRate: 65, lastCallAt: d(-30), nextCallAt: d(0), notes: '', createdAt: d(-100), updatedAt: d(-5) },
  { id: 'c5', name: 'คุณรัตนา ใจดี', phone: '085-678-9012', address: 'ภูเก็ต', tier: 'cold', totalOrders: 1, totalAmount: 590, successRate: 40, lastCallAt: d(-44), nextCallAt: d(1), notes: 'ยังลังเล', createdAt: d(-90), updatedAt: d(-10) },
  { id: 'c6', name: 'คุณไพบูลย์ ร่ำรวย', phone: '086-789-0123', address: 'กรุงเทพฯ', tier: 'cold', totalOrders: 0, totalAmount: 0, successRate: 0, lastCallAt: d(-46), nextCallAt: d(-1), notes: 'ไม่รับสาย 2 ครั้ง', createdAt: d(-80), updatedAt: d(-15) },
  { id: 'c7', name: 'คุณอรทัย สดใส', phone: '087-890-1234', address: 'ชลบุรี', tier: 'vip', totalOrders: 15, totalAmount: 24000, successRate: 95, lastCallAt: d(-22), nextCallAt: d(-1), notes: 'ลูกค้าประจำ ชอบคอลลาเจน', createdAt: d(-200), updatedAt: d(-1) },
  { id: 'c8', name: 'คุณธนาคาร ทรัพย์ดี', phone: '088-901-2345', address: 'กรุงเทพฯ', tier: 'warm', totalOrders: 5, totalAmount: 6800, successRate: 72, lastCallAt: d(-31), nextCallAt: d(-1), notes: '', createdAt: d(-110), updatedAt: d(-4) },
]

export const MOCK_CALL_LOGS: CallLog[] = [
  { id: 'cl1', customerId: 'c1', customerName: 'คุณวิภา สุขใจ', customerPhone: '081-234-5678', telesaleId: 'u2', telesaleName: 'สมศักดิ์ เทเล', result: 'closed', notes: 'สั่งวิตามิน C 2 กล่อง', createdAt: d(-20) },
  { id: 'cl2', customerId: 'c2', customerName: 'คุณสมชาย ดีใจ', customerPhone: '082-345-6789', telesaleId: 'u2', telesaleName: 'สมศักดิ์ เทเล', result: 'follow_up', notes: 'นัดโทรกลับพรุ่งนี้', followUpAt: d(1), createdAt: d(-21) },
  { id: 'cl3', customerId: 'c3', customerName: 'คุณนิตยา แสนดี', customerPhone: '083-456-7890', telesaleId: 'u3', telesaleName: 'มานี เทเล', result: 'closed', notes: 'สั่งโปรตีน 1 ถุง', createdAt: d(-29) },
  { id: 'cl4', customerId: 'c6', customerName: 'คุณไพบูลย์ ร่ำรวย', customerPhone: '086-789-0123', telesaleId: 'u2', telesaleName: 'สมศักดิ์ เทเล', result: 'no_answer', notes: '', createdAt: d(-46) },
]

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1', customerId: 'c1', customerName: 'คุณวิภา สุขใจ', customerPhone: '081-234-5678',
    telesaleId: 'u2', telesaleName: 'สมศักดิ์ เทเล', packingId: 'u4', packingName: 'สมหมาย แพ็ก',
    status: 'shipped', trackingNumber: 'TH1234567890',
    items: [{ productId: 'p1', productName: 'วิตามิน C 1000mg', price: 590, quantity: 2, subtotal: 1180 }],
    totalAmount: 1180, discount: 0, notes: '', callLogId: 'cl1', createdAt: d(-20), updatedAt: d(-19),
  },
  {
    id: 'o2', customerId: 'c3', customerName: 'คุณนิตยา แสนดี', customerPhone: '083-456-7890',
    telesaleId: 'u3', telesaleName: 'มานี เทเล',
    status: 'pending_pack',
    items: [{ productId: 'p4', productName: 'โปรตีนชง Whey', price: 1890, quantity: 1, subtotal: 1890 }],
    totalAmount: 1890, discount: 100, notes: 'ส่วนลดลูกค้าใหม่', callLogId: 'cl3', createdAt: d(-1), updatedAt: d(-1),
  },
]

export const MOCK_HISTORY: HistoryLog[] = [
  { id: 'h1', eventType: 'customer_added', description: 'เพิ่มลูกค้า คุณวิภา สุขใจ', userId: 'u2', userName: 'สมศักดิ์ เทเล', relatedId: 'c1', relatedType: 'customer', createdAt: d(-180) },
  { id: 'h2', eventType: 'call_made', description: 'โทรหา คุณวิภา สุขใจ — ปิดได้', userId: 'u2', userName: 'สมศักดิ์ เทเล', relatedId: 'cl1', relatedType: 'call_log', createdAt: d(-20) },
  { id: 'h3', eventType: 'order_created', description: 'สร้างออเดอร์ #o1 ลูกค้า คุณวิภา สุขใจ ยอด 1,180 บาท', userId: 'u2', userName: 'สมศักดิ์ เทเล', relatedId: 'o1', relatedType: 'order', createdAt: d(-20) },
  { id: 'h4', eventType: 'order_packed', description: 'แพ็กสินค้าออเดอร์ #o1 แล้ว', userId: 'u4', userName: 'สมหมาย แพ็ก', relatedId: 'o1', relatedType: 'order', createdAt: d(-19) },
  { id: 'h5', eventType: 'order_shipped', description: 'จัดส่งออเดอร์ #o1 เลขพัสดุ TH1234567890', userId: 'u4', userName: 'สมหมาย แพ็ก', relatedId: 'o1', relatedType: 'order', createdAt: d(-19) },
  { id: 'h6', eventType: 'call_made', description: 'โทรหา คุณนิตยา แสนดี — ปิดได้', userId: 'u3', userName: 'มานี เทเล', relatedId: 'cl3', relatedType: 'call_log', createdAt: d(-1) },
  { id: 'h7', eventType: 'order_created', description: 'สร้างออเดอร์ #o2 ลูกค้า คุณนิตยา แสนดี ยอด 1,790 บาท', userId: 'u3', userName: 'มานี เทเล', relatedId: 'o2', relatedType: 'order', createdAt: d(-1) },
]
