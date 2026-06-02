'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AppProvider, useApp } from '@/lib/store'
import { Sidebar } from '@/components/layout/Sidebar'
import { UserRole } from '@/types'
import { homePathForRole } from '@/lib/utils'

const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard':  ['owner', 'admin'],
  '/import':     ['owner', 'admin'],
  '/grade-settings': ['owner', 'admin'],
  '/shipping-profiles': ['owner', 'admin'],
  '/queue':      ['telesale', 'owner', 'admin'],
  '/customers':  ['owner', 'admin', 'telesale'],
  '/packing':    ['packing', 'owner', 'admin'],
  '/commission': ['owner', 'admin', 'telesale'],
  '/profit':     ['owner', 'admin'],
  '/products':   ['owner', 'admin'],
  '/history':    ['owner', 'admin'],
  '/settings':   ['owner'],
}

function Inner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { state } = useApp()

  useEffect(() => {
    if (state.isLoading) return
    if (!state.currentUser) { router.replace('/login'); return }
    const allowed = ROUTE_ROLES[pathname]
    if (allowed && !allowed.includes(state.currentUser.role)) {
      router.replace(homePathForRole(state.currentUser.role))
    }
  }, [state.isLoading, state.currentUser, pathname, router])

  if (state.isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-black text-[11px] leading-none">CNP</span>
        </div>
        <p className="text-slate-400 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  )

  if (!state.currentUser) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider><Inner>{children}</Inner></AppProvider>
}
