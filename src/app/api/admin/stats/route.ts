import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { getAdminStats } from '@/lib/admin/admin-db'

/** Admin: dashboard counters, all computed from real tables. */
export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const stats = await getAdminStats()
  if (!stats) return NextResponse.json({ stats: null, mode: 'static-auth' })
  return NextResponse.json({ stats, mode: 'd1' })
}
