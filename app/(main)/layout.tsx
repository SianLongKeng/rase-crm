'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppProvider, useApp } from '@/lib/store'
import { Sidebar } from '@/components/layout/Sidebar'

function Inner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { state } = useApp()

  useEffect(() => {
    if (!state.isLoading && !state.currentUser) router.replace('/login')
  }, [state.isLoading, state.currentUser, router])

  if (state.isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-black text-base">RC</span>
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
