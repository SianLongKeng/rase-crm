'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, PageHeader } from '@/components/ui'
import { formatMoney } from '@/lib/utils'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/types'
import { cn } from '@/lib/utils'
import { DateRangePicker, defaultRange, rangeToMillis } from '@/components/DateRangePicker'

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x }

function fmtPct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? '+100%' : '0%'
  const diff = ((curr - prev) / prev) * 100
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(2)}%`
}

export default function DashboardPage() {
  const { state } = useApp()
  const [range, setRange] = useState(defaultRange())

  const { startMs: rangeStart, endMs: rangeEnd } = rangeToMillis(range)
  const rangeDays = Math.max(1, Math.round((rangeEnd - rangeStart) / 86400000))
  // Previous period of same length for comparison
  const prevEnd = rangeStart - 1
  const prevStart = prevEnd - rangeDays * 86400000

  const today = rangeStart
  const todayEnd = rangeEnd

  const ordersToday = state.orders.filter(o => {
    const t = new Date(o.createdAt).getTime()
    return t >= today && t <= todayEnd
  })
  const ordersYest = state.orders.filter(o => {
    const t = new Date(o.createdAt).getTime()
    return t >= prevStart && t <= prevEnd
  })

  const callsToday = state.callLogs.filter(c => {
    const t = new Date(c.createdAt).getTime()
    return t >= today && t <= todayEnd
  })
  const callsYest = state.callLogs.filter(c => {
    const t = new Date(c.createdAt).getTime()
    return t >= prevStart && t <= prevEnd
  })

  // Today KPIs
  const closedToday = callsToday.filter(c => c.result === 'closed').length
  const closedYest = callsYest.filter(c => c.result === 'closed').length
  const answeredToday = callsToday.filter(c => c.result !== 'no_answer').length
  const answeredYest = callsYest.filter(c => c.result !== 'no_answer').length
  const interestedToday = callsToday.filter(c => c.result === 'closed' || c.result === 'follow_up').length

  // Money — uses delivered orders within range
  const deliveredInRange = state.orders.filter(o => {
    if (o.status !== 'delivered') return false
    const t = new Date(o.deliveredAt ?? o.updatedAt).getTime()
    return t >= rangeStart && t <= rangeEnd
  })
  const salesToday = ordersToday.reduce((s, o) => s + (o.totalAmount - o.discount), 0)
  const salesYest = ordersYest.reduce((s, o) => s + (o.totalAmount - o.discount), 0)
  const costToday = ordersToday.reduce((s, o) => s + o.totalCost + (o.shippingFee ?? 0) + (o.codFee ?? 0), 0)
  const grossProfitToday = salesToday - costToday
  const netProfitToday = grossProfitToday  // simplified — would subtract commission for net

  const totalCallsToday = callsToday.length
  const totalCallsYest = callsYest.length
  const closeRateToday = totalCallsToday > 0 ? (closedToday / totalCallsToday) * 100 : 0
  const closeRateYest = totalCallsYest > 0 ? (closedYest / totalCallsYest) * 100 : 0

  // Per-product top 5
  type Agg = { name: string; revenue: number }
  const productMap = new Map<string, Agg>()
  for (const o of deliveredInRange) {
    for (const i of o.items) {
      const prev = productMap.get(i.productName) ?? { name: i.productName, revenue: 0 }
      prev.revenue += i.subtotal
      productMap.set(i.productName, prev)
    }
  }
  const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  const otherRevenue = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(5).reduce((s, p) => s + p.revenue, 0)
  const totalTopRevenue = topProducts.reduce((s, p) => s + p.revenue, 0) + otherRevenue || 1

  // Per-employee today
  const telesales = state.users.filter(u => u.role === 'telesale')
  const employeePerf = telesales.map(t => {
    const myCalls = callsToday.filter(c => c.telesaleId === t.id)
    const myOrders = ordersToday.filter(o => o.telesaleId === t.id)
    const closed = myCalls.filter(c => c.result === 'closed').length
    const sales = myOrders.reduce((s, o) => s + (o.totalAmount - o.discount), 0)
    const profit = myOrders.reduce((s, o) => s + (o.totalAmount - o.discount - o.totalCost), 0)
    return { user: t, totalCalls: myCalls.length, closed, sales, profit }
  }).sort((a, b) => b.profit - a.profit)

  // 4 customer/order status counts for new card row
  const followUpCount = state.callLogs.filter(c => {
    if (c.result !== 'follow_up') return false
    if (!c.followUpAt) return false
    const t = new Date(c.followUpAt).getTime()
    return t >= rangeStart && t <= rangeEnd
  }).length
  const dueCustomers = state.customers.filter(c => {
    if (!c.nextCallAt) return false
    const t = new Date(c.nextCallAt).getTime()
    return t >= rangeStart && t <= rangeEnd
  }).length
  const deliveredCount = state.orders.filter(o => {
    if (o.status !== 'delivered') return false
    const t = new Date(o.deliveredAt ?? o.updatedAt).getTime()
    return t >= rangeStart && t <= rangeEnd
  }).length
  const returnedCount = state.orders.filter(o => {
    if (o.status !== 'returned') return false
    const t = new Date(o.returnedAt ?? o.updatedAt).getTime()
    return t >= rangeStart && t <= rangeEnd
  }).length

  // 7-day trend
  const trend7 = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(new Date(today - (6 - i) * 86400000))
    const dayEnd = endOfDay(day)
    const ordersDay = state.orders.filter(o => {
      const t = new Date(o.createdAt).getTime()
      return t >= day.getTime() && t <= dayEnd.getTime()
    })
    const sales = ordersDay.reduce((s, o) => s + (o.totalAmount - o.discount), 0)
    const profit = ordersDay.reduce((s, o) => s + (o.totalAmount - o.discount - o.totalCost), 0)
    const label = `${day.getDate()} ${day.toLocaleDateString('th-TH', { month: 'short' })}`
    return { label, sales, profit }
  })
  const trendMax = Math.max(...trend7.map(t => t.sales), 1)

  return (
    <div>
      <PageHeader
        title="ภาพรวมระบบ (Dashboard)"
        subtitle={new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="p-5 space-y-5">
        {/* Top 6 KPI Cards — reordered per PDF spec */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiBox label="ยอดขายวันนี้" value={`฿${formatMoney(salesToday)}`} sub={`เมื่อวาน ฿${formatMoney(salesYest)}`} change={fmtPct(salesToday, salesYest)} positive={salesToday >= salesYest} gradient="from-blue-500 to-blue-600" icon="🛍️" />
          <KpiBox label="โทรทั้งหมด" value={totalCallsToday} sub={`เมื่อวาน ${totalCallsYest}`} change={fmtPct(totalCallsToday, totalCallsYest)} positive gradient="from-orange-500 to-orange-600" icon="📞" />
          <KpiBox label="รับสาย (คุยได้)" value={answeredToday} sub={`เมื่อวาน ${answeredYest}`} change={fmtPct(answeredToday, answeredYest)} positive gradient="from-teal-500 to-teal-600" icon="🎧" />
          <KpiBox label="จำนวนออเดอร์" value={ordersToday.length} sub={`เมื่อวาน ${ordersYest.length}`} change={fmtPct(ordersToday.length, ordersYest.length)} positive gradient="from-violet-500 to-violet-600" icon="📋" />
          <KpiBox label="อัตราปิดการขาย" value={`${closeRateToday.toFixed(2)}%`} sub={`เมื่อวาน ${closeRateYest.toFixed(2)}%`} change={`+${(closeRateToday - closeRateYest).toFixed(2)}%`} positive gradient="from-rose-500 to-rose-600" icon="🎯" />
          <KpiBox label="กำไร" value={`฿${formatMoney(grossProfitToday)}`} sub={`เมื่อวาน ฿${formatMoney(salesYest - ordersYest.reduce((s, o) => s + o.totalCost + (o.shippingFee ?? 0) + (o.codFee ?? 0), 0))}`} change={fmtPct(grossProfitToday, salesYest - ordersYest.reduce((s, o) => s + o.totalCost + (o.shippingFee ?? 0) + (o.codFee ?? 0), 0))} positive={grossProfitToday >= 0} gradient="from-emerald-500 to-emerald-600" icon="📈" />
        </div>

        {/* Row 2: การเงินวันนี้ + 4 status cards (5 cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* การเงินวันนี้ */}
          <Card className="p-4">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">การเงินวันนี้</p>
            <div className="space-y-2">
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2">
                <p className="text-[10px] text-rose-600 dark:text-rose-400">ต้นทุนรวม</p>
                <p className="text-base font-black text-rose-700 dark:text-rose-300">฿{formatMoney(costToday)}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">กำไรขั้นต้น</p>
                <p className="text-base font-black text-emerald-700 dark:text-emerald-300">฿{formatMoney(grossProfitToday)}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">กำไรสุทธิ</p>
                <p className="text-base font-black text-emerald-700 dark:text-emerald-300">฿{formatMoney(netProfitToday)}</p>
              </div>
            </div>
          </Card>

          <StatusCard label="ลูกค้ารอ Follow Up" value={followUpCount} icon="🔁" color="yellow" hint="นัดติดตามในช่วงที่เลือก" />
          <StatusCard label="ลูกค้าถึงกำหนดโทร" value={dueCustomers} icon="📞" color="blue" hint="คิวโทรที่ถึงกำหนด" />
          <StatusCard label="ส่งสำเร็จ" value={deliveredCount} icon="✅" color="emerald" hint="ออเดอร์ที่ลูกค้ารับสินค้าแล้ว" />
          <StatusCard label="ตีกลับ" value={returnedCount} icon="↩️" color="red" hint="พัสดุที่ลูกค้าไม่รับ" />
        </div>

        {/* Trend + Top 5 + Employee */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 7-day trend — Area Chart */}
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">แนวโน้มยอดขาย &amp; กำไร ({range.label})</p>
            <div className="flex gap-3 mb-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> ยอดขาย</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> กำไรสุทธิ</span>
            </div>
            <AreaChart points={trend7} max={trendMax} />
          </Card>

          {/* Top 5 products donut */}
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">ยอดขายตามสินค้า (Top 5)</p>
            <div className="flex items-center gap-4">
              <DonutChart
                slices={topProducts.map((p, i) => ({
                  label: p.name, value: p.revenue,
                  color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][i],
                })).concat(otherRevenue > 0 ? [{ label: 'อื่นๆ', value: otherRevenue, color: '#94a3b8' }] : [])}
                total={totalTopRevenue}
              />
              <div className="flex-1 space-y-2 text-xs">
                {topProducts.slice(0, 5).map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][i] }} />
                      <span className="truncate text-slate-600 dark:text-slate-300">{p.name}</span>
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 ml-2 shrink-0">
                      {formatMoney(p.revenue)} ({Math.round((p.revenue / totalTopRevenue) * 100)}%)
                    </span>
                  </div>
                ))}
                {otherRevenue > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>อื่นๆ</span>
                    </span>
                    <span>{formatMoney(otherRevenue)} ({Math.round((otherRevenue / totalTopRevenue) * 100)}%)</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Employee leaderboard */}
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">ผลงานพนักงานวันนี้</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500">
                    <th className="text-left py-2">อันดับ</th>
                    <th className="text-left py-2">พนักงาน</th>
                    <th className="text-right py-2">โทร</th>
                    <th className="text-right py-2">ปิดได้</th>
                    <th className="text-right py-2">ยอด</th>
                    <th className="text-right py-2">กำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {employeePerf.map((e, i) => (
                    <tr key={e.user.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 text-slate-500">{i + 1}</td>
                      <td className="py-2 truncate max-w-[80px] text-slate-700 dark:text-slate-200">{e.user.name}</td>
                      <td className="py-2 text-right text-blue-600">{e.totalCalls}</td>
                      <td className="py-2 text-right text-emerald-600 font-semibold">{e.closed}</td>
                      <td className="py-2 text-right text-slate-600 dark:text-slate-300">{formatMoney(e.sales)}</td>
                      <td className="py-2 text-right text-emerald-600 font-semibold">{formatMoney(e.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent orders */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">ออเดอร์ล่าสุด</p>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {state.orders.slice(0, 6).map(o => (
              <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                <p className="text-xs font-mono text-slate-400 w-32 shrink-0">{o.id}</p>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{o.customerName}</p>
                  <p className="text-xs text-slate-400">฿{formatMoney(o.totalAmount - o.discount)} · {o.telesaleName}</p>
                </div>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold shrink-0', ORDER_STATUS_COLOR[o.status])}>
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function AreaChart({ points, max }: { points: { label: string; sales: number; profit: number }[]; max: number }) {
  const W = 500
  const H = 200
  const padL = 30
  const padR = 8
  const padT = 8
  const padB = 22
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const n = points.length
  function xCoord(i: number) { return padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW) }
  function yCoord(v: number) { return padT + innerH - (v / max) * innerH }

  function areaPath(key: 'sales' | 'profit') {
    if (n === 0) return ''
    let d = `M ${xCoord(0)} ${yCoord(points[0][key])}`
    for (let i = 1; i < n; i++) {
      d += ` L ${xCoord(i)} ${yCoord(points[i][key])}`
    }
    d += ` L ${xCoord(n - 1)} ${padT + innerH} L ${xCoord(0)} ${padT + innerH} Z`
    return d
  }
  function linePath(key: 'sales' | 'profit') {
    if (n === 0) return ''
    let d = `M ${xCoord(0)} ${yCoord(points[0][key])}`
    for (let i = 1; i < n; i++) {
      d += ` L ${xCoord(i)} ${yCoord(points[i][key])}`
    }
    return d
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56">
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padT + innerH * (1 - p)
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2,3" />
              <text x={padL - 4} y={y + 3} fontSize="9" fill="currentColor" fillOpacity="0.4" textAnchor="end">
                {Math.round(max * p).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Areas */}
        <path d={areaPath('sales')} fill="url(#salesGrad)" />
        <path d={areaPath('profit')} fill="url(#profitGrad)" />
        {/* Lines */}
        <path d={linePath('sales')} fill="none" stroke="#3b82f6" strokeWidth="2" />
        <path d={linePath('profit')} fill="none" stroke="#10b981" strokeWidth="2" />
        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xCoord(i)} cy={yCoord(p.sales)} r="3" fill="#3b82f6" />
            <circle cx={xCoord(i)} cy={yCoord(p.profit)} r="3" fill="#10b981" />
          </g>
        ))}
        {/* X-axis labels */}
        {points.map((p, i) => (
          <text key={i} x={xCoord(i)} y={H - 6} fontSize="9" fill="currentColor" fillOpacity="0.55" textAnchor="middle">{p.label}</text>
        ))}
      </svg>
    </div>
  )
}

function StatusCard({ label, value, icon, color, hint }: { label: string; value: number; icon: string; color: 'yellow' | 'blue' | 'emerald' | 'red'; hint: string }) {
  const colorClasses = {
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  }[color]
  return (
    <div className={cn('rounded-2xl p-5 border-2', colorClasses)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-bold">{label}</p>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-4xl font-black mb-1">{value}</p>
      <p className="text-xs opacity-70">{hint}</p>
    </div>
  )
}

function KpiBox({ label, value, sub, change, positive, gradient, icon }: {
  label: string; value: string | number; sub: string; change: string; positive: boolean; gradient: string; icon: string
}) {
  return (
    <div className={cn('rounded-2xl p-4 text-white relative overflow-hidden bg-gradient-to-br', gradient)}>
      <div className="absolute -right-2 -top-2 text-4xl opacity-20 select-none">{icon}</div>
      <p className="text-xs font-semibold opacity-90 mb-1">{label}</p>
      <p className="text-2xl font-black mb-1">{value}</p>
      <div className="flex items-center justify-between text-xs opacity-90 mt-2">
        <span>{sub}</span>
        <span className={cn('font-bold', positive ? 'text-emerald-100' : 'text-rose-100')}>{change} {positive ? '↑' : '↓'}</span>
      </div>
    </div>
  )
}

function DonutChart({ slices, total }: { slices: { label: string; value: number; color: string }[]; total: number }) {
  let acc = 0
  const R = 40
  const C = 2 * Math.PI * R
  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx={50} cy={50} r={R} fill="none" stroke="#e5e7eb" strokeWidth={14} className="dark:stroke-slate-700" />
        {slices.map((s, i) => {
          const portion = s.value / total
          const dash = C * portion
          const offset = C * (1 - acc)
          acc += portion
          return (
            <circle key={i} cx={50} cy={50} r={R} fill="none" stroke={s.color} strokeWidth={14}
              strokeDasharray={`${dash} ${C}`} strokeDashoffset={-(C - offset)} />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] text-slate-500">รวม</p>
        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{formatMoney(total)}</p>
        <p className="text-[10px] text-slate-500">บาท</p>
      </div>
    </div>
  )
}
