import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import CommandPalette from '@/components/features/CommandPalette'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authDisabled = process.env.DISABLE_LOGIN === 'true'
  const session = authDisabled ? null : await getServerSession(authOptions)
  if (!authDisabled && !session) redirect('/login')

  return (
    <div dir="rtl" style={{ background: 'var(--bg-shell)', minHeight: '100vh' }}>
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <CommandPalette />
      <main
        style={{
          minHeight: '100vh',
          marginRight: 'var(--sidebar-width, 212px)',
          width: 'calc(100% - var(--sidebar-width, 212px))',
          padding: 24,
          transition: 'margin-right var(--duration-base) var(--easing-standard), width var(--duration-base) var(--easing-standard)',
        }}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
