// Run a SQL file against Supabase via the connection pooler (IPv4).
// Tries multiple regions since we don't know which one the project is in.
// Usage: node scripts/run-sql.mjs <sqlFile> <projectRef> <dbPassword>
import { readFileSync } from 'node:fs'
import pg from 'pg'

const [, , sqlFile, ref, password] = process.argv
if (!sqlFile || !ref || !password) {
  console.error('Usage: node scripts/run-sql.mjs <sqlFile> <projectRef> <dbPassword>')
  process.exit(1)
}

const sql = readFileSync(sqlFile, 'utf8')

const regions = [
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'sa-east-1', 'ca-central-1',
]
const prefixes = ['aws-0', 'aws-1']

const hosts = []
for (const r of regions) for (const p of prefixes) hosts.push(`${p}-${r}.pooler.supabase.com`)

async function tryHost(host) {
  const client = new pg.Client({
    host,
    port: 5432,
    user: `postgres.${ref}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 7000,
    statement_timeout: 60000,
  })
  await client.connect()
  return client
}

let client = null
let connectedHost = null
for (const host of hosts) {
  try {
    client = await tryHost(host)
    connectedHost = host
    break
  } catch (e) {
    const msg = (e && e.message) || String(e)
    // Wrong region / tenant not found / timeout -> keep trying. Auth fail -> password wrong.
    if (/password authentication failed/i.test(msg)) {
      console.error(`❌ Connected region but WRONG DB PASSWORD (${host}). Check the database password.`)
      process.exit(2)
    }
    // else: try next host
  }
}

if (!client) {
  console.error('❌ Could not connect to any pooler region. (firewall, wrong password, or unusual region)')
  process.exit(3)
}

console.log(`✅ Connected via ${connectedHost}`)
try {
  await client.query(sql)
  console.log('✅ SQL executed successfully — tables, RLS, realtime all set up.')
} catch (e) {
  console.error('❌ SQL error:', e.message)
  process.exit(4)
} finally {
  await client.end()
}
