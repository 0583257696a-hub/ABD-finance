import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

/**
 * MeetingShell root — deliberately does NOT render the dashboard Sidebar.
 * This is a separate layout tree from `(dashboard)/layout.tsx`; the two
 * never nest. The actual shell chrome (header/nav) lives in the page itself
 * since it needs client-side session-timer state — this layout only
 * enforces the auth boundary, matching the dashboard layout's pattern.
 */
export default async function MeetingLayout({ children }: { children: React.ReactNode }) {
  const authDisabled = process.env.DISABLE_LOGIN === 'true'
  const session = authDisabled ? null : await getServerSession(authOptions)
  if (!authDisabled && !session) redirect('/login')

  return <div dir="rtl" style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>{children}</div>
}
