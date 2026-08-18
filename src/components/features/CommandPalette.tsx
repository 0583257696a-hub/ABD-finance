'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Archive, CalendarClock, CalendarPlus, FileText, Link2, LogOut, Palette, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { clearClientDataStorage } from '@/lib/client-data-keys'
import { formatDate } from '@/lib/format-date'

/**
 * ⌘K / Ctrl+K command palette (proposal §5 "מעבר מהיר"). One box that reaches
 * every screen and every meeting: static commands (screens, new meeting,
 * settings tabs, logout) plus a live search over the advisor's meetings and
 * archived summaries — typed name → Enter → you are there. Opened by the
 * shortcut, by the sidebar's search row, or by dispatching the
 * `abd:command-palette` event. Data is fetched on open (not on mount) so idle
 * screens cost nothing.
 */

export const COMMAND_PALETTE_EVENT = 'abd:command-palette'

type Item = {
  id: string
  group: string
  label: string
  hint?: string
  keywords?: string
  icon: React.ReactNode
  run: () => void
}

type MeetingRow = { id: string; client_name: string; title: string; starts_at: string; status: 'scheduled' | 'done' | 'cancelled' }
type SummaryRow = { id: string; client_name: string; title: string; meeting_ended_at: string | null; created_at: string }

const MAX_RESULTS = 12

function normalize(value: string) {
  return value.toLowerCase().replace(/["'`״׳]/g, '').replace(/\s+/g, ' ').trim()
}

/** Every space-separated token of the query must appear somewhere in the haystack. */
function matches(query: string, haystack: string) {
  const tokens = normalize(query).split(' ').filter(Boolean)
  if (!tokens.length) return true
  const target = normalize(haystack)
  return tokens.every(token => target.includes(token))
}

export default function CommandPalette() {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [summaries, setSummaries] = useState<SummaryRow[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  const close = useCallback(() => { setOpen(false); setQuery(''); setCursor(0) }, [])

  // Global shortcut + custom event (sidebar row, header button).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(current => !current)
      } else if (event.key === 'Escape' && open) {
        close()
      }
    }
    function onEvent() { setOpen(true) }
    window.addEventListener('keydown', onKey)
    window.addEventListener(COMMAND_PALETTE_EVENT, onEvent)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener(COMMAND_PALETTE_EVENT, onEvent) }
  }, [open, close])

  // Data on first open; refreshed on each open in the background.
  useEffect(() => {
    if (!open) return
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30)
    const controller = new AbortController()
    if (!loadedRef.current) setLoading(true)
    Promise.all([
      fetch('/api/meetings', { signal: controller.signal }).then(response => response.ok ? response.json() : null).catch(() => null),
      fetch('/api/meeting-summaries', { signal: controller.signal }).then(response => response.ok ? response.json() : null).catch(() => null),
    ]).then(([meetingData, summaryData]) => {
      if (controller.signal.aborted) return
      const meetingList = (meetingData as { meetings?: MeetingRow[] } | null)?.meetings
      const summaryList = (summaryData as { summaries?: SummaryRow[] } | null)?.summaries
      if (Array.isArray(meetingList)) setMeetings(meetingList)
      if (Array.isArray(summaryList)) setSummaries(summaryList)
      loadedRef.current = true
      setLoading(false)
    })
    return () => { window.clearTimeout(focusTimer); controller.abort() }
  }, [open])

  const go = useCallback((href: string) => { close(); router.push(href) }, [close, router])

  const staticItems = useMemo<Item[]>(() => {
    const items: Item[] = [
      { id: 'nav-meetings', group: 'מסכים', label: 'פגישות', hint: 'הפגישות הקרובות והתחלת פגישה', keywords: 'meetings home בית', icon: <CalendarClock size={16} />, run: () => go('/?tab=meetings') },
      { id: 'nav-archive', group: 'מסכים', label: 'ארכיון סיכומי פגישות', hint: 'סיכומים שנשמרו, PDF, שליחה ללקוח', keywords: 'archive summaries history היסטוריה', icon: <Archive size={16} />, run: () => go('/?tab=meeting-summaries') },
      { id: 'act-new-meeting', group: 'פעולות', label: 'התחל פגישה עכשיו', hint: 'פגישה ספונטנית או מהיומן', keywords: 'start new meeting חדש התחל', icon: <Sparkles size={16} />, run: () => go('/?tab=meetings&start=1') },
      { id: 'act-schedule', group: 'פעולות', label: 'קבע פגישה חדשה', hint: 'טופס זימון + הזמנה ללקוח', keywords: 'schedule new זימון תזמון', icon: <CalendarPlus size={16} />, run: () => go('/?tab=meetings&schedule=1') },
      { id: 'set-brand', group: 'הגדרות', label: 'הגדרות — מיתוג', hint: 'לוגו, שם, צבעים, ערכת נושא', keywords: 'settings brand theme logo צבע לוגו', icon: <Palette size={16} />, run: () => go('/?tab=settings&section=brand') },
      { id: 'set-connections', group: 'הגדרות', label: 'הגדרות — חיבורים', hint: 'Google / Outlook / Calendly', keywords: 'settings connections google calendar integrations יומן', icon: <Link2 size={16} />, run: () => go('/?tab=settings&section=connections') },
      { id: 'set-questionnaires', group: 'הגדרות', label: 'הגדרות — שאלונים', hint: 'תבניות שאלוני הכנה ללקוח', keywords: 'settings questionnaires templates שאלון', icon: <FileText size={16} />, run: () => go('/?tab=settings&section=questionnaires') },
    ]
    if (isAdmin) items.push({ id: 'nav-admin', group: 'ניהול', label: 'פאנל ניהול', hint: 'משתמשים, סוכנויות, לוג פעילות', keywords: 'admin ניהול', icon: <ShieldCheck size={16} />, run: () => go('/admin-panel') })
    items.push({ id: 'act-logout', group: 'חשבון', label: 'התנתקות', hint: 'מנקה את נתוני הלקוח מהדפדפן', keywords: 'logout sign out יציאה', icon: <LogOut size={16} />, run: () => { close(); clearClientDataStorage(); window.location.href = '/api/auth/logout' } })
    return items
  }, [isAdmin, go, close])

  const results = useMemo<Item[]>(() => {
    const trimmed = query.trim()
    const commands = staticItems.filter(item => matches(trimmed, `${item.label} ${item.hint || ''} ${item.keywords || ''}`))
    // Without a query: commands + the next few meetings. With a query: everything that matches.
    const meetingItems: Item[] = meetings
      .filter(meeting => meeting.status !== 'cancelled')
      .filter(meeting => trimmed ? matches(trimmed, `${meeting.client_name} ${meeting.title}`) : meeting.status === 'scheduled')
      .sort((a, b) => (a.status === b.status ? a.starts_at.localeCompare(b.starts_at) : a.status === 'scheduled' ? -1 : 1))
      .slice(0, trimmed ? 8 : 4)
      .map(meeting => ({
        id: `meeting-${meeting.id}`,
        group: 'פגישות',
        label: meeting.client_name?.trim() || meeting.title || 'פגישה',
        hint: `${meeting.status === 'done' ? 'הסתיימה · ' : ''}${formatDate(meeting.starts_at)}${meeting.client_name && meeting.title ? ` · ${meeting.title}` : ''}`,
        icon: <CalendarClock size={16} />,
        run: () => go(`/?tab=meetings&focus=${encodeURIComponent(meeting.id)}`),
      }))
    const summaryItems: Item[] = trimmed
      ? summaries
        .filter(summary => matches(trimmed, `${summary.client_name} ${summary.title}`))
        .slice(0, 8)
        .map(summary => ({
          id: `summary-${summary.id}`,
          group: 'ארכיון',
          label: summary.client_name?.trim() || summary.title || 'סיכום',
          hint: `סיכום · ${formatDate(summary.meeting_ended_at || summary.created_at)}`,
          icon: <Archive size={16} />,
          run: () => go(`/?tab=meeting-summaries&open=${encodeURIComponent(summary.id)}`),
        }))
      : []
    return [...(trimmed ? [...meetingItems, ...summaryItems, ...commands] : [...commands, ...meetingItems])].slice(0, trimmed ? MAX_RESULTS + 8 : MAX_RESULTS + 4)
  }, [query, staticItems, meetings, summaries, go])

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') { event.preventDefault(); setCursor(current => Math.min(current + 1, results.length - 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setCursor(current => Math.max(current - 1, 0)) }
    else if (event.key === 'Enter') { event.preventDefault(); results[cursor]?.run() }
  }

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open || typeof document === 'undefined') return null

  let lastGroup = ''
  return createPortal(
    <div
      role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) close() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15, 25, 41, 0.42)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '10vh 16px 16px', animation: 'ui-fade-in var(--duration-fast) var(--easing-standard) both' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="חיפוש ופקודות"
        dir="rtl"
        style={{ width: 'min(620px, 100%)', background: 'var(--bg-surface-elevated, var(--bg-surface))', color: 'var(--text-heading)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-floating)', border: '1px solid var(--separator)', overflow: 'hidden', fontFamily: 'var(--font-main)', animation: 'ui-scale-in var(--duration-base) var(--easing-standard) both' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--separator)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={event => { setQuery(event.target.value); setCursor(0) }}
            onKeyDown={onInputKey}
            placeholder="חפש לקוח, פגישה, סיכום או פעולה…"
            aria-label="חיפוש"
            style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', color: 'inherit', fontSize: 16, fontFamily: 'inherit' }}
          />
          <kbd style={kbdStyle}>Esc</kbd>
        </div>
        <div ref={listRef} style={{ maxHeight: 'min(60vh, 460px)', overflowY: 'auto', padding: 6 }}>
          {results.length === 0 && (
            <div style={{ padding: '22px 14px', color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
              {loading ? 'טוען…' : 'לא נמצא. נסה שם לקוח, נושא פגישה או "הגדרות".'}
            </div>
          )}
          {results.map((item, index) => {
            const showGroup = item.group !== lastGroup
            lastGroup = item.group
            const active = index === cursor
            return (
              <div key={item.id}>
                {showGroup && <div style={{ padding: '8px 10px 4px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.2 }}>{item.group}</div>}
                <button
                  type="button"
                  data-index={index}
                  onMouseEnter={() => setCursor(index)}
                  onClick={item.run}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: 0, borderRadius: 'var(--radius-md)', background: active ? 'var(--abd-accent-light, var(--bg-surface-sunken))' : 'transparent', color: 'inherit', textAlign: 'start', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 10, background: 'var(--bg-surface-sunken)', color: active ? 'var(--abd-primary)' : 'var(--text-muted)', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ minWidth: 0, display: 'grid', gap: 1 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    {item.hint && <span style={{ fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.hint}</span>}
                  </span>
                  {active && <kbd style={{ ...kbdStyle, marginInlineStart: 'auto' }}>↵</kbd>}
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '8px 14px', borderTop: '1px solid var(--separator)', color: 'var(--text-muted)', fontSize: 12 }}>
          <span><kbd style={kbdStyle}>↑↓</kbd> ניווט</span>
          <span><kbd style={kbdStyle}>↵</kbd> פתיחה</span>
          <span style={{ marginInlineStart: 'auto' }}><kbd style={kbdStyle}>Ctrl</kbd>+<kbd style={kbdStyle}>K</kbd> פתיחה מכל מקום</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  borderRadius: 6,
  border: '1px solid var(--separator-strong)',
  background: 'var(--bg-surface-sunken)',
  color: 'var(--text-muted)',
  fontSize: 11,
  fontFamily: 'inherit',
  lineHeight: 1.5,
}
