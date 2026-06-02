import { User, Customer, Product, CallLog, Order, HistoryLog, ShippingProfile } from '@/types'

const now = new Date().toISOString()
const d = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString()
const dh = (hourOffset: number) => new Date(Date.now() + hourOffset * 3600000).toISOString()

// ============================================================
// USERS — 8 คน, 4 บทบาท (รวม Checker เข้ากับ Packing)
// ============================================================
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'คุณนา เจ้าของ',  email: 'owner@cnp.co.th', role: 'owner',    department: 'บริหาร',     password: '1234', active: true },
  { id: 'u2', name: 'อรอนงค์ แอดมิน', email: 'admin@cnp.co.th', role: 'admin',    department: 'บริหาร',     password: '1234', active: true },
  { id: 'u3', name: 'สมศักดิ์ เทเล',   email: 'tele1@cnp.co.th', role: 'telesale', department: 'ฝ่ายขาย',    password: '1234', commissionRate: 6, active: true },
  { id: 'u4', name: 'มานี เทเล',       email: 'tele2@cnp.co.th', role: 'telesale', department: 'ฝ่ายขาย',    password: '1234', commissionRate: 5, active: true },
  { id: 'u5', name: 'ปรีชา เทเล',     email: 'tele3@cnp.co.th', role: 'telesale', department: 'ฝ่ายขาย',    password: '1234', commissionRate: 5, active: true },
  { id: 'u6', name: 'ลัดดา เทเล',     email: 'tele4@cnp.co.th', role: 'telesale', department: 'ฝ่ายขาย',    password: '1234', commissionRate: 4, active: true },
  { id: 'u7', name: 'สมหมาย แพ็ก',     email: 'pack1@cnp.co.th', role: 'packing',  department: 'คลังสินค้า', password: '1234', active: true },
  { id: 'u8', name: 'ชาตรี เช็คเกอร์', email: 'check@cnp.co.th', role: 'packing',  department: 'ตรวจสอบ',   password: '1234', active: true },
]

// ============================================================
// PRODUCTS — 10 รายการ พร้อม SKU, category, brand, full pricing
// ============================================================
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'วิตามิน C 1000mg', sku: 'VIT-C-1000', category: 'อาหารเสริม', brand: 'CNP',
    description: 'เสริมภูมิคุ้มกัน บำรุงผิวขาวใส', price: 590, cost: 220, shippingFee: 50, codFee: 1, packingFee: 2,
    commission: { mode: 'percent', value: 10 },
    unit: 'กล่อง', stockQty: 120, lowStockThreshold: 20, status: 'active', createdAt: d(-200),
  },
  {
    id: 'p2', name: 'คอลลาเจนไตรเปปไทด์ 5g', sku: 'COL-TRI-5G', category: 'อาหารเสริม', brand: 'CNP',
    description: 'บำรุงผิว ข้อต่อ ลดริ้วรอย', price: 1290, cost: 480, shippingFee: 50, codFee: 1, packingFee: 3,
    commission: { mode: 'percent', value: 8 },
    unit: 'กล่อง', stockQty: 80, lowStockThreshold: 15, status: 'active', createdAt: d(-200),
  },
  {
    id: 'p3', name: 'โอเมก้า 3 Fish Oil', sku: 'FISHOIL-3', category: 'อาหารเสริม', brand: 'CNP',
    description: 'บำรุงสมองและหัวใจ ลดไขมัน', price: 790, cost: 290, shippingFee: 50, codFee: 1, packingFee: 2,
    commission: { mode: 'percent', value: 5 },
    unit: 'กล่อง', stockQty: 45, lowStockThreshold: 10, status: 'active', createdAt: d(-180),
  },
  {
    id: 'p4', name: 'โปรตีน Whey วานิลา', sku: 'WHEY-VAN', category: 'อาหารเสริม', brand: 'CNP',
    description: 'เสริมกล้ามเนื้อ ลดน้ำหนัก', price: 1890, cost: 950, shippingFee: 80, codFee: 1, packingFee: 5,
    commission: { mode: 'percent', value: 7 },
    unit: 'ถุง', stockQty: 30, lowStockThreshold: 5, status: 'active', createdAt: d(-150),
  },
  {
    id: 'p5', name: 'ครีมกันแดด SPF50+', sku: 'SUN-SPF50', category: 'ความงาม', brand: 'CNP',
    description: 'ปกป้องผิวจากแสงแดด UV', price: 490, cost: 180, shippingFee: 40, codFee: 1, packingFee: 2,
    commission: { mode: 'flat', value: 8 },
    unit: 'หลอด', stockQty: 0, lowStockThreshold: 10, status: 'out_of_stock', createdAt: d(-120),
  },
  {
    id: 'p6', name: 'คอลลาเจนผง รสองุ่น', sku: 'COL-GRAPE', category: 'อาหารเสริม', brand: 'CNP',
    description: 'ดื่มอร่อย ผิวเปล่งปลั่ง', price: 690, cost: 280, shippingFee: 50, codFee: 1, packingFee: 2,
    commission: { mode: 'percent', value: 6 },
    unit: 'กล่อง', stockQty: 18, lowStockThreshold: 20, status: 'active', createdAt: d(-90),
  },
  {
    id: 'p7', name: 'น้ำมันมะพร้าวสกัดเย็น', sku: 'COCO-OIL', category: 'สุขภาพ', brand: 'CNP',
    description: 'ออร์แกนิค ลดน้ำหนัก', price: 390, cost: 150, shippingFee: 40, codFee: 1, packingFee: 2,
    commission: { mode: 'flat', value: 5 },
    unit: 'ขวด', stockQty: 60, lowStockThreshold: 15, status: 'active', createdAt: d(-80),
  },
  {
    id: 'p8', name: 'แอมป์เซรั่มหน้าใส', sku: 'SERUM-WHT', category: 'ความงาม', brand: 'CNP',
    description: 'วิตามิน C เข้มข้น ลดจุดด่างดำ', price: 1490, cost: 520, shippingFee: 50, codFee: 1, packingFee: 3,
    commission: { mode: 'percent', value: 8 },
    unit: 'ขวด', stockQty: 25, lowStockThreshold: 10, status: 'active', createdAt: d(-60),
  },
  {
    id: 'p9', name: 'ขมิ้นชันแคปซูล', sku: 'TURMERIC', category: 'อาหารเสริม', brand: 'CNP',
    description: 'บำรุงตับ ลดกรดในกระเพาะ', price: 290, cost: 110, shippingFee: 40, codFee: 1, packingFee: 2,
    commission: { mode: 'flat', value: 3 },
    unit: 'กระปุก', stockQty: 75, lowStockThreshold: 20, status: 'active', createdAt: d(-45),
  },
  {
    id: 'p10', name: 'ชุดผักสวนครัว 5 ชนิด', sku: 'VEG-SET-001', category: 'เมล็ดพันธุ์ผัก', brand: 'ALL LUCKY SEED',
    description: 'ปลูกง่าย โตไว เหมาะสำหรับปลูกเองในครัวเรือน ประกอบด้วย ต้นหอม ผักชี กวางตุ้ง คะน้า และพริก',
    price: 100, cost: 20, shippingFee: 25, codFee: 1, packingFee: 2,
    commission: { mode: 'flat', value: 5 },
    unit: 'ชุด', stockQty: 250, lowStockThreshold: 20, status: 'active', createdAt: d(-30),
  },
]

// ============================================================
// SHIPPING PROFILES — 2 ตัวอย่าง
// ============================================================
export const MOCK_SHIPPING_PROFILES: ShippingProfile[] = [
  {
    id: 'sp1',
    name: 'อาหารเสริม',
    shippingFee: 50,
    codPercent: 1,
    productIds: ['p1', 'p2', 'p3', 'p4', 'p6', 'p9'],
    createdAt: d(-60),
  },
  {
    id: 'sp2',
    name: 'ความงาม + สุขภาพ + ทั่วไป',
    shippingFee: 60,
    codPercent: 2,
    productIds: ['p5', 'p7', 'p8', 'p10'],
    createdAt: d(-60),
  },
]

// ============================================================
// CUSTOMERS — 32 ราย กระจาย Grade A/B/C/D + Line + addressDetail
// ============================================================
export const MOCK_CUSTOMERS: Customer[] = [
  // Grade A — 8 ราย
  { id: 'c1', name: 'คุณวิภา สุขใจ', phone: '081-234-5678', line: 'wipas123', address: '210 ถ.ชมสินธุ์ ต.หัวหิน อ.หัวหิน จ.ประจวบฯ 77110', addressDetail: { line: '210 ถ.ชมสินธุ์', subDistrict: 'หัวหิน', district: 'หัวหิน', province: 'ประจวบฯ', postalCode: '77110' }, grade: 'A', status: 'closed', tags: ['ลูกค้าประจำ', 'VIP'], ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 12, totalAmount: 18500, successRate: 92, lastCallAt: d(-18), nextCallAt: d(3), nextCallNote: 'ลูกค้าสนใจโปรในช่องคอลลาเจนกระปุกใหญ่ นัดโทรติดตามยืนยันโปรเดิน', notes: 'ชอบวิตามิน C และคอลลาเจน', createdAt: d(-180), updatedAt: d(-1), editHistory: [{ id: 'eh1', at: d(-2), userId: 'u4', userName: 'มานี เทเล', field: 'เบอร์โทร', from: '082-123-4567', to: '081-234-5678' }] },
  { id: 'c2', name: 'คุณอรทัย สดใส', phone: '087-890-1234', line: 'orathai_s', address: 'ชลบุรี', grade: 'A', status: 'follow_up', ownerId: 'u4', ownerName: 'มานี เทเล', totalOrders: 15, totalAmount: 24300, successRate: 95, lastCallAt: d(-21), nextCallAt: d(0), nextCallNote: 'ลูกค้าตอบในช่องคอลลาเจนกระปุกใหญ่', notes: 'ลูกค้าประจำ ชอบคอลลาเจน', createdAt: d(-220), updatedAt: d(-1) },
  { id: 'c3', name: 'คุณสมชาย ดีใจ', phone: '082-345-6789', address: 'เชียงใหม่', grade: 'A', status: 'closed', ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 9, totalAmount: 13200, successRate: 88, lastCallAt: d(-22), nextCallAt: d(-1), notes: 'นัดโทรซ้ำกำหนด', createdAt: d(-180), updatedAt: d(-2) },
  { id: 'c4', name: 'คุณกนกพร แก้วใส', phone: '091-234-5678', address: 'กรุงเทพฯ', grade: 'A', status: 'closed', ownerId: 'u4', ownerName: 'มานี เทเล', totalOrders: 10, totalAmount: 16800, successRate: 90, lastCallAt: d(-19), nextCallAt: d(2), notes: 'พนักงานออฟฟิศ ดูแลสุขภาพดี', createdAt: d(-200), updatedAt: d(-2) },
  { id: 'c5', name: 'คุณพิเชษฐ์ ทองดี', phone: '092-345-6789', address: 'ภูเก็ต', grade: 'A', status: 'closed', ownerId: 'u5', ownerName: 'ปรีชา เทเล', totalOrders: 8, totalAmount: 11900, successRate: 87, lastCallAt: d(-20), nextCallAt: d(1), notes: 'เจ้าของร้านค้า', createdAt: d(-160), updatedAt: d(-3) },
  { id: 'c6', name: 'คุณนงค์ลักษณ์ ใจดี', phone: '093-456-7890', address: 'นนทบุรี', grade: 'A', status: 'follow_up', ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 11, totalAmount: 17200, successRate: 91, lastCallAt: d(-17), nextCallAt: d(4), notes: 'พ่อค้าตลาด ซื้อให้ครอบครัว', createdAt: d(-190), updatedAt: d(-1) },
  { id: 'c7', name: 'คุณสุกัญญา รุ่งเรือง', phone: '094-567-8901', address: 'อยุธยา', grade: 'A', status: 'closed', ownerId: 'u6', ownerName: 'ลัดดา เทเล', totalOrders: 13, totalAmount: 20800, successRate: 93, lastCallAt: d(-15), nextCallAt: d(6), notes: 'แนะนำเพื่อนๆ มาซื้อด้วย', createdAt: d(-210), updatedAt: d(-2) },
  { id: 'c8', name: 'คุณวรพล มั่งคั่ง', phone: '095-678-9012', address: '99/88 หมู่ 5 ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000', addressDetail: { line: '99/88 หมู่ 5', subDistrict: 'ในเมือง', district: 'เมืองขอนแก่น', province: 'ขอนแก่น', postalCode: '40000' }, grade: 'A', status: 'closed', ownerId: 'u4', ownerName: 'มานี เทเล', totalOrders: 9, totalAmount: 14500, successRate: 89, lastCallAt: d(-22), nextCallAt: d(-1), notes: 'นักธุรกิจ ซื้อยกเดือน', createdAt: d(-170), updatedAt: d(-1) },

  // Grade B — 10 ราย
  { id: 'c9', name: 'คุณนิตยา แสนดี', phone: '083-456-7890', address: 'ขอนแก่น', grade: 'B', status: 'follow_up', ownerId: 'u4', ownerName: 'มานี เทเล', totalOrders: 5, totalAmount: 6200, successRate: 75, lastCallAt: d(-25), nextCallAt: d(5), notes: 'สนใจโปรตีนชง', createdAt: d(-140), updatedAt: d(-2) },
  { id: 'c10', name: 'คุณประเสริฐ มั่งมี', phone: '084-567-8901', address: 'นครราชสีมา', grade: 'B', status: 'closed', ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 4, totalAmount: 4900, successRate: 70, lastCallAt: d(-28), nextCallAt: d(2), notes: 'เกษียณ ดูแลสุขภาพตัวเอง', createdAt: d(-120), updatedAt: d(-5) },
  { id: 'c11', name: 'คุณธนาคาร ทรัพย์ดี', phone: '088-901-2345', address: 'กรุงเทพฯ', grade: 'B', status: 'closed', ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 5, totalAmount: 6800, successRate: 72, lastCallAt: d(-26), nextCallAt: d(4), createdAt: d(-110), updatedAt: d(-4) },
  { id: 'c12', name: 'คุณกชกร กุลทรัพย์', phone: '096-789-0123', address: 'อุดรธานี', grade: 'B', status: 'closed', ownerId: 'u5', ownerName: 'ปรีชา เทเล', totalOrders: 6, totalAmount: 8400, successRate: 78, lastCallAt: d(-29), nextCallAt: d(1), notes: 'ครูประจำ ติดต่อง่าย', createdAt: d(-130), updatedAt: d(-3) },
  { id: 'c13', name: 'คุณบุญรอด มีชัย', phone: '097-890-1234', address: 'สงขลา', grade: 'B', status: 'follow_up', ownerId: 'u6', ownerName: 'ลัดดา เทเล', totalOrders: 4, totalAmount: 5100, successRate: 67, lastCallAt: d(-30), nextCallAt: d(0), notes: 'ชาวสวน', createdAt: d(-100), updatedAt: d(-7) },
  { id: 'c14', name: 'คุณเสาวลักษณ์ สุขสันต์', phone: '098-901-2345', address: 'ระยอง', grade: 'B', status: 'closed', ownerId: 'u4', ownerName: 'มานี เทเล', totalOrders: 5, totalAmount: 7200, successRate: 75, lastCallAt: d(-24), nextCallAt: d(6), notes: 'พนักงานโรงงาน', createdAt: d(-115), updatedAt: d(-2) },
  { id: 'c15', name: 'คุณวีระชัย กล้าหาญ', phone: '099-012-3456', address: 'สุราษฎร์ธานี', grade: 'B', status: 'closed', ownerId: 'u5', ownerName: 'ปรีชา เทเล', totalOrders: 3, totalAmount: 3900, successRate: 65, lastCallAt: d(-31), nextCallAt: d(-1), createdAt: d(-95), updatedAt: d(-8) },
  { id: 'c16', name: 'คุณสุภาพร ใจเย็น', phone: '081-345-6789', address: 'ลำปาง', grade: 'B', status: 'closed', ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 4, totalAmount: 5400, successRate: 68, lastCallAt: d(-27), nextCallAt: d(3), notes: 'นัดโทรเช้า', createdAt: d(-105), updatedAt: d(-4) },
  { id: 'c17', name: 'คุณอนันต์ รุ่งโรจน์', phone: '082-456-7890', address: 'พิษณุโลก', grade: 'B', status: 'closed', ownerId: 'u6', ownerName: 'ลัดดา เทเล', totalOrders: 6, totalAmount: 8800, successRate: 76, lastCallAt: d(-23), nextCallAt: d(7), notes: 'พระสงฆ์ ซื้อให้ญาติโยม', createdAt: d(-125), updatedAt: d(-1) },
  { id: 'c18', name: 'คุณสุนีย์ ขยันดี', phone: '083-567-8901', address: 'อุบลราชธานี', grade: 'B', status: 'closed', ownerId: 'u4', ownerName: 'มานี เทเล', totalOrders: 3, totalAmount: 4100, successRate: 66, lastCallAt: d(-32), nextCallAt: d(-2), createdAt: d(-85), updatedAt: d(-10) },

  // Grade C — 8 ราย
  { id: 'c19', name: 'คุณรัตนา ใจดี', phone: '085-678-9012', address: 'ภูเก็ต', grade: 'C', status: 'follow_up', ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 2, totalAmount: 1180, successRate: 55, lastCallAt: d(-40), nextCallAt: d(5), notes: 'ยังลังเล', createdAt: d(-90), updatedAt: d(-12) },
  { id: 'c20', name: 'คุณวันเฉลิม สว่างใส', phone: '084-789-0123', address: 'นครศรีธรรมราช', grade: 'C', status: 'follow_up', ownerId: 'u5', ownerName: 'ปรีชา เทเล', totalOrders: 1, totalAmount: 590, successRate: 50, lastCallAt: d(-44), nextCallAt: d(1), notes: 'ลองสินค้าครั้งแรก', createdAt: d(-80), updatedAt: d(-15) },
  { id: 'c21', name: 'คุณดวงพร จิตใส', phone: '085-890-1234', address: 'ตรัง', grade: 'C', status: 'closed', ownerId: 'u4', ownerName: 'มานี เทเล', totalOrders: 2, totalAmount: 980, successRate: 60, lastCallAt: d(-42), nextCallAt: d(3), createdAt: d(-75), updatedAt: d(-13) },
  { id: 'c22', name: 'คุณวินัย ทำงานดี', phone: '086-901-2345', address: 'พระนครศรีอยุธยา', grade: 'C', status: 'lost', ownerId: 'u6', ownerName: 'ลัดดา เทเล', totalOrders: 1, totalAmount: 690, successRate: 50, lastCallAt: d(-46), nextCallAt: d(-1), notes: 'ลองคอลลาเจน', createdAt: d(-70), updatedAt: d(-16) },
  { id: 'c23', name: 'คุณภัทรพล ก้าวหน้า', phone: '087-012-3456', address: 'นนทบุรี', grade: 'C', status: 'follow_up', ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 2, totalAmount: 1290, successRate: 58, lastCallAt: d(-41), nextCallAt: d(4), notes: 'รับสายไม่เสมอ', createdAt: d(-78), updatedAt: d(-14) },
  { id: 'c24', name: 'คุณกานต์ มีสุข', phone: '088-123-4567', address: 'ลพบุรี', grade: 'C', status: 'follow_up', ownerId: 'u5', ownerName: 'ปรีชา เทเล', totalOrders: 1, totalAmount: 790, successRate: 50, lastCallAt: d(-50), nextCallAt: d(-5), notes: 'นัดติดต่อใหม่', createdAt: d(-72), updatedAt: d(-20) },
  { id: 'c25', name: 'คุณนริศรา ใจกล้า', phone: '089-234-5678', address: 'นครสวรรค์', grade: 'C', status: 'follow_up', ownerId: 'u4', ownerName: 'มานี เทเล', totalOrders: 2, totalAmount: 1480, successRate: 62, lastCallAt: d(-38), nextCallAt: d(6), notes: 'แม่บ้าน', createdAt: d(-65), updatedAt: d(-11) },
  { id: 'c26', name: 'คุณสมพงษ์ พงษ์พันธ์', phone: '090-345-6789', address: 'สมุทรปราการ', grade: 'C', status: 'lost', ownerId: 'u6', ownerName: 'ลัดดา เทเล', totalOrders: 1, totalAmount: 490, successRate: 50, lastCallAt: d(-48), nextCallAt: d(-3), createdAt: d(-60), updatedAt: d(-18) },

  // Grade D — 6 ราย
  { id: 'c27', name: 'คุณไพบูลย์ ร่ำรวย', phone: '086-789-0123', address: 'กรุงเทพฯ', grade: 'D', status: 'lost', ownerId: 'u3', ownerName: 'สมศักดิ์ เทเล', totalOrders: 0, totalAmount: 0, successRate: 0, lastCallAt: d(-46), nextCallAt: d(-1), notes: 'ไม่รับสาย 2 ครั้ง', createdAt: d(-65), updatedAt: d(-15) },
  { id: 'c28', name: 'คุณภัทรา รักดี', phone: '089-012-3456', address: 'นนทบุรี', grade: 'D', status: 'new', totalOrders: 0, totalAmount: 0, successRate: 0, nextCallAt: d(-2), notes: 'ลูกค้าใหม่ ยังไม่ได้กำหนดเจ้าของ', createdAt: d(-5), updatedAt: d(-5) },
  { id: 'c29', name: 'คุณกิตติพงษ์ พรหมา', phone: '090-123-4567', address: 'ระยอง', grade: 'D', status: 'new', totalOrders: 0, totalAmount: 0, successRate: 0, nextCallAt: d(0), notes: 'นำเข้าจาก Excel', createdAt: d(-1), updatedAt: d(-1) },
  { id: 'c30', name: 'คุณธีรพล ปลื้มใจ', phone: '081-456-7890', address: 'กรุงเทพฯ', grade: 'D', status: 'new', totalOrders: 0, totalAmount: 0, successRate: 0, nextCallAt: d(0), notes: 'Lead จาก Facebook Ads', createdAt: d(-1), updatedAt: d(-1) },
  { id: 'c31', name: 'คุณมณีรัตน์ งามดี', phone: '082-567-8901', address: 'นครราชสีมา', grade: 'D', status: 'new', ownerId: 'u6', ownerName: 'ลัดดา เทเล', totalOrders: 0, totalAmount: 0, successRate: 0, nextCallAt: d(1), notes: 'ลูกค้าใหม่ Grade D', createdAt: d(-2), updatedAt: d(-2) },
  { id: 'c32', name: 'คุณชนกานต์ มงคล', phone: '083-678-9012', address: 'ปทุมธานี', grade: 'D', status: 'new', totalOrders: 0, totalAmount: 0, successRate: 0, nextCallAt: d(-1), notes: 'Lead ใหม่ รอ Assign', createdAt: d(-3), updatedAt: d(-3) },
]

// ============================================================
// CALL LOGS
// ============================================================
export const MOCK_CALL_LOGS: CallLog[] = [
  // closed
  { id: 'cl1',  customerId: 'c1',  customerName: 'คุณวิภา สุขใจ',     customerPhone: '081-234-5678', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', result: 'closed', notes: 'สั่งวิตามิน C 2 กล่อง + โอเมก้า 3', createdAt: d(-18) },
  { id: 'cl2',  customerId: 'c2',  customerName: 'คุณอรทัย สดใส',     customerPhone: '087-890-1234', telesaleId: 'u4', telesaleName: 'มานี เทเล',     result: 'closed', notes: 'คอลลาเจน 1 กล่อง', createdAt: d(-21) },
  { id: 'cl3',  customerId: 'c9',  customerName: 'คุณนิตยา แสนดี',    customerPhone: '083-456-7890', telesaleId: 'u4', telesaleName: 'มานี เทเล',     result: 'closed', notes: 'โปรตีน Whey 1 ถุง', createdAt: d(-25) },
  { id: 'cl4',  customerId: 'c4',  customerName: 'คุณกนกพร แก้วใส',   customerPhone: '091-234-5678', telesaleId: 'u4', telesaleName: 'มานี เทเล',     result: 'closed', notes: 'แอมป์เซรั่ม 1 ขวด', createdAt: d(-12) },
  { id: 'cl5',  customerId: 'c5',  customerName: 'คุณพิเชษฐ์ ทองดี',  customerPhone: '092-345-6789', telesaleId: 'u5', telesaleName: 'ปรีชา เทเล',    result: 'closed', notes: 'น้ำมันมะพร้าว + ขมิ้นชัน', createdAt: d(-10) },
  { id: 'cl6',  customerId: 'c6',  customerName: 'คุณนงค์ลักษณ์ ใจดี', customerPhone: '093-456-7890', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', result: 'closed', notes: 'วิตามิน C 3 กล่อง', createdAt: d(-8) },
  { id: 'cl7',  customerId: 'c7',  customerName: 'คุณสุกัญญา รุ่งเรือง', customerPhone: '094-567-8901', telesaleId: 'u6', telesaleName: 'ลัดดา เทเล',  result: 'closed', notes: 'คอลลาเจนผง 2 กล่อง', createdAt: d(-6) },
  { id: 'cl8',  customerId: 'c3',  customerName: 'คุณสมชาย ดีใจ',     customerPhone: '082-345-6789', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', result: 'closed', notes: 'โอเมก้า 3 + ขมิ้นชัน', createdAt: d(-3) },
  { id: 'cl9',  customerId: 'c11', customerName: 'คุณธนาคาร ทรัพย์ดี', customerPhone: '088-901-2345', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', result: 'closed', notes: 'โอเมก้า + แอมป์เซรั่ม', createdAt: d(-2) },
  { id: 'cl10', customerId: 'c12', customerName: 'คุณกชกร กุลทรัพย์', customerPhone: '096-789-0123', telesaleId: 'u5', telesaleName: 'ปรีชา เทเล',    result: 'closed', notes: 'คอลลาเจน 2 กล่อง', createdAt: dh(-12) },
  // follow_up
  { id: 'cl20', customerId: 'c20', customerName: 'คุณวันเฉลิม สว่างใส', customerPhone: '084-789-0123', telesaleId: 'u5', telesaleName: 'ปรีชา เทเล',  result: 'follow_up', notes: 'ขอคิดดูก่อน', followUpAt: d(7), createdAt: d(-1) },
  { id: 'cl21', customerId: 'c25', customerName: 'คุณนริศรา ใจกล้า',   customerPhone: '089-234-5678', telesaleId: 'u4', telesaleName: 'มานี เทเล',     result: 'follow_up', notes: 'ปรึกษาสามีก่อน', followUpAt: d(3), createdAt: d(-2) },
  // no_answer
  { id: 'cl30', customerId: 'c27', customerName: 'คุณไพบูลย์ ร่ำรวย',  customerPhone: '086-789-0123', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', result: 'no_answer', notes: 'ไม่รับสาย โทร 2 ครั้ง', createdAt: d(-46) },
  { id: 'cl31', customerId: 'c19', customerName: 'คุณรัตนา ใจดี',      customerPhone: '085-678-9012', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', result: 'no_answer', notes: 'ปิดเครื่อง', createdAt: d(-40) },
  // not_interested
  { id: 'cl40', customerId: 'c22', customerName: 'คุณวินัย ทำงานดี',   customerPhone: '086-901-2345', telesaleId: 'u6', telesaleName: 'ลัดดา เทเล',   result: 'not_interested', notes: 'ไม่สะดวก', createdAt: d(-46) },
  { id: 'cl41', customerId: 'c26', customerName: 'คุณสมพงษ์ พงษ์พันธ์', customerPhone: '090-345-6789', telesaleId: 'u6', telesaleName: 'ลัดดา เทเล',  result: 'not_interested', notes: 'ราคาสูงเกินไป', createdAt: d(-48) },
]

// ============================================================
// ORDERS — กระจายทุกสถานะรวม IN_MYORDER + CANCELLED
// Order ID format: ORD680527-001 (Thai year 568 + month-day + sequence)
// ============================================================
const currentBE = (new Date().getFullYear() + 543) % 1000
const yyStr = String(currentBE).padStart(3, '0')
const mm = String(new Date().getMonth() + 1).padStart(2, '0')
const dd = String(new Date().getDate()).padStart(2, '0')
const oid = (seq: number) => `ORD${yyStr}${mm}${dd}-${String(seq).padStart(3, '0')}`

export const MOCK_ORDERS: Order[] = [
  // ============== DELIVERED — 12 ออเดอร์ ==============
  { id: oid(1), customerId: 'c1', customerName: 'คุณวิภา สุขใจ', customerPhone: '081-234-5678', customerAddress: 'กรุงเทพฯ', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'flash', trackingNumber: 'TH1234567890', items: [{ productId: 'p1', productName: 'วิตามิน C 1000mg', price: 590, cost: 220, quantity: 2, subtotal: 1180 }, { productId: 'p3', productName: 'โอเมก้า 3 Fish Oil', price: 790, cost: 290, quantity: 1, subtotal: 790 }], totalAmount: 1970, totalCost: 730, discount: 0, shippingFee: 50, codFee: 1, commissionAmount: 118, callLogId: 'cl1', createdAt: d(-18), updatedAt: d(-13), shippedAt: d(-16), deliveredAt: d(-13) },
  { id: oid(2), customerId: 'c2', customerName: 'คุณอรทัย สดใส', customerPhone: '087-890-1234', customerAddress: 'ชลบุรี', telesaleId: 'u4', telesaleName: 'มานี เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'kerry', trackingNumber: 'KE9876543210', items: [{ productId: 'p2', productName: 'คอลลาเจนไตรเปปไทด์ 5g', price: 1290, cost: 480, quantity: 1, subtotal: 1290 }], totalAmount: 1290, totalCost: 480, discount: 0, shippingFee: 50, codFee: 1, commissionAmount: 65, callLogId: 'cl2', createdAt: d(-21), updatedAt: d(-17), shippedAt: d(-19), deliveredAt: d(-17) },
  { id: oid(3), customerId: 'c9', customerName: 'คุณนิตยา แสนดี', customerPhone: '083-456-7890', customerAddress: 'ขอนแก่น', telesaleId: 'u4', telesaleName: 'มานี เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'jt', trackingNumber: 'JT1112223334', items: [{ productId: 'p4', productName: 'โปรตีน Whey วานิลา', price: 1890, cost: 950, quantity: 1, subtotal: 1890 }], totalAmount: 1890, totalCost: 950, discount: 100, shippingFee: 80, codFee: 1, commissionAmount: 90, callLogId: 'cl3', createdAt: d(-25), updatedAt: d(-21), shippedAt: d(-23), deliveredAt: d(-21), notes: 'ส่วนลดลูกค้าใหม่' },
  { id: oid(4), customerId: 'c4', customerName: 'คุณกนกพร แก้วใส', customerPhone: '091-234-5678', customerAddress: 'กรุงเทพฯ', telesaleId: 'u4', telesaleName: 'มานี เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'flash', trackingNumber: 'TH5556667778', items: [{ productId: 'p8', productName: 'แอมป์เซรั่มหน้าใส', price: 1490, cost: 520, quantity: 1, subtotal: 1490 }], totalAmount: 1490, totalCost: 520, discount: 0, shippingFee: 50, codFee: 1, commissionAmount: 75, callLogId: 'cl4', createdAt: d(-12), updatedAt: d(-8), shippedAt: d(-10), deliveredAt: d(-8) },
  { id: oid(5), customerId: 'c5', customerName: 'คุณพิเชษฐ์ ทองดี', customerPhone: '092-345-6789', customerAddress: 'ภูเก็ต', telesaleId: 'u5', telesaleName: 'ปรีชา เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'thaipost', trackingNumber: 'EX123456789TH', items: [{ productId: 'p7', productName: 'น้ำมันมะพร้าวสกัดเย็น', price: 390, cost: 150, quantity: 2, subtotal: 780 }, { productId: 'p9', productName: 'ขมิ้นชันแคปซูล', price: 290, cost: 110, quantity: 1, subtotal: 290 }], totalAmount: 1070, totalCost: 410, discount: 0, shippingFee: 80, codFee: 1, commissionAmount: 54, callLogId: 'cl5', createdAt: d(-10), updatedAt: d(-6), shippedAt: d(-8), deliveredAt: d(-6) },
  { id: oid(6), customerId: 'c6', customerName: 'คุณนงค์ลักษณ์ ใจดี', customerPhone: '093-456-7890', customerAddress: 'นนทบุรี', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'flash', trackingNumber: 'TH7778889990', items: [{ productId: 'p1', productName: 'วิตามิน C 1000mg', price: 590, cost: 220, quantity: 3, subtotal: 1770 }], totalAmount: 1770, totalCost: 660, discount: 0, shippingFee: 50, codFee: 1, commissionAmount: 106, callLogId: 'cl6', createdAt: d(-8), updatedAt: d(-5), shippedAt: d(-7), deliveredAt: d(-5) },
  { id: oid(7), customerId: 'c7', customerName: 'คุณสุกัญญา รุ่งเรือง', customerPhone: '094-567-8901', customerAddress: 'อยุธยา', telesaleId: 'u6', telesaleName: 'ลัดดา เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'kerry', trackingNumber: 'KE2223334445', items: [{ productId: 'p6', productName: 'คอลลาเจนผง รสองุ่น', price: 690, cost: 280, quantity: 2, subtotal: 1380 }], totalAmount: 1380, totalCost: 560, discount: 50, shippingFee: 60, codFee: 1, commissionAmount: 53, callLogId: 'cl7', createdAt: d(-6), updatedAt: d(-3), shippedAt: d(-5), deliveredAt: d(-3) },
  { id: oid(8), customerId: 'c8', customerName: 'คุณวรพล มั่งคั่ง', customerPhone: '095-678-9012', customerAddress: '99/88 หมู่ 5 ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000', telesaleId: 'u4', telesaleName: 'มานี เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'myorder', trackingNumber: 'MO334455667', items: [{ productId: 'p2', productName: 'คอลลาเจนไตรเปปไทด์ 5g', price: 1290, cost: 480, quantity: 1, subtotal: 1290 }, { productId: 'p3', productName: 'โอเมก้า 3 Fish Oil', price: 790, cost: 290, quantity: 1, subtotal: 790 }], totalAmount: 2080, totalCost: 770, discount: 0, shippingFee: 50, codFee: 1, commissionAmount: 104, createdAt: d(-30), updatedAt: d(-26), shippedAt: d(-28), deliveredAt: d(-26) },
  { id: oid(9), customerId: 'c10', customerName: 'คุณประเสริฐ มั่งมี', customerPhone: '084-567-8901', customerAddress: 'นครราชสีมา', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'flash', trackingNumber: 'TH4445556669', items: [{ productId: 'p9', productName: 'ขมิ้นชันแคปซูล', price: 290, cost: 110, quantity: 2, subtotal: 580 }], totalAmount: 580, totalCost: 220, discount: 0, shippingFee: 50, codFee: 1, commissionAmount: 35, createdAt: d(-40), updatedAt: d(-36), shippedAt: d(-38), deliveredAt: d(-36) },
  { id: oid(10), customerId: 'c12', customerName: 'คุณกชกร กุลทรัพย์', customerPhone: '096-789-0123', customerAddress: 'อุดรธานี', telesaleId: 'u5', telesaleName: 'ปรีชา เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'kerry', trackingNumber: 'KE5556667778', items: [{ productId: 'p2', productName: 'คอลลาเจนไตรเปปไทด์ 5g', price: 1290, cost: 480, quantity: 2, subtotal: 2580 }], totalAmount: 2580, totalCost: 960, discount: 150, shippingFee: 60, codFee: 1, commissionAmount: 122, callLogId: 'cl10', createdAt: dh(-12), updatedAt: d(-1), shippedAt: dh(-6), deliveredAt: dh(-2) },
  { id: oid(11), customerId: 'c14', customerName: 'คุณเสาวลักษณ์ สุขสันต์', customerPhone: '098-901-2345', customerAddress: 'ระยอง', telesaleId: 'u4', telesaleName: 'มานี เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'jt', trackingNumber: 'JT8889990001', items: [{ productId: 'p1', productName: 'วิตามิน C 1000mg', price: 590, cost: 220, quantity: 1, subtotal: 590 }], totalAmount: 590, totalCost: 220, discount: 0, shippingFee: 50, codFee: 1, commissionAmount: 30, createdAt: dh(-8), updatedAt: dh(-1), shippedAt: dh(-4), deliveredAt: dh(-1) },
  { id: oid(12), customerId: 'c3', customerName: 'คุณสมชาย ดีใจ', customerPhone: '082-345-6789', customerAddress: 'เชียงใหม่', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'delivered', carrier: 'flash', trackingNumber: 'TH9990001112', items: [{ productId: 'p3', productName: 'โอเมก้า 3 Fish Oil', price: 790, cost: 290, quantity: 1, subtotal: 790 }, { productId: 'p9', productName: 'ขมิ้นชันแคปซูล', price: 290, cost: 110, quantity: 2, subtotal: 580 }], totalAmount: 1370, totalCost: 510, discount: 0, shippingFee: 50, codFee: 1, commissionAmount: 82, callLogId: 'cl8', createdAt: d(-3), updatedAt: dh(-2), shippedAt: d(-2), deliveredAt: dh(-2) },

  // ============== SHIPPING — 3 ออเดอร์ ==============
  { id: oid(13), customerId: 'c11', customerName: 'คุณธนาคาร ทรัพย์ดี', customerPhone: '088-901-2345', customerAddress: 'กรุงเทพฯ', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'shipping', carrier: 'flash', trackingNumber: 'TH3334445556', items: [{ productId: 'p3', productName: 'โอเมก้า 3 Fish Oil', price: 790, cost: 290, quantity: 1, subtotal: 790 }, { productId: 'p8', productName: 'แอมป์เซรั่มหน้าใส', price: 1490, cost: 520, quantity: 1, subtotal: 1490 }], totalAmount: 2280, totalCost: 810, discount: 0, shippingFee: 50, codFee: 1, callLogId: 'cl9', createdAt: d(-2), updatedAt: dh(-3), shippedAt: dh(-3) },
  { id: oid(14), customerId: 'c17', customerName: 'คุณอนันต์ รุ่งโรจน์', customerPhone: '082-456-7890', customerAddress: 'พิษณุโลก', telesaleId: 'u6', telesaleName: 'ลัดดา เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'shipping', carrier: 'kerry', trackingNumber: 'KE7778889990', items: [{ productId: 'p8', productName: 'แอมป์เซรั่มหน้าใส', price: 1490, cost: 520, quantity: 1, subtotal: 1490 }], totalAmount: 1490, totalCost: 520, discount: 0, shippingFee: 60, codFee: 1, createdAt: dh(-4), updatedAt: dh(-1), shippedAt: dh(-1) },
  { id: oid(15), customerId: 'c15', customerName: 'คุณวีระชัย กล้าหาญ', customerPhone: '099-012-3456', customerAddress: 'สุราษฎร์ธานี', telesaleId: 'u5', telesaleName: 'ปรีชา เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'shipping', carrier: 'thaipost', trackingNumber: 'EX998877665TH', items: [{ productId: 'p7', productName: 'น้ำมันมะพร้าวสกัดเย็น', price: 390, cost: 150, quantity: 3, subtotal: 1170 }], totalAmount: 1170, totalCost: 450, discount: 0, shippingFee: 80, codFee: 1, createdAt: d(-4), updatedAt: d(-1), shippedAt: d(-1) },

  // ============== IN_MYORDER — 2 ออเดอร์ (คัดลอกแล้วรอแพ็ค) ==============
  { id: oid(16), customerId: 'c16', customerName: 'คุณสุภาพร ใจเย็น', customerPhone: '081-345-6789', customerAddress: 'ลำปาง', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', status: 'in_myorder', items: [{ productId: 'p1', productName: 'วิตามิน C 1000mg', price: 590, cost: 220, quantity: 2, subtotal: 1180 }], totalAmount: 1180, totalCost: 440, discount: 0, createdAt: dh(-10), updatedAt: dh(-2), copiedAt: dh(-2) },
  { id: oid(17), customerId: 'c18', customerName: 'คุณสุนีย์ ขยันดี', customerPhone: '083-567-8901', customerAddress: 'อุบลราชธานี', telesaleId: 'u4', telesaleName: 'มานี เทเล', status: 'in_myorder', items: [{ productId: 'p6', productName: 'คอลลาเจนผง รสองุ่น', price: 690, cost: 280, quantity: 1, subtotal: 690 }, { productId: 'p1', productName: 'วิตามิน C 1000mg', price: 590, cost: 220, quantity: 1, subtotal: 590 }], totalAmount: 1280, totalCost: 500, discount: 50, createdAt: dh(-6), updatedAt: dh(-1), copiedAt: dh(-1) },

  // ============== WAIT_PACK — 4 ออเดอร์ ==============
  { id: oid(18), customerId: 'c11', customerName: 'คุณธนาคาร ทรัพย์ดี', customerPhone: '088-901-2345', customerAddress: 'กรุงเทพฯ', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', status: 'wait_pack', items: [{ productId: 'p4', productName: 'โปรตีน Whey วานิลา', price: 1890, cost: 950, quantity: 1, subtotal: 1890 }], totalAmount: 1890, totalCost: 950, discount: 0, callLogId: 'cl9', createdAt: dh(-12), updatedAt: dh(-12) },
  { id: oid(19), customerId: 'c5', customerName: 'คุณพิเชษฐ์ ทองดี', customerPhone: '092-345-6789', customerAddress: 'ภูเก็ต', telesaleId: 'u5', telesaleName: 'ปรีชา เทเล', status: 'wait_pack', items: [{ productId: 'p2', productName: 'คอลลาเจนไตรเปปไทด์ 5g', price: 1290, cost: 480, quantity: 2, subtotal: 2580 }, { productId: 'p6', productName: 'คอลลาเจนผง รสองุ่น', price: 690, cost: 280, quantity: 1, subtotal: 690 }], totalAmount: 3270, totalCost: 1240, discount: 200, notes: 'ส่วนลดลูกค้า VIP', createdAt: dh(-8), updatedAt: dh(-8) },
  { id: oid(20), customerId: 'c1', customerName: 'คุณวิภา สุขใจ', customerPhone: '081-234-5678', customerAddress: '210 ถ.ชมสินธุ์ ต.หัวหิน อ.หัวหิน จ.ประจวบฯ 77110', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', status: 'wait_pack', items: [{ productId: 'p1', productName: 'วิตามิน C 1000mg', price: 590, cost: 220, quantity: 5, subtotal: 2950 }], totalAmount: 2950, totalCost: 1100, discount: 0, notes: 'ซื้อยกเดือน', createdAt: dh(-6), updatedAt: dh(-6) },
  { id: oid(21), customerId: 'c8', customerName: 'คุณวรพล มั่งคั่ง', customerPhone: '095-678-9012', customerAddress: '99/88 หมู่ 5 ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000', telesaleId: 'u4', telesaleName: 'มานี เทเล', status: 'wait_pack', items: [{ productId: 'p2', productName: 'คอลลาเจนไตรเปปไทด์ 5g', price: 1290, cost: 480, quantity: 1, subtotal: 1290 }, { productId: 'p4', productName: 'โปรตีน Whey วานิลา', price: 1890, cost: 950, quantity: 1, subtotal: 1890 }], totalAmount: 3180, totalCost: 1430, discount: 0, createdAt: dh(-2), updatedAt: dh(-2) },

  // ============== RETURNED — 3 ออเดอร์ ==============
  { id: oid(22), customerId: 'c19', customerName: 'คุณรัตนา ใจดี', customerPhone: '085-678-9012', customerAddress: 'ภูเก็ต', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'returned', carrier: 'jt', trackingNumber: 'JT4556678889', returnReason: 'ลูกค้าไม่รับสาย', items: [{ productId: 'p3', productName: 'โอเมก้า 3 Fish Oil', price: 790, cost: 290, quantity: 1, subtotal: 790 }], totalAmount: 790, totalCost: 290, discount: 0, shippingFee: 60, codFee: 1, createdAt: d(-15), updatedAt: d(-10), shippedAt: d(-13), returnedAt: d(-10) },
  { id: oid(23), customerId: 'c22', customerName: 'คุณวินัย ทำงานดี', customerPhone: '086-901-2345', customerAddress: 'พระนครศรีอยุธยา', telesaleId: 'u6', telesaleName: 'ลัดดา เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'returned', carrier: 'kerry', trackingNumber: 'KE6678889990', returnReason: 'ที่อยู่ไม่ถูกต้อง', items: [{ productId: 'p6', productName: 'คอลลาเจนผง รสองุ่น', price: 690, cost: 280, quantity: 1, subtotal: 690 }], totalAmount: 690, totalCost: 280, discount: 0, shippingFee: 60, codFee: 1, createdAt: d(-12), updatedAt: d(-7), shippedAt: d(-10), returnedAt: d(-7) },
  { id: oid(24), customerId: 'c23', customerName: 'คุณภัทรพล ก้าวหน้า', customerPhone: '087-012-3456', customerAddress: 'นนทบุรี', telesaleId: 'u3', telesaleName: 'สมศักดิ์ เทเล', packingId: 'u7', packingName: 'สมหมาย แพ็ก', status: 'returned', carrier: 'flash', trackingNumber: 'TH7889990001', returnReason: 'ลูกค้าเปลี่ยนใจ', items: [{ productId: 'p8', productName: 'แอมป์เซรั่มหน้าใส', price: 1490, cost: 520, quantity: 1, subtotal: 1490 }], totalAmount: 1490, totalCost: 520, discount: 0, shippingFee: 50, codFee: 1, createdAt: d(-9), updatedAt: d(-5), shippedAt: d(-7), returnedAt: d(-5) },

  // ============== CANCELLED — 1 ออเดอร์ ==============
  { id: oid(25), customerId: 'c20', customerName: 'คุณวันเฉลิม สว่างใส', customerPhone: '084-789-0123', customerAddress: 'นครศรีธรรมราช', telesaleId: 'u5', telesaleName: 'ปรีชา เทเล', status: 'cancelled', cancelReason: 'ลูกค้ายกเลิกหลังจากปิดได้ ต้องการเปลี่ยนสินค้า', items: [{ productId: 'p7', productName: 'น้ำมันมะพร้าวสกัดเย็น', price: 390, cost: 150, quantity: 1, subtotal: 390 }], totalAmount: 390, totalCost: 150, discount: 0, createdAt: d(-7), updatedAt: d(-5), cancelledAt: d(-5) },
]

// ============================================================
// HISTORY LOG
// ============================================================
export const MOCK_HISTORY: HistoryLog[] = [
  { id: 'h1',  eventType: 'order_delivered', description: `ส่งสำเร็จ ${oid(10)} คุณกชกร กุลทรัพย์`, userId: 'u8', userName: 'ชาตรี เช็คเกอร์', relatedId: oid(10), relatedType: 'order', createdAt: dh(-2) },
  { id: 'h2',  eventType: 'commission_paid', description: 'จ่ายค่าคอม ฿122 ให้ ปรีชา เทเล', userId: 'u8', userName: 'ชาตรี เช็คเกอร์', relatedId: oid(10), relatedType: 'order', createdAt: dh(-2) },
  { id: 'h3',  eventType: 'order_delivered', description: `ส่งสำเร็จ ${oid(11)} คุณเสาวลักษณ์ สุขสันต์`, userId: 'u8', userName: 'ชาตรี เช็คเกอร์', relatedId: oid(11), relatedType: 'order', createdAt: dh(-1) },
  { id: 'h4',  eventType: 'order_shipped',   description: `จัดส่ง ${oid(14)} KE7778889990`, userId: 'u7', userName: 'สมหมาย แพ็ก', relatedId: oid(14), relatedType: 'order', createdAt: dh(-1) },
  { id: 'h5',  eventType: 'order_copied',    description: `คัดลอกข้อมูล ${oid(17)} (คุณสุนีย์ ขยันดี)`, userId: 'u7', userName: 'สมหมาย แพ็ก', relatedId: oid(17), relatedType: 'order', createdAt: dh(-1) },
  { id: 'h6',  eventType: 'order_copied',    description: `คัดลอกข้อมูล ${oid(16)} (คุณสุภาพร ใจเย็น)`, userId: 'u7', userName: 'สมหมาย แพ็ก', relatedId: oid(16), relatedType: 'order', createdAt: dh(-2) },
  { id: 'h7',  eventType: 'order_created',   description: `สร้างออเดอร์ ${oid(21)} คุณวรพล มั่งคั่ง ยอด 3,180 บาท`, userId: 'u4', userName: 'มานี เทเล', relatedId: oid(21), relatedType: 'order', createdAt: dh(-2) },
  { id: 'h8',  eventType: 'order_cancelled', description: `ยกเลิก ${oid(25)} (ลูกค้ายกเลิก)`, userId: 'u5', userName: 'ปรีชา เทเล', relatedId: oid(25), relatedType: 'order', createdAt: d(-5) },
  { id: 'h9',  eventType: 'order_returned',  description: `ตีกลับ ${oid(24)} (ลูกค้าเปลี่ยนใจ)`, userId: 'u8', userName: 'ชาตรี เช็คเกอร์', relatedId: oid(24), relatedType: 'order', createdAt: d(-5) },
  { id: 'h10', eventType: 'customer_edited', description: 'แก้ไขข้อมูล คุณวิภา สุขใจ จากออเดอร์ใหม่: เบอร์โทร', userId: 'u4', userName: 'มานี เทเล', relatedId: 'c1', relatedType: 'customer', createdAt: d(-2) },
  { id: 'h11', eventType: 'customer_grade_changed', description: 'คุณกชกร กุลทรัพย์ เปลี่ยน Grade เป็น A', userId: 'u5', userName: 'ปรีชา เทเล', relatedId: 'c12', relatedType: 'customer', createdAt: d(-1) },
  { id: 'h12', eventType: 'customer_assigned', description: 'กำหนด คุณมณีรัตน์ งามดี → ลัดดา เทเล', userId: 'u2', userName: 'อรอนงค์ แอดมิน', relatedId: 'c31', relatedType: 'customer', createdAt: d(-2) },
  { id: 'h13', eventType: 'customer_added',  description: 'นำเข้าลูกค้าใหม่ 5 ราย', userId: 'u2', userName: 'อรอนงค์ แอดมิน', relatedType: 'customer', createdAt: d(-3) },
  { id: 'h14', eventType: 'order_returned',  description: `ตีกลับ ${oid(23)} (ที่อยู่ไม่ถูกต้อง)`, userId: 'u8', userName: 'ชาตรี เช็คเกอร์', relatedId: oid(23), relatedType: 'order', createdAt: d(-7) },
  { id: 'h15', eventType: 'order_delivered', description: `ส่งสำเร็จ ${oid(6)} คุณนงค์ลักษณ์ ใจดี`, userId: 'u8', userName: 'ชาตรี เช็คเกอร์', relatedId: oid(6), relatedType: 'order', createdAt: d(-5) },
  { id: 'h16', eventType: 'order_returned',  description: `ตีกลับ ${oid(22)} (ลูกค้าไม่รับสาย)`, userId: 'u8', userName: 'ชาตรี เช็คเกอร์', relatedId: oid(22), relatedType: 'order', createdAt: d(-10) },
  { id: 'h17', eventType: 'member_edited',   description: 'แก้ไขสิทธิ์ของ สมศักดิ์ เทเล', userId: 'u1', userName: 'คุณนา เจ้าของ', relatedId: 'u3', relatedType: 'user', createdAt: d(-2) },
  { id: 'h18', eventType: 'member_added',    description: 'เพิ่มสมาชิก ชาตรี เช็คเกอร์', userId: 'u2', userName: 'อรอนงค์ แอดมิน', relatedId: 'u8', relatedType: 'user', createdAt: d(-30) },
]
