/**
 * Pull live pension/provident/insurance yield data from data.gov.il (the
 * Capital Market, Insurance and Savings Authority's official open datasets:
 * גמל-נט / פנסיה-נט / ביטוח-נט) and regenerate src/lib/returns-data.ts.
 *
 * Usage: npx tsx scripts/sync-abd-returns.ts   (or: npm run sync:returns)
 *
 * Each dataset publishes one CSV resource per year plus a rolling
 * "YYYY-till now" resource; we only need the rolling one since it always
 * contains the most recent reported month per fund. We keep just the latest
 * REPORT_PERIOD row per FUND_ID (matches the previous single-snapshot shape
 * of returns-data.ts) rather than dumping the full monthly history.
 */
import { writeFileSync } from 'fs'

const CKAN_BASE = 'https://data.gov.il/api/3/action/datastore_search'
const PAGE_SIZE = 5000

type Source = 'gemel' | 'pension' | 'insurance'

const DATASETS: { source: Source; resourceId: string }[] = [
  { source: 'gemel', resourceId: 'a30dcbea-a1d2-482c-ae29-8f781f5025fb' },
  { source: 'pension', resourceId: '6d47d6b5-cb08-488b-b333-f1e717b1e1bd' },
  { source: 'insurance', resourceId: 'c6c62cc7-fe02-4b18-8f3e-813abfbb4647' },
]

type RawRow = Record<string, unknown>

async function fetchAllRows(resourceId: string): Promise<RawRow[]> {
  const rows: RawRow[] = []
  let offset = 0
  for (;;) {
    const url = `${CKAN_BASE}?resource_id=${resourceId}&limit=${PAGE_SIZE}&offset=${offset}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`data.gov.il request failed (${res.status}) for ${resourceId}`)
    const json = (await res.json()) as { success: boolean; result?: { records?: RawRow[] } }
    if (!json.success) throw new Error(`data.gov.il returned success:false for ${resourceId}`)
    const records = json.result?.records || []
    rows.push(...records)
    if (records.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return rows
}

function toNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

// The source dataset has a known encoding glitch where "S&P" was published
// as literal "s1;p" in some historic pension records (verified against the
// raw data.gov.il response) — cosmetic-only fix, doesn't touch any numbers.
function fixKnownEncodingGlitches(value: string): string {
  return value.replace(/s1;p/gi, 'S&P')
}

// Mirrors the specialization heuristic in src/lib/returns-catalog.ts so
// stored tracks carry the same `specialization` values the app expects.
function inferSpecialization(trackName: string): string {
  const text = trackName.toLowerCase()
  if (/s&p|500|מדד 500/.test(text)) return 'עוקב מדד S&P 500'
  if (text.includes('מניות')) return 'מניות'
  if (text.includes('הלכה')) return 'הלכה'
  if (text.includes('אגח') || text.includes('אג"ח')) return 'אג"ח'
  if (text.includes('כספי') || text.includes('שקלי') || text.includes('שיקלי')) return 'כספי / שקלי'
  if (text.includes('50') || text.includes('60') || text.includes('גיל') || text.includes('קצבה')) return 'מסלול גיל / קצבה'
  if (text.includes('כללי')) return 'כללי'
  return ''
}

// Resolve the app's Hebrew productType directly (rather than relying on
// normalizeProductType() downstream, since the raw FUND_CLASSIFICATION text
// from these datasets doesn't literally contain the word "גמל").
function resolveProductType(source: Source, fundClassification: string): string {
  if (source === 'pension') return 'קרן פנסיה'
  if (source === 'insurance') return 'פוליסה פיננסית'
  // gemel-net's FUND_CLASSIFICATION mixes 6 distinct sub-types in one dataset
  // (verified against the full 20,819-row resource, not a partial sample):
  //   תגמולים ואישית לפיצויים / מרכזית לפיצויים / מטרה אחרת -> קופת גמל
  //   קרנות השתלמות                                        -> קרן השתלמות
  //   קופת גמל להשקעה - חסכון לילד                          -> חיסכון לכל ילד
  //   קופת גמל להשקעה                                       -> קופת גמל להשקעה
  // Order matters: check the child-savings variant before the generic
  // "להשקעה" check, since its classification text contains both words.
  if (fundClassification.includes('חסכון לילד') || fundClassification.includes('חיסכון לילד')) return 'חיסכון לכל ילד'
  if (fundClassification.includes('להשקעה')) return 'קופת גמל להשקעה'
  if (fundClassification.includes('השתלמות')) return 'קרן השתלמות'
  return 'קופת גמל'
}

function dedupeLatestPerFund(rows: RawRow[]): RawRow[] {
  const latest = new Map<string, RawRow>()
  for (const row of rows) {
    const fundId = toText(row.FUND_ID)
    if (!fundId) continue
    const period = toNum(row.REPORT_PERIOD) ?? 0
    const existing = latest.get(fundId)
    const existingPeriod = existing ? toNum(existing.REPORT_PERIOD) ?? 0 : -1
    if (!existing || period > existingPeriod) latest.set(fundId, row)
  }
  return [...latest.values()]
}

function buildTrack(source: Source, row: RawRow, index: number) {
  const trackName = fixKnownEncodingGlitches(toText(row.FUND_NAME))
  const manufacturer = toText(row.MANAGING_CORPORATION || row.PARENT_COMPANY_NAME || row.CONTROLLING_CORPORATION)
  const fundClassification = toText(row.FUND_CLASSIFICATION)

  return {
    id: `${source}-${toText(row.FUND_ID) || index}-${index}`,
    source,
    productType: resolveProductType(source, fundClassification),
    manufacturer,
    trackName,
    trackId: toText(row.FUND_ID),
    specialization: inferSpecialization(trackName),
    reportPeriod: toText(row.REPORT_PERIOD),
    returns: {
      periodAvg: toNum(row.MONTHLY_YIELD),
      periodAccumulated: toNum(row.YEAR_TO_DATE_YIELD),
      months36Accumulated: toNum(row.YIELD_TRAILING_3_YRS),
      months60Accumulated: toNum(row.YIELD_TRAILING_5_YRS),
      annual3: toNum(row.AVG_ANNUAL_YIELD_TRAILING_3YRS),
      annual5: toNum(row.AVG_ANNUAL_YIELD_TRAILING_5YRS),
    },
    risk: {
      stdev36: toNum(row.STANDARD_DEVIATION),
      stdev60: null,
      alpha: toNum(row.ALPHA),
      sharpe: toNum(row.SHARPE_RATIO),
      liquidity: toNum(row.LIQUID_ASSETS_PERCENT),
    },
    fees: {
      balance: toNum(row.AVG_ANNUAL_MANAGEMENT_FEE),
      deposit: toNum(row.AVG_DEPOSIT_FEE),
    },
    assets: toNum(row.TOTAL_ASSETS),
    rawProductType: fundClassification,
  }
}

async function main() {
  const allTracks: ReturnType<typeof buildTrack>[] = []

  for (const { source, resourceId } of DATASETS) {
    console.log(`Fetching ${source} (${resourceId})...`)
    const rows = await fetchAllRows(resourceId)
    const latestRows = dedupeLatestPerFund(rows)
    console.log(`  ${rows.length} rows -> ${latestRows.length} funds (latest period each)`)
    latestRows.forEach((row, index) => allTracks.push(buildTrack(source, row, index)))
  }

  const header = `// Generated from data.gov.il (גמל-נט / פנסיה-נט / ביטוח-נט — רשות שוק ההון, ביטוח וחיסכון) on ${new Date().toISOString()}\n`
  const body = `export const ABD_RETURNS_DATA = ${JSON.stringify(allTracks)}\n`
  writeFileSync('src/lib/returns-data.ts', header + body, 'utf8')

  console.log(`\nWrote ${allTracks.length} tracks to src/lib/returns-data.ts`)
}

main().catch(error => {
  console.error('Sync failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
