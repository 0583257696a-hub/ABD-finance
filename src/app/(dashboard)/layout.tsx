import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div dir="rtl" style={{ background: 'var(--bg-shell)', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          minHeight: '100vh',
          marginRight: 104,
          width: 'calc(100% - 104px)',
          padding: 24,
        }}
      >
        {children}
      </main>
    </div>
  )
}
