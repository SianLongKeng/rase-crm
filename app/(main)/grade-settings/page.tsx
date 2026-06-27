'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, Button, PageHeader, Badge } from '@/components/ui'
import {
  CustomerGrade, GRADE_LABEL, GRADE_TITLE, GRADE_DESCRIPTION, GRADE_COLOR, GRADE_EMOJI,
  CustomerActivityStatus, ACTIVITY_STATUS_LABEL, ACTIVITY_STATUS_TITLE,
  ACTIVITY_STATUS_DESCRIPTION, ACTIVITY_STATUS_COLOR, ACTIVITY_STATUS_EMOJI,
  ACTIVITY_INACTIVE_DAYS,
  DEFAULT_GRADE_SETTINGS, GradeSettings,
  computeCustomerActivityStatus,
} from '@/types'
import { cn } from '@/lib/utils'

const GRADES: CustomerGrade[] = ['A', 'B', 'C', 'D']
const STATUSES: CustomerActivityStatus[] = ['active', 'inactive', 'returned']

export default function GradeSettingsPage() {
  const { state, updateGradeSettings, recalculateAllGrades } = useApp()
  const user = state.currentUser
  const [settings, setSettings] = useState<GradeSettings>(state.gradeSettings)
  const [saved, setSaved] = useState(false)
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null)
  const [recalcing, setRecalcing] = useState(false)

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-6 py-8 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <p className="text-sm mt-1 opacity-70">เฉพาะ Owner / Admin เท่านั้น</p>
        </div>
      </div>
    )
  }

  function updateNumberField(field: 'callDays' | 'cardLimit', grade: CustomerGrade, value: number) {
    setSettings(prev => ({ ...prev, [field]: { ...prev[field], [grade]: value } }))
    setSaved(false)
  }

  function updateMinPurchase(grade: CustomerGrade, value: number | null) {
    setSettings(prev => ({ ...prev, minPurchase: { ...prev.minPurchase, [grade]: value } }))
    setSaved(false)
  }

  function updateExclude(grade: CustomerGrade, value: boolean) {
    setSettings(prev => ({ ...prev, excludeFromQueue: { ...prev.excludeFromQueue, [grade]: value } }))
    setSaved(false)
  }

  function updateThreshold(key: 'aDelivered' | 'bDelivered' | 'dReturned', value: number) {
    setSettings(prev => ({ ...prev, thresholds: { ...prev.thresholds, [key]: value } }))
    setSaved(false)
  }

  function gradeDescription(g: CustomerGrade): string {
    const th = settings.thresholds
    if (g === 'A') return `ส่งสำเร็จ ≥ ${th.aDelivered} ครั้ง`
    if (g === 'B') {
      const upper = Math.max(th.aDelivered - 1, th.bDelivered)
      return th.bDelivered === upper ? `ส่งสำเร็จ ${th.bDelivered} ครั้ง` : `ส่งสำเร็จ ${th.bDelivered}–${upper} ครั้ง`
    }
    if (g === 'C') return 'ยังไม่เคยส่งสำเร็จ'
    return `ตีกลับ ≥ ${th.dReturned} ครั้ง`
  }

  function handleSave() {
    updateGradeSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    if (!confirm('รีเซ็ตกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) return
    setSettings(DEFAULT_GRADE_SETTINGS)
  }

  function handleRecalculate() {
    const ok = confirm(
      `คำนวณเกรดลูกค้าทั้งหมดใหม่?\n\n` +
      `ระบบจะวนลูกค้าทุกคน (${state.customers.length} คน) นับ ส่งสำเร็จ/ตีกลับ จากออเดอร์จริง ` +
      `และอัปเดตเกรดตามเกณฑ์ปัจจุบัน\n\n⚠️ ควรกด "บันทึก" เกณฑ์ก่อน ถ้าเพิ่งแก้`
    )
    if (!ok) return
    setRecalcing(true)
    setRecalcMsg(null)
    // ใช้ setTimeout เพื่อให้ UI render loading state ก่อน
    setTimeout(() => {
      const result = recalculateAllGrades()
      setRecalcMsg(`✅ อัปเดต ${result.updated} / ${result.total} คน`)
      setRecalcing(false)
      setTimeout(() => setRecalcMsg(null), 6000)
    }, 50)
  }

  // Count current customers per grade
  const customerCounts: Record<CustomerGrade, number> = {
    A: state.customers.filter(c => c.grade === 'A').length,
    B: state.customers.filter(c => c.grade === 'B').length,
    C: state.customers.filter(c => c.grade === 'C').length,
    D: state.customers.filter(c => c.grade === 'D').length,
  }

  // Count current customers per activity status (computed)
  const statusCounts: Record<CustomerActivityStatus, number> = { active: 0, inactive: 0, returned: 0 }
  for (const c of state.customers) {
    const s = computeCustomerActivityStatus({
      lastDeliveredAt: c.lastDeliveredAt,
      lastReturnedAt: c.lastReturnedAt,
    })
    statusCounts[s]++
  }

  return (
    <div>
      <PageHeader
        title="เกรดลูกค้า &amp; สถานะลูกค้า"
        subtitle="แยกคุณภาพระยะยาว (Grade) ออกจากสถานะปัจจุบัน (Status)"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={handleReset}>↻ รีเซ็ตค่าเริ่มต้น</Button>
            <Button variant="secondary" onClick={handleRecalculate} disabled={recalcing}>
              {recalcing ? '⏳ กำลังคำนวณ...' : '🔄 คำนวณเกรดทั้งหมดใหม่'}
            </Button>
            <Button onClick={handleSave}>{saved ? '✅ บันทึกแล้ว' : '💾 บันทึก'}</Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {recalcMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
            {recalcMsg}
          </div>
        )}

        {/* ===== แนวคิด ===== */}
        <Card className="p-5 bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2">💡 แนวคิด</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">🏆 Grade — คุณภาพระยะยาว</p>
              <p>เปลี่ยนช้า สะท้อนประวัติทั้งหมด เช่น Grade A = ส่งสำเร็จ ≥ 5 ครั้ง</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">📍 Status — สถานะปัจจุบัน</p>
              <p>เปลี่ยนเร็ว ตามการเคลื่อนไหวล่าสุด เช่น Inactive = เงียบ &gt; 180 วัน</p>
            </div>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-3">
            ✅ ลูกค้า Grade A ที่เงียบ จะแสดงเป็น <strong>Grade A + Inactive</strong> ไม่ลดเกรดลงเป็น C
          </p>
        </Card>

        {/* ===== Grade Cards ===== */}
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">🏆 เกรดลูกค้า (Customer Grade)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GRADES.map(g => (
              <Card key={g} className={cn('p-5 border-2', {
                A: 'border-emerald-200 dark:border-emerald-800',
                B: 'border-blue-200 dark:border-blue-800',
                C: 'border-amber-200 dark:border-amber-800',
                D: 'border-rose-200 dark:border-rose-800',
              }[g])}>
                <div className="mb-4">
                  <Badge label={`${GRADE_EMOJI[g]} ${GRADE_LABEL[g]}`} className={cn('text-sm', GRADE_COLOR[g])} />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-2">{GRADE_TITLE[g]}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{gradeDescription(g)}</p>
                  <p className="text-xs text-slate-500 mt-2">{customerCounts[g]} คนในระบบ</p>
                </div>

                <div className="space-y-3">
                  {/* เกณฑ์ตัวเลขกำหนดเกรด */}
                  {g === 'A' && (
                    <div>
                      <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                        🎯 ส่งสำเร็จขั้นต่ำ (เพื่อเป็น Grade A)
                      </label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} max={999}
                          value={settings.thresholds.aDelivered}
                          onChange={e => updateThreshold('aDelivered', Number(e.target.value) || 1)}
                          className="flex-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/20 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        <span className="text-xs text-slate-500">ครั้ง</span>
                      </div>
                    </div>
                  )}
                  {g === 'B' && (
                    <div>
                      <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 block mb-1">
                        🎯 ส่งสำเร็จขั้นต่ำ (เพื่อเป็น Grade B)
                      </label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} max={999}
                          value={settings.thresholds.bDelivered}
                          onChange={e => updateThreshold('bDelivered', Number(e.target.value) || 1)}
                          className="flex-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/20 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        <span className="text-xs text-slate-500">ครั้ง</span>
                      </div>
                    </div>
                  )}
                  {g === 'D' && (
                    <div>
                      <label className="text-xs font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                        🎯 ตีกลับขั้นต่ำ (เพื่อเป็น Grade D)
                      </label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} max={999}
                          value={settings.thresholds.dReturned}
                          onChange={e => updateThreshold('dReturned', Number(e.target.value) || 1)}
                          className="flex-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-900/20 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-400" />
                        <span className="text-xs text-slate-500">ครั้ง</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      🗓️ วันที่ติดตามครั้งต่อไป
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} max={365}
                        value={settings.callDays[g]}
                        onChange={e => updateNumberField('callDays', g, Number(e.target.value) || 0)}
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      <span className="text-xs text-slate-500">วัน</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      🎯 โควต้าบัตร / Telesale
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={500}
                        value={settings.cardLimit[g]}
                        onChange={e => updateNumberField('cardLimit', g, Number(e.target.value) || 0)}
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      <span className="text-xs text-slate-500">บัตร</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      💰 ยอดซื้อสะสมขั้นต่ำ
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} placeholder="เว้นว่าง = ไม่ใช้"
                        value={settings.minPurchase[g] ?? ''}
                        onChange={e => {
                          const v = e.target.value.trim()
                          updateMinPurchase(g, v === '' ? null : Number(v))
                        }}
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      <span className="text-xs text-slate-500">บาท</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {settings.minPurchase[g] == null ? 'ไม่ใช้ยอดเงินในการคำนวณ' : `ต้องซื้อสะสม ≥ ฿${settings.minPurchase[g]?.toLocaleString()}`}
                    </p>
                  </div>

                  {g === 'D' && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox"
                          checked={settings.excludeFromQueue.D}
                          onChange={e => updateExclude('D', e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-rose-500 focus:ring-rose-400 border-slate-300" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">ไม่นำเข้าคิวโทรอัตโนมัติ</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Grade D จะไม่ถูกส่งเข้าคิวโทรปกติ จนกว่าจะเปลี่ยนสถานะหรือเกรด
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ===== Priority ===== */}
        <Card className="p-5 bg-amber-50/40 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">⚖️ เกณฑ์การคำนวณเกรด</p>
          <ol className="text-xs text-slate-600 dark:text-slate-300 list-decimal pl-5 space-y-1">
            <li><strong>{gradeDescription('A')}</strong> → Grade A (ลูกค้าประจำ)</li>
            <li><strong>{gradeDescription('B')}</strong> → Grade B (ลูกค้าทั่วไป)</li>
            <li><strong>ยังไม่เคยส่งสำเร็จ</strong> → Grade C (ลูกค้าใหม่)</li>
            <li><strong>{gradeDescription('D')}</strong> → Grade D (ลูกค้าเสี่ยง)</li>
          </ol>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-2 italic">
            * เกณฑ์ตีกลับ (D) จะถูกตรวจสอบก่อนเสมอในการคำนวณจริง — ลูกค้าตีกลับเยอะจะเป็น D แม้ส่งสำเร็จเยอะ
          </p>
        </Card>

        {/* ===== Status Cards (read-only) ===== */}
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">📍 สถานะลูกค้า (Customer Status)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            🔒 ระบบคำนวณอัตโนมัติจากข้อมูลจริง — ไม่สามารถแก้ไขจากหน้านี้
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUSES.map(s => (
              <Card key={s} className="p-5 border-2 border-slate-200 dark:border-slate-700 opacity-95">
                <div className="flex items-start justify-between mb-2">
                  <Badge label={`${ACTIVITY_STATUS_EMOJI[s]} ${ACTIVITY_STATUS_LABEL[s]}`} className={cn('text-sm', ACTIVITY_STATUS_COLOR[s])} />
                  <span className="text-[10px] text-slate-400">🔒 อัตโนมัติ</span>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{ACTIVITY_STATUS_TITLE[s]}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ACTIVITY_STATUS_DESCRIPTION[s]}</p>
                <p className="text-xs text-slate-500 mt-3">{statusCounts[s]} คนในระบบ</p>
              </Card>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
            * เกณฑ์ Inactive ใช้ที่ {ACTIVITY_INACTIVE_DAYS} วัน นับจากออเดอร์ส่งสำเร็จล่าสุด
          </p>
        </div>

        {/* ===== Note ===== */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            🎯 <strong>วัตถุประสงค์:</strong> แยก &quot;ลูกค้าดีแต่เงียบ&quot; ออกจาก &quot;ลูกค้าใหม่&quot; และ &quot;ลูกค้ามีปัญหา&quot;
            เพื่อให้ทีม Telesales ติดตามลูกค้าเก่าได้อย่างมีประสิทธิภาพมากขึ้น
          </p>
        </Card>
      </div>
    </div>
  )
}
