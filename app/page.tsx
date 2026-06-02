'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppProvider, useApp } from '@/lib/store'
import { homePathForRole } from '@/lib/utils'

function RootInner() {
  const router = useRouter()
  const { state } = useApp()

  useEffect(() => {
    if (state.isLoading) return
    if (!state.currentUser) router.replace('/login')
    else router.replace(homePathForRole(state.currentUser.role))
  }, [state.isLoading, state.currentUser, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-black text-[11px] leading-none">CNP</span>
        </div>
        <p className="text-slate-400 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  )
}

export default function Root() {
  return <AppProvider><RootInner /></AppProvider>
}
