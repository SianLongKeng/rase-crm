'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, Button, Input, PageHeader, Badge } from '@/components/ui'
import {
  CustomerGrade, GRADE_LABEL, GRADE_COLOR, GRADE_EMOJI,
  DEFAULT_GRADE_SETTINGS, GradeSettings,
} from '@/types'
import { cn } from '@/lib/utils'

const GRADES: CustomerGrade[] = ['A', 'B', 'C', 'D']

export default function GradeSettingsPage() {
  const { state, updateGradeSettings } = useApp()
  const user = state.currentUser
  const [settings, setSettings] = useState<GradeSettings>(state.gradeSettings)
  const [saved, setSaved] = useState(false)

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

  function updateField(field: keyof GradeSettings, grade: CustomerGrade, value: number) {
    setSettings(prev => ({ ...prev, [field]: { ...prev[field], [grade]: value } }))
    setSaved(false)
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

  // Count current customers per grade
  const customerCounts: Record<CustomerGrade, number> = {
    A: state.customers.filter(c => c.grade === 'A').length,
    B: state.customers.filter(c => c.grade === 'B').length,
    C: state.customers.filter(c => c.grade === 'C').length,
    D: state.customers.filter(c => c.grade === 'D').length,
  }

  return (
    <div>
      <PageHeader
        title="เกรดลูกค้า (Customer Grade)"
        subtitle="ตั้งค่าวันที่ติดตามลูกค้า โควต้าบัตร และอัตราค่าคอมสำหรับแต่ละเกรด"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleReset}>↻ รีเซ็ตค่าเริ่มต้น</Button>
            <Button onClick={handleSave}>{saved ? '✅ บันทึกแล้ว' : '💾 บันทึก'}</Button>
          </div>
        }
      />

      <div className="p-6 space-y-5">
        <Card className="p-5">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">📋 คำอธิบายเกรดลูกค้า</p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-5 mb-4">
            <li><strong>วันติดตามครั้งต่อไป</strong> — ระยะวันก่อนระบบจะนำลูกค้าเข้าคิวโทรซ้ำอัตโนมัติ</li>
            <li><strong>โควต้าบัตร</strong> — จำนวนลูกค้าสูงสุดที่ Telesale หนึ่งคนควรดูแลสำหรับเกรดนั้นๆ</li>
            <li><strong>ค่าคอม</strong> — กำหนดที่ระดับสินค้า (ดูที่หน้า &quot;สินค้า&quot;)</li>
          </ul>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {GRADES.map(g => (
            <Card key={g} className={cn('p-5 border-2', {
              A: 'border-emerald-200 dark:border-emerald-800',
              B: 'border-blue-200 dark:border-blue-800',
              C: 'border-amber-200 dark:border-amber-800',
              D: 'border-slate-200 dark:border-slate-700',
            }[g])}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge label={`${GRADE_EMOJI[g]} ${GRADE_LABEL[g]}`} className={cn('text-sm', GRADE_COLOR[g])} />
                  <p className="text-xs text-slate-500 mt-1">{customerCounts[g]} คนในระบบ</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    🗓️ วันที่ติดตามครั้งต่อไป
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={365}
                      value={settings.callDays[g]}
                      onChange={e => updateField('callDays', g, Number(e.target.value) || 0)}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    <span className="text-xs text-slate-500">วัน</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">หลังโทรครั้งล่าสุด ระบบจะนำลูกค้าเข้าคิวอีกครั้งใน {settings.callDays[g]} วัน</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    🎯 โควต้าบัตร / Telesale
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={500}
                      value={settings.cardLimit[g]}
                      onChange={e => updateField('cardLimit', g, Number(e.target.value) || 0)}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    <span className="text-xs text-slate-500">บัตร</span>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            ⚠️ <strong>หมายเหตุ:</strong> การเปลี่ยนค่า &quot;วันที่ติดตาม&quot; จะมีผลกับลูกค้าที่บันทึกผลโทรครั้งใหม่เท่านั้น ไม่กระทบกับลูกค้าที่มีนัดอยู่แล้ว
          </p>
        </Card>
      </div>
    </div>
  )
}
