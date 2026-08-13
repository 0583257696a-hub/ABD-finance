/**
 * Fetches the full Israeli Consumer Price Index (מדד המחירים לצרכן, כללי)
 * monthly series from the CBS (הלמ"ס) public API and writes a continuous,
 * base-rebase-proof series to src/lib/retirement/params/cpi-monthly.json.
 *
 * Per RETIREMENT_CALCULATORS_SPEC.md §1.4: "יש לבנות סקריפט עדכון חודשי
 * אוטומטי" — re-run this monthly (or whenever a new CBS reading is
 * published, the 15th of each month) to extend the series.
 *
 * Why chaining via month-over-month `percent`, not the raw `currBase.value`:
 * CBS has rebased the index ~22 times since 1951 (e.g. "1976 ממוצע=100",
 * "2024 ממוצע=100"), so raw values from different eras aren't comparable.
 * `percent` (month-over-month % change) is continuous across every rebase
 * boundary — this is the standard chain-linking method Israeli law itself
 * uses for indexation. The most recent base segment ("2024 ממוצע") is used
 * verbatim (CBS's own published values, zero chain error); everything
 * before that is chained backward from that anchor via `percent`.
 *
 * Usage: npx tsx scripts/update-cpi-series.ts
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CPI_SERIES_CODE = 120010 // מדד המחירים לצרכן - כללי
// PageSize is capped server-side at 1000 (>1000 causes a 500); the full
// 1951-present series is currently ~900 rows, comfortably under that cap
// for years to come. endPeriod is computed a year out so re-running this
// later doesn't need the constant bumped.
const endYear = new Date().getFullYear() + 1
const API_URL = `https://api.cbs.gov.il/index/data/price?id=${CPI_SERIES_CODE}&format=json&download=false&startPeriod=01-1951&endPeriod=12-${endYear}&Page=1&PageSize=1000`
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'retirement', 'params', 'cpi-monthly.json')
const META_PATH = join(__dirname, '..', 'src', 'lib', 'retirement', 'params', 'cpi-monthly.meta.json')

type CbsRow = {
  year: number
  month: number
  percent: number | null
  currBase: { baseDesc: string; value: number }
}

type CbsResponse = {
  month: Array<{ code: number; name: string; date: CbsRow[] }>
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

async function main() {
  console.info(`Fetching CPI series ${CPI_SERIES_CODE} from CBS API...`)
  const res = await fetch(API_URL, { headers: { 'User-Agent': 'abd-finance-cpi-updater/1.0' } })
  if (!res.ok) throw new Error(`CBS API request failed: ${res.status} ${res.statusText}`)
  const data = (await res.json()) as CbsResponse

  const rows = data.month?.[0]?.date
  if (!rows?.length) throw new Error('CBS API returned no data — check the series code and date range.')

  // API returns newest-first; sort ascending for chaining.
  const ascending = [...rows].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)

  const latestBase = ascending[ascending.length - 1].currBase.baseDesc
  const series: Record<string, number> = {}

  // Segment using the latest base verbatim (exact published values).
  const latestSegmentStart = ascending.findIndex(row => row.currBase.baseDesc === latestBase)
  for (let i = latestSegmentStart; i < ascending.length; i++) {
    const row = ascending[i]
    series[monthKey(row.year, row.month)] = row.currBase.value
  }

  // Chain backward from the first month of the latest base segment using
  // month-over-month percent: value(m-1) = value(m) / (1 + percent(m)/100).
  // percent(m) is "change from m-1 to m", published on row m.
  let anchor = ascending[latestSegmentStart].currBase.value
  for (let i = latestSegmentStart - 1; i >= 0; i--) {
    const row = ascending[i + 1] // percent belongs to the row AFTER this one
    const pct = row.percent
    if (pct == null) {
      // Only true for the very first data point (no prior month to diff against).
      series[monthKey(ascending[i].year, ascending[i].month)] = anchor / (1 + 0)
      continue
    }
    anchor = anchor / (1 + pct / 100)
    series[monthKey(ascending[i].year, ascending[i].month)] = Math.round(anchor * 10000) / 10000
  }

  const monthCount = Object.keys(series).length
  const [firstKey] = Object.keys(series).sort()
  const lastKey = Object.keys(series).sort().slice(-1)[0]
  console.info(`Built continuous series: ${monthCount} months, ${firstKey} .. ${lastKey}, anchored to base "${latestBase}"`)

  // Pure flat "YYYY-MM" -> value map, matching spec §1.4's exact cpi.json
  // shape and the CpiSeries type in core/indexation.ts directly importable.
  writeFileSync(OUTPUT_PATH, JSON.stringify(series, null, 2) + '\n', 'utf8')
  console.info(`Wrote ${OUTPUT_PATH}`)

  const meta = {
    source: 'CBS (הלשכה המרכזית לסטטיסטיקה) public API, series 120010 — מדד המחירים לצרכן, כללי',
    sourceUrl: `https://api.cbs.gov.il/index/data/price?id=${CPI_SERIES_CODE}&format=json`,
    method: 'Chain-linked via month-over-month percent change across CBS base-rebases; latest base segment (anchorBase) values used verbatim, taken directly from CBS.',
    anchorBase: latestBase,
    monthCount,
    firstMonth: firstKey,
    lastMonth: lastKey,
    lastFetched: new Date().toISOString(),
  }
  writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n', 'utf8')
  console.info(`Wrote ${META_PATH}`)
}

main().catch(error => {
  console.error('update-cpi-series failed:', error)
  process.exit(1)
})
