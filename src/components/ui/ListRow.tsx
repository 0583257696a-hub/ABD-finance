'use client'

import type { ReactNode } from 'react'

export function ListRow({
  icon,
  label,
  sub,
  trailing,
  active = false,
  onClick,
  as = 'button',
}: {
  icon?: ReactNode
  label: string
  sub?: string
  trailing?: ReactNode
  active?: boolean
  onClick?: () => void
  as?: 'button' | 'div'
}) {
  const Tag = as as 'button'
  return (
    <Tag
      type={as === 'button' ? 'button' : undefined}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        border: 0,
        textAlign: 'right',
        borderRadius: 'var(--radius-sm)',
        padding: '9px 10px',
        background: active ? 'var(--abd-accent-light)' : 'transparent',
        color: active ? 'var(--abd-accent)' : 'var(--text-body)',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-main)',
        transition: 'background var(--duration-fast) var(--easing-standard)',
      }}
    >
      {icon && <span style={{ display: 'flex', flexShrink: 0, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>{icon}</span>}
      <span style={{ flex: 1, display: 'grid', gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {sub && <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
      </span>
      {trailing && <span style={{ flexShrink: 0 }}>{trailing}</span>}
    </Tag>
  )
}
