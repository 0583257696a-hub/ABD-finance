'use client'

import { useEffect, useState } from 'react'

type Settings = {
  fontScale: number
  grayscale: boolean
  highContrast: boolean
  underlineLinks: boolean
  readableFont: boolean
  stopAnimations: boolean
}

const KEY = 'abd_accessibility_v1'
const defaults: Settings = {
  fontScale: 1,
  grayscale: false,
  highContrast: false,
  underlineLinks: false,
  readableFont: false,
  stopAnimations: false,
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>(defaults)

  useEffect(() => {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      try { setSettings({ ...defaults, ...JSON.parse(saved) }) } catch {}
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accessibility-font-scale', String(settings.fontScale))
    document.body.dataset.a11yContrast = settings.highContrast ? 'on' : 'off'
    document.body.dataset.a11yGray = settings.grayscale ? 'on' : 'off'
    document.body.dataset.a11yUnderline = settings.underlineLinks ? 'on' : 'off'
    document.body.dataset.a11yReadable = settings.readableFont ? 'on' : 'off'
    document.body.dataset.animations = settings.stopAnimations ? 'off' : 'on'
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  function patch(patch: Partial<Settings>) {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label="פתיחת תפריט נגישות" style={toggleStyle}>
        נגישות
      </button>
      {open && (
        <section aria-label="תפריט נגישות" style={panelStyle}>
          <h2 style={titleStyle}>תפריט נגישות</h2>
          <button style={itemStyle} onClick={() => patch({ fontScale: Math.min(1.35, settings.fontScale + 0.08) })}>הגדלת טקסט</button>
          <button style={itemStyle} onClick={() => patch({ fontScale: Math.max(0.9, settings.fontScale - 0.08) })}>הקטנת טקסט</button>
          <Toggle label="גווני אפור" value={settings.grayscale} onChange={value => patch({ grayscale: value })} />
          <Toggle label="ניגודיות גבוהה" value={settings.highContrast} onChange={value => patch({ highContrast: value })} />
          <Toggle label="קו תחתון לקישורים" value={settings.underlineLinks} onChange={value => patch({ underlineLinks: value })} />
          <Toggle label="פונט קריא" value={settings.readableFont} onChange={value => patch({ readableFont: value })} />
          <Toggle label="עצירת אנימציות" value={settings.stopAnimations} onChange={value => patch({ stopAnimations: value })} />
          <p style={hintStyle}>ניווט מלא במקלדת נתמך באמצעות Tab ו־Enter.</p>
          <button style={resetStyle} onClick={() => setSettings(defaults)}>איפוס הגדרות</button>
        </section>
      )}
    </>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label style={labelStyle}>
      <input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)} />
      {label}
    </label>
  )
}

const toggleStyle: React.CSSProperties = { position: 'fixed', zIndex: 1001, left: 18, bottom: 92, border: '1px solid #CFE6FA', borderRadius: 999, padding: '10px 14px', background: '#fff', color: 'var(--abd-primary)', fontWeight: 900, boxShadow: 'var(--shadow-card)', cursor: 'pointer' }
const panelStyle: React.CSSProperties = { position: 'fixed', zIndex: 1001, left: 18, bottom: 142, width: 260, display: 'grid', gap: 9, padding: 16, borderRadius: 18, background: '#fff', border: '1px solid #D7EAFB', boxShadow: '0 18px 50px rgba(15,25,41,.16)', fontFamily: 'var(--font-main)' }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 18, fontWeight: 900 }
const itemStyle: React.CSSProperties = { minHeight: 36, border: '1px solid #CFE6FA', borderRadius: 10, background: '#F8FBFF', color: 'var(--abd-primary)', fontWeight: 800, cursor: 'pointer' }
const labelStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', color: 'var(--abd-primary)', fontWeight: 800 }
const hintStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }
const resetStyle: React.CSSProperties = { ...itemStyle, background: 'var(--abd-accent)', color: '#fff' }
