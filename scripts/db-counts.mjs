// Count rows in all CNP CRM tables via the Supabase pooler.
// Usage: node scripts/db-counts.mjs <projectRef> <dbPassword>
import pg from 'pg'
const [, , ref, password] = process.argv
const client = new pg.Client({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})
await client.connect()
const tables = ['profiles','customers','products','orders','call_logs','history_logs','shipping_profiles','grade_settings']
for (const t of tables) {
  const r = await client.query(`select count(*)::int as n from public.${t}`)
  console.log(`${t.padEnd(18)} ${r.rows[0].n}`)
}
await client.end()
