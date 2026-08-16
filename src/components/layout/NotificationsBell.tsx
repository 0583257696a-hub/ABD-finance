'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, CalendarCheck, FileText } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * In-app notifications (התראות) — questionnaire submissions and meeting
 * confirmations. Polls every 60s; opening the panel marks everything read.
 */

type NotificationItem = {
  id: string
  type: 'form-submitted' | 'meeting-confirmed'
  title: string
  body: string
  link: string
  read: number
  created_at: string
}

export default function NotificationsBell({ collapsed }: { collapsed: boolean }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) return
      const data = await response.json() as { notifications: NotificationItem[]; unread: number }
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch { /* polling — silent */ }
  }, [])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 60_000)
    return () => clearInterval(interval)
  }, [load])

  async function openPanel() {
    setOpen(true)
    if (unread > 0) {
      setUnread(0)
      await fetch('/api/notifications', { method: 'POST' }).catch(() => {})
    }
  }

  return (
    <>
      <button type="button" onClick={() => void openPanel()} title="התראות" style={bellButtonStyle(collapsed)}>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <Bell size={18} />
          {unread > 0 && <span style={badgeStyle}>{unread > 9 ? '9+' : unread}</span>}
        </span>
        {!collapsed && <span>התראות</span>}
      </button>

      {open && (
        <Sheet open onClose={() => setOpen(false)} placement="side" width="min(420px, 96vw)" title="התראות">
          {notifications.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {notifications.map(notification => (
                <div key={notification.id} style={notificationRowStyle(Boolean(notification.read))}>
                  <span style={{ flexShrink: 0, marginTop: 2 }}>
                    {notification.type === 'form-submitted' ? <FileText size={16} color="var(--abd-accent)" /> : <CalendarCheck size={16} color="var(--success, #10B981)" />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--text-heading)', fontSize: 13.5 }}>{notification.title}</strong>
                    <span style={{ display: 'block', color: 'var(--text-body, #374151)', fontSize: 13, lineHeight: 1.6, marginTop: 2 }}>{notification.body}</span>
                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4 }}>
                      {new Date(notification.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Bell size={28} />} title="אין התראות" description="כשלקוח ימלא שאלון הכנה או יאשר הגעה לפגישה — תקבל כאן התראה." />
          )}
        </Sheet>
      )}
    </>
  )
}

function bellButtonStyle(collapsed: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    justifyContent: collapsed ? 'center' : 'flex-start',
    minHeight: 38,
    width: '100%',
    padding: '0 10px',
    border: 0,
    borderRadius: 10,
    background: 'transparent',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-main)',
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }
}

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: -6,
  insetInlineEnd: -8,
  minWidth: 16,
  height: 16,
  borderRadius: 999,
  background: 'var(--destructive, #EF4444)',
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  display: 'grid',
  placeItems: 'center',
  padding: '0 4px',
  lineHeight: 1,
}

function notificationRowStyle(read: boolean): React.CSSProperties {
  return {
    display: 'flex',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--separator)',
    background: read ? 'var(--bg-canvas)' : 'var(--abd-accent-light, var(--bg-surface-sunken))',
  }
}
