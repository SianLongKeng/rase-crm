'use client'

import { useRef, useState } from 'react'
import { useApp } from '@/lib/store'
import { Badge, Button, Modal, Card, EmptyState, Input, Select, Textarea, PageHeader } from '@/components/ui'
import {
  Product, ProductStatus, PRODUCT_STATUS_LABEL, PRODUCT_STATUS_COLOR,
  CommissionMode, productGrossProfit, productNetProfit, productCodFeeBaht, computeCommission,
} from '@/types'
import { generateId, formatMoney, cn } from '@/lib/utils'
import Link from 'next/link'

/** Resize + compress image file to data URL (max 800x800 JPEG q=0.85) */
async function fileToDataUrl(file: File, maxSize = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('image failed'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height * maxSize) / width; width = maxSize }
          else { width = (width * maxSize) / height; height = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('no ctx')); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function ProductForm({ initial, onSave, onClose }: {
  initial?: Product | null
  onSave: (p: Product) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload')
  const [uploading, setUploading] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) { setErr('กรุณาเลือกไฟล์รูปภาพ'); return }
    if (file.size > 5 * 1024 * 1024) { setErr('ไฟล์ใหญ่เกิน 5MB'); return }
    setUploading(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      setImageUrl(dataUrl)
      setErr('')
    } catch {
      setErr('โหลดรูปไม่สำเร็จ — ลองไฟล์อื่น')
    } finally {
      setUploading(false)
    }
  }
  const [price, setPrice] = useState(initial ? String(initial.price ?? '') : '')
  const [cost, setCost] = useState(initial ? String(initial.cost ?? '') : '')
  const [shippingFee, setShippingFee] = useState(initial?.shippingFee != null ? String(initial.shippingFee) : '')
  const [codFee, setCodFee] = useState(initial?.codFee != null ? String(initial.codFee) : '')
  const [packingFee, setPackingFee] = useState(initial?.packingFee != null ? String(initial.packingFee) : '')
  const [commMode, setCommMode] = useState<CommissionMode>(initial?.commission?.mode ?? 'flat')
  const [commValue, setCommValue] = useState(initial?.commission?.value != null ? String(initial.commission.value) : '')
  const [hasSpecial, setHasSpecial] = useState(!!initial?.commission?.special)
  const [specialValue, setSpecialValue] = useState(initial?.commission?.special?.value != null ? String(initial.commission.special.value) : '')
  const [specialStart, setSpecialStart] = useState(initial?.commission?.special?.startAt?.slice(0, 10) ?? '')
  const [specialEnd, setSpecialEnd] = useState(initial?.commission?.special?.endAt?.slice(0, 10) ?? '')
  const [stockQty, setStockQty] = useState(initial?.stockQty != null ? String(initial.stockQty) : '')
  const [unit, setUnit] = useState(initial?.unit ?? 'ชุด')
  const [status, setStatus] = useState<ProductStatus>(initial?.status ?? 'active')
  const [lowStockThreshold, setLowStockThreshold] = useState(initial?.lowStockThreshold != null ? String(initial.lowStockThreshold) : '')
  const [err, setErr] = useState('')

  const numPrice = Number(price) || 0
  const numCost = Number(cost) || 0
  const numShip = Number(shippingFee) || 0
  const numCodPct = Number(codFee) || 0   // codFee is now a percentage
  const numPack = Number(packingFee) || 0
  const previewProduct: Product = {
    id: 'preview', name, price: numPrice, cost: numCost, shippingFee: numShip, codFee: numCodPct, packingFee: numPack,
    commission: { mode: commMode, value: Number(commValue) || 0 },
    unit, status, createdAt: '',
  }
  const codBaht = productCodFeeBaht(previewProduct)
  const overhead = numCost + numShip + codBaht + numPack
  const grossProfit = numPrice - numCost
  const commAmount = computeCommission(previewProduct)
  const netProfit = grossProfit - numShip - codBaht - numPack - commAmount
  const netRate = numPrice > 0 ? Math.round((netProfit / numPrice) * 100) : 0

  function handleSave() {
    if (!name.trim()) { setErr('กรุณากรอกชื่อสินค้า'); return }
    if (!(numPrice > 0)) { setErr('กรุณากรอกราคา'); return }
    const product: Product = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      sku: sku.trim() || undefined,
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      price: numPrice,
      cost: numCost,
      // shippingFee + codFee now managed via Shipping Profiles, not per-product
      shippingFee: undefined,
      codFee: undefined,
      packingFee: packingFee !== '' ? numPack : undefined,
      commission: commValue !== '' ? {
        mode: commMode,
        value: Number(commValue) || 0,
        special: hasSpecial && specialStart && specialEnd ? {
          value: Number(specialValue) || 0,
          startAt: new Date(specialStart).toISOString(),
          endAt: new Date(specialEnd).toISOString(),
        } : undefined,
      } : undefined,
      unit: unit.trim() || 'ชิ้น',
      stockQty: stockQty !== '' ? Number(stockQty) : undefined,
      lowStockThreshold: lowStockThreshold !== '' ? Number(lowStockThreshold) : undefined,
      status,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSave(product)
  }

  return (
    <Modal open onClose={onClose} title={initial ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'} width="max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">⚠️ {err}</p>}

          {/* Section 1: Basic info */}
          <section>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">1. ข้อมูลสินค้า</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="ชื่อสินค้า *" value={name} onChange={e => setName(e.target.value)} placeholder="ชุดผักสวนครัว..." />
              <Input label="รหัสสินค้า (SKU)" value={sku} onChange={e => setSku(e.target.value)} placeholder="VEG-SET-001" />
              <div className="col-span-2"><Input label="หมวดหมู่" value={category} onChange={e => setCategory(e.target.value)} placeholder="อาหารเสริม / ความงาม..." /></div>
              <div className="col-span-2">
                <Textarea label="คำอธิบายสินค้า" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="สรรพคุณ ข้อมูลเพิ่มเติม..." />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">รูปภาพสินค้า</label>
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-2 w-fit">
                  {(['upload', 'url'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setImageMode(m)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold',
                        imageMode === m ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500')}>
                      {m === 'upload' ? '📤 อัปโหลด' : '🔗 ใช้ URL'}
                    </button>
                  ))}
                </div>

                {imageMode === 'upload' ? (
                  <div
                    onDragOver={e => { e.preventDefault() }}
                    onDrop={e => {
                      e.preventDefault()
                      const f = e.dataTransfer.files?.[0]
                      if (f) void handleImageFile(f)
                    }}
                    className={cn(
                      'rounded-xl border-2 border-dashed transition-colors',
                      imageUrl ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-400',
                    )}
                  >
                    <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0]
                        if (f) await handleImageFile(f)
                        if (imgInputRef.current) imgInputRef.current.value = ''
                      }} />
                    {imageUrl ? (
                      <div className="flex items-center gap-3 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="preview" className="w-20 h-20 object-cover rounded-lg shrink-0 border border-slate-200 dark:border-slate-700" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">✓ อัปโหลดรูปแล้ว</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">ระบบบีบอัดเหลือ ~800px JPEG เพื่อประหยัดพื้นที่</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="secondary" onClick={() => imgInputRef.current?.click()}>เปลี่ยน</Button>
                          <Button size="sm" variant="danger" onClick={() => setImageUrl('')}>ลบ</Button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => imgInputRef.current?.click()} disabled={uploading}
                        className="w-full py-8 px-4 text-center cursor-pointer disabled:opacity-50">
                        <div className="text-4xl mb-2">{uploading ? '⏳' : '📷'}</div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {uploading ? 'กำลังประมวลผล...' : 'คลิกเพื่อเลือกรูป หรือลากไฟล์มาวาง'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">รองรับ JPG / PNG / WEBP — ขนาดไม่เกิน 5MB</p>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    {imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Price & cost */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">2. ราคาและต้นทุน</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Input label="ราคาขาย *" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="-" />
              <Input label="ต้นทุนสินค้า *" type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="-" />
              <Input label="ค่าแพ็ค/อื่นๆ" type="number" value={packingFee} onChange={e => setPackingFee(e.target.value)} placeholder="-" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              💡 ค่าส่งและ COD ใช้จาก <strong>โปรไฟล์ค่าส่ง + COD</strong> (กำหนดที่หน้า &quot;🚚 ค่าส่ง + COD&quot;)
            </p>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs">
              <div>
                <p className="text-slate-500">ต้นทุนรวม/ออเดอร์</p>
                <p className="font-black text-slate-800 dark:text-slate-100 text-lg">฿{formatMoney(overhead)}</p>
              </div>
              <div>
                <p className="text-slate-500">กำไรขั้นต้น</p>
                <p className="font-black text-slate-800 dark:text-slate-100 text-lg">฿{formatMoney(grossProfit)}</p>
              </div>
              <div>
                <p className="text-slate-500">กำไรสุทธิ</p>
                <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg">฿{formatMoney(netProfit)}</p>
              </div>
              <div>
                <p className="text-slate-500">อัตรากำไรสุทธิ</p>
                <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{netRate}%</p>
              </div>
            </div>
          </section>

          {/* Section 3: Commission */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">3. ค่าคอมมิชชั่น</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">รูปแบบค่าคอม</label>
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  {(['flat', 'percent'] as CommissionMode[]).map(m => (
                    <button key={m} type="button" onClick={() => setCommMode(m)}
                      className={cn('flex-1 px-3 py-2 rounded-lg text-xs font-semibold',
                        commMode === m ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500')}>
                      {m === 'flat' ? '● บาท' : 'เปอร์เซ็นต์'}
                    </button>
                  ))}
                </div>
              </div>
              <Input label={`ค่าคอม/ออเดอร์ * (${commMode === 'flat' ? 'บาท' : '%'})`} type="number" value={commValue} onChange={e => setCommValue(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={hasSpecial} onChange={e => setHasSpecial(e.target.checked)} />
              <span className="text-sm">ค่าคอมพิเศษ (ชั่วคราว)</span>
            </label>
            {hasSpecial && (
              <div className="grid grid-cols-3 gap-3">
                <Input label="ค่าคอมพิเศษ" type="number" value={specialValue} onChange={e => setSpecialValue(e.target.value)} />
                <Input label="เริ่มวันที่" type="date" value={specialStart} onChange={e => setSpecialStart(e.target.value)} />
                <Input label="ถึงวันที่" type="date" value={specialEnd} onChange={e => setSpecialEnd(e.target.value)} />
              </div>
            )}
          </section>

          {/* Section 4: Stock & status */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">4. สต็อกและสถานะ</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input label="สต็อกคงเหลือ *" type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} />
              <Input label="หน่วยนับ" value={unit} onChange={e => setUnit(e.target.value)} placeholder="ชุด / ขวด..." />
              <Select label="สถานะสินค้า" value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>
                {(Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map(s => <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>)}
              </Select>
              <Input label="ขั้นต่ำเตือนสต็อก" type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
            <Button onClick={handleSave}>{initial ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกสินค้า'}</Button>
          </div>
        </div>

        {/* Preview pane */}
        <aside className="lg:sticky lg:top-0 self-start">
          <Card className="p-4">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">ตัวอย่างสินค้า</p>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl aspect-square mb-3 overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl opacity-30">📦</span>
              )}
            </div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2">{name || '(ยังไม่มีชื่อ)'}</p>
            {sku && <p className="text-xs text-slate-500 mt-1">SKU: {sku}</p>}
            {category && <p className="text-xs text-slate-500">หมวดหมู่: {category}</p>}

            <div className="mt-4 space-y-1.5 text-xs">
              <Row label="ราคาขาย" value={`${formatMoney(numPrice)} บาท`} />
              <Row label="ต้นทุนสินค้า" value={`${formatMoney(numCost)} บาท`} />
              <Row label="ค่าแพ็ค/อื่นๆ" value={`${formatMoney(numPack)} บาท`} />
              <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5">
                <Row label="ต้นทุนรวม/ออเดอร์" value={`${formatMoney(overhead)} บาท`} />
                <Row label="ค่าคอมมิชชั่น" value={`${formatMoney(commAmount)} บาท`} />
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5">
                <p className="flex justify-between">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">กำไรสุทธิ</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400">{formatMoney(netProfit)} บาท</span>
                </p>
                <p className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[10px]">
                  <span>อัตรากำไรสุทธิ</span><span>{netRate}%</span>
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5 text-slate-400 text-[10px]">
                <Row label="สต็อกคงเหลือ" value={`${stockQty} ${unit}`} />
                <Row label="ขั้นต่ำเตือนสต็อก" value={`${lowStockThreshold} ${unit}`} />
                <Row label="หน่วยนับ" value={unit} />
                <Row label="สถานะสินค้า" value={PRODUCT_STATUS_LABEL[status]} />
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </p>
  )
}

function ProductDetailModal({ product, onClose, onEdit }: { product: Product; onClose: () => void; onEdit: () => void }) {
  const net = productNetProfit(product)
  const gross = productGrossProfit(product)
  const margin = product.price > 0 ? Math.round((net / product.price) * 100) : 0
  const comm = computeCommission(product)
  void productCodFeeBaht
  return (
    <Modal open onClose={onClose} title="รายละเอียดสินค้า" width="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
        <div>
          <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : <span className="text-5xl opacity-30">📦</span>}
          </div>
          <Badge label={PRODUCT_STATUS_LABEL[product.status]} className={cn('mt-3 w-full justify-center', PRODUCT_STATUS_COLOR[product.status])} />
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{product.name}</h3>
            {product.sku && <p className="text-xs text-slate-500 font-mono">SKU: {product.sku}</p>}
            {product.category && <Badge label={product.category} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 mt-1" />}
          </div>
          {product.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg italic">
              {product.description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
              <p className="text-slate-500">ราคาขาย</p>
              <p className="font-black text-emerald-700 dark:text-emerald-300 text-lg">฿{formatMoney(product.price)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
              <p className="text-slate-500">ต้นทุนสินค้า</p>
              <p className="font-black text-slate-700 dark:text-slate-200 text-lg">฿{formatMoney(product.cost)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
              <p className="text-slate-500">กำไรขั้นต้น</p>
              <p className="font-bold text-slate-700">฿{formatMoney(gross)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
              <p className="text-slate-500">กำไรสุทธิ</p>
              <p className="font-bold text-emerald-700">฿{formatMoney(net)} ({margin}%)</p>
            </div>
          </div>
          <table className="w-full text-xs">
            <tbody>
              <tr><td className="py-1 text-slate-500">ค่าแพ็ค/อื่นๆ</td><td className="py-1 text-right font-semibold">฿{formatMoney(product.packingFee ?? 0)}</td></tr>
              <tr><td className="py-1 text-slate-500">ค่าคอมมิชชั่น</td><td className="py-1 text-right font-semibold">{product.commission?.mode === 'percent' ? `${product.commission.value}% = ฿${formatMoney(comm)}` : `฿${formatMoney(comm)}`}</td></tr>
              <tr className="border-t border-slate-100 dark:border-slate-800"><td className="py-1 text-slate-500">สต็อกคงเหลือ</td><td className="py-1 text-right font-semibold">{product.stockQty ?? 0} {product.unit}</td></tr>
              <tr><td className="py-1 text-slate-500">ขั้นต่ำเตือนสต็อก</td><td className="py-1 text-right">{product.lowStockThreshold ?? '—'} {product.unit}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose}>ปิด</Button>
        <Button onClick={onEdit}>แก้ไขสินค้า</Button>
      </div>
    </Modal>
  )
}

export default function ProductsPage() {
  const { state, dispatch, addHistory } = useApp()
  const [form, setForm] = useState<{ open: boolean; product?: Product | null }>({ open: false })
  const [detail, setDetail] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState<ProductStatus | 'all'>('all')
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'ok' | 'out'>('all')

  const categories = [...new Set(state.products.map(p => p.category).filter(Boolean))] as string[]

  const filtered = state.products
    .filter(p => !search || p.name.includes(search) || (p.sku ?? '').toLowerCase().includes(search.toLowerCase()))
    .filter(p => filterCategory === 'all' || p.category === filterCategory)
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => {
      if (filterStock === 'all') return true
      const qty = p.stockQty ?? 0
      const low = p.lowStockThreshold ?? 0
      if (filterStock === 'out') return qty === 0
      if (filterStock === 'low') return qty > 0 && qty <= low
      if (filterStock === 'ok') return qty > low
      return true
    })

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

  return (
    <div>
      <PageHeader
        title="สินค้า"
        subtitle={`ทั้งหมด ${state.products.length} รายการ`}
        action={
          <div className="flex gap-2">
            <Button onClick={() => setForm({ open: true })}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              เพิ่มสินค้า
            </Button>
            <Link href="/shipping-profiles">
              <Button variant="secondary">🚚 ค่าส่ง + COD</Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาสินค้า, SKU, หมวดหมู่..."
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="all">ทั้งหมด (หมวดหมู่)</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as never)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="all">ทั้งหมด (สถานะ)</option>
            {(Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map(s => <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>)}
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value as never)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="all">ทั้งหมด (สต็อก)</option>
            <option value="ok">พร้อมขาย</option>
            <option value="low">ใกล้หมด</option>
            <option value="out">สินค้าหมด</option>
          </select>
        </div>

        {filtered.length === 0 ? <EmptyState message="ไม่พบสินค้า" /> : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-4 font-medium">สินค้า</th>
                    <th className="text-left py-3 px-4 font-medium">SKU</th>
                    <th className="text-left py-3 px-4 font-medium">หมวดหมู่</th>
                    <th className="text-right py-3 px-4 font-medium">ราคา (บาท)</th>
                    <th className="text-right py-3 px-4 font-medium">ต้นทุน (บาท)</th>
                    <th className="text-right py-3 px-4 font-medium">กำไรสุทธิ (บาท)</th>
                    <th className="text-right py-3 px-4 font-medium">คอมมิชชั่น</th>
                    <th className="text-right py-3 px-4 font-medium">สต็อกคงเหลือ</th>
                    <th className="text-center py-3 px-4 font-medium">สถานะ</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const net = productNetProfit(p)
                    const margin = p.price > 0 ? Math.round((net / p.price) * 100) : 0
                    const comm = computeCommission(p)
                    const stock = p.stockQty ?? 0
                    const low = p.lowStockThreshold ?? 0
                    const stockStatus = stock === 0 ? 'out' : stock <= low ? 'low' : 'ok'
                    return (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 cursor-pointer" onClick={() => setDetail(p)}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                              {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                              ) : '📦'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate hover:text-emerald-600">{p.name}</p>
                              {p.description && <p className="text-xs text-slate-400 truncate">{p.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.sku ?? '—'}</td>
                        <td className="py-3 px-4">
                          {p.category && <Badge label={p.category} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" />}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-100">{formatMoney(p.price)}.00</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">{formatMoney(p.cost)}.00</td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(net)}.00</p>
                          <p className="text-[10px] text-emerald-500/70">{margin}%</p>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200">
                          {p.commission?.mode === 'percent' ? `${p.commission.value}%` : `${formatMoney(comm)} บาท`}
                          <p className="text-[10px] text-slate-400">{p.commission?.mode === 'percent' ? 'ของยอดขาย' : 'ต่อออเดอร์'}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="text-slate-700 dark:text-slate-200">{stock} {p.unit}</p>
                          <p className={cn('text-[10px]',
                            stockStatus === 'out' ? 'text-red-500' :
                            stockStatus === 'low' ? 'text-amber-500' : 'text-emerald-500')}>
                            {stockStatus === 'out' ? 'สินค้าหมด' : stockStatus === 'low' ? 'ใกล้หมด' : 'พร้อมขาย'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge label={PRODUCT_STATUS_LABEL[p.status]} className={PRODUCT_STATUS_COLOR[p.status]} />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button onClick={() => setForm({ open: true, product: p })} className="text-slate-400 hover:text-emerald-600 mr-2" title="แก้ไข">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(p)} className="text-slate-400 hover:text-red-500" title="ลบ">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
      </div>

      {form.open && <ProductForm initial={form.product} onSave={handleSave} onClose={() => setForm({ open: false })} />}
      {detail && <ProductDetailModal product={detail} onClose={() => setDetail(null)} onEdit={() => { setForm({ open: true, product: detail }); setDetail(null) }} />}
    </div>
  )
}
