'use client'

import type { CSSProperties, ReactNode } from 'react'

type SurfaceLevel = 'flat' | 'raised' | 'floating'
type SurfaceRadius = 'sm' | 'md' | 'lg' | 'xl'

const radiusVar: Record<SurfaceRadius, string> = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
}

const shadowByLevel: Record<SurfaceLevel, string> = {
  flat: 'none',
  raised: 'var(--shadow-1)',
  floating: 'var(--shadow-floating)',
}

export function Surface({
  children,
  level = 'raised',
  radius = 'lg',
  padding = 20,
  sunken = false,
  style,
  ...rest
}: {
  children: ReactNode
  level?: SurfaceLevel
  radius?: SurfaceRadius
  padding?: number | string
  sunken?: boolean
  style?: CSSProperties
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        background: sunken ? 'var(--bg-surface-sunken)' : 'var(--bg-surface)',
        border: '1px solid var(--separator)',
        borderRadius: radiusVar[radius],
        boxShadow: shadowByLevel[level],
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
