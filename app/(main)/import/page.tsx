'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/lib/store'
import { Button, Card, PageHeader, Select } from '@/components/ui'
import {
  Customer, CustomerGrade, Carrier, CARRIER_LABEL, OrderStatus, PaymentMethod,
  ORDER_STATUS_LABEL,
} from '@/types'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

const GRADE_VALUES: CustomerGrade[] = ['A', 'B', 'C', 'D']

function normalizeGrade(v: unknown): CustomerGrade | undefined {
  if (!v) return undefined
  const s = String(v).trim().toUpperCase().replace('GRADE', '').trim()
  return GRADE_VALUES.includes(s as CustomerGrade) ? (s as CustomerGrade) : undefined
}

function normalizeCarrier(v: unknown): Carrier | undefined {
  if (!v) return undefined
  const s = String(v).trim().toLowerCase()
  if (s.includes('flash')) return 'flash'
  if (s.includes('kerry')) return 'kerry'
  if (s.includes('j&t') || s.includes('jt') || s.includes('j t')) return 'jt'
  if (s.includes('thai') || s.includes('ไปรษณีย์')) return 'thaipost'
  if (s.includes('myorder') || s.includes('my order') || s.includes('myoc')) return 'myorder'
  return undefined
}

/** Parse tracking format like "MYOC143684112D (KERRY)" → { tracking, carrier } */
function parseTracking(v: string): { tracking: string; carrier?: Carrier } {
  const m = v.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (m) {
    return { tracking: m[1].trim(), carrier: normalizeCarrier(m[2]) }
  }
  return { tracking: v.trim() }
}

/** Parse Thai-style date "DD/MM/YYYY HH:MM" or "DD/MM/YYYY" */
function parseDate(v: string): string | undefined {
  if (!v) return undefined
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (m) {
    const [, dd, mm, yyyy, hh, mi] = m
    let year = parseInt(yyyy)
    // If BE year, convert to AD
    if (year > 2500) year -= 543
    const d = new Date(year, parseInt(mm) - 1, parseInt(dd), parseInt(hh ?? '0'), parseInt(mi ?? '0'))
    return d.toISOString()
  }
  // Try native
  const d = new Date(v)
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

/** Map "สถานะพัสดุ" text to OrderStatus */
function normalizeStatus(v: string): OrderStatus | undefined {
  if (!v) return undefined
  const s = v.trim().toLowerCase()
  if (s.includes('ระหว่างขนส่ง') || s.includes('กำลังจัดส่ง') || s.includes('shipping') || s.includes('shipped')) return 'shipping'
  if (s.includes('สำเร็จ') || s.includes('delivered') || s.includes('รับแล้ว')) return 'delivered'
  if (s.includes('ตีกลับ') || s.includes('returned') || s.includes('ส่งคืน')) return 'returned'
  if (s.includes('ยกเลิก') || s.includes('cancel')) return 'cancelled'
  if (s.includes('รอแพ็ค') || s.includes('wait')) return 'wait_pack'
  if (s.includes('นำเข้า') || s.includes('myorder')) return 'in_myorder'
  return undefined
}

function normalizePayment(v: string): PaymentMethod | undefined {
  if (!v) return undefined
  const s = v.trim().toLowerCase()
  if (s.includes('cod')) return 'cod'
  if (s.includes('โอน') || s.includes('transfer')) return 'transfer'
  if (s.includes('บัตร') || s.includes('card')) return 'card'
  return 'other'
}

function getCell(r: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    for (const rk of Object.keys(r)) {
      if (rk.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, '')) {
        return String(r[rk] ?? '').trim()
      }
    }
  }
  return ''
}

type CustomerRow = {
  name: string; phone: string; address?: string; grade?: CustomerGrade; notes?: string
  lastProductName?: string; lastProductPrice?: number
  _valid: boolean; _reason?: string
}

type OrderRow = {
  externalId?: string; channel?: string; orderDate?: string
  name: string; phone: string; address?: string
  productSku?: string; productName: string
  quantity: number; weightKg?: number
  discount: number; shippingFee?: number
  totalAmount?: number
  carrier?: Carrier; trackingNumber?: string
  status?: OrderStatus; paymentMethod?: PaymentMethod
  telesaleName?: string; createdByName?: string; notes?: string
  _valid: boolean; _reason?: string
}

export default function ImportPage() {
  const { state, bulkImportCustomers, bulkImportOrders } = useApp()
  const user = state.currentUser
  const [mode, setMode] = useState<'customer' | 'order'>('order')
  const fileRef = useRef<HTMLInputElement>(null)
  const [customerRows, setCustomerRows] = useState<CustomerRow[]>([])
  const [orderRows, setOrderRows] = useState<OrderRow[]>([])
  const [defaultOwnerId, setDefaultOwnerId] = useState<string>('')
  const [defaultGrade, setDefaultGrade] = useState<CustomerGrade>('D')
  const [result, setResult] = useState<string | null>(null)

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-6 py-8 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <p className="text-sm mt-1 opacity-70">เฉพาะ Owner / Admin เท่านั้น</p>
        </div>
      </div>
    )
  }

  const telesales = state.users.filter(u => u.role === 'telesale')
  const existingPhones = new Set(state.customers.map(c => c.phone.replace(/\D/g, '')))
  const existingOrderIds = new Set(state.orders.map(o => o.id))

  function parseCustomerRows(raw: Record<string, unknown>[]): CustomerRow[] {
    return raw.map(r => {
      const name = getCell(r, 'name', 'ชื่อ', 'ชื่อ-นามสกุล', 'ชื่อลูกค้า')
      const phone = getCell(r, 'phone', 'เบอร์', 'เบอร์โทร', 'tel')
      const address = getCell(r, 'address', 'ที่อยู่')
      const gradeRaw = getCell(r, 'grade', 'เกรด')
      const notes = getCell(r, 'notes', 'หมายเหตุ', 'note')
      const lastProductName = getCell(r, 'product', 'สินค้า', 'ชื่อสินค้า', 'last_product')
      const lastProductPriceStr = getCell(r, 'price', 'ราคา', 'ราคาขายล่าสุด', 'last_price')
      const lastProductPrice = lastProductPriceStr ? Number(lastProductPriceStr.replace(/,/g, '')) : undefined
      const phoneKey = phone.replace(/\D/g, '')
      let valid = true, reason: string | undefined
      if (!name) { valid = false; reason = 'ขาดชื่อ' }
      else if (!phone) { valid = false; reason = 'ขาดเบอร์' }
      else if (existingPhones.has(phoneKey)) { valid = false; reason = 'เบอร์ซ้ำในระบบ' }
      return {
        name, phone, address: address || undefined,
        grade: normalizeGrade(gradeRaw), notes: notes || undefined,
        lastProductName: lastProductName || undefined,
        lastProductPrice: lastProductPrice && lastProductPrice > 0 ? lastProductPrice : undefined,
        _valid: valid, _reason: reason,
      }
    })
  }

  function parseOrderRows(raw: Record<string, unknown>[]): OrderRow[] {
    return raw.map(r => {
      // MyOrder columns
      const externalId = getCell(r, 'orderNo', 'order no', 'order_no', 'เลขออเดอร์', 'หมายเลขออเดอร์')
      const channel = getCell(r, 'channel', 'ช่องทาง', 'ช่องทาง/เพจ', 'เพจ')
      const orderDateRaw = getCell(r, 'orderDate', 'วันที่สั่งซื้อ', 'วันที่สั่ง', 'date')
      const name = getCell(r, 'name', 'ชื่อ', 'ชื่อลูกค้า', 'ลูกค้า')
      const phone = getCell(r, 'phone', 'เบอร์', 'เบอร์โทร')
      const address = getCell(r, 'address', 'ที่อยู่')
      // MyOrder's newer export names these "รหัสสินค้า (จำนวนชิ้น)" / "สินค้า (จำนวนชิ้น)"
      // and embeds the quantity as a trailing "(N)" inside the cell, e.g.
      // "ยานวดสมุนไพร 1 แถม 1 ขวด (1)" / "A002-1 (1)"
      const productSkuRaw = getCell(r, 'sku', 'รหัสสินค้า', 'product_sku', 'รหัสสินค้า (จำนวนชิ้น)')
      const productNameRaw = getCell(r, 'product', 'สินค้า', 'product_name', 'ชื่อสินค้า', 'สินค้า (จำนวนชิ้น)')
      const trailingQty = (s: string) => { const m = s.match(/\((\d+)\)\s*$/); return m ? Number(m[1]) : undefined }
      const embeddedQty = trailingQty(productNameRaw) ?? trailingQty(productSkuRaw)
      const productSku = productSkuRaw.replace(/\s*\(\d+\)\s*$/, '').trim()
      const productName = productNameRaw.replace(/\s*\(\d+\)\s*$/, '').trim()
      const qtyStr = getCell(r, 'quantity', 'จำนวน', 'จำนวนชิ้น', 'qty')
      const weightStr = getCell(r, 'weight', 'น้ำหนัก', 'น้ำหนัก (กก.)', 'weight_kg')
      const trackingRaw = getCell(r, 'tracking', 'tracking_no', 'tracking no.', 'tracking no', 'เลขพัสดุ', 'เลข tracking')
      const statusRaw = getCell(r, 'status', 'สถานะ', 'สถานะพัสดุ')
      const discountStr = getCell(r, 'discount', 'ส่วนลด', 'ส่วนลด(บาท)')
      const shippingFeeStr = getCell(r, 'shippingFee', 'ค่าจัดส่ง', 'ค่าจัดส่ง(บาท)', 'shipping_fee')
      const totalStr = getCell(r, 'ยอดเงิน', 'ยอดเงิน(บาท)', 'total', 'amount', 'price', 'ราคา')
      const paymentRaw = getCell(r, 'paymentMethod', 'วิธีการชำระเงิน', 'การชำระเงิน', 'payment')
      const telesale = getCell(r, 'telesale', 'เทเลเซล', 'เทเล')
      const createdBy = getCell(r, 'createdBy', 'สร้างออเดอร์โดย', 'สร้างโดย')
      const notes = getCell(r, 'notes', 'หมายเหตุ')

      const qty = Number(qtyStr) || embeddedQty || 1
      const weight = Number(weightStr) || undefined
      const discount = Number(discountStr.replace(/,/g, '')) || 0
      const shippingFee = Number(shippingFeeStr.replace(/,/g, '')) || undefined
      const total = Number(totalStr.replace(/,/g, '')) || undefined
      const tracking = trackingRaw ? parseTracking(trackingRaw) : { tracking: '', carrier: undefined }
      const status = normalizeStatus(statusRaw)
      const payment = normalizePayment(paymentRaw)
      const orderDate = parseDate(orderDateRaw)

      let valid = true, reason: string | undefined
      if (!name) { valid = false; reason = 'ขาดชื่อ' }
      else if (!phone) { valid = false; reason = 'ขาดเบอร์' }
      else if (!productName) { valid = false; reason = 'ขาดสินค้า' }
      else if (!(total && total > 0)) { valid = false; reason = 'ขาดยอดเงิน' }
      else if (externalId && existingOrderIds.has(externalId)) { valid = false; reason = 'Order No. ซ้ำในระบบ' }

      return {
        externalId: externalId || undefined,
        channel: channel || undefined,
        orderDate,
        name, phone, address: address || undefined,
        productSku: productSku || undefined,
        productName,
        quantity: qty,
        weightKg: weight,
        discount,
        shippingFee,
        totalAmount: total,
        carrier: tracking.carrier,
        trackingNumber: tracking.tracking || undefined,
        status, paymentMethod: payment,
        telesaleName: telesale || undefined,
        createdByName: createdBy || undefined,
        notes: notes || undefined,
        _valid: valid, _reason: reason,
      }
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
        if (mode === 'customer') setCustomerRows(parseCustomerRows(raw))
        else setOrderRows(parseOrderRows(raw))
      } catch { alert('อ่านไฟล์ไม่ได้ — รองรับ .xlsx / .csv') }
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsArrayBuffer(file)
  }

  function handleImport() {
    if (mode === 'customer') {
      const owner = telesales.find(u => u.id === defaultOwnerId)
      const valid = customerRows.filter(r => r._valid).map<Partial<Customer> & { name: string; phone: string }>(r => {
        const lastInfo = (r.lastProductName || r.lastProductPrice)
          ? `[ซื้อล่าสุด: ${r.lastProductName ?? ''}${r.lastProductPrice ? ` ฿${r.lastProductPrice.toLocaleString()}` : ''}]`
          : ''
        return {
          name: r.name, phone: r.phone, address: r.address, grade: r.grade ?? defaultGrade,
          ownerId: owner?.id, ownerName: owner?.name,
          notes: [r.notes, lastInfo].filter(Boolean).join(' '),
        }
      })
      const count = bulkImportCustomers(valid)
      setResult(`✅ นำเข้าลูกค้าสำเร็จ ${count} ราย`)
      setCustomerRows([])
    } else {
      const valid = orderRows.filter(r => r._valid).map(r => ({
        externalId: r.externalId, channel: r.channel, orderDate: r.orderDate,
        name: r.name, phone: r.phone, address: r.address,
        productSku: r.productSku, productName: r.productName,
        price: r.totalAmount ? r.totalAmount / r.quantity : 0,
        quantity: r.quantity, weightKg: r.weightKg, discount: r.discount,
        shippingFee: r.shippingFee, totalAmount: r.totalAmount,
        carrier: r.carrier, trackingNumber: r.trackingNumber,
        status: r.status, paymentMethod: r.paymentMethod,
        telesaleName: r.telesaleName, createdByName: r.createdByName,
        source: 'MyOrder', notes: r.notes,
      }))
      const { orders, newCustomers } = bulkImportOrders(valid)
      setResult(`✅ นำเข้าออเดอร์ ${orders} รายการ (สร้างลูกค้าใหม่ ${newCustomers})`)
      setOrderRows([])
    }
  }

  function handleDownloadTemplate() {
    const wb = XLSX.utils.book_new()
    if (mode === 'customer') {
      const template = [
        { name: 'คุณตัวอย่าง หนึ่ง', phone: '081-000-0001', address: 'กรุงเทพฯ', grade: 'D', 'ชื่อสินค้า': 'วิตามิน C 1000mg', 'ราคาขายล่าสุด': 590, notes: 'ลูกค้าใหม่' },
        { name: 'คุณตัวอย่าง สอง', phone: '082-000-0002', address: 'เชียงใหม่', grade: 'C', 'ชื่อสินค้า': 'คอลลาเจน', 'ราคาขายล่าสุด': 1290, notes: '' },
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(template), 'ลูกค้า')
      XLSX.writeFile(wb, 'cnp-customer-template.xlsx')
    } else {
      // MyOrder-style template
      const template = [
        { No: 1, 'Order No.': '1779185073489', 'ช่องทาง/เพจ': 'เกษตรออนไลน์', 'วันที่สั่งซื้อ': '19/05/2026 17:04',
          'ชื่อลูกค้า': 'ทวี', 'เบอร์โทร': '090-932-1286', 'ที่อยู่': '49 ม.9 ตำบลโคกหล่อ อำเภอเมืองตรัง จังหวัดตรัง 92000',
          'หมายเหตุ': '', 'รหัสสินค้า': 'ASP-01-5', 'สินค้า': 'เมล็ดพันธุ์หน่อไม้ฝรั่ง 5 ซอง',
          'จำนวนชิ้น': 1, 'น้ำหนัก (กก.)': 0.1, 'TRACKING NO.': 'MYOC143684112D (KERRY)',
          'สถานะพัสดุ': 'ระหว่างขนส่ง', 'ส่วนลด(บาท)': 0, 'ค่าจัดส่ง(บาท)': 0, 'ยอดเงิน(บาท)': 139,
          'วิธีการชำระเงิน': 'COD', 'สร้างออเดอร์โดย': 'Admin Pat' },
        { No: 2, 'Order No.': '1779058293639', 'ช่องทาง/เพจ': 'เกษตรออนไลน์', 'วันที่สั่งซื้อ': '18/05/2026 05:51',
          'ชื่อลูกค้า': 'ประทิน บุญมีวิริยะ', 'เบอร์โทร': '091-054-4379', 'ที่อยู่': '1/1 ซ.บางแก้วใต้ ตำบลปลายพระยา อำเภอปลายพระยา จังหวัดกระบี่ 81160',
          'หมายเหตุ': '', 'รหัสสินค้า': 'ASP-01-5', 'สินค้า': 'เมล็ดพันธุ์หน่อไม้ฝรั่ง 5 ซอง',
          'จำนวนชิ้น': 1, 'น้ำหนัก (กก.)': 0.1, 'TRACKING NO.': 'MYOC14358800A1 (KERRY)',
          'สถานะพัสดุ': 'ระหว่างขนส่ง', 'ส่วนลด(บาท)': 0, 'ค่าจัดส่ง(บาท)': 0, 'ยอดเงิน(บาท)': 139,
          'วิธีการชำระเงิน': 'COD', 'สร้างออเดอร์โดย': 'Admin Pat' },
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(template), 'ออเดอร์')
      XLSX.writeFile(wb, 'cnp-myorder-template.xlsx')
    }
  }

  const rows = mode === 'customer' ? customerRows : orderRows
  const validCount = rows.filter(r => r._valid).length
  const invalidCount = rows.length - validCount

  return (
    <div>
      <PageHeader title="นำเข้าข้อมูล" subtitle="Excel / CSV → CUSTOMER DATABASE หรือ ORDER (รองรับ Export จาก MyOrder)" />

      <div className="p-6 space-y-5">
        {/* Mode tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {([
            { k: 'order' as const, label: '📦 ออเดอร์ (MyOrder Export)' },
            { k: 'customer' as const, label: '👥 ลูกค้า (Leads)' },
          ]).map(t => (
            <button key={t.k} onClick={() => { setMode(t.k); setResult(null) }}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                mode === t.k ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200')}>
              {t.label}
            </button>
          ))}
        </div>

        <Card className="p-5">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">ขั้นตอน</p>
          {mode === 'customer' ? (
            <ol className="list-decimal pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>โหลด Template หรือเตรียมไฟล์คอลัมน์: <code>name, phone, address, grade, ชื่อสินค้า, ราคาขายล่าสุด, notes</code></li>
              <li>เลือกไฟล์ .xlsx / .csv</li>
              <li>เลือก default Owner แล้วกด &quot;นำเข้า&quot;</li>
              <li>ระบบจะนำ &quot;ชื่อสินค้า&quot; และ &quot;ราคาขายล่าสุด&quot; ไปเก็บใน notes เพื่ออ้างอิงครั้งถัดไป</li>
            </ol>
          ) : (
            <ol className="list-decimal pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>โหลด <strong>Template MyOrder</strong> หรือใช้ไฟล์ Export Data จากระบบหลังบ้าน MyOrder ได้ตรงๆ</li>
              <li>รองรับคอลัมน์ MyOrder: <code>Order No., ช่องทาง/เพจ, วันที่สั่งซื้อ, ชื่อลูกค้า, เบอร์โทร, ที่อยู่, รหัสสินค้า, สินค้า, จำนวนชิ้น, น้ำหนัก, TRACKING NO., สถานะพัสดุ, ส่วนลด, ค่าจัดส่ง, ยอดเงิน, วิธีการชำระเงิน, สร้างออเดอร์โดย, ฯลฯ</code></li>
              <li>Tracking ที่มีวงเล็บ เช่น <code>MYOC143684112D (KERRY)</code> ระบบ parse carrier ออกอัตโนมัติ</li>
              <li>สถานะพัสดุ &quot;ระหว่างขนส่ง&quot; → สถานะออเดอร์ <code>SHIPPING</code> ทันที</li>
              <li>ลูกค้าใหม่จะถูกสร้างอัตโนมัติ Grade D และจับคู่สินค้าตาม SKU หรือชื่อ</li>
            </ol>
          )}
          <div className="mt-4 flex gap-3 flex-wrap">
            <Button variant="secondary" onClick={handleDownloadTemplate}>📥 โหลด Template</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            <Button onClick={() => fileRef.current?.click()}>📂 เลือกไฟล์</Button>
          </div>
          {result && (
            <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">{result}</p>
          )}
        </Card>

        {rows.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <p className="text-sm font-bold">พบ {rows.length} แถว · ✅ {validCount} · ⚠️ {invalidCount}</p>
                <p className="text-xs text-slate-400 mt-1">เฉพาะแถวที่ถูกต้องเท่านั้นที่จะถูกนำเข้า</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {mode === 'customer' && (
                  <>
                    <Select value={defaultGrade} onChange={e => setDefaultGrade(e.target.value as CustomerGrade)} className="w-32">
                      {GRADE_VALUES.map(g => <option key={g} value={g}>Default Grade {g}</option>)}
                    </Select>
                    <Select value={defaultOwnerId} onChange={e => setDefaultOwnerId(e.target.value)} className="w-44">
                      <option value="">— ไม่กำหนดเจ้าของ —</option>
                      {telesales.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </Select>
                  </>
                )}
                <Button onClick={handleImport} disabled={validCount === 0}>
                  นำเข้า {validCount > 0 ? `(${validCount})` : ''}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur">
                  <tr className="text-slate-500 uppercase">
                    <th className="text-left py-2 px-3">สถานะ</th>
                    {mode === 'order' && <th className="text-left py-2 px-2">Order No.</th>}
                    {mode === 'order' && <th className="text-left py-2 px-2">ช่องทาง</th>}
                    {mode === 'order' && <th className="text-left py-2 px-2">วันที่สั่ง</th>}
                    <th className="text-left py-2 px-2">ชื่อ</th>
                    <th className="text-left py-2 px-2">เบอร์</th>
                    {mode === 'customer' && <th className="text-left py-2 px-2">Grade</th>}
                    {mode === 'order' && <th className="text-left py-2 px-2">SKU</th>}
                    {mode === 'order' && <th className="text-left py-2 px-2">สินค้า</th>}
                    {mode === 'order' && <th className="text-right py-2 px-2">จำนวน</th>}
                    {mode === 'order' && <th className="text-right py-2 px-2">ยอด COD</th>}
                    {mode === 'order' && <th className="text-left py-2 px-2">Tracking</th>}
                    {mode === 'order' && <th className="text-left py-2 px-2">สถานะ</th>}
                    <th className="text-left py-2 px-3">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {mode === 'customer' && customerRows.map((r, i) => (
                    <tr key={i} className={cn('border-b border-slate-50 dark:border-slate-800', !r._valid && 'bg-red-50/40 dark:bg-red-900/10')}>
                      <td className="py-2 px-3">{r._valid ? <span className="text-emerald-600">✅</span> : <span className="text-red-500">⚠️</span>}</td>
                      <td className="py-2 px-2">{r.name || '—'}</td>
                      <td className="py-2 px-2">{r.phone || '—'}</td>
                      <td className="py-2 px-2 text-slate-500">{r.grade ?? defaultGrade}</td>
                      <td className="py-2 px-3 text-xs">
                        {r.lastProductName && (
                          <span className="block text-emerald-700">📦 {r.lastProductName}{r.lastProductPrice ? ` · ฿${r.lastProductPrice.toLocaleString()}` : ''}</span>
                        )}
                        <span className="text-red-500">{r._reason ?? r.notes ?? ''}</span>
                      </td>
                    </tr>
                  ))}
                  {mode === 'order' && orderRows.map((r, i) => (
                    <tr key={i} className={cn('border-b border-slate-50 dark:border-slate-800', !r._valid && 'bg-red-50/40 dark:bg-red-900/10')}>
                      <td className="py-2 px-3">{r._valid ? <span className="text-emerald-600">✅</span> : <span className="text-red-500">⚠️</span>}</td>
                      <td className="py-2 px-2 font-mono text-[10px] text-slate-500">{r.externalId || '—'}</td>
                      <td className="py-2 px-2 text-slate-500 text-[10px]">{r.channel ?? '—'}</td>
                      <td className="py-2 px-2 text-[10px] text-slate-500">{r.orderDate ? new Date(r.orderDate).toLocaleDateString('th-TH') : '—'}</td>
                      <td className="py-2 px-2">{r.name || '—'}</td>
                      <td className="py-2 px-2">{r.phone || '—'}</td>
                      <td className="py-2 px-2 font-mono text-[10px]">{r.productSku ?? '—'}</td>
                      <td className="py-2 px-2 truncate max-w-[160px]">{r.productName || '—'}</td>
                      <td className="py-2 px-2 text-right">{r.quantity}</td>
                      <td className="py-2 px-2 text-right font-bold">฿{(r.totalAmount ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-2 text-[10px]">
                        {r.trackingNumber ? (
                          <>
                            <span className="font-mono">{r.trackingNumber}</span>
                            {r.carrier && <span className="text-slate-400 ml-1">({CARRIER_LABEL[r.carrier]})</span>}
                          </>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-2 text-[10px]">
                        {r._valid && (
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            (r.status ?? (r.trackingNumber ? 'shipping' : 'wait_pack')) === 'shipping' ? 'bg-blue-100 text-blue-700' :
                            (r.status ?? '') === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            (r.status ?? '') === 'returned' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700')}>
                            {ORDER_STATUS_LABEL[r.status ?? (r.trackingNumber ? 'shipping' : 'wait_pack')]}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[10px] text-red-500">{r._reason ?? r.notes ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
