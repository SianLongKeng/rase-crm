'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, Badge, Button, Modal, Input, Select, PageHeader } from '@/components/ui'
import { User, UserRole } from '@/types'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'เจ้าของ',
  telesale: 'เทเลเซล',
  packing: 'แพ็กสินค้า',
}

const ROLE_COLOR: Record<UserRole, string> = {
  owner: 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-700',
  telesale: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  packing: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
}

const ROLE_AVATAR: Record<UserRole, string> = {
  owner: 'from-violet-500 to-purple-600',
  telesale: 'from-emerald-500 to-teal-600',
  packing: 'from-orange-400 to-amber-500',
}

const ROLE_EMOJI: Record<UserRole, string> = {
  owner: '👑',
  telesale: '📞',
  packing: '📦',
}

function MemberForm({ initial, onSave, onClose, currentUserId, users }: {
  initial?: User | null
  onSave: (u: User) => void
  onClose: () => void
  currentUserId: string
  users: User[]
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(initial?.role ?? 'telesale')
  const [err, setErr] = useState('')

  const isEdit = !!initial
  const isSelf = initial?.id === currentUserId

  function handleSave() {
    if (!name.trim()) { setErr('กรุณากรอกชื่อ'); return }
    if (!email.trim()) { setErr('กรุณากรอกอีเมล'); return }
    if (!isEdit && !password.trim()) { setErr('กรุณากรอกรหัสผ่าน'); return }
    if (password && password.length < 4) { setErr('รหัสผ่านต้องมีอย่างน้อย 4 ตัว'); return }

    const emailLower = email.trim().toLowerCase()
    const duplicate = users.find(u => u.email.toLowerCase() === emailLower && u.id !== initial?.id)
    if (duplicate) { setErr('อีเมลนี้ถูกใช้แล้ว'); return }

    const user: User = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      email: emailLower,
      role,
      password: password.trim() || initial?.password,
    }
    onSave(user)
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}>
      <div className="space-y-4">
        {err && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            ⚠️ {err}
          </div>
        )}

        <Input
          label="ชื่อ-นามสกุล *"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="คุณสมชาย..."
        />
        <Input
          label="อีเมล *"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@rase.co.th"
        />
        <Input
          label={isEdit ? 'รหัสผ่านใหม่ (ว่างไว้ = ไม่เปลี่ยน)' : 'รหัสผ่าน *'}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <Select
          label="บทบาท *"
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          disabled={isSelf}
        >
          <option value="telesale">📞 เทเลเซล — โทรขาย + จัดการลูกค้า</option>
          <option value="packing">📦 แพ็กสินค้า — เห็นเฉพาะคิวแพ็ก</option>
          <option value="owner">👑 เจ้าของ — เข้าถึงทุกอย่าง</option>
        </Select>
        {isSelf && (
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-1">ไม่สามารถเปลี่ยนบทบาทของตัวเองได้</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave}>{isEdit ? 'บันทึก' : 'เพิ่มสมาชิก'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const user = state.currentUser
  const [form, setForm] = useState<{ open: boolean; member?: User | null }>({ open: false })

  if (user?.role !== 'owner') {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-6 py-8 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <p className="text-sm mt-1 opacity-70">เฉพาะ Owner เท่านั้น</p>
        </div>
      </div>
    )
  }

  function handleSave(member: User) {
    const isNew = !state.users.find(u => u.id === member.id)
    dispatch({ type: isNew ? 'ADD_USER' : 'UPDATE_USER', payload: member })
    setForm({ open: false })
  }

  function handleDelete(u: User) {
    if (u.id === user?.id) return
    const ownerCount = state.users.filter(x => x.role === 'owner').length
    if (u.role === 'owner' && ownerCount <= 1) {
      alert('ไม่สามารถลบ Owner คนสุดท้ายได้')
      return
    }
    if (!confirm(`ลบ "${u.name}" ออกจากทีม?`)) return
    dispatch({ type: 'DELETE_USER', payload: u.id })
  }

  const roleOrder: UserRole[] = ['owner', 'telesale', 'packing']
  const sorted = [...state.users].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))

  return (
    <div>
      <PageHeader
        title="จัดการทีม"
        subtitle={`${state.users.length} คน`}
        action={
          <Button onClick={() => setForm({ open: true })}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            เพิ่มสมาชิก
          </Button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Member list */}
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {sorted.map(u => {
              const isSelf = u.id === user?.id
              return (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {/* Avatar */}
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm', ROLE_AVATAR[u.role])}>
                    {u.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.name}</p>
                      {isSelf && <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">คุณ</span>}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                  </div>

                  {/* Role badge */}
                  <Badge label={`${ROLE_EMOJI[u.role]} ${ROLE_LABEL[u.role]}`} className={ROLE_COLOR[u.role]} />

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setForm({ open: true, member: u })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                      title="แก้ไข"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={isSelf}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isSelf ? 'ไม่สามารถลบตัวเองได้' : 'ลบ'}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Role permissions */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">สิทธิ์การเข้าถึงแต่ละบทบาท</p>
          <div className="space-y-3">
            {([
              { role: 'owner' as UserRole, access: ['Dashboard KPI', 'ฐานลูกค้า', 'คิวโทร', 'ออเดอร์', 'แพ็กสินค้า', 'สินค้า', 'ประวัติ', 'จัดการทีม'] },
              { role: 'telesale' as UserRole, access: ['คิวโทร', 'ฐานลูกค้า', 'ออเดอร์'] },
              { role: 'packing' as UserRole, access: ['แพ็กสินค้า'] },
            ]).map(r => (
              <div key={r.role} className="flex items-start gap-3">
                <Badge label={`${ROLE_EMOJI[r.role]} ${ROLE_LABEL[r.role]}`} className={cn('shrink-0', ROLE_COLOR[r.role])} />
                <p className="text-sm text-slate-600 dark:text-slate-400">{r.access.join(' · ')}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Login info */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 สมาชิกที่เพิ่มใหม่สามารถเข้าสู่ระบบได้ทันทีด้วยอีเมลและรหัสผ่านที่ตั้งไว้
          </p>
        </div>
      </div>

      {form.open && (
        <MemberForm
          initial={form.member}
          onSave={handleSave}
          onClose={() => setForm({ open: false })}
          currentUserId={user?.id ?? ''}
          users={state.users}
        />
      )}
    </div>
  )
}
