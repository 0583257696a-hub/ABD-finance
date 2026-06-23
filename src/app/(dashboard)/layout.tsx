import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authDisabled = process.env.DISABLE_LOGIN !== 'false'
  const session = authDisabled ? null : await getServerSession(authOptions)
  if (!authDisabled && !session) redirect('/login')

  return (
    <div dir="rtl" style={{ background: 'var(--bg-shell)', minHeight: '100vh' }}>
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <main
        style={{
          minHeight: '100vh',
          marginRight: 104,
          width: 'calc(100% - 104px)',
          padding: 24,
        }}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
