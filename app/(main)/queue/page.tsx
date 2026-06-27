'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'
import {
  Customer, CustomerGrade,
  GRADE_LABEL, GRADE_COLOR, GRADE_EMOJI,
  CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_COLOR,
} from '@/types'
import { cn, formatDate, formatDateTime, formatMoney } from '@/lib/utils'
import { CallModal } from '@/components/CallModal'

const GRADE_OPTS: CustomerGrade[] = ['A', 'B', 'C', 'D']

export default function QueuePage() {
  const { state, completeCall } = useApp()
  const user = state.currentUser
  const isTele = user?.role === 'telesale'

  const [selected, setSelected] = useState<Customer | null>(null)
  const [callFor, setCallFor] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')
  const [gradeTab, setGradeTab] = useState<CustomerGrade | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const gradeOrder: Record<CustomerGrade, number> = { A: 0, B: 1, C: 2, D: 3 }
  const excludeFromQueue = state.gradeSettings.excludeFromQueue

  let queue = state.customers.filter(c => c.nextCallAt && new Date(c.nextCallAt) <= new Date())
  // Filter out grades that admin marked as "ไม่นำเข้าคิวโทรอัตโนมัติ"
  queue = queue.filter(c => !excludeFromQueue[c.grade])
  if (isTele) queue = queue.filter(c => c.ownerId === user?.id)
  queue = queue
    .filter(c => !search || c.name.includes(search) || c.phone.includes(search))
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade])

  const gradeCounts: Record<CustomerGrade | 'all', number> = {
    all: queue.length,
    A: queue.filter(c => c.grade === 'A').length,
    B: queue.filter(c => c.grade === 'B').length,
    C: queue.filter(c => c.grade === 'C').length,
    D: queue.filter(c => c.grade === 'D').length,
  }

  const visible = gradeTab === 'all' ? queue : queue.filter(c => c.grade === gradeTab)

  // Most recent order per customer (for "ข้อมูลล่าสุด" column)
  function latestOrder(customerId: string) {
    return state.orders
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }
  function latestCall(customerId: string) {
    return state.callLogs
      .filter(c => c.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }
  function customerOrders(customerId: string) {
    return state.orders.filter(o => o.customerId === customerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return (
    <div>
      <PageHeader
        title="คิวโทรวันนี้ 📞"
        subtitle={`${queue.length} รายการ · อัปเดตล่าสุด ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`}
        action={
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นชื่อลูกค้า, เบอร์โทร..."
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="all">ทุกสถานะ</option>
              {Object.entries(CUSTOMER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Grade tabs */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setGradeTab('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
              gradeTab === 'all' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700')}>
            ทั้งหมด ({gradeCounts.all})
          </button>
          {GRADE_OPTS.map(g => (
            <button key={g} onClick={() => setGradeTab(g)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                gradeTab === g ? GRADE_COLOR[g] : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700')}>
              {GRADE_EMOJI[g]} Grade {g} ({gradeCounts[g]})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-4">
          {visible.length === 0 ? <EmptyState message="ไม่มีคิวโทรวันนี้ เยี่ยมมาก!" emoji="🎉" /> : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left py-3 px-3 font-medium w-12">ลำดับ</th>
                      <th className="text-left py-3 px-3 font-medium">ลูกค้า</th>
                      <th className="text-left py-3 px-3 font-medium">ข้อมูลล่าสุด</th>
                      <th className="text-center py-3 px-3 font-medium">สถานะ</th>
                      <th className="text-left py-3 px-3 font-medium">นัดโทรครั้งต่อไป</th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((c, i) => {
                      const lo = latestOrder(c.id)
                      const isSelected = selected?.id === c.id
                      return (
                        <tr key={c.id} className={cn('border-b border-slate-50 dark:border-slate-800 cursor-pointer transition-colors',
                          isSelected ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50')}
                          onClick={() => setSelected(c)}>
                          <td className="py-3 px-3 text-slate-500 font-semibold">{i + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                c.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                c.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                c.grade === 'C' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700')}>
                                {c.name.charAt(2) || c.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  {c.name}
                                  <Badge label={c.grade} className={cn('text-[10px]', GRADE_COLOR[c.grade])} />
                                </p>
                                <p className="text-xs text-slate-400">{c.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {lo ? (
                              <>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <Badge label="ซื้อล่าสุด" className="bg-emerald-100 text-emerald-700 text-[10px]" />
                                  <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{lo.items[0]?.productName}</span>
                                </div>
                                <p className="text-[11px] text-slate-400">{formatDate(lo.createdAt)} · ฿{formatMoney(lo.totalAmount - lo.discount)}</p>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic">ยังไม่มีออเดอร์</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {c.status && <Badge label={CUSTOMER_STATUS_LABEL[c.status]} className={CUSTOMER_STATUS_COLOR[c.status]} />}
                          </td>
                          <td className="py-3 px-3">
                            <p className={cn('text-sm font-semibold', new Date(c.nextCallAt!) <= new Date() ? 'text-red-500' : 'text-slate-700 dark:text-slate-200')}>
                              {formatDate(c.nextCallAt!)}
                            </p>
                            <p className="text-[10px] text-slate-400">{new Date(c.nextCallAt!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setCallFor(c)} className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white inline-flex items-center justify-center mr-1" title="โทร">
                              📞
                            </button>
                            <button onClick={() => setSelected(c)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center" title="โน้ต">
                              📝
                            </button>
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
          {selected && (
            <Card className="p-5 self-start sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold">
                    {selected.name.charAt(2) || selected.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{selected.name}</p>
                    <Badge label={`${GRADE_EMOJI[selected.grade]} ${GRADE_LABEL[selected.grade]}`} className={cn('text-[10px]', GRADE_COLOR[selected.grade])} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setCallFor(selected)} className="px-2 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold">📝 บันทึกโน้ต</button>
                  <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">✕</button>
                </div>
              </div>

              <Card className="p-3 bg-slate-50 dark:bg-slate-800 mb-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">ข้อมูลลูกค้า</p>
                <table className="w-full text-xs">
                  <tbody>
                    <tr><td className="py-0.5 text-slate-500 w-28">เจ้าของลูกค้า</td><td className="py-0.5 font-semibold">{selected.ownerName ?? '—'}</td></tr>
                    <tr><td className="py-0.5 text-slate-500">จังหวัด</td><td className="py-0.5">{selected.address ?? '—'}</td></tr>
                    <tr><td className="py-0.5 text-slate-500">ออเดอร์ทั้งหมด</td><td className="py-0.5 font-semibold">{selected.totalOrders} ครั้ง</td></tr>
                    <tr><td className="py-0.5 text-slate-500">ยอดรวม</td><td className="py-0.5 font-semibold text-emerald-600">฿{formatMoney(selected.totalAmount)}</td></tr>
                    <tr><td className="py-0.5 text-slate-500">ลูกค้าสมัครเมื่อ</td><td className="py-0.5">{formatDate(selected.createdAt)}</td></tr>
                  </tbody>
                </table>
              </Card>

              <Card className="p-3 bg-slate-50 dark:bg-slate-800 mb-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">โน้ตล่าสุด</p>
                {(() => {
                  const lc = latestCall(selected.id)
                  if (!lc) return <p className="text-xs text-slate-400 italic">ยังไม่มีโน้ต</p>
                  return (
                    <>
                      <p className="text-[10px] text-slate-400">{formatDateTime(lc.createdAt)} · {lc.telesaleName}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">{lc.notes || '—'}</p>
                    </>
                  )
                })()}
              </Card>

              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">ประวัติการซื้อ (ล่าสุด)</p>
                <button className="text-xs text-emerald-600 font-semibold">ดูทั้งหมด</button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {customerOrders(selected.id).slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-slate-600 dark:text-slate-300 truncate">{formatDate(o.createdAt)} · {o.items[0]?.productName}</p>
                    </div>
                    <p className="text-emerald-600 font-bold shrink-0 ml-2">฿{formatMoney(o.totalAmount - o.discount)}</p>
                  </div>
                ))}
                {customerOrders(selected.id).length === 0 && <p className="text-xs text-slate-400 italic">ยังไม่มีออเดอร์</p>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {callFor && (
        <CallModal
          customer={callFor}
          products={state.products}
          onClose={() => setCallFor(null)}
          onSubmit={(opts) => {
            completeCall({ customerId: callFor.id, ...opts })
            setCallFor(null)
          }}
        />
      )}
    </div>
  )
}
