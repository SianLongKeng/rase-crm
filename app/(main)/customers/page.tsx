'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Button, Modal, Card, EmptyState, Input, Select, Textarea, PageHeader } from '@/components/ui'
import { Customer, CustomerTier, TIER_LABEL, TIER_COLOR, TIER_CALL_DAYS } from '@/types'
import { cn, formatDate, formatMoney, generateId, addDays } from '@/lib/utils'

const TIER_OPTS: CustomerTier[] = ['vip', 'warm', 'cold']

function CustomerForm({ initial, onSave, onClose }: {
  initial?: Customer | null
  onSave: (c: Customer) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [tier, setTier] = useState<CustomerTier>(initial?.tier ?? 'cold')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [err, setErr] = useState('')

  function handleSave() {
    if (!name.trim() || !phone.trim()) { setErr('กรุณากรอกชื่อและเบอร์โทร'); return }
    const now = new Date().toISOString()
    const customer: Customer = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      tier,
      totalOrders: initial?.totalOrders ?? 0,
      totalAmount: initial?.totalAmount ?? 0,
      successRate: initial?.successRate ?? 0,
      lastCallAt: initial?.lastCallAt,
      nextCallAt: initial?.nextCallAt ?? addDays(new Date(), TIER_CALL_DAYS[tier]),
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    }
    onSave(customer)
  }

  return (
    <Modal open onClose={onClose} title={initial ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}>
      <div className="space-y-4">
        {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{err}</p>}
        <Input label="ชื่อ-นามสกุล *" value={name} onChange={e => setName(e.target.value)} placeholder="คุณสมชาย..." />
        <Input label="เบอร์โทร *" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" />
        <Input label="ที่อยู่" value={address} onChange={e => setAddress(e.target.value)} placeholder="จังหวัด..." />
        <Select label="ระดับลูกค้า" value={tier} onChange={e => setTier(e.target.value as CustomerTier)}>
          {TIER_OPTS.map(t => <option key={t} value={t}>{TIER_LABEL[t]} (โทรทุก {TIER_CALL_DAYS[t]} วัน)</option>)}
        </Select>
        <Textarea label="หมายเหตุ" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="ความสนใจ, สินค้าที่ชอบ..." />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave}>{initial ? 'บันทึก' : 'เพิ่มลูกค้า'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function CustomersPage() {
  const { state, dispatch, addHistory } = useApp()
  const [form, setForm] = useState<{ open: boolean; customer?: Customer | null }>({ open: false })
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<CustomerTier | 'all'>('all')
  const [detail, setDetail] = useState<Customer | null>(null)

  const filtered = state.customers
    .filter(c => tierFilter === 'all' || c.tier === tierFilter)
    .filter(c => !search || c.name.includes(search) || c.phone.includes(search) || (c.address ?? '').includes(search))

  function handleSave(customer: Customer) {
    const isNew = !state.customers.find(c => c.id === customer.id)
    dispatch({ type: isNew ? 'ADD_CUSTOMER' : 'UPDATE_CUSTOMER', payload: customer })
    if (isNew) addHistory('customer_added', `เพิ่มลูกค้า ${customer.name}`, customer.id, 'customer')
    setForm({ open: false })
  }

  function handleDelete(id: string) {
    if (!confirm('ลบลูกค้านี้?')) return
    dispatch({ type: 'DELETE_CUSTOMER', payload: id })
    setDetail(null)
  }

  const callLogs = (customerId: string) => state.callLogs.filter(c => c.customerId === customerId)
  const customerOrders = (customerId: string) => state.orders.filter(o => o.customerId === customerId)

  return (
    <div>
      <PageHeader
        title="ฐานลูกค้า"
        subtitle={`${filtered.length} จาก ${state.customers.length} ราย`}
        action={
          <div className="flex gap-2 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..."
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white dark:focus:bg-slate-700" />
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value as never)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="all">ทุกระดับ</option>
              {TIER_OPTS.map(t => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
            </select>
            <Button onClick={() => setForm({ open: true })}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              เพิ่มลูกค้า
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {filtered.length === 0 ? <EmptyState message="ไม่พบลูกค้า" /> : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-4 font-medium">ลูกค้า</th>
                    <th className="text-left py-3 px-4 font-medium">ระดับ</th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">ออเดอร์</th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">ยอดรวม</th>
                    <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">โทรครั้งต่อไป</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => setDetail(c)}>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{c.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{c.phone}</p>
                      </td>
                      <td className="py-3 px-4"><Badge label={TIER_LABEL[c.tier]} className={TIER_COLOR[c.tier]} /></td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-600 dark:text-slate-400">{c.totalOrders} ครั้ง</td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-600 dark:text-slate-400">฿{formatMoney(c.totalAmount)}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className={cn('text-xs', c.nextCallAt && new Date(c.nextCallAt) <= new Date() ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400')}>
                          {c.nextCallAt ? formatDate(c.nextCallAt) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setForm({ open: true, customer: c })} className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 mr-2 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {form.open && <CustomerForm initial={form.customer} onSave={handleSave} onClose={() => setForm({ open: false })} />}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={() => setDetail(null)} />
          <div className="relative ml-auto w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl border-l border-slate-100 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">{detail.name}</h2>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Badge label={TIER_LABEL[detail.tier]} className={cn('text-sm', TIER_COLOR[detail.tier])} />
                <span className="text-sm text-slate-500 dark:text-slate-400">{detail.phone}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Card className="p-3 text-center">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{detail.totalOrders}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ออเดอร์</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">฿{formatMoney(detail.totalAmount)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ยอดรวม</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{detail.successRate}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ส่งสำเร็จ</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{detail.nextCallAt ? formatDate(detail.nextCallAt) : '—'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">โทรครั้งต่อไป</p>
                </Card>
              </div>
              {detail.notes && <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">"{detail.notes}"</p>}

              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">ประวัติการโทร ({callLogs(detail.id).length})</p>
                {callLogs(detail.id).length === 0 ? <p className="text-sm text-slate-400 dark:text-slate-500">ยังไม่มีประวัติ</p> : (
                  <div className="space-y-2">
                    {callLogs(detail.id).slice(0, 5).map(cl => (
                      <div key={cl.id} className="flex items-start gap-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                        <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium shrink-0', cl.result === 'closed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : cl.result === 'follow_up' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400')}>
                          {cl.result === 'closed' ? 'ปิดได้' : cl.result === 'follow_up' ? 'F/U' : cl.result === 'no_answer' ? 'ไม่รับ' : 'ไม่สนใจ'}
                        </span>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">{cl.notes || '—'}</p>
                          <p className="text-slate-400 dark:text-slate-500">{formatDate(cl.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">ออเดอร์ ({customerOrders(detail.id).length})</p>
                {customerOrders(detail.id).length === 0 ? <p className="text-sm text-slate-400 dark:text-slate-500">ยังไม่มีออเดอร์</p> : (
                  <div className="space-y-2">
                    {customerOrders(detail.id).map(o => (
                      <div key={o.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                        <span className="text-slate-700 dark:text-slate-200">฿{formatMoney(o.totalAmount - o.discount)}</span>
                        <span className="text-slate-400 dark:text-slate-500">{formatDate(o.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => { setForm({ open: true, customer: detail }); setDetail(null) }}>แก้ไข</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(detail.id)}>ลบ</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
