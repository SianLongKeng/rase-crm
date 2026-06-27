import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function clean(s: string | undefined): string | undefined {
  if (!s) return undefined
  // Strip whitespace, newlines, and accidentally pasted quotes
  const trimmed = s.trim().replace(/^["']|["']$/g, '').trim()
  return trimmed || undefined
}

const rawUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
const rawKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

let _supabase: SupabaseClient | null = null

if (rawUrl && rawKey) {
  try {
    // Validate URL format
    const u = new URL(rawUrl)
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      _supabase = createClient(rawUrl, rawKey)
    } else {
      console.warn('Supabase URL must be http(s)://...')
    }
  } catch (e) {
    console.warn('Invalid Supabase URL:', rawUrl, e)
  }
}

export const supabase = _supabase
export const isSupabaseEnabled = () => _supabase !== null
