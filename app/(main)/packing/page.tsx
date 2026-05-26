'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Button, Card, EmptyState, Input, Modal, PageHeader } from '@/components/ui'
import { Order, OrderStatus } from '@/types'
import { formatDate, formatMoney } from '@/lib/utils'
import { cn } from '@/lib/utils'

function ShipModal({ order, onClose, onShip }: { order: Order; onClose: () => void; onShip: (tracking: string) => void }) {
  const [tracking, setTracking] = useState('')
  return (
    <Modal open onClose={onClose} title="ใส่เลขพัสดุ">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">ออเดอร์: <span className="font-medium text-slate-800 dark:text-slate-200">{order.customerName}</span></p>
        <Input label="เลขพัสดุ / Tracking Number" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="TH1234567890" />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={() => { if (tracking.trim()) onShip(tracking.trim()) }}>ยืนยันจัดส่ง</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function PackingPage() {
  const { state, updateOrderStatus } = useApp()
  const [shipOrder, setShipOrder] = useState<Order | null>(null)
  const [tab, setTab] = useState<'pending_pack' | 'packing' | 'shipped'>('pending_pack')

  const orders = state.orders.filter(o => o.status === tab)

  function handleAction(order: Order, action: OrderStatus, tracking?: string) {
    updateOrderStatus(order.id, action, tracking)
  }

  const tabConfig = [
    { key: 'pending_pack' as const, label: 'รอแพ็ก', count: state.orders.filter(o => o.status === 'pending_pack').length },
    { key: 'packing' as const, label: 'กำลังแพ็ก', count: state.orders.filter(o => o.status === 'packing').length },
    { key: 'shipped' as const, label: 'จัดส่งแล้ว', count: state.orders.filter(o => o.status === 'shipped').length },
  ]

  return (
    <div>
      <PageHeader title="แพ็กสินค้า" subtitle="จัดการคิวแพ็กและจัดส่ง" />

      <div className="p-6 space-y-5">
        <div className="flex gap-1">
          {tabConfig.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {orders.length === 0 ? <EmptyState message="ไม่มีออเดอร์ในสถานะนี้" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map(o => (
              <Card key={o.id} className="p-5">
                <div className="mb-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{o.customerName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{o.customerPhone}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">สั่ง {formatDate(o.createdAt)} · เทเล: {o.telesaleName}</p>
                </div>

                <div className="space-y-1.5 mb-4">
                  {o.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{item.productName}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">x{item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">ยอดรวม</span>
                    <span className="text-emerald-600 dark:text-emerald-400">฿{formatMoney(o.totalAmount - o.discount)}</span>
                  </div>
                </div>

                {o.trackingNumber && (
                  <div className="mb-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Tracking: </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{o.trackingNumber}</span>
                  </div>
                )}

                {o.notes && <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-3">"{o.notes}"</p>}

                <div className="flex gap-2">
                  {tab === 'pending_pack' && (
                    <>
                      <Button size="sm" className="flex-1 justify-center" onClick={() => handleAction(o, 'packing')}>เริ่มแพ็ก</Button>
                      <Button size="sm" variant="danger" onClick={() => handleAction(o, 'returned')}>คืนสินค้า</Button>
                    </>
                  )}
                  {tab === 'packing' && (
                    <Button size="sm" className="flex-1 justify-center" onClick={() => setShipOrder(o)}>
                      จัดส่ง + ใส่ Tracking
                    </Button>
                  )}
                  {tab === 'shipped' && (
                    <Button size="sm" className="flex-1 justify-center" variant="secondary" onClick={() => handleAction(o, 'delivered')}>
                      ยืนยันส่งสำเร็จ
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {shipOrder && (
        <ShipModal
          order={shipOrder}
          onClose={() => setShipOrder(null)}
          onShip={(tracking) => { handleAction(shipOrder, 'shipped', tracking); setShipOrder(null) }}
        />
      )}
    </div>
  )
}
