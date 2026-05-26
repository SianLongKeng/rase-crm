type ClassValue = string | undefined | null | false | 0

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(d: string | Date | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(d: string | Date | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatMoney(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0 })
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function isToday(d: string | Date): boolean {
  const today = new Date()
  const date = new Date(d)
  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
}

export function isDueToday(d: string | Date | undefined): boolean {
  if (!d) return false
  return new Date(d) <= new Date()
}

export function addDays(d: Date, days: number): string {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result.toISOString()
}

export function timeAgo(d: string | Date): string {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'เมื่อกี้'
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`
  const day = Math.floor(h / 24)
  if (day < 30) return `${day} วันที่แล้ว`
  return formatDate(d)
}
