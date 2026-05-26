'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Button, Modal, Card, EmptyState, Input, Select, Textarea, PageHeader } from '@/components/ui'
import { Product, ProductStatus, PRODUCT_STATUS_LABEL, PRODUCT_STATUS_COLOR } from '@/types'
import { generateId, formatMoney } from '@/lib/utils'

function ProductForm({ initial, onSave, onClose }: {
  initial?: Product | null
  onSave: (p: Product) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(String(initial?.price ?? ''))
  const [unit, setUnit] = useState(initial?.unit ?? 'กล่อง')
  const [status, setStatus] = useState<ProductStatus>(initial?.status ?? 'active')
  const [err, setErr] = useState('')

  function handleSave() {
    if (!name.trim() || !price) { setErr('กรุณากรอกชื่อและราคา'); return }
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      unit: unit.trim() || 'กล่อง',
      status,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <Modal open onClose={onClose} title={initial ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}>
      <div className="space-y-4">
        {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{err}</p>}
        <Input label="ชื่อสินค้า *" value={name} onChange={e => setName(e.target.value)} placeholder="วิตามิน C..." />
        <Textarea label="รายละเอียด" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="สรรพคุณ ข้อมูล..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="ราคา (บาท) *" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="590" />
          <Input label="หน่วย" value={unit} onChange={e => setUnit(e.target.value)} placeholder="กล่อง, ถุง, ขวด..." />
        </div>
        <Select label="สถานะ" value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>
          {(Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map(s => <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>)}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave}>{initial ? 'บันทึก' : 'เพิ่มสินค้า'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function ProductsPage() {
  const { state, dispatch, addHistory } = useApp()
  const [form, setForm] = useState<{ open: boolean; product?: Product | null }>({ open: false })
  const [search, setSearch] = useState('')

  const filtered = state.products.filter(p => !search || p.name.includes(search))

  function handleSave(product: Product) {
    const isNew = !state.products.find(p => p.id === product.id)
    dispatch({ type: isNew ? 'ADD_PRODUCT' : 'UPDATE_PRODUCT', payload: product })
    addHistory('product_changed', `${isNew ? 'เพิ่ม' : 'แก้ไข'}สินค้า ${product.name}`, product.id, 'product')
    setForm({ open: false })
  }

  function handleDelete(p: Product) {
    if (!confirm(`ลบสินค้า "${p.name}"?`)) return
    dispatch({ type: 'DELETE_PRODUCT', payload: p.id })
    addHistory('product_changed', `ลบสินค้า ${p.name}`)
  }

  const active = state.products.filter(p => p.status === 'active').length

  return (
    <div>
      <PageHeader
        title="สินค้า"
        subtitle={`${active} รายการพร้อมขาย จาก ${state.products.length} ทั้งหมด`}
        action={
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาสินค้า..."
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white dark:focus:bg-slate-700" />
            <Button onClick={() => setForm({ open: true })}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              เพิ่มสินค้า
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {filtered.length === 0 ? <EmptyState message="ไม่พบสินค้า" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(p => (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                  <Badge label={PRODUCT_STATUS_LABEL[p.status]} className={PRODUCT_STATUS_COLOR[p.status]} />
                </div>
                {p.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{p.description}</p>}
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                  ฿{formatMoney(p.price)} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/{p.unit}</span>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setForm({ open: true, product: p })}>แก้ไข</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>ลบ</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {form.open && <ProductForm initial={form.product} onSave={handleSave} onClose={() => setForm({ open: false })} />}
    </div>
  )
}
