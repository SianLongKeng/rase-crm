'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/lib/store'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { UserRole, ROLE_LABEL } from '@/types'

const navItems: { href: string; label: string; roles: UserRole[]; emoji: string }[] = [
  { href: '/dashboard',  label: 'ภาพรวม',         roles: ['owner', 'admin'],             emoji: '📊' },
  { href: '/products',   label: 'สินค้า',          roles: ['owner', 'admin'],             emoji: '🛍️' },
  { href: '/import',     label: 'นำเข้าออเดอร์',   roles: ['owner', 'admin'],             emoji: '📥' },
  { href: '/grade-settings', label: 'เกรดลูกค้า',  roles: ['owner', 'admin'],             emoji: '🏆' },
  { href: '/customers',  label: 'ฐานลูกค้า',       roles: ['owner', 'admin', 'telesale'], emoji: '👥' },
  { href: '/queue',      label: 'คิวโทรวันนี้',   roles: ['telesale', 'owner', 'admin'], emoji: '📞' },
  { href: '/packing',    label: 'แพ็คสินค้า',     roles: ['packing', 'owner', 'admin'],  emoji: '📦' },
  { href: '/commission', label: 'ค่าคอมมิชชั่น',   roles: ['owner', 'admin', 'telesale'], emoji: '💰' },
  { href: '/profit',     label: 'กำไร',             roles: ['owner', 'admin'],             emoji: '📈' },
  { href: '/settings',   label: 'จัดการทีม',       roles: ['owner'],                      emoji: '⚙️' },
  { href: '/history',    label: 'ประวัติ',         roles: ['owner', 'admin'],             emoji: '🕒' },
]

const roleBg: Record<UserRole, string> = {
  owner:    'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  admin:    'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  telesale: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  packing:  'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
}

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { state, logout } = useApp()
  const { theme, setTheme } = useTheme()
  const user = state.currentUser
  const role = user?.role ?? 'telesale'

  const waitPack = state.orders.filter(o => o.status === 'wait_pack' || o.status === 'in_myorder').length
  const shipping = state.orders.filter(o => o.status === 'shipping').length
  const packBadge = role === 'packing' ? waitPack + shipping : waitPack
  const todayQueue = state.customers.filter(c => {
    if (!c.nextCallAt || new Date(c.nextCallAt) > new Date()) return false
    if (role === 'telesale') return c.ownerId === user?.id
    return true
  }).length
  const badges: Record<string, number> = {
    '/packing': packBadge,
    '/queue': todayQueue,
  }
  const visible = navItems.filter(n => n.roles.includes(role))

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-[10px] leading-none">CNP</span>
          </div>
          <div>
            <p className="font-black text-slate-800 dark:text-slate-100 text-sm">CHANAPHAT659</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Telesales System</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {visible.map(item => {
          const isActive = pathname === item.href
          const badge = badges[item.href] ?? 0
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-all',
                isActive ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
              )}>
                {item.emoji}
              </span>
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center font-bold shrink-0">{badge}</span>
              )}
              {isActive && <div className="w-1 h-4 bg-emerald-500 rounded-full shrink-0" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {([['light', '☀️', 'สว่าง'], ['dark', '🌙', 'มืด']] as const).map(([t, icon, label]) => (
            <button key={t} onClick={() => setTheme(t)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                theme === t
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}>
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name}</p>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', roleBg[role])}>{ROLE_LABEL[role]}</span>
            </div>
          </div>
        </div>

        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-white font-black text-[9px] leading-none">CNP</span>
          </div>
          <span className="font-black text-slate-800 dark:text-slate-100 text-sm">CHANAPHAT659</span>
        </div>
        <button onClick={() => setOpen(true)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside className={cn('lg:hidden fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300 shadow-2xl', open ? 'translate-x-0' : '-translate-x-full')}>
        <NavContent onClose={() => setOpen(false)} />
      </aside>
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64">
        <NavContent />
      </aside>
    </>
  )
}
