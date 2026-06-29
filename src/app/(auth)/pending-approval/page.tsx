import Link from 'next/link'

export default async function PendingApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams

  return (
    <main dir="rtl" style={pageStyle}>
      <section style={cardStyle}>
        <img src="/assets/abd-finance-logo.png" alt="ABD Finance" style={logoStyle} />
        <span style={pillStyle}>הבקשה התקבלה</span>
        <h1 style={titleStyle}>המשתמש ממתין לאישור מנהל מערכת</h1>
        <p style={textStyle}>
          {params.email ? `נרשמה בקשת הצטרפות עבור ${params.email}. ` : ''}
          לאחר אישור בפאנל האדמין ניתן יהיה להתחבר למערכת עם הסיסמה שהוגדרה בהרשמה.
        </p>
        <Link href="/login" style={buttonStyle}>חזרה למסך הכניסה</Link>
      </section>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 28,
  fontFamily: 'var(--font-main)',
  background: 'linear-gradient(135deg, #F8FBFF 0%, #EAF2FB 100%)',
}
const cardStyle: React.CSSProperties = {
  width: 'min(560px, 100%)',
  display: 'grid',
  justifyItems: 'center',
  gap: 16,
  textAlign: 'center',
  padding: 34,
  borderRadius: 26,
  background: '#fff',
  border: '1px solid #D7EAFB',
  boxShadow: 'var(--shadow-hover)',
}
const logoStyle: React.CSSProperties = { width: 170, height: 96, objectFit: 'contain' }
const pillStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: 999, background: '#EFF6FF', color: 'var(--abd-accent)', fontWeight: 900 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 30, fontWeight: 900 }
const textStyle: React.CSSProperties = { color: 'var(--text-muted)', lineHeight: 1.8 }
const buttonStyle: React.CSSProperties = { minHeight: 44, display: 'inline-flex', alignItems: 'center', borderRadius: 14, background: 'var(--abd-accent)', color: '#fff', padding: '0 18px', textDecoration: 'none', fontWeight: 900 }
