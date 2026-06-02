'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Button, Card, EmptyState, Modal, Input, Select, PageHeader, Textarea } from '@/components/ui'
import { Order, OrderStatus, Carrier, CARRIER_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, ORDER_STATUS_SHORT } from '@/types'
import { formatDate, formatMoney, cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

type Tab = 'wait_pack' | 'in_myorder' | 'shipping' | 'delivered' | 'returned'

function ShipModal({ order, onClose, onShip }: {
  order: Order; onClose: () => void;
  onShip: (opts: { carrier: Carrier; tracking: string; realShippingFee: number; realCodBaht: number; useRealForProfit: boolean }) => void
}) {
  const stdShipping = order.shippingFee ?? 0
  const stdCodBaht = order.standardCodBaht ?? 0
  const [carrier, setCarrier] = useState<Carrier>(order.carrier ?? 'flash')
  const [tracking, setTracking] = useState(order.trackingNumber ?? '')
  const [realShippingFee, setRealShippingFee] = useState(order.realShippingFee ?? stdShipping)
  const [realCodBaht, setRealCodBaht] = useState(order.realCodBaht ?? stdCodBaht)
  const [useRealForProfit, setUseRealForProfit] = useState(order.useRealForProfit ?? true)
  const [err, setErr] = useState('')

  const overrideShip = realShippingFee !== stdShipping
  const overrideCod = realCodBaht !== stdCodBaht

  return (
    <Modal open onClose={onClose} title="กรอกเลขพัสดุและยืนยันจัดส่ง" width="max-w-2xl">
      <div className="space-y-4">
        {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        <p className="text-sm text-slate-600 dark:text-slate-400">
          ออเดอร์: <span className="font-mono font-semibold">{order.id}</span> · {order.customerName}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Select label="ขนส่ง *" value={carrier} onChange={e => setCarrier(e.target.value as Carrier)}>
            {(Object.keys(CARRIER_LABEL) as Carrier[]).map(c => <option key={c} value={c}>{CARRIER_LABEL[c]}</option>)}
          </Select>
          <Input label="เลขพัสดุ / Tracking Number *" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="TH0123456789" />
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">ค่าส่งและ COD</p>
          {order.shippingProfileName && (
            <p className="text-[10px] text-emerald-600 mb-2">📌 โปรไฟล์ที่ระบบเลือก: <strong>{order.shippingProfileName}</strong></p>
          )}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-[10px] text-slate-500">ค่าส่งมาตรฐาน (ระบบเลือก)</p>
              <p className="text-xl font-black text-slate-700 dark:text-slate-200">{stdShipping} <span className="text-xs">บาท</span></p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-[10px] text-slate-500">COD มาตรฐาน (ระบบเลือก)</p>
              <p className="text-xl font-black text-slate-700 dark:text-slate-200">{stdCodBaht} <span className="text-xs">บาท</span></p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input label="ค่าส่งจริง (บาท)" type="number" value={realShippingFee} onChange={e => setRealShippingFee(Number(e.target.value))} />
              {overrideShip && <p className="text-[10px] text-amber-600 mt-1">⚠️ แก้ไขจากมาตรฐาน</p>}
            </div>
            <div>
              <Input label="COD จริง (บาท)" type="number" value={realCodBaht} onChange={e => setRealCodBaht(Number(e.target.value))} />
              {overrideCod && <p className="text-[10px] text-amber-600 mt-1">⚠️ แก้ไขจากมาตรฐาน</p>}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs mt-3 cursor-pointer bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
            <input type="checkbox" checked={useRealForProfit} onChange={e => setUseRealForProfit(e.target.checked)} className="accent-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">ใช้ค่าส่งจริงในการคำนวณกำไร</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={() => {
            if (!tracking.trim()) { setErr('กรุณากรอกเลขพัสดุ'); return }
            onShip({ carrier, tracking: tracking.trim(), realShippingFee, realCodBaht, useRealForProfit })
          }}>
            ยืนยันจัดส่ง
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ReturnOrCancelModal({ order, mode, onClose, onSubmit }: {
  order: Order; mode: 'returned' | 'cancelled'; onClose: () => void; onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return (
    <Modal open onClose={onClose} title={mode === 'returned' ? 'ยืนยันตีกลับ (RETURNED)' : 'ยกเลิกออเดอร์ (CANCELLED)'}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">ออเดอร์: <span className="font-mono font-semibold">{order.id}</span> · {order.customerName}</p>
        <Textarea label="เหตุผล *" value={reason} onChange={e => setReason(e.target.value)} rows={3} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button variant="danger" onClick={() => reason.trim() && onSubmit(reason.trim())}>ยืนยัน</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function PackingPage() {
  const { state, updateOrderStatus, copyOrderData } = useApp()
  const [tab, setTab] = useState<Tab>('wait_pack')
  const [selected, setSelected] = useState<Order | null>(null)
  const [shipOrder, setShipOrder] = useState<Order | null>(null)
  const [returnOrder, setReturnOrder] = useState<Order | null>(null)
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null)
  const [copiedHint, setCopiedHint] = useState<string | null>(null)

  const orders = state.orders.filter(o => o.status === tab)

  const tabConfig: { key: Tab; label: string; count: number }[] = [
    { key: 'wait_pack',  label: 'รอแพ็ค',         count: state.orders.filter(o => o.status === 'wait_pack').length },
    { key: 'in_myorder', label: 'นำเข้าระบบแล้ว', count: state.orders.filter(o => o.status === 'in_myorder').length },
    { key: 'shipping',   label: 'กำลังจัดส่ง',     count: state.orders.filter(o => o.status === 'shipping').length },
    { key: 'delivered',  label: 'ส่งสำเร็จ',       count: state.orders.filter(o => o.status === 'delivered').length },
    { key: 'returned',   label: 'ตีกลับ',          count: state.orders.filter(o => o.status === 'returned').length },
  ]

  async function handleCopy(o: Order) {
    const text = copyOrderData(o.id)
    if (!text) { alert('ไม่มีข้อมูลให้คัดลอก'); return }
    // Try modern clipboard API first
    let copied = false
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        copied = true
      }
    } catch {}
    // Fallback to execCommand if modern API fails or unavailable
    if (!copied) {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        copied = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {}
    }
    if (copied) {
      setCopiedHint(o.id)
      setTimeout(() => setCopiedHint(null), 2500)
    } else {
      // Last resort: show text in prompt for manual copy
      window.prompt('คัดลอกข้อความนี้ (Ctrl+C):', text)
    }
  }

  function handleExportCSV() {
    const rows = orders.map(o => ({
      'เลขออเดอร์': o.id, 'ลูกค้า': o.customerName, 'เบอร์': o.customerPhone,
      'ที่อยู่': o.shipping?.addressLine || o.customerAddress || '',
      'สินค้า': o.items.map(i => `${i.productName} x${i.quantity}`).join(' + '),
      'ยอด COD': o.totalAmount - o.discount, 'ขนส่ง': o.carrier ? CARRIER_LABEL[o.carrier] : '',
      'Tracking': o.trackingNumber ?? '', 'สถานะ': ORDER_STATUS_LABEL[o.status],
      'เทเลเซล': o.telesaleName, 'วันที่สั่ง': formatDate(o.createdAt),
    }))
    if (rows.length === 0) { alert('ไม่มีออเดอร์ในสถานะนี้'); return }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), tab)
    XLSX.writeFile(wb, `packing-${tab}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div>
      <PageHeader
        title="แพ็คสินค้า"
        subtitle="จัดการออเดอร์เพื่อแพ็คและจัดส่ง"
        action={
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg px-3 py-1.5 text-xs font-semibold">
              รอแพ็ค <span className="font-black text-base ml-1">{state.orders.filter(o => o.status === 'wait_pack').length}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={handleExportCSV}>📤 Export CSV</Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabConfig.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                tab === t.key ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          {/* Table */}
          {orders.length === 0 ? <EmptyState message="ไม่มีออเดอร์ในสถานะนี้" /> : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left py-3 px-3 font-medium">เลขออเดอร์</th>
                      <th className="text-left py-3 px-3 font-medium">ลูกค้า / เบอร์โทร</th>
                      <th className="text-left py-3 px-3 font-medium">ที่อยู่จัดส่ง</th>
                      <th className="text-left py-3 px-3 font-medium">สินค้า</th>
                      <th className="text-right py-3 px-3 font-medium">ยอด COD</th>
                      <th className="text-center py-3 px-3 font-medium">สถานะ</th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => {
                      const isSelected = selected?.id === o.id
                      return (
                        <tr key={o.id} className={cn('border-b border-slate-50 dark:border-slate-800 cursor-pointer',
                          isSelected ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50')}
                          onClick={() => setSelected(o)}>
                          <td className="py-3 px-3">
                            <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{o.id}</p>
                            <p className="text-[10px] text-slate-400">{formatDate(o.createdAt)}</p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-slate-800 dark:text-slate-100">{o.customerName}</p>
                            <p className="text-xs text-slate-400">{o.customerPhone}</p>
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                            <p>📍 {o.shipping?.addressLine || o.customerAddress || '—'}</p>
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-700 dark:text-slate-200">
                            {o.items.slice(0, 2).map((i, idx) => (
                              <p key={idx}>• {i.productName} x{i.quantity}</p>
                            ))}
                            {o.items.length > 2 && <p className="text-slate-400">รวม {o.items.length} รายการ</p>}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <p className="font-bold text-slate-800 dark:text-slate-100">฿{formatMoney(o.totalAmount - o.discount)}</p>
                            <p className="text-[10px] text-slate-400">COD</p>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge label={ORDER_STATUS_LABEL[o.status]} className={ORDER_STATUS_COLOR[o.status]} />
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            {o.status === 'wait_pack' && (
                              <button onClick={() => handleCopy(o)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1">
                                {copiedHint === o.id ? '✅ คัดลอกแล้ว' : '📋 คัดลอกข้อมูล'}
                              </button>
                            )}
                            {o.status === 'in_myorder' && (
                              <button onClick={() => setShipOrder(o)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold">
                                กรอกเลขพัสดุ
                              </button>
                            )}
                            {o.status === 'shipping' && (
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => updateOrderStatus(o.id, 'delivered')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold">
                                  ✅ ส่งสำเร็จ
                                </button>
                                <button onClick={() => setReturnOrder(o)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold">
                                  ❌ ตีกลับ
                                </button>
                              </div>
                            )}
                            {(o.status === 'wait_pack' || o.status === 'in_myorder') && (
                              <button onClick={() => setCancelOrder(o)} className="ml-1 text-xs text-slate-400 hover:text-red-500" title="ยกเลิก">✕</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Side panel */}
          <div className="space-y-4 self-start">
            {selected ? (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-400">ยอดออเดอร์</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{selected.id}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">✕</button>
                </div>
                <Badge label={ORDER_STATUS_LABEL[selected.status]} className={cn('mb-3', ORDER_STATUS_COLOR[selected.status])} />

                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">ข้อมูลลูกค้า</p>
                <div className="text-xs space-y-0.5 mb-3">
                  <p>👤 {selected.customerName}</p>
                  <p>📞 {selected.customerPhone}</p>
                </div>

                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">ที่อยู่จัดส่ง</p>
                <p className="text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 mb-3">
                  📍 {selected.shipping?.addressLine || selected.customerAddress || '—'}
                </p>

                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">รายการสินค้า</p>
                <div className="space-y-1 mb-3 text-xs">
                  {selected.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{idx + 1}. {i.productName}</span>
                      <span className="font-semibold">x{i.quantity} · ฿{formatMoney(i.subtotal)}</span>
                    </div>
                  ))}
                  <p className="text-right text-slate-400">รวม {selected.items.length} รายการ</p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mb-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">ยอด COD</p>
                  <p className="text-2xl font-black text-emerald-600">฿{formatMoney(selected.totalAmount - selected.discount)}</p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-xs">
                  <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">ข้อมูลสำหรับคัดลอก (กดปุ่มเพื่อคัดลอกทั้งหมด)</p>
                  <p className="text-emerald-900 dark:text-emerald-200">ชื่อ: {selected.shipping?.recipientName || selected.customerName}</p>
                  <p className="text-emerald-900 dark:text-emerald-200">เบอร์: {selected.shipping?.recipientPhone || selected.customerPhone}</p>
                  <p className="text-emerald-900 dark:text-emerald-200">ที่อยู่: {selected.shipping?.addressLine || selected.customerAddress || '—'}</p>
                  <p className="text-emerald-900 dark:text-emerald-200">สินค้า: {selected.items.map(i => `${i.productName} x${i.quantity}`).join(', ')}</p>
                  <p className="text-emerald-900 dark:text-emerald-200">ยอด COD: {formatMoney(selected.totalAmount - selected.discount)} บาท</p>
                  {selected.notes && selected.notes.trim() && (
                    <p className="text-emerald-900 dark:text-emerald-200 mt-1 italic">📝 หมายเหตุ: {selected.notes}</p>
                  )}
                  <button onClick={() => handleCopy(selected)}
                    className="mt-2 w-full px-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors">
                    {copiedHint === selected.id ? '✅ คัดลอกแล้ว' : '📋 คัดลอกข้อมูลทั้งหมด'}
                  </button>
                </div>

                {selected.trackingNumber && (
                  <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2 text-xs">
                    <p className="text-indigo-700">{selected.carrier ? CARRIER_LABEL[selected.carrier] : ''}</p>
                    <p className="font-mono font-bold text-indigo-900">{selected.trackingNumber}</p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-4 text-center text-xs text-slate-400">
                เลือกออเดอร์เพื่อดูข้อมูลละเอียด
              </Card>
            )}

            {/* Status legend */}
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">ความหมายของสถานะ</p>
              <div className="space-y-2 text-xs">
                {(['wait_pack', 'in_myorder', 'shipping', 'delivered', 'returned', 'cancelled'] as OrderStatus[]).map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <Badge label={ORDER_STATUS_SHORT[s]} className={cn('text-[10px] shrink-0', ORDER_STATUS_COLOR[s])} />
                    <span className="text-slate-600 dark:text-slate-300">
                      {s === 'wait_pack' ? 'รอฝ่ายแพ็คดำเนินการ' :
                       s === 'in_myorder' ? 'นำข้อมูลไปวางใน My Order แล้ว' :
                       s === 'shipping' ? 'กรอกเลขพัสดุ อยู่ระหว่างจัดส่ง' :
                       s === 'delivered' ? 'ลูกค้ารับสินค้าสำเร็จ' :
                       s === 'returned' ? 'พัสดุตีกลับ' : 'ยกเลิกออเดอร์'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 5-step workflow */}
        <Card className="p-5">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">ขั้นตอนการทำงานของฝ่ายแพ็ค</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { n: 1, title: 'คัดลอกข้อมูล', desc: 'กดปุ่ม "คัดลอกข้อมูล" เพื่อนำไปวางในระบบ My Order', icon: '📋' },
              { n: 2, title: 'วางในระบบ My Order', desc: 'วางข้อมูลในระบบ My Order เพื่อสร้างออเดอร์ในระบบขนส่ง', icon: '🖥️' },
              { n: 3, title: 'แพ็คและจัดส่ง', desc: 'พิมพ์ใบปะหน้า แพ็คสินค้า และนำส่งพนักงานขนส่ง', icon: '📦' },
              { n: 4, title: 'กรอกเลขพัสดุ', desc: 'กรอกเลขพัสดุและกด "ยืนยันจัดส่ง" ระบบจะเปลี่ยนสถานะเป็น "กำลังจัดส่ง"', icon: '🔢' },
              { n: 5, title: 'อัปเดตผลลัพธ์', desc: 'เมื่อส่งสำเร็จหรือตีกลับ กดปุ่มยืนยันสถานะในระบบ', icon: '✅' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl mb-2">
                  {s.icon}
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100"><span className="text-emerald-600">{s.n}.</span> {s.title}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-4 italic">💡 หมายเหตุ: การกรอกเลขพัสดุและอัปเดตสถานะ จะช่วยให้ระบบติดตามพัสดุแม่นยำ และใช้ในการวิเคราะห์คุณภาพลูกค้าในอนาคต</p>
        </Card>
      </div>

      {shipOrder && (
        <ShipModal order={shipOrder} onClose={() => setShipOrder(null)}
          onShip={(opts) => {
            updateOrderStatus(shipOrder.id, 'shipping', {
              carrier: opts.carrier,
              trackingNumber: opts.tracking,
              realShippingFee: opts.realShippingFee,
              realCodBaht: opts.realCodBaht,
              useRealForProfit: opts.useRealForProfit,
            })
            setShipOrder(null)
          }} />
      )}
      {returnOrder && (
        <ReturnOrCancelModal order={returnOrder} mode="returned" onClose={() => setReturnOrder(null)}
          onSubmit={reason => { updateOrderStatus(returnOrder.id, 'returned', { returnReason: reason }); setReturnOrder(null) }} />
      )}
      {cancelOrder && (
        <ReturnOrCancelModal order={cancelOrder} mode="cancelled" onClose={() => setCancelOrder(null)}
          onSubmit={reason => { updateOrderStatus(cancelOrder.id, 'cancelled', { cancelReason: reason }); setCancelOrder(null) }} />
      )}
    </div>
  )
}
