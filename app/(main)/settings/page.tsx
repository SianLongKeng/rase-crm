'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/lib/store'
import { Card, Badge, Button, Modal, Input, Select, PageHeader } from '@/components/ui'
import {
  User, UserRole, ROLE_LABEL,
  Permission, PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS,
} from '@/types'
import { generateId, formatDateTime, cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

const ROLE_COLOR: Record<UserRole, string> = {
  owner:    'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300',
  admin:    'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300',
  telesale: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300',
  packing:  'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
}

const ROLE_AVATAR: Record<UserRole, string> = {
  owner:    'from-violet-500 to-purple-600',
  admin:    'from-cyan-500 to-blue-600',
  telesale: 'from-emerald-500 to-teal-600',
  packing:  'from-orange-400 to-amber-500',
}

const ROLE_EMOJI: Record<UserRole, string> = {
  owner: '👑', admin: '🛠️', telesale: '📞', packing: '📦',
}

export default function SettingsPage() {
  const { state, dispatch, addHistory } = useApp()
  const user = state.currentUser
  const [search, setSearch] = useState('')
  const [editFor, setEditFor] = useState<User | null>(null)
  const [showNewMember, setShowNewMember] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

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

  const counts = {
    total: state.users.length,
    owner: state.users.filter(u => u.role === 'owner').length,
    admin: state.users.filter(u => u.role === 'admin').length,
    telesale: state.users.filter(u => u.role === 'telesale').length,
    packing: state.users.filter(u => u.role === 'packing').length,
  }

  const filtered = state.users.filter(u =>
    !search || u.name.includes(search) || u.email.includes(search)
  )

  function handleSaveMember(member: User) {
    const isNew = !state.users.find(u => u.id === member.id)
    dispatch({ type: isNew ? 'ADD_USER' : 'UPDATE_USER', payload: member })
    addHistory(isNew ? 'member_added' : 'member_edited',
      `${isNew ? 'เพิ่ม' : 'แก้ไข'}สมาชิก ${member.name}`, member.id, 'user')
    setEditFor(null)
    setShowNewMember(false)
  }

  function handleDelete(u: User) {
    if (u.id === user?.id) return
    const ownerCount = state.users.filter(x => x.role === 'owner').length
    if (u.role === 'owner' && ownerCount <= 1) { alert('ไม่สามารถลบ Owner คนสุดท้ายได้'); return }
    if (!confirm(`ลบ "${u.name}"?`)) return
    dispatch({ type: 'DELETE_USER', payload: u.id })
  }

  function toggleActive(u: User) {
    dispatch({ type: 'UPDATE_USER', payload: { ...u, active: u.active === false ? true : false } })
  }

  function handleBackup() {
    const data = { users: state.users, customers: state.customers, products: state.products, callLogs: state.callLogs, orders: state.orders, history: state.history }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `cnp-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!data.users || !data.customers) throw new Error('invalid')
        dispatch({ type: 'RESTORE_DATA', payload: data })
        localStorage.setItem('crm_data', JSON.stringify(data))
        setImportMsg({ type: 'ok', text: 'นำเข้าข้อมูลสำเร็จ' })
      } catch { setImportMsg({ type: 'err', text: 'ไฟล์ไม่ถูกต้อง' }) }
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  function handleExportExcel() {
    const wb = XLSX.utils.book_new()
    const usersData = state.users.map(u => ({ ชื่อ: u.name, อีเมล: u.email, บทบาท: ROLE_LABEL[u.role], แผนก: u.department ?? '', เปอร์เซ็นต์คอม: u.commissionRate ?? '', สถานะ: u.active !== false ? 'ใช้งาน' : 'ปิดใช้งาน' }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersData), 'สมาชิก')
    XLSX.writeFile(wb, `cnp-team-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div>
      <PageHeader
        title="จัดการทีม"
        subtitle="จัดการสมาชิกและสิทธิ์การใช้งานระบบ"
        action={
          <div className="flex gap-2">
            <Input placeholder="🔍 ค้นหาสมาชิก..." value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
            <Button onClick={() => setShowNewMember(true)}>+ เพิ่มสมาชิก</Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatChip label="ทั้งหมด" value={counts.total} unit="คน" color="slate" />
          <StatChip label="เจ้าของ" value={counts.owner} unit="คน" color="violet" emoji="👑" />
          <StatChip label="แอดมิน" value={counts.admin} unit="คน" color="cyan" emoji="🛠️" />
          <StatChip label="เทเลเซล" value={counts.telesale} unit="คน" color="emerald" emoji="📞" />
          <StatChip label="แพ็คสินค้า" value={counts.packing} unit="คน" color="orange" emoji="📦" />
        </div>

        {/* Member table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-3 px-4">สมาชิก</th>
                  <th className="text-left py-3 px-4">บทบาท</th>
                  <th className="text-left py-3 px-4">แผนก</th>
                  <th className="text-right py-3 px-4">เปอร์เซ็นต์คอม</th>
                  <th className="text-center py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm', ROLE_AVATAR[u.role])}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            {u.name}
                            {u.id === user?.id && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">คุณ</span>}
                            {u.role === 'owner' && <span title="Owner">🛡️</span>}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge label={`${ROLE_EMOJI[u.role]} ${ROLE_LABEL[u.role]}`} className={ROLE_COLOR[u.role]} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{u.department ?? '—'}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200 font-semibold">
                      {u.role === 'telesale' && u.commissionRate != null ? `${u.commissionRate}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => toggleActive(u)}
                        className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                          u.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600')}>
                        {u.active !== false ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => setEditFor(u)} className="text-slate-400 hover:text-emerald-600 mr-2" title="แก้ไข">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(u)} disabled={u.id === user?.id} className="text-red-400 hover:text-red-500 disabled:opacity-30" title="ลบ">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Activity log */}
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">ประวัติกิจกรรมล่าสุด</p>
            <button className="text-xs text-emerald-600 font-semibold">ดูทั้งหมด</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left py-2 px-3">เวลา</th>
                <th className="text-left py-2 px-3">ผู้ใช้</th>
                <th className="text-left py-2 px-3">การกระทำ</th>
                <th className="text-left py-2 px-3">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {state.history.filter(h => h.relatedType === 'user' || h.eventType === 'member_added' || h.eventType === 'member_edited' || h.eventType === 'permission_changed').slice(0, 10).map(h => (
                <tr key={h.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 px-3 text-slate-500">{formatDateTime(h.createdAt)}</td>
                  <td className="py-2 px-3 font-semibold">{h.userName}</td>
                  <td className="py-2 px-3">{h.eventType === 'member_added' ? 'เพิ่มสมาชิก' : h.eventType === 'permission_changed' ? 'แก้ไขสิทธิ์' : 'แก้ไขข้อมูล'}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{h.description}</td>
                </tr>
              ))}
              {state.history.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400">ยังไม่มีประวัติ</td></tr>}
            </tbody>
          </table>
        </Card>

        {/* Backup */}
        <Card className="p-4">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">สำรองข้อมูล (Backup)</p>
          <p className="text-xs text-slate-400 mb-3">Export ข้อมูลทั้งหมดเป็นไฟล์ .json แล้ว Import กลับได้ทุกเมื่อ</p>
          {importMsg && (
            <p className={cn('text-xs px-3 py-2 rounded-lg mb-3',
              importMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
              {importMsg.text}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={handleBackup}>📥 Backup (.json)</Button>
            <Button size="sm" variant="secondary" onClick={handleExportExcel}>📊 Export Excel</Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>📤 Import Backup</Button>
          </div>
        </Card>
      </div>

      {(editFor || showNewMember) && (
        <MemberEditPanel
          initial={editFor}
          users={state.users}
          currentUserId={user?.id ?? ''}
          onSave={handleSaveMember}
          onClose={() => { setEditFor(null); setShowNewMember(false) }}
        />
      )}
    </div>
  )
}

function StatChip({ label, value, unit, color, emoji }: { label: string; value: number; unit: string; color: string; emoji?: string }) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg',
        color === 'slate' && 'bg-slate-100 dark:bg-slate-800',
        color === 'violet' && 'bg-violet-100 dark:bg-violet-900/30',
        color === 'cyan' && 'bg-cyan-100 dark:bg-cyan-900/30',
        color === 'emerald' && 'bg-emerald-100 dark:bg-emerald-900/30',
        color === 'orange' && 'bg-orange-100 dark:bg-orange-900/30',
      )}>
        {emoji ?? '👥'}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-black"><span className={cn(
          color === 'violet' && 'text-violet-600',
          color === 'cyan' && 'text-cyan-600',
          color === 'emerald' && 'text-emerald-600',
          color === 'orange' && 'text-orange-600',
        )}>{value}</span> <span className="text-xs text-slate-400">{unit}</span></p>
      </div>
    </Card>
  )
}

function MemberEditPanel({ initial, users, currentUserId, onSave, onClose }: {
  initial?: User | null
  users: User[]
  currentUserId: string
  onSave: (u: User) => void
  onClose: () => void
}) {
  const isEdit = !!initial
  const [tab, setTab] = useState<'info' | 'perms'>('info')
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(initial?.role ?? 'telesale')
  const [department, setDepartment] = useState(initial?.department ?? '')
  const [commissionRate, setCommissionRate] = useState(String(initial?.commissionRate ?? 5))
  const [active, setActive] = useState(initial?.active !== false)
  const [perms, setPerms] = useState<Permission[]>(
    initial?.permissions ?? DEFAULT_ROLE_PERMISSIONS[initial?.role ?? 'telesale']
  )
  const [err, setErr] = useState('')

  const isSelf = initial?.id === currentUserId

  function togglePerm(p: Permission) {
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function handleSave() {
    if (!name.trim() || !email.trim()) { setErr('กรุณากรอกชื่อและอีเมล'); return }
    if (!isEdit && !password) { setErr('กรุณากรอกรหัสผ่าน'); return }
    if (password && password.length < 4) { setErr('รหัสผ่านอย่างน้อย 4 ตัว'); return }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== initial?.id)) { setErr('อีเมลซ้ำ'); return }
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(), email: email.trim().toLowerCase(),
      role, department: department.trim() || undefined,
      password: password.trim() || initial?.password,
      commissionRate: role === 'telesale' ? Number(commissionRate) || 0 : undefined,
      permissions: perms,
      active,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm', ROLE_AVATAR[role])}>
              {name.charAt(0) || 'N'}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">{isEdit ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}</p>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
          </div>
          <select value={active ? 'on' : 'off'} onChange={e => setActive(e.target.value === 'on')}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs">
            <option value="on">ใช้งาน</option>
            <option value="off">ปิดใช้งาน</option>
          </select>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">✕</button>
        </div>

        <div className="border-b border-slate-100 dark:border-slate-800 px-5 flex gap-4">
          {[
            { k: 'info' as const, label: 'ข้อมูลสมาชิก' },
            { k: 'perms' as const, label: 'บทบาทและสิทธิ์' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={cn('text-xs font-semibold py-3 px-1 border-b-2',
                tab === t.k ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {err && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">⚠️ {err}</p>}

          {tab === 'info' && (
            <>
              <Input label="ชื่อ-นามสกุล *" value={name} onChange={e => setName(e.target.value)} />
              <Input label="อีเมล *" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <Input label={isEdit ? 'รหัสผ่านใหม่ (ว่าง = ไม่เปลี่ยน)' : 'รหัสผ่าน *'} type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <Input label="แผนก" value={department} onChange={e => setDepartment(e.target.value)} placeholder="ฝ่ายขาย / คลังสินค้า..." />
              {role === 'telesale' && (
                <Input label="เปอร์เซ็นต์ค่าคอม (%)" type="number" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} />
              )}
              {isSelf && <p className="text-xs text-slate-400 italic">ไม่สามารถเปลี่ยนบทบาทตัวเองได้</p>}
            </>
          )}

          {tab === 'perms' && (
            <>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">บทบาท (Role)</label>
                <Select value={role} onChange={e => {
                  const newRole = e.target.value as UserRole
                  setRole(newRole)
                  setPerms(DEFAULT_ROLE_PERMISSIONS[newRole])
                }} disabled={isSelf}>
                  <option value="telesale">📞 เทเลเซล</option>
                  <option value="packing">📦 แพ็คสินค้า</option>
                  <option value="admin">🛠️ แอดมิน</option>
                  <option value="owner">👑 เจ้าของ</option>
                </Select>
                <p className="text-xs text-slate-400 mt-1">กำหนดตามบทบาทหลักของสมาชิก</p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">สิทธิ์การใช้งาน (Permission)</p>
                <div className="space-y-3">
                  {PERMISSION_GROUPS.map(g => (
                    <details key={g.key} className="border border-slate-100 dark:border-slate-800 rounded-xl" open>
                      <summary className="px-3 py-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 list-none flex items-center justify-between">
                        <span>{g.label}</span>
                        <span className="text-slate-400">▾</span>
                      </summary>
                      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                        {g.perms.map(p => (
                          <label key={p.key} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={perms.includes(p.key)} onChange={() => togglePerm(p.key)}
                              className="accent-emerald-500" />
                            <span className="text-slate-600 dark:text-slate-300">{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-slate-900">
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave}>{isEdit ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มสมาชิก'}</Button>
        </div>
      </div>
    </div>
  )
}
