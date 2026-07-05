import Link from 'next/link'

export type LegalSection = {
  id: string
  title: string
  body: string[]
}

export default function LegalPage({
  title,
  description,
  lastUpdated,
  sections,
}: {
  title: string
  description: string
  lastUpdated: string
  sections: LegalSection[]
}) {
  return (
    <main dir="rtl" style={pageStyle}>
      <div style={containerStyle}>
        <nav aria-label="פירורי לחם" style={breadcrumbStyle}>
          <Link href="/login" style={linkStyle}>כניסה</Link>
          <span>/</span>
          <span>{title}</span>
        </nav>

        <header style={heroStyle}>
          <p style={eyebrowStyle}>פגישה חכמה · ABD_FINANCE</p>
          <h1 style={titleStyle}>{title}</h1>
          <p style={descriptionStyle}>{description}</p>
          <p style={dateStyle}>עודכן לאחרונה: {lastUpdated}</p>
        </header>

        <div style={layoutStyle}>
          <aside style={tocStyle} aria-label="תוכן עניינים">
            <strong>תוכן עניינים</strong>
            {sections.map(section => (
              <a key={section.id} href={`#${section.id}`} style={tocLinkStyle}>{section.title}</a>
            ))}
          </aside>

          <article style={articleStyle}>
            {sections.map(section => (
              <section key={section.id} id={section.id} style={sectionStyle}>
                <h2 style={sectionTitleStyle}>{section.title}</h2>
                {section.body.map((paragraph, index) => (
                  <p key={index} style={paragraphStyle}>{paragraph}</p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-shell)',
  color: 'var(--text-body)',
  fontFamily: 'var(--font-main)',
  padding: '28px 18px',
}
const containerStyle: React.CSSProperties = { maxWidth: 1180, margin: '0 auto' }
const breadcrumbStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', marginBottom: 16, fontWeight: 800 }
const linkStyle: React.CSSProperties = { color: 'var(--abd-accent)', textDecoration: 'none' }
const heroStyle: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid #D7EAFB', borderRadius: 24, padding: 34, boxShadow: 'var(--shadow-card)', marginBottom: 18 }
const eyebrowStyle: React.CSSProperties = { color: 'var(--abd-accent)', fontWeight: 900, marginBottom: 8 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 42, lineHeight: 1.12, fontWeight: 900, marginBottom: 12 }
const descriptionStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 18, lineHeight: 1.8, maxWidth: 860 }
const dateStyle: React.CSSProperties = { color: 'var(--text-muted)', marginTop: 16, fontWeight: 800 }
const layoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18, alignItems: 'start' }
const tocStyle: React.CSSProperties = { position: 'sticky', top: 20, display: 'grid', gap: 10, background: 'var(--bg-card)', border: '1px solid #D7EAFB', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)', color: 'var(--abd-primary)' }
const tocLinkStyle: React.CSSProperties = { color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 800, lineHeight: 1.5 }
const articleStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const sectionStyle: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid #D7EAFB', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)' }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 24, fontWeight: 900, marginBottom: 12 }
const paragraphStyle: React.CSSProperties = { color: 'var(--text-body)', lineHeight: 1.9, fontSize: 16, marginBottom: 10 }
