import Link from 'next/link'

const links = [
  { href: '/terms', label: 'תנאי שימוש' },
  { href: '/privacy', label: 'מדיניות פרטיות' },
  { href: '/cookies', label: 'מדיניות עוגיות' },
  { href: '/accessibility', label: 'הצהרת נגישות' },
  { href: 'mailto:admin@abd-finance.co.il', label: 'יצירת קשר' },
]

export default function LegalFooter() {
  return (
    <footer style={footerStyle}>
      <nav aria-label="קישורים משפטיים" style={navStyle}>
        {links.map(link => (
          <Link key={link.href} href={link.href} style={linkStyle}>
            {link.label}
          </Link>
        ))}
      </nav>
      <span style={copyStyle}>© {new Date().getFullYear()} פגישה חכמה · ABD_FINANCE</span>
    </footer>
  )
}

const footerStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  justifyItems: 'center',
  padding: '22px 16px',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-main)',
  background: 'var(--bg-shell)',
}
const navStyle: React.CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }
const linkStyle: React.CSSProperties = { color: 'var(--abd-primary)', textDecoration: 'none', fontWeight: 800 }
const copyStyle: React.CSSProperties = { fontSize: 13 }
