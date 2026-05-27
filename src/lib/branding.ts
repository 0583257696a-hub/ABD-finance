export const USER_SETTINGS_KEY = 'abd_user_settings'
export const BRANDING_EVENT = 'abd-branding-change'

export type ThemeId = 'abd-blue' | 'emerald' | 'royal' | 'graphite' | 'wine' | 'sand'

export type BrandingSettings = {
  companyName: string
  advisorName: string
  emailSignature: string
  logoData: string
  themeId: ThemeId
  primaryColor: string
  accentColor: string
  shellColor: string
  cardColor: string
  sidebarColor: string
  headingColor: string
  bodyColor: string
  zebraRowColor: string
  tableDensity: 'compact' | 'normal' | 'wide'
  borderRadius: 'soft' | 'normal' | 'round'
  showAnimations: boolean
  summaryOpening: string
  summaryClosing: string
}

export const themePresets: Array<{
  id: ThemeId
  name: string
  description: string
  primaryColor: string
  accentColor: string
  shellColor: string
  cardColor: string
  sidebarColor: string
  headingColor: string
  bodyColor: string
}> = [
  {
    id: 'abd-blue',
    name: 'ABD כחול',
    description: 'הערכת המקורית של המערכת',
    primaryColor: '#1B3A6B',
    accentColor: '#2563EB',
    shellColor: '#EEF2F7',
    cardColor: '#FFFFFF',
    sidebarColor: '#FFFFFF',
    headingColor: '#0F1929',
    bodyColor: '#334155',
  },
  {
    id: 'emerald',
    name: 'ירוק פיננסי',
    description: 'נקי, רגוע ומתאים לתיקי השקעות',
    primaryColor: '#075E54',
    accentColor: '#10B981',
    shellColor: '#EFF8F4',
    cardColor: '#FFFFFF',
    sidebarColor: '#F8FFFC',
    headingColor: '#073B35',
    bodyColor: '#25423D',
  },
  {
    id: 'royal',
    name: 'כחול רויאל',
    description: 'טכנולוגי, חד ויוקרתי',
    primaryColor: '#1D2F6F',
    accentColor: '#4F46E5',
    shellColor: '#F1F4FF',
    cardColor: '#FFFFFF',
    sidebarColor: '#FFFFFF',
    headingColor: '#111B4F',
    bodyColor: '#33406A',
  },
  {
    id: 'graphite',
    name: 'גרפיט',
    description: 'מראה פרימיום כהה-בהיר',
    primaryColor: '#1F2937',
    accentColor: '#64748B',
    shellColor: '#F3F4F6',
    cardColor: '#FFFFFF',
    sidebarColor: '#FAFAFA',
    headingColor: '#111827',
    bodyColor: '#374151',
  },
  {
    id: 'wine',
    name: 'יין עמוק',
    description: 'חם, סמכותי ומבודל',
    primaryColor: '#6D1F3F',
    accentColor: '#BE2E5C',
    shellColor: '#FFF2F6',
    cardColor: '#FFFFFF',
    sidebarColor: '#FFF8FA',
    headingColor: '#431125',
    bodyColor: '#513443',
  },
  {
    id: 'sand',
    name: 'זהב רך',
    description: 'קלאסי ועדין למסמכי פרישה',
    primaryColor: '#6F5521',
    accentColor: '#C89B3C',
    shellColor: '#F8F4EA',
    cardColor: '#FFFFFF',
    sidebarColor: '#FFFDF8',
    headingColor: '#3D3017',
    bodyColor: '#514632',
  },
]

export const defaultBrandingSettings: BrandingSettings = {
  companyName: 'ABD Finance',
  advisorName: '',
  emailSignature: 'בברכה,\nABD Finance',
  logoData: '',
  themeId: 'abd-blue',
  primaryColor: '#1B3A6B',
  accentColor: '#2563EB',
  shellColor: '#EEF2F7',
  cardColor: '#FFFFFF',
  sidebarColor: '#FFFFFF',
  headingColor: '#0F1929',
  bodyColor: '#334155',
  zebraRowColor: '#EEF7FF',
  tableDensity: 'normal',
  borderRadius: 'normal',
  showAnimations: true,
  summaryOpening: 'תודה על פגישת התכנון. להלן סיכום הנושאים, ההמלצות והפעולות להמשך.',
  summaryClosing: 'נשמח להמשיך ללוות אותך בקבלת החלטות פיננסיות ופנסיוניות.',
}

export function settingsFromTheme(themeId: ThemeId) {
  return themePresets.find(theme => theme.id === themeId) || themePresets[0]
}

export function normalizeBrandingSettings(value: Partial<BrandingSettings> | null | undefined): BrandingSettings {
  const theme = settingsFromTheme(value?.themeId || defaultBrandingSettings.themeId)
  return {
    ...defaultBrandingSettings,
    ...theme,
    ...(value || {}),
  }
}

export function readBrandingSettings(): BrandingSettings {
  if (typeof window === 'undefined') return defaultBrandingSettings
  try {
    return normalizeBrandingSettings(JSON.parse(localStorage.getItem(USER_SETTINGS_KEY) || '{}'))
  } catch {
    return defaultBrandingSettings
  }
}

export function saveBrandingSettings(settings: BrandingSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent(BRANDING_EVENT, { detail: settings }))
}

export function applyBrandingSettings(settings: BrandingSettings) {
  if (typeof document === 'undefined') return
  const radius = settings.borderRadius === 'soft' ? '10px' : settings.borderRadius === 'round' ? '22px' : '16px'
  const primaryText = ensureReadableText(settings.primaryColor)
  const headingText = ensureReadableText(settings.headingColor)
  const bodyText = ensureReadableText(settings.bodyColor)
  const mutedText = mixColors(bodyText, '#64748B', 0.35)
  const root = document.documentElement
  root.style.setProperty('--abd-primary', primaryText)
  root.style.setProperty('--abd-accent', settings.accentColor)
  root.style.setProperty('--abd-accent-light', `${settings.accentColor}14`)
  root.style.setProperty('--abd-accent-mid', `${settings.accentColor}33`)
  root.style.setProperty('--bg-shell', settings.shellColor)
  root.style.setProperty('--bg-card', settings.cardColor)
  root.style.setProperty('--bg-sidebar', settings.sidebarColor)
  root.style.setProperty('--bg-sidebar-active', `${settings.primaryColor}18`)
  root.style.setProperty('--text-heading', headingText)
  root.style.setProperty('--text-body', bodyText)
  root.style.setProperty('--text-muted', mutedText)
  root.style.setProperty('--table-zebra-bg', settings.zebraRowColor)
  root.style.setProperty('--radius-card', radius)
  root.style.setProperty('--radius-btn', settings.borderRadius === 'round' ? '14px' : '10px')
  document.body.dataset.density = settings.tableDensity
  document.body.dataset.animations = settings.showAnimations ? 'on' : 'off'
}

function ensureReadableText(color: string) {
  const rgb = hexToRgb(color)
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  if (luminance < 0.36) return rgbToHex(rgb.r, rgb.g, rgb.b)
  return rgbToHex(rgb.r * 0.52, rgb.g * 0.52, rgb.b * 0.52)
}

function hexToRgb(hex: string) {
  const clean = String(hex || '#1B3A6B').replace('#', '')
  const value = clean.length === 3 ? clean.split('').map(char => char + char).join('') : clean.padEnd(6, '0').slice(0, 6)
  return {
    r: parseInt(value.slice(0, 2), 16) || 0,
    g: parseInt(value.slice(2, 4), 16) || 0,
    b: parseInt(value.slice(4, 6), 16) || 0,
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`
}

function mixColors(color: string, target: string, amount: number) {
  const base = hexToRgb(color)
  const next = hexToRgb(target)
  return rgbToHex(base.r * (1 - amount) + next.r * amount, base.g * (1 - amount) + next.g * amount, base.b * (1 - amount) + next.b * amount)
}
