'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  applyBrandingSettings,
  defaultBrandingSettings,
  normalizeBrandingSettings,
  saveBrandingSettings,
  settingsFromTheme,
  themePresets,
  type BrandingSettings,
  type ThemeId,
  USER_SETTINGS_KEY,
} from '@/lib/branding'

type GeneratedTheme = {
  id: string
  name: string
  description: string
  primaryColor: string
  accentColor: string
  shellColor: string
  cardColor: string
  sidebarColor: string
  headingColor: string
  bodyColor: string
  zebraRowColor: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BrandingSettings>(defaultBrandingSettings)
  const [logoPalette, setLogoPalette] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const selectedTheme = useMemo(() => settingsFromTheme(settings.themeId), [settings.themeId])
  const generatedThemes = useMemo(() => buildLogoThemes(logoPalette), [logoPalette])

  useEffect(() => {
    try {
      setSettings(normalizeBrandingSettings(JSON.parse(localStorage.getItem(USER_SETTINGS_KEY) || '{}')))
    } catch {
      setSettings(defaultBrandingSettings)
    }
  }, [])

  useEffect(() => {
    if (!settings.logoData) {
      setLogoPalette([])
      return
    }
    void extractPaletteFromImage(settings.logoData).then(setLogoPalette).catch(() => setLogoPalette([]))
  }, [settings.logoData])

  function persist(next: BrandingSettings) {
    setSettings(next)
    saveBrandingSettings(next)
    applyBrandingSettings(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1200)
  }

  function update<K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) {
    persist({ ...settings, [key]: value })
  }

  function applyTheme(themeId: ThemeId) {
    const theme = settingsFromTheme(themeId)
    persist({
      ...settings,
      themeId,
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      shellColor: theme.shellColor,
      cardColor: theme.cardColor,
      sidebarColor: theme.sidebarColor,
      headingColor: theme.headingColor,
      bodyColor: theme.bodyColor,
      zebraRowColor: mix(theme.accentColor, '#FFFFFF', 0.86),
    })
  }

  function applyGeneratedTheme(theme: GeneratedTheme) {
    persist({
      ...settings,
      themeId: 'abd-blue',
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      shellColor: theme.shellColor,
      cardColor: theme.cardColor,
      sidebarColor: theme.sidebarColor,
      headingColor: theme.headingColor,
      bodyColor: theme.bodyColor,
      zebraRowColor: theme.zebraRowColor,
    })
  }

  function uploadLogo(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('logoData', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function resetBranding() {
    persist(defaultBrandingSettings)
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>הגדרות תצוגה ומיתוג</h1>
        </div>
        <div style={headerActionsStyle}>
          <span style={saveBadgeStyle}>{saved ? 'נשמר אוטומטית' : 'שמירה אוטומטית פעילה'}</span>
          <button type="button" onClick={resetBranding} style={secondaryButtonStyle}>איפוס מיתוג</button>
        </div>
      </header>

      <section style={layoutStyle}>
        <aside style={sideTabsStyle}>
          <a href="#brand" style={sideTabStyle}>מיתוג אישי</a>
          <a href="#themes" style={sideTabStyle}>ערכות נושא</a>
          <a href="#summary" style={sideTabStyle}>סיכום וחתימה</a>
          <a href="#preview" style={sideTabStyle}>תצוגה מקדימה</a>
        </aside>

        <div style={contentStyle}>
          <section id="brand" style={cardStyle}>
            <h2 style={sectionTitleStyle}>מיתוג אישי</h2>
            <div style={gridStyle}>
              <Field label="שם חברה / מותג">
                <input value={settings.companyName} onChange={event => update('companyName', event.target.value)} style={inputStyle} />
              </Field>
              <Field label="שם יועץ">
                <input value={settings.advisorName} onChange={event => update('advisorName', event.target.value)} style={inputStyle} />
              </Field>
              <Field label="לוגו אישי">
                <input type="file" accept="image/*" onChange={event => uploadLogo(event.target.files?.[0])} style={inputStyle} />
              </Field>
              <div style={logoPreviewBoxStyle}>
                {settings.logoData ? <img src={settings.logoData} alt="לוגו אישי" style={logoPreviewStyle} /> : <span style={logoPlaceholderStyle}>ABD</span>}
                <button type="button" onClick={() => update('logoData', '')} style={smallButtonStyle}>הסר לוגו</button>
              </div>
            </div>

            {settings.logoData && (
              <div style={logoPalettePanelStyle}>
                <div>
                  <h3 style={miniTitleStyle}>צבעים שהמערכת זיהתה בלוגו</h3>
                </div>
                <CirclePalette colors={logoPalette} fallback={[settings.primaryColor, settings.accentColor, settings.zebraRowColor]} />
              </div>
            )}
          </section>

          <section id="themes" style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>ערכות נושא</h2>
              </div>
              <strong style={themeBadgeStyle}>{generatedThemes.length ? 'כולל ערכות מהלוגו' : selectedTheme.name}</strong>
            </div>

            {generatedThemes.length > 0 && (
              <>
                <h3 style={miniTitleStyle}>5 ערכות שנוצרו מהלוגו</h3>
                <div style={themeGridStyle}>
                  {generatedThemes.map(theme => (
                    <ThemeButton key={theme.id} theme={theme} onClick={() => applyGeneratedTheme(theme)} />
                  ))}
                </div>
              </>
            )}

            <h3 style={{ ...miniTitleStyle, marginTop: generatedThemes.length ? 22 : 0 }}>ערכות בסיס</h3>
            <div style={themeGridStyle}>
              {themePresets.slice(0, 5).map(theme => (
                <ThemeButton
                  key={theme.id}
                  theme={{ ...theme, zebraRowColor: mix(theme.accentColor, '#FFFFFF', 0.86) }}
                  active={settings.themeId === theme.id}
                  onClick={() => applyTheme(theme.id)}
                />
              ))}
            </div>

            <div style={themeDisplayOptionsStyle}>
              <Field label="צפיפות טבלאות">
                <select value={settings.tableDensity} onChange={event => update('tableDensity', event.target.value as BrandingSettings['tableDensity'])} style={inputStyle}>
                  <option value="compact">קומפקטי</option>
                  <option value="normal">רגיל</option>
                  <option value="wide">מרווח</option>
                </select>
              </Field>
              <Field label="עיגול פינות">
                <select value={settings.borderRadius} onChange={event => update('borderRadius', event.target.value as BrandingSettings['borderRadius'])} style={inputStyle}>
                  <option value="soft">עדין</option>
                  <option value="normal">רגיל</option>
                  <option value="round">עגול</option>
                </select>
              </Field>
              <label style={toggleStyle}>
                <input type="checkbox" checked={settings.showAnimations} onChange={event => update('showAnimations', event.target.checked)} />
                אנימציות עדינות בממשק
              </label>
            </div>
          </section>

          <section id="summary" style={cardStyle}>
            <h2 style={sectionTitleStyle}>נוסחי סיכום וחתימה</h2>
            <Field label="טקסט פתיחה">
              <textarea value={settings.summaryOpening} onChange={event => update('summaryOpening', event.target.value)} rows={3} style={textareaStyle} />
            </Field>
            <Field label="טקסט סיום">
              <textarea value={settings.summaryClosing} onChange={event => update('summaryClosing', event.target.value)} rows={3} style={textareaStyle} />
            </Field>
            <Field label="חתימת מייל">
              <textarea value={settings.emailSignature} onChange={event => update('emailSignature', event.target.value)} rows={5} style={textareaStyle} />
            </Field>
          </section>

          <section id="preview" style={cardStyle}>
            <h2 style={sectionTitleStyle}>תצוגה מקדימה מלאה</h2>
            <div style={{ ...previewStyle, background: settings.shellColor, color: settings.primaryColor, borderRadius: radiusValue(settings.borderRadius, 24, 12, 18) }}>
              <aside style={{ ...previewSidebarStyle, background: settings.sidebarColor }}>
                {settings.logoData ? <img src={settings.logoData} alt="לוגו" style={previewLogoStyle} /> : <span style={previewLogoFallbackStyle}>ABD</span>}
                <span style={{ ...previewNavItemStyle, background: `${settings.accentColor}1f`, color: settings.primaryColor }}>קופות</span>
                <span style={previewNavItemStyle}>סימולציות</span>
                <span style={previewNavItemStyle}>סיכום</span>
              </aside>
              <div style={previewContentStyle}>
                <div style={{ ...previewHeroStyle, background: settings.cardColor }}>
                  <div>
                    <strong style={{ color: settings.headingColor }}>{settings.companyName || 'שם חברה'}</strong>
                    <span>{settings.advisorName || 'שם יועץ'}</span>
                  </div>
                  <button style={{ ...previewButtonStyle, background: settings.accentColor }}>פעולה ראשית</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: settings.tableDensity === 'compact' ? 12 : settings.tableDensity === 'wide' ? 15 : 13 }}>
                  <thead><tr><th style={{ ...previewThStyle, background: settings.primaryColor }}>יצרן</th><th style={{ ...previewThStyle, background: settings.primaryColor }}>מסלול</th><th style={{ ...previewThStyle, background: settings.primaryColor }}>צבירה</th></tr></thead>
                  <tbody>
                    <tr><td style={previewTdStyle}>כלל</td><td style={previewTdStyle}>מסלול כללי</td><td style={previewTdStyle}>₪ 245,000</td></tr>
                    <tr><td style={{ ...previewTdStyle, background: settings.zebraRowColor }}>הראל</td><td style={{ ...previewTdStyle, background: settings.zebraRowColor }}>מסלול מניות</td><td style={{ ...previewTdStyle, background: settings.zebraRowColor }}>₪ 138,000</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={fieldStyle}><span>{label}</span>{children}</label>
}

function CirclePalette({ colors, fallback }: { colors: string[]; fallback: string[] }) {
  const list = colors.length ? colors : fallback
  return (
    <div style={circleRowStyle}>
      {list.map(color => (
        <i key={color} title={color} style={{ ...logoColorCircleStyle, background: color }} />
      ))}
    </div>
  )
}

function ThemeButton({ theme, active, onClick }: { theme: GeneratedTheme; active?: boolean; onClick: () => void }) {
  const colors = [theme.primaryColor, theme.accentColor, theme.zebraRowColor, theme.shellColor]
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...themeCardStyle,
        borderColor: active ? theme.accentColor : '#D7EAFB',
        boxShadow: active ? `0 14px 34px ${theme.accentColor}33` : 'var(--shadow-card)',
      }}
    >
      <CirclePalette colors={colors} fallback={colors} />
      <span style={themeTextStyle}>
        <strong>{theme.name}</strong>
        <small>{theme.description}</small>
      </span>
    </button>
  )
}

function buildLogoThemes(colors: string[]): GeneratedTheme[] {
  if (!colors.length) return []
  const palette = [...colors]
  while (palette.length < 5) palette.push(palette[palette.length % colors.length])
  const [a, b, c, d, e] = palette
  return [
    makeTheme('logo-1', 'לוגו נקי', 'בהיר, מאוזן ומתאים לעבודה יומיומית', a, b, 0.9, 0.84, 'normal', '#FFFFFF'),
    makeTheme('logo-2', 'לוגו עמוק', 'דגש חזק על צבעי המותג והכותרות', b, c, 0.92, 0.78, 'compact', mix(a, '#FFFFFF', 0.94)),
    makeTheme('logo-3', 'לוגו רך', 'גוונים עדינים עם Zebra בהיר במיוחד', c, d, 0.94, 0.9, 'wide', '#FFFFFF'),
    makeTheme('logo-4', 'לוגו פרימיום', 'קונטרסט גבוה וסרגל צד מורגש', d, a, 0.88, 0.8, 'normal', mix(b, '#FFFFFF', 0.92)),
    makeTheme('logo-5', 'לוגו מסמכים', 'רגוע ומתאים לסיכומי פגישה והפקת דוחות', e, b, 0.93, 0.86, 'normal', '#FFFFFF'),
  ]
}

function makeTheme(id: string, name: string, description: string, primary: string, accent: string, shellMix: number, zebraMix: number, _density: BrandingSettings['tableDensity'], cardColor: string): GeneratedTheme {
  return {
    id,
    name,
    description,
    primaryColor: darken(primary, 0.22),
    accentColor: accent,
    shellColor: mix(accent, '#FFFFFF', shellMix),
    cardColor,
    sidebarColor: mix(primary, '#FFFFFF', 0.95),
    headingColor: darken(primary, 0.36),
    bodyColor: mix(darken(primary, 0.42), '#334155', 0.45),
    zebraRowColor: mix(accent, '#FFFFFF', zebraMix),
  }
}

function radiusValue(mode: BrandingSettings['borderRadius'], round: number, soft: number, normal: number) {
  return mode === 'round' ? round : mode === 'soft' ? soft : normal
}

async function extractPaletteFromImage(src: string): Promise<string[]> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const size = 96
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return []
  context.drawImage(image, 0, 0, size, size)
  const { data } = context.getImageData(0, 0, size, size)
  const buckets = new Map<string, { count: number; r: number; g: number; b: number; score: number }>()
  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3]
    if (alpha < 180) continue
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max - min
    const brightness = (r + g + b) / 3
    if (brightness > 238 || brightness < 24 || saturation < 18) continue
    const key = rgbToHex(Math.round(r / 24) * 24, Math.round(g / 24) * 24, Math.round(b / 24) * 24)
    const existing = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0, score: 0 }
    existing.count += 1
    existing.r += r
    existing.g += g
    existing.b += b
    existing.score += saturation + Math.abs(150 - brightness) * 0.18
    buckets.set(key, existing)
  }
  return Array.from(buckets.values())
    .sort((x, y) => y.count * y.score - x.count * x.score)
    .slice(0, 8)
    .map(item => rgbToHex(item.r / item.count, item.g / item.count, item.b / item.count))
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map(char => char + char).join('') : clean
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`
}

function mix(color: string, target: string, amount: number) {
  const base = hexToRgb(color)
  const next = hexToRgb(target)
  return rgbToHex(base.r * (1 - amount) + next.r * amount, base.g * (1 - amount) + next.g * amount, base.b * (1 - amount) + next.b * amount)
}

function darken(color: string, amount: number) {
  const rgb = hexToRgb(color)
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount))
}

const pageStyle: React.CSSProperties = { fontFamily: 'var(--font-main)' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 22 }
const headerActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 32, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 6 }
const saveBadgeStyle: React.CSSProperties = { border: '1px solid #CFE6FA', borderRadius: 999, padding: '9px 14px', background: '#fff', color: 'var(--abd-primary)', fontWeight: 900 }
const secondaryButtonStyle: React.CSSProperties = { minHeight: 38, border: '1px solid #CFE6FA', borderRadius: 999, padding: '0 14px', background: '#fff', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const layoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'start' }
const sideTabsStyle: React.CSSProperties = { position: 'sticky', top: 86, display: 'grid', gap: 8, background: 'var(--bg-card)', border: '1px solid #D7EAFB', borderRadius: 'var(--radius-card)', padding: 12, boxShadow: 'var(--shadow-card)' }
const sideTabStyle: React.CSSProperties = { textDecoration: 'none', color: 'var(--abd-primary)', fontWeight: 900, padding: '11px 12px', borderRadius: 12, background: '#F8FBFF' }
const contentStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const cardStyle: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid #D7EAFB', borderRadius: 'var(--radius-card)', padding: 18, boxShadow: 'var(--shadow-card)' }
const sectionHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 14 }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900, marginBottom: 8 }
const miniTitleStyle: React.CSSProperties = { margin: '0 0 12px', color: 'var(--abd-primary)', fontSize: 18, fontWeight: 900 }
const themeBadgeStyle: React.CSSProperties = { border: '1px solid #CFE6FA', borderRadius: 999, padding: '8px 12px', color: 'var(--abd-primary)', background: '#F8FBFF' }
const themeGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(136px, 1fr))', gap: 10, marginBottom: 14 }
const themeCardStyle: React.CSSProperties = { display: 'grid', alignContent: 'start', gap: 8, textAlign: 'right', border: '1px solid #D7EAFB', borderRadius: 14, padding: 10, background: '#fff', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', cursor: 'pointer', minHeight: 112 }
const themeTextStyle: React.CSSProperties = { display: 'grid', gap: 2, lineHeight: 1.25 }
const themeDisplayOptionsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14, padding: 12, border: '1px solid #D7EAFB', borderRadius: 16, background: '#F8FBFF' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 7, color: 'var(--abd-primary)', fontWeight: 900 }
const inputStyle: React.CSSProperties = { minHeight: 42, border: '1px solid #CFE6FA', borderRadius: 12, padding: '8px 12px', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)', background: '#fff' }
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical', width: '100%', marginBottom: 12 }
const logoPreviewBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #D7EAFB', borderRadius: 16, padding: 12, background: '#F8FBFF' }
const logoPreviewStyle: React.CSSProperties = { width: 92, height: 58, objectFit: 'contain', borderRadius: 12, background: '#fff', border: '1px solid #D7EAFB' }
const logoPlaceholderStyle: React.CSSProperties = { display: 'grid', placeItems: 'center', width: 92, height: 58, borderRadius: 12, background: '#fff', border: '1px solid #D7EAFB', color: 'var(--abd-primary)', fontWeight: 900 }
const smallButtonStyle: React.CSSProperties = { border: '1px solid #CFE6FA', borderRadius: 999, background: '#fff', color: 'var(--abd-primary)', padding: '8px 12px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const logoPalettePanelStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginTop: 14, padding: 12, border: '1px solid #D7EAFB', borderRadius: 16, background: '#F8FBFF' }
const circleRowStyle: React.CSSProperties = { display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }
const logoColorCircleStyle: React.CSSProperties = { width: 28, height: 28, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #B9DDF7, 0 5px 12px rgba(15,25,41,.10)' }
const toggleStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', color: 'var(--abd-primary)', fontWeight: 900 }
const previewStyle: React.CSSProperties = { minHeight: 320, display: 'grid', gridTemplateColumns: '92px 1fr', gap: 16, border: '1px solid #D7EAFB', padding: 16, color: 'var(--abd-primary)' }
const previewSidebarStyle: React.CSSProperties = { display: 'grid', justifyItems: 'center', alignContent: 'start', gap: 10, border: '1px solid #D7EAFB', borderRadius: 18, padding: 10 }
const previewLogoStyle: React.CSSProperties = { width: 58, height: 42, objectFit: 'contain', borderRadius: 10, background: '#fff', border: '1px solid #D7EAFB' }
const previewLogoFallbackStyle: React.CSSProperties = { display: 'grid', placeItems: 'center', width: 58, height: 42, borderRadius: 10, background: '#fff', border: '1px solid #D7EAFB', fontWeight: 900 }
const previewNavItemStyle: React.CSSProperties = { width: '100%', borderRadius: 12, padding: '8px 4px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#6F8DB5' }
const previewContentStyle: React.CSSProperties = { display: 'grid', gap: 14, alignContent: 'start' }
const previewHeroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', border: '1px solid #D7EAFB', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-card)' }
const previewButtonStyle: React.CSSProperties = { border: 0, borderRadius: 12, color: '#fff', minHeight: 38, padding: '0 14px', fontFamily: 'var(--font-main)', fontWeight: 900 }
const previewThStyle: React.CSSProperties = { textAlign: 'right', padding: 10, color: '#fff' }
const previewTdStyle: React.CSSProperties = { padding: 10, borderBottom: '1px solid #D7EAFB', color: 'var(--abd-primary)', fontWeight: 800, background: '#fff' }

