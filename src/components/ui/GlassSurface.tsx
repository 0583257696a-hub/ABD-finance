'use client'

import type { CSSProperties, ReactNode } from 'react'

/**
 * Liquid-Glass surface — reserved for sidebar / toolbar / popover / sheet chrome.
 * Never use this for content cards (tables, KPI cards, form sections) — glass
 * communicates "floating chrome", not decoration. See redesign plan §2.1/§6.
 */
export function GlassSurface({
  children,
  radius = 'lg',
  style,
  ...rest
}: {
  children: ReactNode
  radius?: 'sm' | 'md' | 'lg' | 'xl'
  style?: CSSProperties
} & React.HTMLAttributes<HTMLDivElement>) {
  const radiusVar = { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)' }[radius]
  return (
    <div
      {...rest}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        borderRadius: radiusVar,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
