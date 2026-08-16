'use client'

import { useState, type CSSProperties } from 'react'

type LogoConfig = {
  match: string[]
  src?: string
  // Per-logo cap on width only — height is always uniform (see LOGO_HEIGHT)
  // so every row in a manufacturer column is the same height regardless of
  // which company's logo it holds. Without this, each logo's own hand-picked
  // height (previously 34-50px, all different) made row height alternate
  // depending on which manufacturer happened to be in that row.
  maxWidth?: number
}

const LOGO_HEIGHT = 28
const LOGO_HEIGHT_COMPACT = 22

const LOGOS: LogoConfig[] = [
  { match: ['הפניקס'], src: '/assets/fnx-logo.svg', maxWidth: 104 },
  { match: ['פניקס'], src: '/assets/fnx-logo.svg', maxWidth: 104 },
  { match: ['הראל'], src: '/assets/harel-logo.png', maxWidth: 64 },
  { match: ['אלטשולר'], src: '/assets/altshuler-logo.png', maxWidth: 132 },
  { match: ['שחם'], src: '/assets/altshuler-logo.png', maxWidth: 132 },
  { match: ['מגדל'], src: '/assets/migdal-logo.svg', maxWidth: 110 },
  { match: ['עמיתים'], src: '/assets/amitim-logo.svg', maxWidth: 104 },
  { match: ['קרן פנסיה לשכירים'], src: '/assets/amitim-logo.svg', maxWidth: 104 },
  { match: ['שכירים ועצמאיים'], src: '/assets/amitim-logo.svg', maxWidth: 104 },
  { match: ['מיטב'], src: '/assets/meitav-logo.svg', maxWidth: 112 },
  { match: ['הכשרה'], src: '/assets/hachshara-logo.png', maxWidth: 118 },
  { match: ['ילין', 'לפידות'], src: '/assets/yalin-logo.png', maxWidth: 108 },
  { match: ['מור'], src: '/assets/mor-logo.png', maxWidth: 104 },
  { match: ['מנורה'], src: '/assets/menora-logo.png', maxWidth: 118 },
  { match: ['איילון'], src: '/assets/ayalon-logo.png', maxWidth: 118 },
]

export function ManufacturerLogo({ name, compact = false }: { name?: string; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
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
  if (logo?.src && !imageFailed) {
    const height = compact ? LOGO_HEIGHT_COMPACT : LOGO_HEIGHT
    return (
      <span style={{ ...wrapStyle, height }} title={value}>
        <img
          src={logo.src}
          alt={value}
          onError={() => setImageFailed(true)}
          style={{
            ...imageStyle,
            height,
            width: 'auto',
            maxWidth: logo.maxWidth || 96,
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
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: LOGO_HEIGHT,
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
