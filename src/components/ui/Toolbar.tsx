'use client'

import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { IconButton } from './Button'

/**
 * Contextual top toolbar — sits above a screen's content, sticky.
 * Glass chrome per design plan §3.2/§6: this is one of the few surfaces
 * allowed to use GlassSurface-style translucency.
 */
export function Toolbar({
  title,
  subtitle,
  onBack,
  actions,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  actions?: ReactNode
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 4px',
        marginBottom: 20,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderBottom: '1px solid var(--separator)',
      }}
    >
      {onBack && (
        <IconButton label="חזרה" onClick={onBack}>
          <ChevronRight size={18} />
        </IconButton>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            display: 'block',
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-heading)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{subtitle}</span>
        )}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </header>
  )
}
