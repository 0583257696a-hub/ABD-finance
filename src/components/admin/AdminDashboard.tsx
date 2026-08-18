'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { KpiTile, SectionTitle, StatusPill, formatDate, USER_STATUS, TICKET_STATUS, type AdminUser, type Stats, type Ticket } from './shared'

/**
 * Dashboard: real counters from D1 plus the two queues that need a human —
 * users waiting for approval and open support tickets — each with a jump
 * to the tab that handles them. Nothing here is a placeholder metric.
 */
export function AdminDashboard({ stats, users, tickets, onGo }: {
  stats: Stats | null
  users: AdminUser[]
  tickets: Ticket[]
  onGo: (tab: 'users' | 'support' | 'agencies' | 'security') => void
}) {
  const pending = users.filter(user => user.status === 'pending_approval').slice(0, 6)
  const openTickets = tickets.filter(ticket => ticket.status !== 'closed').slice(0, 6)

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <KpiTile label="משתמשים פעילים" value={stats.usersActive} note={`מתוך ${stats.usersTotal}`} tone="success" />
          <KpiTile label="ממתינים לאישור" value={stats.usersPending} note="דורשים טיפול" tone={stats.usersPending ? 'warning' : 'neutral'} />
          <KpiTile label="חסומים" value={stats.usersBlocked} tone={stats.usersBlocked ? 'destructive' : 'neutral'} />
          <KpiTile label="סוכנויות" value={stats.agencies} note={`${stats.admins} מנהלי מערכת`} />
          <KpiTile label="פגישות החודש" value={stats.meetingsThisMonth} note={`סה"כ ${stats.meetingsTotal}`} tone="accent" />
          <KpiTile label="סיכומים החודש" value={stats.summariesThisMonth} note={`סה"כ ${stats.summariesTotal}`} tone="accent" />
          <KpiTile label="שאלונים" value={`${stats.formsSubmitted}/${stats.formsSent}`} note="מולאו / נשלחו" />
          <KpiTile label="פניות פתוחות" value={stats.ticketsOpen + stats.ticketsInProgress} note={`${stats.ticketsOpen} חדשות · ${stats.ticketsInProgress} בטיפול`} tone={stats.ticketsOpen ? 'warning' : 'neutral'} />
        </div>
      ) : (
        <Surface padding={16}><p style={{ margin: 0, color: 'var(--text-muted)' }}>המערכת פועלת ללא מסד נתונים — אין מדדים להצגה.</p></Surface>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Surface padding={18}>
          <SectionTitle actions={<Button size="sm" variant="ghost" onClick={() => onGo('users')}>לכל המשתמשים <ArrowLeft size={14} /></Button>}>ממתינים לאישור</SectionTitle>
          {pending.length ? (
            <div style={{ display: 'grid', gap: 6 }}>
              {pending.map(user => (
                <button key={user.id} type="button" onClick={() => onGo('users')} style={rowButtonStyle}>
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ color: 'var(--text-heading)', display: 'block' }}>{user.name || user.email}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{user.email} · נרשם {formatDate(user.createdAt)}</span>
                  </span>
                  <StatusPill status={user.status} map={USER_STATUS} />
                </button>
              ))}
            </div>
          ) : <p style={emptyStyle}>אין נרשמים שממתינים לאישור.</p>}
        </Surface>

        <Surface padding={18}>
          <SectionTitle actions={<Button size="sm" variant="ghost" onClick={() => onGo('support')}>לכל הפניות <ArrowLeft size={14} /></Button>}>פניות תמיכה לטיפול</SectionTitle>
          {openTickets.length ? (
            <div style={{ display: 'grid', gap: 6 }}>
              {openTickets.map(ticket => (
                <button key={ticket.id} type="button" onClick={() => onGo('support')} style={rowButtonStyle}>
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ color: 'var(--text-heading)', display: 'block', overflowWrap: 'anywhere' }}>{ticket.subject}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{ticket.user_email} · {formatDate(ticket.created_at, true)}</span>
                  </span>
                  <StatusPill status={ticket.status} map={TICKET_STATUS} />
                </button>
              ))}
            </div>
          ) : <p style={emptyStyle}>אין פניות פתוחות.</p>}
        </Surface>
      </div>
    </div>
  )
}

const rowButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'start', width: '100%', background: 'var(--bg-surface-sunken)', border: '1px solid transparent', borderRadius: 'var(--radius-md)', padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }
const emptyStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }
