'use client'

import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
        padding: '48px 24px',
        color: 'var(--text-muted)',
      }}
    >
      {icon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface-sunken)',
            color: 'var(--text-tertiary)',
            marginBottom: 4,
          }}
        >
          {icon}
        </div>
      )}
      <strong style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</strong>
      {description && <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>{description}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
