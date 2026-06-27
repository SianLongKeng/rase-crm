// ============================================================
// Create the FIRST admin/owner user on a fresh Supabase project.
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
//
// Usage:
//   node scripts/create-admin.mjs <email> <password> [name] [role]
// Example:
//   node scripts/create-admin.mjs admincnp912@gmail.com "Admincnp.1234" "Admin CNP" owner
// role defaults to "owner". Valid: owner | admin | telesale | packing
// ============================================================
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

function loadEnv(path) {
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = loadEnv(envPath)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const [, , email, password, name = 'Admin', role = 'owner'] = process.argv
if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [name] [role]')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

console.log(`→ Creating ${role} user ${email} on ${url} ...`)

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name, role },
})

if (error) {
  console.error('❌ createUser failed:', error.message)
  process.exit(1)
}

// Ensure the profile row has the correct role/name (trigger may default to telesale)
const { error: pErr } = await admin.from('profiles').upsert({
  id: data.user.id,
  name,
  email,
  role,
  active: true,
})

if (pErr) {
  console.error('⚠️  User created but profile upsert failed:', pErr.message)
  process.exit(1)
}

console.log(`✅ Done. Login with:\n   email:    ${email}\n   password: ${password}\n   role:     ${role}`)
