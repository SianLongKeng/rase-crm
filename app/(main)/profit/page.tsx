'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, EmptyState, PageHeader } from '@/components/ui'
import { formatMoney, cn } from '@/lib/utils'
import { DateRangePicker, defaultRange, presets, rangeToMillis } from '@/components/DateRangePicker'

export default function ProfitPage() {
  const { state } = useApp()
  const [range, setRange] = useState(() => presets().last30)

  function aggregate(rangeStart: number, rangeEnd: number) {
    const delivered = state.orders.filter(o => {
      if (o.status !== 'delivered') return false
      const t = new Date(o.deliveredAt ?? o.updatedAt).getTime()
      return t >= rangeStart && t <= rangeEnd
    })
    const revenue = delivered.reduce((s, o) => s + (o.totalAmount - o.discount), 0)
    const cost = delivered.reduce((s, o) => s + o.totalCost, 0)
    // Use real values if useRealForProfit is set; otherwise use standard
    const shipping = delivered.reduce((s, o) => {
      const v = o.useRealForProfit && o.realShippingFee != null ? o.realShippingFee : (o.shippingFee ?? 0)
      return s + v
    }, 0)
    const commission = delivered.reduce((s, o) => s + (o.commissionAmount ?? 0), 0)
    const codFee = delivered.reduce((s, o) => {
      // Prefer real cod baht, then standard cod baht, then heuristic on codFee
      const v = o.useRealForProfit && o.realCodBaht != null
        ? o.realCodBaht
        : (o.standardCodBaht ?? (() => {
            const c = o.codFee ?? 0
            if (c > 0 && c < 50) return ((o.totalAmount - o.discount) * c) / 100
            return c
          })())
      return s + v
    }, 0)
    const grossProfit = revenue - cost
    const otherExpenses = codFee
    const netProfit = grossProfit - shipping - commission - otherExpenses
    return { delivered, revenue, cost, shipping, commission, otherExpenses, grossProfit, netProfit }
  }

  const { startMs, endMs } = rangeToMillis(range)
  const curr = aggregate(startMs, endMs)
  const rangeDays = Math.max(1, Math.round((endMs - startMs) / 86400000))
  const prevEnd = startMs - 1
  const prevStart = prevEnd - rangeDays * 86400000
  const prev = aggregate(prevStart, prevEnd)

  const { delivered, revenue, cost, shipping, commission, otherExpenses, grossProfit, netProfit } = curr

  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0
  const breakEven = grossMargin > 0 ? (shipping + commission + otherExpenses) / (grossMargin / 100) : 0
  const avgShipping = delivered.length > 0 ? shipping / delivered.length : 0
  const avgProfit = delivered.length > 0 ? netProfit / delivered.length : 0

  function fmtDelta(curr: number, prev: number): { text: string; positive: boolean } {
    if (prev === 0) return { text: curr > 0 ? '+100%' : '0%', positive: curr >= 0 }
    const diff = ((curr - prev) / prev) * 100
    return { text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, positive: diff >= 0 }
  }

  // Per-product
  type Agg = { name: string; qty: number; revenue: number; cost: number; shipping: number; commission: number; other: number; gross: number; net: number; grossMargin: number; netMargin: number; roasBe: number }
  const productMap = new Map<string, Agg>()
  for (const o of delivered) {
    const orderItemCount = o.items.reduce((s, i) => s + i.quantity, 0) || 1
    for (const i of o.items) {
      const share = i.quantity / orderItemCount
      const prev = productMap.get(i.productName) ?? { name: i.productName, qty: 0, revenue: 0, cost: 0, shipping: 0, commission: 0, other: 0, gross: 0, net: 0, grossMargin: 0, netMargin: 0, roasBe: 0 }
      prev.qty += i.quantity
      prev.revenue += i.subtotal
      prev.cost += i.cost * i.quantity
      prev.shipping += (o.shippingFee ?? 0) * share
      prev.commission += (o.commissionAmount ?? 0) * share
      prev.other += (o.codFee ?? 0) * share
      productMap.set(i.productName, prev)
    }
  }
  const productRows = [...productMap.values()].map(p => {
    p.gross = p.revenue - p.cost
    p.net = p.gross - p.shipping - p.commission - p.other
    p.grossMargin = p.revenue > 0 ? (p.gross / p.revenue) * 100 : 0
    p.netMargin = p.revenue > 0 ? (p.net / p.revenue) * 100 : 0
    p.roasBe = p.revenue > 0 ? p.revenue / p.qty / Math.max(1, p.net / p.qty) : 0
    return p
  }).sort((a, b) => b.net - a.net)

  const totalRow = productRows.reduce((acc, p) => ({
    name: 'รวมทั้งหมด', qty: acc.qty + p.qty, revenue: acc.revenue + p.revenue, cost: acc.cost + p.cost,
    shipping: acc.shipping + p.shipping, commission: acc.commission + p.commission, other: acc.other + p.other,
    gross: acc.gross + p.gross, net: acc.net + p.net, grossMargin: 0, netMargin: 0, roasBe: 0,
  }), { name: 'รวมทั้งหมด', qty: 0, revenue: 0, cost: 0, shipping: 0, commission: 0, other: 0, gross: 0, net: 0, grossMargin: 0, netMargin: 0, roasBe: 0 } as Agg)
  totalRow.grossMargin = totalRow.revenue > 0 ? (totalRow.gross / totalRow.revenue) * 100 : 0
  totalRow.netMargin = totalRow.revenue > 0 ? (totalRow.net / totalRow.revenue) * 100 : 0
  totalRow.roasBe = totalRow.net > 0 ? totalRow.revenue / totalRow.net : 0

  return (
    <div>
      <PageHeader
        title="กำไร (Profit System)"
        subtitle="กำไรขั้นต้น = ยอดขาย − ต้นทุน · กำไรจริง = กำไรขั้นต้น − ค่าส่ง − ค่าคอม − ค่าใช้จ่ายอื่นๆ"
        action={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="p-6 space-y-5">
        {/* 4 KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="ยอดขาย (Revenue)" value={`฿${formatMoney(revenue)}`} sub={`${delivered.length} ออเดอร์ · 100%`} color="emerald" icon="$" />
          <KpiCard label="ต้นทุนสินค้า (COGS)" value={`฿${formatMoney(cost)}`} sub={`${revenue > 0 ? Math.round((cost / revenue) * 100) : 0}% ของยอดขาย`} color="slate" icon="📦" />
          <KpiCard label="กำไรขั้นต้น (Gross Profit)" value={`฿${formatMoney(grossProfit)}`} sub={`${grossMargin.toFixed(0)}% Margin`} color="cyan" icon="📊" />
          <KpiCard label="กำไรจริง (Net Profit)" value={`฿${formatMoney(netProfit)}`} sub={`${netMargin.toFixed(0)}% Net Margin`} color="fuchsia" icon="📈" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profit structure waterfall */}
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">โครงสร้างกำไร</p>
            <div className="space-y-3">
              {[
                { dot: 'emerald', label: 'ยอดขาย (Revenue)', val: revenue, pct: 100 },
                { dot: 'slate', label: '− ต้นทุนสินค้า (COGS)', val: -cost, pct: revenue > 0 ? (cost / revenue) * 100 : 0 },
                { dot: 'cyan', label: '= กำไรขั้นต้น (Gross Profit)', val: grossProfit, pct: grossMargin, bold: true },
                { dot: 'amber', label: '− ค่าส่ง', val: -shipping, pct: revenue > 0 ? (shipping / revenue) * 100 : 0 },
                { dot: 'rose', label: '− ค่าคอมมิชชั่น', val: -commission, pct: revenue > 0 ? (commission / revenue) * 100 : 0 },
                { dot: 'violet', label: '− ค่าใช้จ่ายอื่นๆ', val: -otherExpenses, pct: revenue > 0 ? (otherExpenses / revenue) * 100 : 0 },
                { dot: 'fuchsia', label: '= กำไรจริง (Net Profit)', val: netProfit, pct: netMargin, bold: true },
              ].map((r, i) => (
                <div key={i} className={cn('flex items-center justify-between gap-3', r.bold && 'border-t border-slate-200 dark:border-slate-700 pt-3 font-bold')}>
                  <div className="flex items-center gap-2 w-56 shrink-0">
                    <span className={cn('w-3 h-3 rounded-full', {
                      emerald: 'bg-emerald-500', slate: 'bg-slate-400', cyan: 'bg-cyan-500', amber: 'bg-amber-500',
                      rose: 'bg-rose-500', violet: 'bg-violet-500', fuchsia: 'bg-fuchsia-500',
                    }[r.dot])} />
                    <span className={cn('text-sm', r.bold ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400')}>{r.label}</span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded">
                    <div className={cn('h-full rounded', {
                      emerald: 'bg-emerald-400', slate: 'bg-slate-400', cyan: 'bg-cyan-400', amber: 'bg-amber-400',
                      rose: 'bg-rose-400', violet: 'bg-violet-400', fuchsia: 'bg-fuchsia-400',
                    }[r.dot])} style={{ width: `${Math.min(Math.abs(r.pct), 100)}%` }} />
                  </div>
                  <span className={cn('text-sm font-semibold w-20 text-right shrink-0',
                    r.val < 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200')}>
                    {r.val < 0 ? '-' : ''}฿{formatMoney(Math.abs(r.val))}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right shrink-0">{Math.round(r.pct)}%</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic mt-3">ℹ️ คำนวณจากออเดอร์ที่ส่งสำเร็จ (Delivered) เท่านั้น</p>
          </Card>

          {/* Summary Margin */}
          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">สรุป Margin</p>
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">กำไรขั้นต้น (Gross Margin)</span>
                    <span className="font-bold text-cyan-600">{grossMargin.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${Math.max(0, Math.min(grossMargin, 100))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">กำไรจริง (Net Margin)</span>
                    <span className="font-bold text-fuchsia-600">{netMargin.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-fuchsia-400 to-pink-500" style={{ width: `${Math.max(0, Math.min(netMargin, 100))}%` }} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <MiniStat icon="📄" label="ค่าใช้จ่ายอื่นๆ" value={`฿${formatMoney(otherExpenses + shipping + commission)}`} sub={`${revenue > 0 ? Math.round(((otherExpenses + shipping + commission) / revenue) * 100) : 0}% ของยอดขาย`} />
                <MiniStat icon="🚚" label="ค่าส่งเฉลี่ย/ออเดอร์" value={`฿${avgShipping.toFixed(2)}`} sub={`${delivered.length} ออเดอร์`} />
                <MiniStat icon="📈" label="กำไรเฉลี่ย/ออเดอร์" value={`฿${avgProfit.toFixed(2)}`} sub={`${delivered.length} ออเดอร์`} />
                <MiniStat icon="🎯" label="จุดคุ้มทุน (Break-even)" value={`฿${formatMoney(breakEven)}`} sub="ยอดขายที่ต้องทำ" />
              </div>
            </Card>

            {/* Expense ratio + comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="p-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">สัดส่วนค่าใช้จ่าย</p>
                <ExpenseDonut
                  revenue={revenue} cost={cost} shipping={shipping} commission={commission} otherExpenses={otherExpenses} netProfit={netProfit}
                />
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">เปรียบเทียบกับช่วงเดียวกันก่อนหน้า</p>
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      { label: 'ยอดขาย', curr: revenue, prev: prev.revenue },
                      { label: 'กำไรขั้นต้น', curr: grossProfit, prev: prev.grossProfit },
                      { label: 'กำไรจริง', curr: netProfit, prev: prev.netProfit },
                      { label: 'Net Margin', curr: netMargin, prev: prev.revenue > 0 ? (prev.netProfit / prev.revenue) * 100 : 0, isPct: true },
                    ].map(r => {
                      const delta = fmtDelta(r.curr, r.prev)
                      return (
                        <tr key={r.label} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="py-1.5 text-slate-500">{r.label}</td>
                          <td className="py-1.5 text-right font-semibold">{r.isPct ? `${r.curr.toFixed(0)}%` : `฿${formatMoney(r.curr)}`}</td>
                          <td className={cn('py-1.5 text-right font-bold pl-3', delta.positive ? 'text-emerald-600' : 'text-red-500')}>
                            {delta.text} {delta.positive ? '↑' : '↓'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        </div>

        {/* Per-product */}
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">กำไรแยกตามสินค้า</p>
          </div>
          {productRows.length === 0 ? <EmptyState message="ยังไม่มีออเดอร์ในเดือนนี้" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-3">สินค้า</th>
                    <th className="text-right py-3 px-2">จำนวนที่ขาย</th>
                    <th className="text-right py-3 px-2">ยอดขาย</th>
                    <th className="text-right py-3 px-2">ต้นทุนสินค้า</th>
                    <th className="text-right py-3 px-2">ค่าส่ง</th>
                    <th className="text-right py-3 px-2">ค่าคอม</th>
                    <th className="text-right py-3 px-2">ค่าใช้จ่ายอื่นๆ</th>
                    <th className="text-right py-3 px-2">กำไรขั้นต้น</th>
                    <th className="text-right py-3 px-2">กำไรจริง</th>
                    <th className="text-right py-3 px-2">Gross Margin</th>
                    <th className="text-right py-3 px-2">Net Margin</th>
                    <th className="text-right py-3 px-2">ROAS Breakeven</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map(p => (
                    <tr key={p.name} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-3 font-semibold">{p.name}</td>
                      <td className="py-3 px-2 text-right">{p.qty}</td>
                      <td className="py-3 px-2 text-right">฿{formatMoney(p.revenue)}</td>
                      <td className="py-3 px-2 text-right">฿{formatMoney(p.cost)}</td>
                      <td className="py-3 px-2 text-right">฿{formatMoney(p.shipping)}</td>
                      <td className="py-3 px-2 text-right">฿{formatMoney(p.commission)}</td>
                      <td className="py-3 px-2 text-right">฿{formatMoney(p.other)}</td>
                      <td className="py-3 px-2 text-right font-bold text-cyan-600">฿{formatMoney(p.gross)}</td>
                      <td className="py-3 px-2 text-right font-bold text-fuchsia-600">฿{formatMoney(p.net)}</td>
                      <td className="py-3 px-2 text-right">{p.grossMargin.toFixed(2)}%</td>
                      <td className="py-3 px-2 text-right">{p.netMargin.toFixed(2)}%</td>
                      <td className="py-3 px-2 text-right">{p.roasBe.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50/50 dark:bg-emerald-900/10 font-bold">
                    <td className="py-3 px-3 text-emerald-700">รวมทั้งหมด</td>
                    <td className="py-3 px-2 text-right">{totalRow.qty}</td>
                    <td className="py-3 px-2 text-right">฿{formatMoney(totalRow.revenue)}</td>
                    <td className="py-3 px-2 text-right">฿{formatMoney(totalRow.cost)}</td>
                    <td className="py-3 px-2 text-right">฿{formatMoney(totalRow.shipping)}</td>
                    <td className="py-3 px-2 text-right">฿{formatMoney(totalRow.commission)}</td>
                    <td className="py-3 px-2 text-right">฿{formatMoney(totalRow.other)}</td>
                    <td className="py-3 px-2 text-right text-cyan-600">฿{formatMoney(totalRow.gross)}</td>
                    <td className="py-3 px-2 text-right text-fuchsia-600">฿{formatMoney(totalRow.net)}</td>
                    <td className="py-3 px-2 text-right">{totalRow.grossMargin.toFixed(2)}%</td>
                    <td className="py-3 px-2 text-right">{totalRow.netMargin.toFixed(2)}%</td>
                    <td className="py-3 px-2 text-right">{totalRow.roasBe.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: 'emerald' | 'slate' | 'cyan' | 'fuchsia'; icon: string }) {
  const bg = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    slate: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
    fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800',
  }[color]
  const text = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    slate: 'text-slate-700 dark:text-slate-300',
    cyan: 'text-cyan-700 dark:text-cyan-300',
    fuchsia: 'text-fuchsia-700 dark:text-fuchsia-300',
  }[color]
  return (
    <div className={cn('rounded-2xl p-4 border-2', bg)}>
      <div className="flex items-start justify-between mb-2">
        <p className={cn('text-xs font-bold', text)}>{label}</p>
        <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold', text, 'bg-white/50 dark:bg-black/20')}>{icon}</span>
      </div>
      <p className={cn('text-3xl font-black mb-1', text)}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
    </div>
  )
}

function MiniStat({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <p className="text-sm font-black text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  )
}

function ExpenseDonut({ revenue, cost, shipping, commission, otherExpenses, netProfit }: {
  revenue: number; cost: number; shipping: number; commission: number; otherExpenses: number; netProfit: number
}) {
  const total = Math.max(revenue, 1)
  const slices = [
    { label: 'ต้นทุนสินค้า', val: cost, color: '#10b981' },
    { label: 'ค่าส่ง', val: shipping, color: '#fbbf24' },
    { label: 'ค่าคอมมิชชั่น', val: commission, color: '#f43f5e' },
    { label: 'ค่าใช้จ่ายอื่นๆ', val: otherExpenses, color: '#8b5cf6' },
    { label: 'กำไรจริง', val: Math.max(netProfit, 0), color: '#ec4899' },
  ]
  let acc = 0
  const R = 36
  const C = 2 * Math.PI * R
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {slices.map((s, i) => {
            const portion = s.val / total
            const dash = C * portion
            const offset = C * (1 - acc)
            acc += portion
            return (
              <circle key={i} cx={50} cy={50} r={R} fill="none" stroke={s.color} strokeWidth={14}
                strokeDasharray={`${dash} ${C}`} strokeDashoffset={-(C - offset)} />
            )
          })}
        </svg>
      </div>
      <div className="flex-1 space-y-0.5 text-[10px]">
        {slices.map(s => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} /> {s.label}</span>
            <span className="font-semibold">{Math.round((s.val / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
