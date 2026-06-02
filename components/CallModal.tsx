'use client'

import { useState } from 'react'
import { Modal, Button, Input, Textarea } from './ui'
import {
  Customer, Product, OrderItem, OrderShippingInfo, CallResult,
  GRADE_COLOR, GRADE_EMOJI, GRADE_LABEL,
  CALL_RESULT_LABEL, computeCommission,
} from '@/types'
import { cn, formatMoney } from '@/lib/utils'

export interface CompleteCallOpts {
  result: CallResult
  notes: string
  followUpAt?: string
  items?: OrderItem[]
  discount?: number
  shippingOverride?: OrderShippingInfo
  saveAsCustomerLatest?: boolean
}

export function CallModal({ customer, products, onClose, onSubmit }: {
  customer: Customer
  products: Product[]
  onClose: () => void
  onSubmit: (opts: CompleteCallOpts) => void
}) {
  // Step 1 — Call result
  const [result, setResult] = useState<CallResult>('follow_up')
  const [followUpAt, setFollowUpAt] = useState('')
  const [notes, setNotes] = useState('')

  // Step 2 — Shipping info (only if closed)
  const [useLatest, setUseLatest] = useState(true)   // ใช้ข้อมูลล่าสุด / แก้ไขข้อมูล
  const [recipientName, setRecipientName] = useState(customer.name)
  const [recipientPhone, setRecipientPhone] = useState(customer.phone)
  const [addressLine, setAddressLine] = useState(
    customer.addressDetail?.line ?? customer.address ?? ''
  )
  const [subDistrict, setSubDistrict] = useState(customer.addressDetail?.subDistrict ?? '')
  const [district, setDistrict] = useState(customer.addressDetail?.district ?? '')
  const [province, setProvince] = useState(customer.addressDetail?.province ?? '')
  const [postalCode, setPostalCode] = useState(customer.addressDetail?.postalCode ?? '')
  const [saveAsCustomerLatest, setSaveAsCustomerLatest] = useState(false)

  // Step 3 — Items
  const [items, setItems] = useState<OrderItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [productSearch, setProductSearch] = useState('')

  const activeProducts = products.filter(p => p.status === 'active' && (
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(productSearch.toLowerCase())
  ))

  function changeItemQty(productId: string, qty: number) {
    if (qty <= 0) {
      setItems(items.filter(i => i.productId !== productId))
      return
    }
    const prod = products.find(p => p.id === productId)
    if (!prod) return
    const existing = items.find(i => i.productId === productId)
    if (existing) {
      setItems(items.map(i => i.productId === productId ? { ...i, quantity: qty, subtotal: qty * i.price } : i))
    } else {
      setItems([...items, { productId: prod.id, productName: prod.name, price: prod.price, cost: prod.cost, quantity: qty, subtotal: prod.price * qty }])
    }
  }
  function qtyOf(productId: string) {
    return items.find(i => i.productId === productId)?.quantity ?? 0
  }

  const totalAmount = items.reduce((s, i) => s + i.subtotal, 0)
  const netAmount = totalAmount - discount

  function handleSubmit(skipOrder = false) {
    const shippingOverride: OrderShippingInfo | undefined =
      result === 'closed' && !useLatest ? {
        recipientName, recipientPhone, addressLine, subDistrict, district, province, postalCode,
      } : undefined
    onSubmit({
      result, notes, followUpAt: followUpAt || undefined,
      items: result === 'closed' && !skipOrder ? items : undefined,
      discount: result === 'closed' && !skipOrder ? discount : undefined,
      shippingOverride,
      saveAsCustomerLatest: result === 'closed' && !useLatest && saveAsCustomerLatest,
    })
  }

  return (
    <Modal open onClose={onClose} title="การบันทึกผลโทร และสร้างออเดอร์" width="max-w-7xl">
      {/* Steps tracker */}
      <div className="mb-5 flex items-center justify-between gap-2 text-xs">
        {[
          { n: 1, label: 'บันทึกผลโทร', active: true },
          { n: 2, label: 'ข้อมูลจัดส่ง (แก้ไขได้)', active: result === 'closed' },
          { n: 3, label: 'เลือกสินค้า', active: result === 'closed' },
          { n: 4, label: 'ยืนยันออเดอร์', active: result === 'closed' },
        ].map((s, i, arr) => (
          <div key={s.n} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
              s.active ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')}>{s.n}</div>
            <span className={cn('text-xs whitespace-nowrap', s.active ? 'text-slate-800 dark:text-slate-100 font-semibold' : 'text-slate-400')}>{s.label}</span>
            {i < arr.length - 1 && <div className={cn('flex-1 h-0.5', s.active ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700')} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Column 1: Call result */}
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">บันทึกผลการโทร</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {customer.name.charAt(2) || customer.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm">{customer.name}</p>
                <p className="text-xs text-slate-400">{customer.phone}</p>
                <span className={cn('inline-block text-[10px] px-1.5 py-0.5 rounded-md border font-bold', GRADE_COLOR[customer.grade])}>
                  {GRADE_EMOJI[customer.grade]} {GRADE_LABEL[customer.grade]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {(Object.entries(CALL_RESULT_LABEL) as [CallResult, string][]).map(([k, label]) => (
                <button key={k} onClick={() => setResult(k)}
                  className={cn('text-xs font-semibold rounded-lg py-2 px-2 border-2 transition-all',
                    result === k
                      ? k === 'closed' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700' :
                        k === 'follow_up' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700' :
                        k === 'no_answer' ? 'border-slate-400 bg-slate-100 dark:bg-slate-700 text-slate-700' :
                        'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500')}>
                  {label}
                </button>
              ))}
            </div>

            <Input label="นัดโทรกลับวันที่" type="datetime-local" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)} />
            <div className="mt-3">
              <Textarea label="หมายเหตุ" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="บันทึกรายละเอียดเพิ่มเติม..." />
            </div>
          </div>
        </div>

        {/* Column 2: Shipping */}
        <div className="space-y-4">
          <div className={cn('bg-slate-50 dark:bg-slate-800 rounded-2xl p-4', result !== 'closed' && 'opacity-40 pointer-events-none')}>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">ข้อมูลจัดส่ง (แก้ไขได้)</p>
            <div className="flex gap-2 mb-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={useLatest} onChange={() => setUseLatest(true)} className="accent-emerald-500" />
                <span>ใช้ข้อมูลล่าสุด</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={!useLatest} onChange={() => setUseLatest(false)} className="accent-emerald-500" />
                <span>แก้ไขข้อมูล</span>
              </label>
            </div>
            <div className="space-y-2">
              <Input label="ชื่อผู้รับ *" value={recipientName} onChange={e => setRecipientName(e.target.value)} disabled={useLatest} />
              <Input label="เบอร์โทร *" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} disabled={useLatest} />
              <Textarea label="ที่อยู่ *" value={addressLine} onChange={e => setAddressLine(e.target.value)} rows={2} disabled={useLatest} />
              <div className="grid grid-cols-2 gap-1.5">
                <Input label="ตำบล" value={subDistrict} onChange={e => setSubDistrict(e.target.value)} disabled={useLatest} />
                <Input label="อำเภอ" value={district} onChange={e => setDistrict(e.target.value)} disabled={useLatest} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Input label="จังหวัด" value={province} onChange={e => setProvince(e.target.value)} disabled={useLatest} />
                <Input label="รหัสไปรษณีย์" value={postalCode} onChange={e => setPostalCode(e.target.value)} disabled={useLatest} />
              </div>
              {!useLatest && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSaveAsCustomerLatest(true)
                      // Visual feedback via alert
                      alert('✓ บันทึกเป็นข้อมูลล่าสุดของลูกค้าแล้ว — กดสร้างออเดอร์เพื่อบันทึกพร้อมข้อมูลใหม่')
                    }}
                    className={cn('w-full py-2 rounded-lg text-xs font-bold transition-colors',
                      saveAsCustomerLatest
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30')}>
                    {saveAsCustomerLatest ? '✓ อัปเดตข้อมูลแล้ว' : '🔄 อัปเดตข้อมูลลูกค้า'}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">กดเพื่อบันทึกข้อมูลใหม่นี้เป็นข้อมูลล่าสุดของลูกค้าใน CRM</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Products */}
        <div className="space-y-4">
          <div className={cn('bg-slate-50 dark:bg-slate-800 rounded-2xl p-4', result !== 'closed' && 'opacity-40 pointer-events-none')}>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">เลือกสินค้า</p>
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="🔍 ค้นหาสินค้า"
              className="w-full mb-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {activeProducts.map(p => {
                const qty = qtyOf(p.id)
                const stock = p.stockQty ?? 0
                const low = p.lowStockThreshold ?? 0
                const stockColor = stock === 0 ? 'text-red-500' : stock <= low ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'
                const commAmount = computeCommission(p)
                const commLabel = p.commission?.mode === 'percent' ? `${p.commission.value}%` : `฿${formatMoney(commAmount)}`
                return (
                  <div key={p.id} className="flex items-start gap-2 bg-white dark:bg-slate-900 rounded-lg p-2">
                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 mt-0.5">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded" />
                      ) : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">฿{formatMoney(p.price)} / {p.unit}</p>
                      <p className={cn('text-[10px]', stockColor)}>สต็อก : {stock}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300">ค่าคอม : {commLabel}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-1">
                      <button onClick={() => changeItemQty(p.id, Math.max(0, qty - 1))} className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">−</button>
                      <span className="w-6 text-center text-xs font-bold">{qty}</span>
                      <button onClick={() => changeItemQty(p.id, qty + 1)} className="w-6 h-6 rounded bg-emerald-500 text-white">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Column 4: Confirm */}
        <div className="space-y-4">
          <div className={cn('bg-slate-50 dark:bg-slate-800 rounded-2xl p-4', result !== 'closed' && 'opacity-40 pointer-events-none')}>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">ยืนยันออเดอร์</p>
            <table className="w-full text-xs mb-3">
              <tbody>
                <tr><td className="py-0.5 text-slate-500">ลูกค้า</td><td className="py-0.5 text-right font-semibold">{recipientName || customer.name}</td></tr>
                <tr><td className="py-0.5 text-slate-500">เบอร์โทร</td><td className="py-0.5 text-right">{recipientPhone || customer.phone}</td></tr>
              </tbody>
            </table>

            <p className="text-xs font-semibold mb-1.5">รายการสินค้า ({items.length})</p>
            <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
              {items.length === 0 && <p className="text-xs text-slate-400 italic">ยังไม่ได้เลือกสินค้า</p>}
              {items.map(i => (
                <div key={i.productId} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded">
                  <span className="truncate">{i.productName} <span className="text-slate-400">x{i.quantity}</span></span>
                  <span className="font-semibold text-emerald-600 ml-2 shrink-0">฿{formatMoney(i.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs mb-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">ส่วนลดพิเศษ</span>
                <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                  className="flex-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-right" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="font-bold">ยอดรวม</span>
                <span className="text-xl font-black text-emerald-600">฿{formatMoney(netAmount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full justify-center" onClick={() => handleSubmit(false)} disabled={items.length === 0}>
                สร้างออเดอร์
              </Button>
              <Button variant="secondary" className="w-full justify-center" onClick={() => handleSubmit(true)}>
                บันทึกเฉพาะผลโทร
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* For non-closed results, simple action footer */}
      {result !== 'closed' && (
        <div className="flex justify-end gap-2 mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={() => handleSubmit(true)}>บันทึกผลการโทร</Button>
        </div>
      )}
    </Modal>
  )
}
