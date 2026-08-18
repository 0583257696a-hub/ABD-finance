import type { MeetingSummaryData } from '@/types/summary'
import { filledEditedSections, filledFacts } from '@/lib/meeting-summary-doc'

/**
 * Read-only rendering of an archived meeting-summary document. Used by the
 * archive viewer (inside a Sheet) and by the print/PDF page, so both show
 * exactly the same content. `variant="print"` swaps design tokens for fixed
 * ink colours and enables page-break hints.
 */
export function MeetingSummaryDocument({ doc, variant = 'screen' }: { doc: MeetingSummaryData; variant?: 'screen' | 'print' }) {
  const print = variant === 'print'
  const facts = filledFacts(doc)
  const recommendations = (doc.recommendations || []).filter(item => item?.text?.trim())
  const followUps = (doc.manualFollowUps || []).filter(item => item?.text?.trim())
  const edited = filledEditedSections(doc)
  const screenshots = (doc.screenshots || []).filter(item => item?.imageData)

  const heading: React.CSSProperties = { color: print ? '#111827' : 'var(--text-heading)', fontSize: 15, fontWeight: 700, margin: '0 0 8px', paddingBottom: 4, borderBottom: `1px solid ${print ? '#D1D5DB' : 'var(--separator)'}` }
  const text: React.CSSProperties = { color: print ? '#1F2937' : 'var(--text-body, #374151)', fontSize: 14, lineHeight: 1.8, margin: 0, overflowWrap: 'anywhere' }
  const section: React.CSSProperties = { breakInside: 'avoid', minWidth: 0 }
  const factRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 12px', background: print ? '#F3F4F6' : 'var(--bg-surface-sunken)', borderRadius: 8, fontSize: 13.5, minWidth: 0 }
  const list: React.CSSProperties = { margin: 0, paddingInlineStart: 20, display: 'grid', gap: 6 }

  return (
    <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
      {doc.documentTitle && <h2 style={{ color: print ? '#111827' : 'var(--text-heading)', fontSize: 20, fontWeight: 700, margin: 0, overflowWrap: 'anywhere' }}>{doc.documentTitle}</h2>}
      {doc.clientLine && <p style={{ color: print ? '#4B5563' : 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>{doc.clientLine}</p>}

      {doc.introText && (
        <section style={section}>
          <h3 style={heading}>פתיחה</h3>
          <p style={text}>{doc.introText}</p>
        </section>
      )}

      {facts.length ? (
        <section style={section}>
          <h3 style={heading}>תמצית נתונים</h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {facts.map(fact => (
              <div key={fact.id} style={factRow}>
                <span style={{ color: print ? '#4B5563' : 'var(--text-muted)' }}>{fact.label}</span>
                <strong style={{ color: print ? '#111827' : 'var(--text-heading)', textAlign: 'start', overflowWrap: 'anywhere' }}>{fact.value}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {recommendations.length ? (
        <section style={section}>
          <h3 style={heading}>המלצות</h3>
          <ul style={list}>{recommendations.map(item => <li key={item.id} style={text}>{item.text}</li>)}</ul>
        </section>
      ) : null}

      {followUps.length ? (
        <section style={section}>
          <h3 style={heading}>המשך טיפול</h3>
          <ul style={list}>{followUps.map(item => <li key={item.id} style={text}>{item.text}</li>)}</ul>
        </section>
      ) : null}

      {edited.map(([key, body]) => (
        <section key={key} style={section}>
          <h3 style={heading}>{key}</h3>
          <p style={{ ...text, whiteSpace: 'pre-wrap' }}>{body}</p>
        </section>
      ))}

      {/* Same professional disclaimer as the live document — the archived copy / PDF is what
          the client actually receives, so it must carry it too (QA P2-1). */}
      <p style={{ ...text, fontSize: 12.5, color: print ? '#6B7280' : 'var(--text-muted)', borderTop: print ? '1px solid #D1D5DB' : '1px solid var(--separator)', paddingTop: 10, marginTop: 4 }}>
        המידע המוצג נועד לסייע בארגון וסיכום מידע בלבד ואינו מהווה ייעוץ פנסיוני, ביטוחי, משפטי, השקעות או מס. האחריות לבדיקת הנתונים וקבלת ההחלטות חלה על המשתמש.
      </p>

      {screenshots.length ? (
        <section style={section}>
          <h3 style={heading}>צילומי מסך</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {screenshots.map(shot => (
              <figure key={shot.id} style={{ margin: 0, breakInside: 'avoid' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.imageData} alt={shot.caption || 'צילום מסך מהפגישה'} style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, border: `1px solid ${print ? '#D1D5DB' : 'var(--separator)'}` }} />
                {shot.caption && <figcaption style={{ ...text, fontSize: 12.5, marginTop: 4 }}>{shot.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
