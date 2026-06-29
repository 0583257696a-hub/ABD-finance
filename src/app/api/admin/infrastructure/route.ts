import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminInfrastructureDefaults } from '@/lib/admin/defaults'

type AdminSession = {
  user?: {
    email?: string | null
    role?: string | null
  }
} | null

function isAdmin(session: AdminSession) {
  return session?.user?.role === 'admin' || session?.user?.email === 'admin@abd-finance.co.il'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  return NextResponse.json({
    mode: 'infrastructure-only',
    connected: {
      landingPage: false,
      registration: false,
      crm: false,
      subscriptions: false,
      auditPersistence: false,
    },
    infrastructure: adminInfrastructureDefaults,
  })
}
