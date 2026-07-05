import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { exportD1UserData, writeAuditEvent } from '@/lib/system-db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await exportD1UserData(session.user.id)
  if (!data) return NextResponse.json({ error: 'Data export unavailable' }, { status: 503 })
  await writeAuditEvent({ actorEmail: session.user.email, action: 'privacy.data_exported', targetId: session.user.id })

  return NextResponse.json(data, {
    headers: {
      'Content-Disposition': 'attachment; filename="smart-meeting-user-data.json"',
    },
  })
}
