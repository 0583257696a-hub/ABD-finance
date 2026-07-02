'use client'

import type { CSSProperties } from 'react'

type LogoConfig = {
  match: string[]
  src?: string
  width?: number
  height?: number
}

const LOGOS: LogoConfig[] = [
  { match: ['הפניקס'], src: '/assets/fnx-logo.svg', width: 104, height: 36 },
  { match: ['פניקס'], src: '/assets/fnx-logo.svg', width: 104, height: 36 },
  { match: ['הראל'], src: '/assets/harel-logo.png', width: 64, height: 46 },
  { match: ['אלטשולר'], src: '/assets/altshuler-logo.png', width: 132, height: 50 },
  { match: ['שחם'], src: '/assets/altshuler-logo.png', width: 132, height: 50 },
  { match: ['מגדל'], src: '/assets/migdal-logo.svg', width: 110, height: 38 },
  { match: ['עמיתים'], src: '/assets/amitim-logo.svg', width: 104, height: 38 },
  { match: ['מבטחים'], src: '/assets/amitim-logo.svg', width: 104, height: 38 },
  { match: ['קרן פנסיה לשכירים'], src: '/assets/amitim-logo.svg', width: 104, height: 38 },
  { match: ['שכירים ועצמאיים'], src: '/assets/amitim-logo.svg', width: 104, height: 38 },
  { match: ['מיטב'], src: '/assets/meitav-logo.svg', width: 112, height: 38 },
  { match: ['הכשרה'], src: '/assets/hachshara-logo.png', width: 118, height: 40 },
  { match: ['ילין', 'לפידות'], src: '/assets/yalin-logo.png', width: 108, height: 36 },
  { match: ['מור'], src: '/assets/mor-logo.png', width: 104, height: 34 },
  { match: ['מנורה'], src: '/assets/menora-logo.png', width: 118, height: 40 },
  { match: ['איילון'], src: '/assets/ayalon-logo.png', width: 118, height: 40 },
]

export function ManufacturerLogo({ name, compact = false }: { name?: string; compact?: boolean }) {
  const value = String(name || '').trim()
  if (!value) return <span style={fallbackStyle}>אין נתון</span>

  if (value.includes('כלל')) {
    return (
      <span style={wrapStyle} title={value}>
        <span style={clalLogoStyle}>
          <span style={clalTextStyle}>כלל</span>
          <span style={clalMarkStyle} aria-hidden="true">
            <span style={{ ...clalMarkPartStyle, borderRadius: '10px 2px 2px 10px', transform: 'skewX(-16deg)' }} />
            <span style={{ ...clalMarkPartStyle, borderRadius: '2px 10px 10px 2px', transform: 'skewX(16deg)' }} />
          </span>
        </span>
      </span>
    )
  }

  const logo = LOGOS.find(item => item.match.every(part => value.includes(part)))
  if (logo?.src) {
    return (
      <span style={wrapStyle} title={value}>
        <img
          src={logo.src}
          alt={value}
          style={{
            ...imageStyle,
            width: compact ? Math.round((logo.width || 96) * 0.86) : logo.width,
            height: compact ? Math.round((logo.height || 34) * 0.9) : logo.height,
          }}
        />
      </span>
    )
  }

  return <span style={fallbackStyle}>{value}</span>
}

const wrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  minWidth: 96,
  maxWidth: 150,
}

const imageStyle: CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  objectFit: 'contain',
  objectPosition: 'right center',
}

const fallbackStyle: CSSProperties = {
  color: 'var(--abd-primary)',
  fontWeight: 900,
}

const clalLogoStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  minHeight: 28,
  direction: 'rtl',
}

const clalTextStyle: CSSProperties = {
  color: '#202637',
  fontSize: 22,
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: -1.2,
}

const clalMarkStyle: CSSProperties = {
  display: 'inline-grid',
  gridTemplateColumns: '1fr 1fr',
  width: 30,
  height: 19,
  gap: 0,
  marginInlineStart: 1,
}

const clalMarkPartStyle: CSSProperties = {
  display: 'block',
  background: '#4E78FF',
  height: '100%',
  width: '100%',
}
