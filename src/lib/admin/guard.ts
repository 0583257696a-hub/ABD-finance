import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin } from '@/lib/security'

/**
 * Single admin gate for every /api/admin/* handler: same-origin check on
 * mutations (CSRF), then an admin session. Returns either the admin's
 * identity or the response to send back — so no route can forget one half.
 */
export type AdminIdentity = { email: string; name: string }

export async function requireAdmin(request: Request): Promise<{ admin: AdminIdentity; response?: undefined } | { admin?: undefined; response: NextResponse }> {
  const csrf = requireSameOrigin(request)
  if (csrf) return { response: csrf }
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || ''
  const isAdmin = session?.user?.role === 'admin' || email.toLowerCase() === 'admin@abd-finance.co.il'
  if (!email || !isAdmin) {
    return { response: NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 }) }
  }
  return { admin: { email, name: session?.user?.name || email } }
}

export function d1Unavailable() {
  return NextResponse.json({ error: 'מסד הנתונים (Cloudflare D1) אינו זמין בסביבה זו.' }, { status: 503 })
}
