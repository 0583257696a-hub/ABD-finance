'use client'

import { useEffect, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { describeAnswers, type DescribedAnswer } from '@/lib/questionnaires'
import { parseSummaryDocument } from '@/lib/meeting-summary-doc'
import { formatDate } from '@/lib/format-date'
import type { MeetingSummaryData } from '@/types/summary'

/**
 * "מוכן לפגישה" — the 30-second brief before a meeting (proposal §5.1):
 * who the client is, what was agreed last time, which follow-ups are still
 * open, what they answered in the questionnaire, and three suggested
 * opening points. Everything here already exists in the system; this just
 * puts it on one screen at the moment it's needed.
 */

type SummaryListItem = { id: string; client_name: string; title: string; meeting_ended_at: string | null; created_at: string }
type ClientForm = { token: string; client_name: string; client_email: string; status: string; payload_json: string | null; questions_json: string | null; submitted_at: string | null }

export type PrepMeeting = { id: string; title: string; client_name: string; client_email: string; starts_at: string; notes: string; location?: string; meeting_url?: string | null }

function normalizeName(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function MeetingPrepSheet({ meeting, forms, onClose, onStart }: {
  meeting: PrepMeeting | null
  forms: ClientForm[]
  onClose: () => void
  onStart: (meeting: PrepMeeting) => void
}) {
  const [previous, setPrevious] = useState<{ item: SummaryListItem; doc: MeetingSummaryData | null } | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ready'>('idle')

  useEffect(() => {
    if (!meeting) return
    let cancelled = false
    setState('loading')
    setPrevious(null)
    ;(async () => {
      try {
        const list = await (await fetch('/api/meeting-summaries')).json() as { summaries: SummaryListItem[] }
        const wanted = normalizeName(meeting.client_name)
        const match = wanted ? (list.summaries || []).find(item => normalizeName(item.client_name) === wanted) : undefined
        if (match && !cancelled) {
          const detail = await (await fetch(`/api/meeting-summaries?id=${encodeURIComponent(match.id)}`)).json() as { summary: { summary_json: string | null } }
          if (!cancelled) setPrevious({ item: match, doc: parseSummaryDocument(detail.summary?.summary_json) })
        }
      } catch { /* brief still shows what it can */ }
      if (!cancelled) setState('ready')
    })()
    return () => { cancelled = true }
  }, [meeting])

  if (!meeting) return null

  const email = String(meeting.client_email || '').trim().toLowerCase()
  const submitted = forms
    .filter(form => form.status === 'submitted' && form.payload_json && (email ? form.client_email.trim().toLowerCase() === email : normalizeName(form.client_name) === normalizeName(meeting.client_name)))
    .sort((a, b) => String(b.submitted_at || '').localeCompare(String(a.submitted_at || '')))[0]
  let answers: DescribedAnswer[] = []
  try { answers = submitted ? describeAnswers(submitted.questions_json, JSON.parse(submitted.payload_json || '{}')) : [] } catch { answers = [] }
  const highlights = answers.filter(row => /פרישה|מטרות|הכנסה|מצב משפחתי|סיכון|חשוב/.test(row.label) || /מטרות/.test(row.section)).slice(0, 6)

  const doc = previous?.doc
  const openTasks = (doc?.manualFollowUps || []).filter(item => item?.text?.trim())
  const lastRecommendations = (doc?.recommendations || []).filter(item => item?.text?.trim()).slice(0, 4)

  const openers: string[] = []
  if (openTasks.length) openers.push(`לבדוק מה קרה עם ${openTasks.length === 1 ? 'המשימה הפתוחה' : `${openTasks.length} המשימות הפתוחות`} מהפגישה הקודמת`)
  const goal = answers.find(row => /גיל פרישה/.test(row.label))
  if (goal) openers.push(`הלקוח ציין גיל פרישה מתוכנן ${goal.value} — לפתוח מזה את תמונת הקצבה`)
  const goals = answers.find(row => /מטרות/.test(row.label) || /מטרות/.test(row.section))
  if (goals && goals !== goal) openers.push(`מטרות שהלקוח כתב: ${goals.value.slice(0, 80)}`)
  if (lastRecommendations.length) openers.push(`לוודא שההמלצות מהפעם הקודמת בוצעו (${lastRecommendations.length})`)
  if (!openers.length) openers.push(meeting.notes ? `ההערות שרשמת לפגישה: ${meeting.notes.slice(0, 100)}` : 'פגישה ראשונה במערכת — להתחיל מייבוא קובץ המסלקה ובירור צרכים')

  return (
    <Sheet
      open
      onClose={onClose}
      placement="side"
      width="min(560px, 100vw)"
      title={`מוכן לפגישה — ${meeting.client_name || meeting.title}`}
      subtitle={`${meeting.title} · ${formatDate(meeting.starts_at)}${meeting.location ? ` · ${meeting.location.startsWith('http') ? 'וידאו' : meeting.location}` : ''}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>סגירה</Button>
          <Button variant="primary" onClick={() => onStart(meeting)}>{meeting.meeting_url ? 'הצטרף והתחל' : 'התחל פגישה'}</Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section>
          <h3 style={h3}>3 נקודות לפתוח בהן</h3>
          <ol style={{ margin: 0, paddingInlineStart: 20, display: 'grid', gap: 6, color: 'var(--text-heading)', fontSize: 14, lineHeight: 1.6 }}>
            {openers.slice(0, 3).map((line, index) => <li key={index}>{line}</li>)}
          </ol>
        </section>

        <section>
          <h3 style={h3}>הפעם הקודמת</h3>
          {state === 'loading' && <p style={muted}>טוען…</p>}
          {state === 'ready' && !previous && <p style={muted}>אין סיכום קודם ללקוח הזה בארכיון.</p>}
          {previous && (
            <div style={{ display: 'grid', gap: 8 }}>
              <p style={{ ...muted, margin: 0 }}>{previous.item.title} · {formatDate(previous.item.meeting_ended_at || previous.item.created_at)}</p>
              {lastRecommendations.length > 0 && (
                <div>
                  <strong style={label}>מה סוכם</strong>
                  <ul style={list}>{lastRecommendations.map(item => <li key={item.id}>{item.text}</li>)}</ul>
                </div>
              )}
              <div>
                <strong style={label}>משימות פתוחות ({openTasks.length})</strong>
                {openTasks.length ? <ul style={list}>{openTasks.map(item => <li key={item.id}>☐ {item.text}</li>)}</ul> : <p style={muted}>אין משימות פתוחות.</p>}
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 style={h3}>מהשאלון</h3>
          {submitted ? (
            <div style={{ display: 'grid', gap: 4 }}>
              {(highlights.length ? highlights : answers.slice(0, 6)).map(row => (
                <div key={row.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 40%) 1fr', gap: 8, fontSize: 13.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}><bdi>{row.value}</bdi></span>
                </div>
              ))}
              {answers.length > 6 && <p style={muted}>ועוד {answers.length - 6} תשובות — נטענות אוטומטית לבירור הצרכים בפגישה.</p>}
            </div>
          ) : <p style={muted}>הלקוח טרם מילא שאלון הכנה.</p>}
        </section>

        {meeting.notes && (
          <section>
            <h3 style={h3}>ההערות שלך לפגישה</h3>
            <p style={{ ...muted, whiteSpace: 'pre-wrap', color: 'var(--text-heading)' }}>{meeting.notes}</p>
          </section>
        )}
      </div>
    </Sheet>
  )
}

const h3: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 14, fontWeight: 700, margin: '0 0 8px' }
const label: React.CSSProperties = { display: 'block', color: 'var(--text-muted)', fontSize: 12.5, marginBottom: 4 }
const muted: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.6 }
const list: React.CSSProperties = { margin: 0, paddingInlineStart: 18, display: 'grid', gap: 4, fontSize: 13.5, color: 'var(--text-heading)', lineHeight: 1.6 }
