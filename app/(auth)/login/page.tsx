'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import { useTheme } from '@/lib/theme'
import { homePathForRole } from '@/lib/utils'

type Theme = 'light' | 'dark'

const DEMO_ACCOUNTS = [
  { role: 'Owner',    emoji: '👑', email: 'owner@cnp.co.th', password: '1234' },
  { role: 'Admin',    emoji: '🛠️', email: 'admin@cnp.co.th', password: '1234' },
  { role: 'Telesale', emoji: '📞', email: 'tele1@cnp.co.th', password: '1234' },
  { role: 'Packing',  emoji: '📦', email: 'pack1@cnp.co.th', password: '1234' },
  { role: 'Checker',  emoji: '🚚', email: 'check@cnp.co.th', password: '1234' },
]

export default function LoginPage() {
  const router = useRouter()
  const { state, login } = useApp()
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitWith(em: string, pw: string) {
    setError('')
    setLoading(true)
    const ok = await login(em, pw)
    if (ok) {
      const u = state.users.find(x => x.email === em)
      router.push(homePathForRole(u?.role))
    }
    else { setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); setLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submitWith(email, password)
  }

  function fillDemo(acc: typeof DEMO_ACCOUNTS[number]) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>

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
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/50 mb-4">
            <span className="text-white font-black text-2xl">CNP</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">CHANAPHAT659</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Telesales System</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl dark:shadow-2xl">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on" method="post" action="#">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">อีเมล</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@cnp.co.th"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">รหัสผ่าน</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} aria-label="แสดง/ซ่อนรหัสผ่าน"
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

          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider text-center">
              🪄 บัญชีทดลอง — กดเพื่อ Autofill
            </p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {DEMO_ACCOUNTS.slice(0, 3).map(acc => (
                <button key={acc.role} type="button" onClick={() => fillDemo(acc)}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{acc.emoji}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{acc.role}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {DEMO_ACCOUNTS.slice(3).map(acc => (
                <button key={acc.role} type="button" onClick={() => fillDemo(acc)}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{acc.emoji}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{acc.role}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => submitWith(DEMO_ACCOUNTS[0].email, DEMO_ACCOUNTS[0].password)}
              disabled={loading}
              className="w-full text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl py-2 transition-all disabled:opacity-50 mb-2"
            >
              ⚡ Auto-login เป็น Owner (Demo)
            </button>

            <button
              type="button"
              onClick={() => {
                if (!confirm('รีเซ็ตข้อมูลทั้งหมดกลับเป็น mock data ตัวอย่างใช่หรือไม่?')) return
                try {
                  localStorage.removeItem('crm_data')
                  localStorage.removeItem('crm_user')
                } catch {}
                window.location.reload()
              }}
              className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-slate-200 dark:border-slate-700 rounded-xl py-2 transition-all"
            >
              🔄 Reset Demo Data (โหลด mock ใหม่ทั้งหมด)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
