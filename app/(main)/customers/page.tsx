'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Button, Modal, Card, EmptyState, Input, Select, Textarea, PageHeader } from '@/components/ui'
import {
  Customer, CustomerGrade, CustomerStatus,
  GRADE_LABEL, GRADE_COLOR, GRADE_CALL_DAYS, GRADE_EMOJI,
  CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_COLOR,
  hasPermission,
} from '@/types'
import { cn, formatDate, formatMoney, generateId, addDays, formatDateTime } from '@/lib/utils'

const GRADE_OPTS: CustomerGrade[] = ['A', 'B', 'C', 'D']

function CustomerForm({ initial, onSave, onClose, users }: {
  initial?: Customer | null
  onSave: (c: Customer) => void
  onClose: () => void
  users: { id: string; name: string; role: string }[]
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [line, setLine] = useState(initial?.line ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [grade, setGrade] = useState<CustomerGrade>(initial?.grade ?? 'D')
  const [status, setStatus] = useState<CustomerStatus>(initial?.status ?? 'new')
  const [ownerId, setOwnerId] = useState<string>(initial?.ownerId ?? '')
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [err, setErr] = useState('')

  const telesales = users.filter(u => u.role === 'telesale')

  function handleSave() {
    if (!name.trim() || !phone.trim()) { setErr('กรุณากรอกชื่อและเบอร์โทร'); return }
    const now = new Date().toISOString()
    const owner = telesales.find(u => u.id === ownerId)
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(), phone: phone.trim(), line: line.trim() || undefined, address: address.trim() || undefined,
      grade, status, ownerId: owner?.id, ownerName: owner?.name,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      totalOrders: initial?.totalOrders ?? 0,
      totalAmount: initial?.totalAmount ?? 0,
      successRate: initial?.successRate ?? 0,
      lastCallAt: initial?.lastCallAt,
      nextCallAt: initial?.nextCallAt ?? addDays(new Date(), GRADE_CALL_DAYS[grade]),
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      editHistory: initial?.editHistory,
    })
  }

  return (
    <Modal open onClose={onClose} title={initial ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}>
      <div className="space-y-4">
        {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{err}</p>}
        <Input label="ชื่อ-นามสกุล *" value={name} onChange={e => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="เบอร์โทร *" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" />
          <Input label="Line ID" value={line} onChange={e => setLine(e.target.value)} placeholder="line_id" />
        </div>
        <Input label="ที่อยู่" value={address} onChange={e => setAddress(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Grade" value={grade} onChange={e => setGrade(e.target.value as CustomerGrade)}>
            {GRADE_OPTS.map(g => <option key={g} value={g}>{GRADE_EMOJI[g]} Grade {g} (โทรทุก {GRADE_CALL_DAYS[g]} วัน)</option>)}
          </Select>
          <Select label="สถานะลูกค้า" value={status} onChange={e => setStatus(e.target.value as CustomerStatus)}>
            {(Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatus[]).map(s => <option key={s} value={s}>{CUSTOMER_STATUS_LABEL[s]}</option>)}
          </Select>
        </div>
        <Select label="เจ้าของดูแล (Owner)" value={ownerId} onChange={e => setOwnerId(e.target.value)}>
          <option value="">— ยังไม่กำหนด —</option>
          {telesales.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Input label="แท็ก (คั่นด้วยจุลภาค)" value={tags} onChange={e => setTags(e.target.value)} placeholder="ลูกค้าประจำ, VIP" />
        <Textarea label="หมายเหตุ" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave}>{initial ? 'บันทึก' : 'เพิ่มลูกค้า'}</Button>
        </div>
      </div>
    </Modal>
  )
}

function AssignOwnerModal({ customer, users, onClose, onAssign }: {
  customer: Customer; users: { id: string; name: string; role: string }[]; onClose: () => void; onAssign: (ownerId: string | null) => void
}) {
  const [selectedId, setSelectedId] = useState(customer.ownerId ?? '')
  const telesales = users.filter(u => u.role === 'telesale')
  return (
    <Modal open onClose={onClose} title="กำหนดเจ้าของดูแล">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">ลูกค้า: <span className="font-semibold text-slate-800 dark:text-slate-200">{customer.name}</span></p>
        <Select label="เจ้าของดูแล (Telesale)" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">— ไม่กำหนด —</option>
          {telesales.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={() => onAssign(selectedId || null)}>บันทึก</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function CustomersPage() {
  const { state, dispatch, addHistory, assignOwner } = useApp()
  const [form, setForm] = useState<{ open: boolean; customer?: Customer | null }>({ open: false })
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState<CustomerGrade | 'all'>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [detail, setDetail] = useState<Customer | null>(null)
  const [assignFor, setAssignFor] = useState<Customer | null>(null)

  const user = state.currentUser
  const isTele = user?.role === 'telesale'
  const canViewEditHistory = hasPermission(user, 'view_activity_log') || user?.role === 'owner' || user?.role === 'admin'

  let visible = state.customers
  if (isTele) visible = visible.filter(c => c.ownerId === user?.id)

  const allTags = [...new Set(visible.flatMap(c => c.tags ?? []))]

  const filtered = visible
    .filter(c => gradeFilter === 'all' || c.grade === gradeFilter)
    .filter(c => ownerFilter === 'all' || (ownerFilter === 'none' ? !c.ownerId : c.ownerId === ownerFilter))
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => tagFilter === 'all' || (c.tags ?? []).includes(tagFilter))
    .filter(c => !search || c.name.includes(search) || c.phone.includes(search) || (c.line ?? '').includes(search) || (c.notes ?? '').includes(search))

  const telesales = state.users.filter(u => u.role === 'telesale')

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
        subtitle={`ทั้งหมด ${visible.length.toLocaleString()} ราย`}
        action={
          <Button onClick={() => setForm({ open: true })}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            เพิ่มลูกค้า
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหาชื่อ, เบอร์โทร, Line, หมายเหตุ..."
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm flex-1 min-w-[260px] focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value as never)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="all">Grade — ทั้งหมด</option>
            {GRADE_OPTS.map(g => <option key={g} value={g}>{GRADE_EMOJI[g]} Grade {g}</option>)}
          </select>
          {!isTele && (
            <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="all">เจ้าของดูแล — ทั้งหมด</option>
              <option value="none">ยังไม่กำหนด</option>
              {telesales.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as never)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="all">สถานะลูกค้า — ทั้งหมด</option>
            {(Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatus[]).map(s => <option key={s} value={s}>{CUSTOMER_STATUS_LABEL[s]}</option>)}
          </select>
          {allTags.length > 0 && (
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="all">แท็ก — ทั้งหมด</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {filtered.length === 0 ? <EmptyState message="ไม่พบลูกค้า" /> : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-4 font-medium">ลูกค้า</th>
                    <th className="text-left py-3 px-4 font-medium">Grade</th>
                    <th className="text-left py-3 px-4 font-medium">เจ้าของดูแล</th>
                    <th className="text-right py-3 px-4 font-medium">ออเดอร์</th>
                    <th className="text-right py-3 px-4 font-medium">ยอดรวม</th>
                    <th className="text-left py-3 px-4 font-medium">นัดโทรครั้งต่อไป</th>
                    <th className="text-center py-3 px-4 font-medium">สถานะ</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => setDetail(c)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {c.name.charAt(2) || c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-100">{c.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{c.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><Badge label={`${GRADE_EMOJI[c.grade]} ${c.grade}`} className={GRADE_COLOR[c.grade]} /></td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {c.ownerName ?? <span className="text-amber-500 italic">ยังไม่กำหนด</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200 font-semibold">{c.totalOrders}</td>
                      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200">฿{formatMoney(c.totalAmount)}</td>
                      <td className="py-3 px-4">
                        <span className={cn('text-xs font-semibold', c.nextCallAt && new Date(c.nextCallAt) <= new Date() ? 'text-red-500' : 'text-slate-500 dark:text-slate-400')}>
                          {c.nextCallAt ? formatDate(c.nextCallAt) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.status && <Badge label={CUSTOMER_STATUS_LABEL[c.status]} className={CUSTOMER_STATUS_COLOR[c.status]} />}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setForm({ open: true, customer: c })} className="text-slate-400 hover:text-emerald-600 mr-2" title="แก้ไข">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {!isTele && (
                          <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-500" title="ลบ">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {form.open && <CustomerForm initial={form.customer} onSave={handleSave} onClose={() => setForm({ open: false })} users={state.users} />}
      {assignFor && (
        <AssignOwnerModal customer={assignFor} users={state.users} onClose={() => setAssignFor(null)}
          onAssign={(ownerId) => { assignOwner(assignFor.id, ownerId); setAssignFor(null) }} />
      )}

      {/* Side panel detail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={() => setDetail(null)} />
          <div className="relative ml-auto w-full max-w-lg bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl">
            <CustomerDetailPanel
              customer={detail}
              callLogs={callLogs(detail.id)}
              orders={customerOrders(detail.id)}
              canViewEditHistory={!!canViewEditHistory}
              onClose={() => setDetail(null)}
              onEdit={() => { setForm({ open: true, customer: detail }); setDetail(null) }}
              onAssign={() => { setAssignFor(detail); setDetail(null) }}
              isTele={isTele}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CustomerDetailPanel({ customer, callLogs, orders, canViewEditHistory, onClose, onEdit, onAssign, isTele }: {
  customer: Customer
  callLogs: ReturnType<typeof Array.prototype.filter>
  orders: ReturnType<typeof Array.prototype.filter>
  canViewEditHistory: boolean
  onClose: () => void
  onEdit: () => void
  onAssign: () => void
  isTele: boolean
}) {
  const [tab, setTab] = useState<'info' | 'calls' | 'orders' | 'edits'>('info')

  return (
    <>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {customer.name.charAt(2) || customer.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
              {customer.name} <Badge label={`${GRADE_EMOJI[customer.grade]} ${GRADE_LABEL[customer.grade]}`} className={GRADE_COLOR[customer.grade]} />
            </p>
            <p className="text-xs text-slate-500">📞 {customer.phone}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">✕</button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex gap-3">
        {[
          { k: 'info' as const, label: 'ข้อมูลลูกค้า' },
          { k: 'calls' as const, label: `ประวัติการโทร (${callLogs.length})` },
          { k: 'orders' as const, label: `ประวัติการสั่งซื้อ (${orders.length})` },
          ...(canViewEditHistory ? [{ k: 'edits' as const, label: `ประวัติการแก้ไข (${customer.editHistory?.length ?? 0})` }] : []),
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={cn('text-xs font-semibold pb-2 px-1 border-b-2 transition-colors',
              tab === t.k ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {tab === 'info' && (
          <>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">ข้อมูลหลัก</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="py-1 text-slate-500 w-24">ชื่อเล่น</td><td className="py-1 font-semibold">{customer.name}</td></tr>
                  <tr><td className="py-1 text-slate-500">เบอร์โทร</td><td className="py-1 font-semibold">{customer.phone}</td></tr>
                  {customer.line && <tr><td className="py-1 text-slate-500">Line</td><td className="py-1 font-semibold">{customer.line}</td></tr>}
                  <tr><td className="py-1 text-slate-500 align-top">ที่อยู่</td><td className="py-1">{customer.address || '—'}</td></tr>
                </tbody>
              </table>
              {customer.tags && customer.tags.length > 0 && (
                <div className="mt-3 flex gap-1 flex-wrap">
                  {customer.tags.map(t => (
                    <Badge key={t} label={t} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" />
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">สถิติลูกค้า</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-500">ออเดอร์ทั้งหมด</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{customer.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ยอดรวมทั้งหมด</p>
                  <p className="text-2xl font-black text-emerald-600">฿{formatMoney(customer.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">อัตราการรับ</p>
                  <p className="text-2xl font-black text-blue-600">{customer.successRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ยกเลิกออเดอร์</p>
                  <p className="text-xl font-black text-slate-700 dark:text-slate-200">{customer.cancelCount ?? 0} ครั้ง</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">เป็นลูกค้ามา</p>
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                    {Math.max(1, Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (30 * 86400000)))} เดือน
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">นัดหมายครั้งต่อไป</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                📅 {customer.nextCallAt ? formatDateTime(customer.nextCallAt) : 'ยังไม่มีนัด'}
              </p>
              {customer.nextCallNote && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg italic">
                  &quot;{customer.nextCallNote}&quot;
                </p>
              )}
            </Card>

            {customer.notes && (
              <Card className="p-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">โน้ต</p>
                <p className="text-sm italic text-slate-600 dark:text-slate-300">&quot;{customer.notes}&quot;</p>
              </Card>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={onEdit}>แก้ไขข้อมูล</Button>
              {!isTele && <Button size="sm" variant="secondary" onClick={onAssign}>กำหนดเจ้าของดูแล</Button>}
            </div>
          </>
        )}

        {tab === 'calls' && (
          <div className="space-y-2">
            {callLogs.length === 0 ? <EmptyState message="ยังไม่มีประวัติการโทร" /> : callLogs.map((cl: { id: string; result: string; notes?: string; createdAt: string; telesaleName: string }) => (
              <Card key={cl.id} className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge label={cl.result} className={cn(
                    cl.result === 'closed' ? 'bg-green-100 text-green-700' :
                    cl.result === 'follow_up' ? 'bg-yellow-100 text-yellow-700' :
                    cl.result === 'no_answer' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                  )} />
                  <span className="text-xs text-slate-400">{formatDateTime(cl.createdAt)}</span>
                </div>
                {cl.notes && <p className="text-sm text-slate-600 dark:text-slate-300">{cl.notes}</p>}
                <p className="text-xs text-slate-400 mt-1">โดย {cl.telesaleName}</p>
              </Card>
            ))}
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-2">
            {orders.length === 0 ? <EmptyState message="ยังไม่มีประวัติการสั่งซื้อ" /> : orders.map((o) => {
              const order = o as { id: string; totalAmount: number; discount: number; status: string; createdAt: string; items?: { productName: string; quantity: number; subtotal: number }[] }
              return (
                <Card key={order.id} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-mono text-slate-500">{order.id}</p>
                    <Badge label={order.status} className="text-xs" />
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="text-xs space-y-0.5 my-2">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-slate-700 dark:text-slate-200">• {it.productName} <span className="text-slate-400">x{it.quantity}</span></span>
                          <span className="text-slate-500">฿{formatMoney(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                    <p className="text-sm font-bold text-emerald-600">฿{formatMoney(order.totalAmount - order.discount)}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {tab === 'edits' && canViewEditHistory && (
          <div className="space-y-2">
            {(!customer.editHistory || customer.editHistory.length === 0) ? <EmptyState message="ยังไม่มีประวัติการแก้ไข" /> : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                  <tr>
                    <th className="text-left py-2 px-3">วันที่</th>
                    <th className="text-left py-2 px-3">ผู้แก้ไข</th>
                    <th className="text-left py-2 px-3">รายการ</th>
                    <th className="text-left py-2 px-3">จาก</th>
                    <th className="text-left py-2 px-3">เป็น</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.editHistory.map(eh => (
                    <tr key={eh.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-3 text-slate-500">{formatDate(eh.at)}</td>
                      <td className="py-2 px-3">{eh.userName}</td>
                      <td className="py-2 px-3 font-semibold">{eh.field}</td>
                      <td className="py-2 px-3 text-red-500 line-through">{eh.from}</td>
                      <td className="py-2 px-3 text-emerald-600 font-semibold">{eh.to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-xs text-slate-400 italic">เฉพาะ Admin และเจ้าของระบบเท่านั้นที่สามารถดูประวัติการแก้ไขได้</p>
          </div>
        )}
      </div>
    </>
  )
}
