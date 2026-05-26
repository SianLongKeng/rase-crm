'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Button, Modal, Card, EmptyState, Textarea, Select, Input, PageHeader } from '@/components/ui'
import { TIER_LABEL, TIER_COLOR, CALL_RESULT_LABEL, Customer, OrderItem, Product } from '@/types'
import { cn, formatDate, formatMoney } from '@/lib/utils'

function TierBadge({ tier }: { tier: Customer['tier'] }) {
  const map = { vip: '⭐ VIP', warm: '🔥 WARM', cold: '❄️ COLD' }
  return <Badge label={map[tier]} className={TIER_COLOR[tier]} />
}

function CallModal({ customer, products, onClose, onSubmit }: {
  customer: Customer
  products: Product[]
  onClose: () => void
  onSubmit: (result: string, notes: string, followUpAt?: string, items?: OrderItem[], discount?: number) => void
}) {
  const [result, setResult] = useState('follow_up')
  const [notes, setNotes] = useState('')
  const [followUpAt, setFollowUpAt] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState(1)

  const activeProducts = products.filter(p => p.status === 'active')
  const total = items.reduce((s, i) => s + i.subtotal, 0)

  function addItem() {
    const prod = activeProducts.find(p => p.id === productId)
    if (!prod) return
    const existing = items.find(i => i.productId === productId)
    if (existing) {
      setItems(items.map(i => i.productId === productId ? { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * i.price } : i))
    } else {
      setItems([...items, { productId: prod.id, productName: prod.name, price: prod.price, quantity: qty, subtotal: prod.price * qty }])
    }
    setProductId(''); setQty(1)
  }

  const resultColors: Record<string, string> = {
    closed: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    follow_up: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    no_answer: 'border-slate-300 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    not_interested: 'border-red-300 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }

  return (
    <Modal open onClose={onClose} title={`บันทึกผลการโทร`} width="max-w-2xl">
      <div className="space-y-5">
        {/* Customer Info */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-200">
              {customer.name.charAt(2) ?? customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">{customer.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{customer.phone}</p>
            </div>
            <TierBadge tier={customer.tier} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { v: `${customer.totalOrders}`, l: 'ออเดอร์' },
              { v: `฿${formatMoney(customer.totalAmount)}`, l: 'ยอดรวม' },
              { v: `${customer.successRate}%`, l: 'สำเร็จ' },
            ].map(s => (
              <div key={s.l} className="bg-white dark:bg-slate-600 rounded-xl py-2">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{s.v}</p>
                <p className="text-xs text-slate-400 dark:text-slate-300">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Result picker */}
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">ผลการโทร</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CALL_RESULT_LABEL).map(([k, v]) => (
              <button key={k} onClick={() => setResult(k)}
                className={cn('p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left', result === k ? resultColors[k] : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600')}>
                {k === 'closed' && '✅ '}{k === 'follow_up' && '🔁 '}{k === 'no_answer' && '📵 '}{k === 'not_interested' && '❌ '}{v}
              </button>
            ))}
          </div>
        </div>

        {result === 'follow_up' && (
          <Input label="📅 นัดโทรกลับวันที่" type="datetime-local" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)} />
        )}

        {result === 'closed' && (
          <div className="border-2 border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">🛍️ สินค้าที่สั่ง</p>
            <div className="flex gap-2">
              <select value={productId} onChange={e => setProductId(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">เลือกสินค้า</option>
                {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name} — ฿{formatMoney(p.price)}/{p.unit}</option>)}
              </select>
              <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min={1}
                className="w-16 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <Button size="sm" onClick={addItem} disabled={!productId}>+ เพิ่ม</Button>
            </div>
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map(i => (
                  <div key={i.productId} className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded-xl text-sm border border-emerald-100 dark:border-emerald-800">
                    <span className="text-slate-700 dark:text-slate-200">{i.productName} <span className="text-slate-400">x{i.quantity}</span></span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">฿{formatMoney(i.subtotal)}</span>
                      <button onClick={() => setItems(items.filter(x => x.productId !== i.productId))} className="text-red-300 hover:text-red-500 text-lg leading-none">✕</button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">ส่วนลด ฿</span>
                  <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min={0}
                    className="w-24 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  <span className="ml-auto text-sm font-black text-emerald-700 dark:text-emerald-400">ยอดสุทธิ ฿{formatMoney(total - discount)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <Textarea label="หมายเหตุ" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="บันทึกรายละเอียดเพิ่มเติม..." />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button size="lg" onClick={() => onSubmit(result, notes, followUpAt || undefined, result === 'closed' ? items : undefined, discount)}>
            บันทึกผลการโทร
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function QueuePage() {
  const { state, completeCall } = useApp()
  const [selected, setSelected] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')

  const queue = state.customers
    .filter(c => c.nextCallAt && new Date(c.nextCallAt) <= new Date())
    .filter(c => !search || c.name.includes(search) || c.phone.includes(search))
    .sort((a, b) => ({ vip: 0, warm: 1, cold: 2 }[a.tier] - { vip: 0, warm: 1, cold: 2 }[b.tier]))

  const tierCounts = { vip: queue.filter(c => c.tier === 'vip').length, warm: queue.filter(c => c.tier === 'warm').length, cold: queue.filter(c => c.tier === 'cold').length }

  function handleSubmit(result: string, notes: string, followUpAt?: string, items?: OrderItem[], discount?: number) {
    if (!selected) return
    completeCall(selected.id, result as never, notes, followUpAt, items, discount)
    setSelected(null)
  }

  return (
    <div>
      <PageHeader
        title="คิวโทรวันนี้"
        subtitle={`${queue.length} ราย รอโทร`}
        action={
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..."
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white dark:focus:bg-slate-700" />
        }
      />

      <div className="p-6 space-y-5">
        {/* Tier summary */}
        <div className="flex gap-3">
          {[
            { label: '⭐ VIP', count: tierCounts.vip, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
            { label: '🔥 WARM', count: tierCounts.warm, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
            { label: '❄️ COLD', count: tierCounts.cold, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
          ].map(t => (
            <div key={t.label} className={cn('px-4 py-2 rounded-xl text-sm font-bold', t.color)}>
              {t.label} <span className="opacity-70">({t.count})</span>
            </div>
          ))}
        </div>

        {queue.length === 0 ? <EmptyState message="ไม่มีคิวโทรวันนี้ เยี่ยมมาก!" emoji="🎉" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {queue.map(c => {
              const tierStyles = {
                vip: { border: 'border-l-4 border-l-yellow-400', badge: '⭐ VIP', badgeColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
                warm: { border: 'border-l-4 border-l-orange-400', badge: '🔥 WARM', badgeColor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
                cold: { border: 'border-l-4 border-l-blue-400', badge: '❄️ COLD', badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
              }[c.tier]

              return (
                <div key={c.id} className={cn('bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-slate-800 transition-all p-5', tierStyles.border)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{c.phone}</p>
                    </div>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-bold', tierStyles.badgeColor)}>{tierStyles.badge}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { v: c.totalOrders, l: 'ออเดอร์' },
                      { v: `${c.successRate}%`, l: 'สำเร็จ' },
                      { v: `฿${formatMoney(c.totalAmount)}`, l: 'ยอดรวม' },
                    ].map(s => (
                      <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2 text-center">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.v}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{s.l}</p>
                      </div>
                    ))}
                  </div>

                  {c.notes && <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-3 line-clamp-1">"{c.notes}"</p>}
                  {c.lastCallAt && <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">โทรล่าสุด: {formatDate(c.lastCallAt)}</p>}

                  <button onClick={() => setSelected(c)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40">
                    <span>📞</span> โทร & บันทึกผล
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <CallModal customer={selected} products={state.products} onClose={() => setSelected(null)} onSubmit={handleSubmit} />
      )}
    </div>
  )
}
