'use client'

import { use, useEffect, useState } from 'react'
import { MeetingSummaryDocument } from '@/components/features/MeetingSummaryDocument'
import { parseSummaryDocument, summaryHasContent } from '@/lib/meeting-summary-doc'
import type { MeetingSummaryData } from '@/types/summary'

/**
 * Print-optimized view of an archived meeting summary, for the advisor.
 * "הורד PDF" works through the browser's print dialog (destination: save as
 * PDF) — auto-opened on load. Data comes from the advisor's own authenticated
 * /api/meeting-summaries, so a summary id here is only viewable by its owner.
 * Same pattern as /client-form-print.
 */

type SummaryDetail = {
  id: string
  title: string
  client_name: string
  source: string
  meeting_started_at: string | null
  meeting_ended_at: string | null
  created_at: string
  summary_json: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function MeetingSummaryPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [summary, setSummary] = useState<SummaryDetail | null>(null)
  const [doc, setDoc] = useState<MeetingSummaryData | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    fetch(`/api/meeting-summaries?id=${encodeURIComponent(id)}`)
      .then(async response => {
        if (!response.ok) throw new Error('failed')
        const data = await response.json() as { summary: SummaryDetail }
        setSummary(data.summary)
        setDoc(parseSummaryDocument(data.summary.summary_json))
        setState('ready')
        // Give fonts/layout (and any embedded screenshots) a beat before the print dialog.
        setTimeout(() => window.print(), 700)
      })
      .catch(() => setState('error'))
  }, [id])

  useEffect(() => {
    if (summary) document.title = `סיכום פגישה — ${summary.client_name || summary.title || 'ABD Finance'}`
  }, [summary])

  if (state === 'loading') return <main dir="rtl" style={centerStyle}>טוען…</main>
  if (state === 'error' || !summary) return <main dir="rtl" style={centerStyle}>הסיכום לא נמצא או שאין הרשאה לצפות בו. ודא שאתה מחובר למערכת.</main>

  const endedAt = summary.meeting_ended_at || summary.created_at

  return (
    <main dir="rtl" style={pageStyle}>
      <div className="no-print" style={printBarStyle}>
        <button type="button" onClick={() => window.print()} style={printButtonStyle}>הדפס / שמור כ-PDF</button>
      </div>
      <style>{'@media print { .no-print { display: none !important; } body { background: #fff !important; } @page { margin: 16mm; } }'}</style>

      <header style={{ marginBottom: 24, borderBottom: '2px solid #111827', paddingBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#6B7280' }}>ABD FINANCE — SMART MEETING</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '6px 0 4px' }}>{summary.client_name || 'סיכום פגישה'}</h1>
        <div style={{ fontSize: 13.5, color: '#374151' }}>
          {summary.title || 'סיכום פגישה'}
          {formatDate(endedAt) ? ` · ${formatDate(endedAt)}` : ''}
        </div>
      </header>

      {doc && summaryHasContent(doc) ? (
        <MeetingSummaryDocument doc={doc} variant="print" />
      ) : (
        <p style={{ color: '#6B7280' }}>הסיכום נשמר ללא תוכן.</p>
      )}

      <footer style={{ marginTop: 32, paddingTop: 10, borderTop: '1px solid #D1D5DB', fontSize: 11.5, color: '#6B7280' }}>
        מסמך זה הופק ממערכת Smart Meeting של ABD Finance ומיועד ללקוח ולנציג המטפל בלבד. המידע נכון למועד הפגישה.
      </footer>
    </main>
  )
}

const pageStyle: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: '32px 28px', background: '#fff', color: '#111827', fontFamily: 'var(--font-main, Arial)', minHeight: '100vh' }
const centerStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-main, Arial)', color: '#6B7280' }
const printBarStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }
const printButtonStyle: React.CSSProperties = { minHeight: 40, padding: '0 18px', border: 0, borderRadius: 10, background: '#111827', color: '#fff', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }
