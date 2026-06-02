'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader } from '@/components/ui'
import { ShippingProfile } from '@/types'
import { cn, formatMoney, generateId } from '@/lib/utils'

function ProfileForm({ initial, onSave, onClose, allProducts }: {
  initial?: ShippingProfile | null
  onSave: (p: ShippingProfile) => void
  onClose: () => void
  allProducts: { id: string; name: string; sku?: string; imageUrl?: string }[]
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [shippingFee, setShippingFee] = useState(initial?.shippingFee != null ? String(initial.shippingFee) : '')
  const [codPercent, setCodPercent] = useState(initial?.codPercent != null ? String(initial.codPercent) : '')
  const [productIds, setProductIds] = useState<Set<string>>(new Set(initial?.productIds ?? []))
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')

  function toggle(id: string) {
    const next = new Set(productIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setProductIds(next)
  }

  function handleSave() {
    if (!name.trim()) { setErr('กรุณากรอกชื่อโปรไฟล์'); return }
    if (!(Number(shippingFee) >= 0)) { setErr('กรุณากรอกค่าส่ง'); return }
    if (!(Number(codPercent) >= 0)) { setErr('กรุณากรอก COD %'); return }
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(),
      shippingFee: Number(shippingFee),
      codPercent: Number(codPercent),
      productIds: [...productIds],
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    })
  }

  const filtered = allProducts.filter(p =>
    !search || p.name.includes(search) || (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal open onClose={onClose} title={initial ? 'แก้ไขโปรไฟล์ค่าส่ง' : 'เพิ่มโปรไฟล์ค่าส่ง'} width="max-w-2xl">
      <div className="space-y-4">
        {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">⚠️ {err}</p>}
        <Input label="ชื่อโปรไฟล์ *" value={name} onChange={e => setName(e.target.value)} placeholder="เช่น เมล็ดพันธุ์, สินค้าสุขภาพ" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input label="ค่าส่ง (บาท) *" type="number" value={shippingFee} onChange={e => setShippingFee(e.target.value)} />
          </div>
          <div>
            <Input label="COD (%) *" type="number" step="0.5" value={codPercent} onChange={e => setCodPercent(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            เลือกสินค้าที่ใช้โปรไฟล์นี้ ({productIds.size} รายการ)
          </label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหาสินค้า"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            {filtered.map(p => (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0">
                <input type="checkbox" checked={productIds.has(p.id)} onChange={() => toggle(p.id)} className="accent-emerald-500" />
                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-sm">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded" />
                  ) : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{p.name}</p>
                  {p.sku && <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave}>{initial ? 'บันทึก' : 'เพิ่มโปรไฟล์'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function ShippingProfilesPage() {
  const { state, saveShippingProfile, deleteShippingProfile } = useApp()
  const user = state.currentUser
  const [form, setForm] = useState<{ open: boolean; profile?: ShippingProfile | null }>({ open: false })

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-6 py-8 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    )
  }

  const allProducts = state.products

  return (
    <div>
      <PageHeader
        title="ค่าส่งมาตรฐาน + COD"
        subtitle="จัดการค่าส่งมาตรฐานและ COD สำหรับแต่ละกลุ่มสินค้า"
        action={
          <Button onClick={() => setForm({ open: true })}>+ เพิ่มโปรไฟล์ค่าส่ง</Button>
        }
      />

      <div className="p-6 space-y-5">
        {state.shippingProfiles.length === 0 ? (
          <EmptyState message="ยังไม่มีโปรไฟล์ค่าส่ง — กดเพิ่มเพื่อสร้างชุดแรก" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.shippingProfiles.map((p, idx) => {
              const products = allProducts.filter(pr => p.productIds.includes(pr.id))
              return (
                <Card key={p.id} className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500">โปรไฟล์ #{idx + 1}</p>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Badge label={p.name} className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" />
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                      <p className="text-xs text-emerald-600">🚚 ค่าส่งมาตรฐาน</p>
                      <p className="text-2xl font-black text-emerald-700">{formatMoney(p.shippingFee)} <span className="text-sm">บาท</span></p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                      <p className="text-xs text-blue-600">💰 COD</p>
                      <p className="text-2xl font-black text-blue-700">{p.codPercent} <span className="text-sm">%</span></p>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">ใช้กับสินค้า ({products.length} รายการ)</p>
                  <div className="max-h-44 overflow-y-auto space-y-1 mb-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    {products.length === 0 ? (
                      <p className="text-xs text-slate-400 italic px-2 py-1">ยังไม่มีสินค้าในโปรไฟล์</p>
                    ) : products.map(pr => (
                      <div key={pr.id} className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded px-2 py-1.5 text-xs">
                        <span className="text-emerald-500">✓</span>
                        <span className="flex-1 truncate">{pr.name}</span>
                        {pr.sku && <span className="text-[10px] text-slate-400 font-mono">{pr.sku}</span>}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setForm({ open: true, profile: p })}>แก้ไข</Button>
                    <Button size="sm" variant="danger" onClick={() => {
                      if (confirm(`ลบโปรไฟล์ "${p.name}"?`)) deleteShippingProfile(p.id)
                    }}>ลบ</Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">📋 หลักการคิดค่าส่งและ COD</p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-5">
            <li>1 ออเดอร์ คิดค่าส่งแค่ 1 ครั้ง / COD แค่ 1 ครั้ง</li>
            <li>ถ้ามีหลายสินค้าจากโปรไฟล์เดียวกัน → คิดครั้งเดียว</li>
            <li>ถ้ามีหลายสินค้าจากคนละโปรไฟล์ → <strong>ระบบเลือกชุดที่แพงที่สุด</strong></li>
            <li>ฝ่ายแพ็คสามารถแก้ค่าส่งจริง/COD จริงในตอนกรอกเลขพัสดุได้ ระบบจะใช้ค่าจริงในการคำนวณกำไร</li>
          </ul>
        </Card>
      </div>

      {form.open && (
        <ProfileForm initial={form.profile} allProducts={allProducts}
          onSave={p => { saveShippingProfile(p); setForm({ open: false }) }}
          onClose={() => setForm({ open: false })} />
      )}
    </div>
  )
}
