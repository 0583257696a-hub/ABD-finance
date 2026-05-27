import { ABD_RETURNS_DATA } from './returns-data'

export type AbdTrack = {
  id: string
  productType: string
  manufacturer: string
  trackName: string
  trackId?: string
  specialization?: string
  reportPeriod?: string
  returns?: {
    periodAvg?: number | null
    periodAccumulated?: number | null
    months36Accumulated?: number | null
    months60Accumulated?: number | null
    annual3?: number | null
    annual5?: number | null
  }
  risk?: Record<string, number | null>
  fees?: Record<string, number | null>
  assets?: number | null
}

const MANUFACTURERS = [
  'מיטב',
  'הראל',
  'כלל',
  'מגדל',
  'מנורה מבטחים',
  'הפניקס',
  'אלטשולר שחם',
  'ילין לפידות',
  'מור',
  'אנליסט',
  'איילון',
  'הכשרה',
]
export const ABD_ALLOWED_RETURN_MANUFACTURERS = [
  'כלל',
  'מנורה מבטחים',
  'הפניקס',
  'מגדל',
  'מיטב',
  'הראל',
  'מור',
  'אנליסט',
  'אלטשולר שחם',
  'ילין לפידות',
]

function compact(value: unknown) {
  return String(value || '')
    .replace(/בע"מ/g, '')
    .replace(/בעמ/g, '')
    .replace(/חברה לניהול/g, '')
    .replace(/קופות גמל/g, '')
    .replace(/קרנות השתלמות/g, '')
    .replace(/קרן פנסיה/g, '')
    .replace(/פנסיה וגמל/g, '')
    .replace(/ביטוח/g, '')
    .replace(/[.,()"״']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeManufacturerName(value: unknown) {
  const text = compact(value)
  return MANUFACTURERS.find(name => text.includes(name) || name.includes(text)) || text
}

export function isAllowedAbdReturnManufacturer(value: unknown) {
  return ABD_ALLOWED_RETURN_MANUFACTURERS.includes(normalizeManufacturerName(value))
}

export function normalizeProductType(value: unknown) {
  const text = String(value || '')
  if (text.includes('השתלמות')) return 'קרן השתלמות'
  if (text.includes('פנס')) return 'קרן פנסיה'
  if (text.includes('גמל להשקעה')) return 'קופת גמל להשקעה'
  if (text.includes('ילד')) return 'חיסכון לכל ילד'
  if (text.includes('גמל')) return 'קופת גמל'
  if (text.includes('פוליסה') || text.includes('ביטוח') || text.includes('מנהלים') || text.includes('פיננס')) return 'פוליסה פיננסית'
  return text.trim()
}

export function normalizeTrackName(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function compactTrack(value: unknown) {
  return normalizeTrackName(value)
    .replace(/[״"']/g, '')
    .replace(/[^\u0590-\u05FFa-zA-Z0-9]+/g, '')
    .toLowerCase()
}

function inferSpecialization(value: unknown) {
  const text = String(value || '').toLowerCase()
  if (/s&p|500|מדד 500/.test(text)) return 'עוקב מדד S&P 500'
  if (text.includes('מניות')) return 'מניות'
  if (text.includes('הלכה')) return 'הלכה'
  if (text.includes('אגח') || text.includes('אג"ח')) return 'אג"ח'
  if (text.includes('כספי') || text.includes('שקלי') || text.includes('שיקלי')) return 'כספי / שקלי'
  if (text.includes('50') || text.includes('60') || text.includes('גיל') || text.includes('קצבה')) return 'מסלול גיל / קצבה'
  if (text.includes('כללי')) return 'כללי'
  return ''
}

export function getAllAbdTracks(): AbdTrack[] {
  return (ABD_RETURNS_DATA as AbdTrack[]).map(track => ({
    ...track,
    productType: normalizeProductType(track.productType),
    manufacturer: normalizeManufacturerName(track.manufacturer),
    trackName: normalizeTrackName(track.trackName),
  }))
}

export function getManufacturersByProductType(productType: string) {
  const normalizedType = normalizeProductType(productType)
  return Array.from(new Set(
    getAllAbdTracks()
      .filter(track => !normalizedType || track.productType === normalizedType)
      .map(track => track.manufacturer)
      .filter(isAllowedAbdReturnManufacturer)
      .filter(Boolean),
  )).sort((a, b) => a.localeCompare(b, 'he'))
}

export function getTracksByProductAndManufacturer(productType: string, manufacturer: string) {
  const normalizedType = normalizeProductType(productType)
  const normalizedManufacturer = normalizeManufacturerName(manufacturer)
  return getAllAbdTracks()
    .filter(track => !normalizedType || track.productType === normalizedType)
    .filter(track => {
      if (!normalizedManufacturer) return true
      return track.manufacturer === normalizedManufacturer && track.trackName.startsWith(normalizedManufacturer)
    })
    .sort((a, b) => Number(b.returns?.annual5 ?? -999) - Number(a.returns?.annual5 ?? -999))
}

export function getTrackDetails(trackId: string) {
  return getAllAbdTracks().find(track => track.id === trackId || track.trackId === trackId)
}

export function findAbdTrackForFund(productType?: string, manufacturer?: string, trackName?: string) {
  const normalizedType = normalizeProductType(productType)
  const normalizedManufacturer = normalizeManufacturerName(manufacturer)
  const normalizedTrack = normalizeTrackName(trackName)
  const compactFundTrack = compactTrack(normalizedTrack)
  const fundSpecialization = inferSpecialization(normalizedTrack)

  return getAllAbdTracks()
    .filter(track => !normalizedType || track.productType === normalizedType)
    .filter(track => !normalizedManufacturer || track.manufacturer === normalizedManufacturer)
    .map(track => {
      const compactCatalogTrack = compactTrack(track.trackName)
      let score = 0
      if (compactFundTrack && compactCatalogTrack) {
        if (compactFundTrack === compactCatalogTrack) score += 100
        if (compactCatalogTrack.includes(compactFundTrack) || compactFundTrack.includes(compactCatalogTrack)) score += 45
      }
      if (fundSpecialization && track.specialization === fundSpecialization) score += 18
      if (normalizedManufacturer && track.trackName.startsWith(normalizedManufacturer)) score += 8
      if (track.returns?.annual5 != null) score += 2
      if (track.returns?.periodAccumulated != null) score += 1
      return { track, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.track.returns?.annual5 ?? -999) - Number(a.track.returns?.annual5 ?? -999))[0]?.track
}
