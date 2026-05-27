export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div dir="rtl" style={{ background: 'var(--bg-sidebar)', minHeight: '100vh' }}>
      {children}
    </div>
  )
}
