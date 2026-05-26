'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import { useTheme } from '@/lib/theme'

type Theme = 'light' | 'dark'

const DEMO_ACCOUNTS = [
  { role: 'Owner', emoji: '👑', email: 'owner@rase.co.th', password: '1234' },
  { role: 'Telesale', emoji: '📞', email: 'tele1@rase.co.th', password: '1234' },
  { role: 'Packing', emoji: '📦', email: 'pack1@rase.co.th', password: '1234' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useApp()
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(email, password)
    if (ok) router.push('/dashboard')
    else { setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); setLoading(false) }
  }

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>

      {/* Theme picker — top right */}
      <div className="absolute top-5 right-5 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
        {([['light', '☀️', 'สว่าง'], ['dark', '🌙', 'มืด']] as [Theme, string, string][]).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTheme(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              theme === t
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/50 mb-4">
            <span className="text-white font-black text-2xl">RC</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">RASE CRM</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Telesales System</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl dark:shadow-2xl">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">อีเมล</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@rase.co.th" required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white dark:focus:bg-slate-700 transition-all" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">รหัสผ่าน</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white dark:focus:bg-slate-700 transition-all" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 disabled:opacity-50 text-sm mt-1">
              {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider text-center">กดเพื่อ autofill บัญชีทดลอง</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.role} onClick={() => { setEmail(acc.email); setPassword(acc.password); setError('') }}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{acc.emoji}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
