import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/admin/create-user
 * Body: { email, password, name, role, department?, commissionRate? }
 * Headers: Authorization: Bearer <caller's access token>
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in env (server-only, never exposed).
 * Verifies caller is admin/owner before creating user.
 */
export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !anonKey || !serviceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Verify caller
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })

    const userClient = createClient(url, anonKey)
    const { data: callerData, error: callerErr } = await userClient.auth.getUser(token)
    if (callerErr || !callerData.user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

    // Check caller's role
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', callerData.user.id)
      .single()
    if (!callerProfile || (callerProfile.role !== 'owner' && callerProfile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden — admin/owner only' }, { status: 403 })
    }

    // Parse body
    const body = await req.json()
    const { email, password, name, role, department, commissionRate } = body
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (!['owner', 'admin', 'telesale', 'packing'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create user (skip email confirmation — admin can communicate password directly)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 })
    }

    // Upsert profile with full details
    if (created.user) {
      await admin.from('profiles').upsert({
        id: created.user.id,
        name,
        email,
        role,
        department: department ?? null,
        commission_rate: commissionRate ?? null,
        active: true,
      })
    }

    return NextResponse.json({ user: created.user })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
