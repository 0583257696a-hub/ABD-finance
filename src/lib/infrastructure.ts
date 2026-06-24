import type { Fund, PeriodRow } from '@/types/fund'

export type InfrastructurePeriodRow = PeriodRow & {
  amount: number
  layerKind: string
  balanceKind: string
  componentKind: string
}

export type InfrastructureRow = {
  id: string
  index: number
  manufacturer?: string
  accountNumber?: string
  startDate?: string
  yieldMode?: string
  compensationPension: number
  compensationCapital: number
  capitalBefore2008: number
  capitalAfter2008: number
  pensionBefore2000: number
  pensionAfter2000: number
  importedPension: number
  total: number
}

function clean(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeText(value: unknown) {
  return clean(value).toLowerCase()
}

export function toInfrastructureNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/[^\d.,-]/g, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function roundNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function firstPositive(...values: number[]) {
  for (const value of values) {
    if (Number.isFinite(value) && value > 0) return value
  }
  return values.length ? values[values.length - 1] || 0 : 0
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + (Number(getValue(item)) || 0), 0)
}

function isCapitalBalanceType(label?: string) {
  return /הון/.test(label || '')
}

function isPensionBalanceType(label?: string) {
  return /קצבה/.test(label || '')
}

function isCompensationComponent(label?: string) {
  return /פיצויים/.test(label || '')
}

function getInfrastructureBalanceKind(row: PeriodRow) {
  const code = clean(row.balanceTypeCode)
  if (code === '1') return 'capital'
  if (code === '2' || code === '3') return 'pension'
  if (isCapitalBalanceType(row.balanceTypeLabel)) return 'capital'
  if (isPensionBalanceType(row.balanceTypeLabel)) return 'pension'
  return 'other'
}

function getInfrastructureComponentKind(row: PeriodRow) {
  const code = clean(row.componentCode)
  if (code === '1') return 'compensation'
  if (code === '2' || code === '3' || code === '4') return 'contribution'
  if (isCompensationComponent(row.componentLabel)) return 'compensation'
  if (/תגמולים/.test(row.componentLabel || '')) return 'contribution'
  return 'other'
}

function getInfrastructureLayerKind(row: PeriodRow) {
  const code = clean(row.periodCode)
  if (code === '1') return 'before2000'
  if (code === '2') return 'through2008'
  if (code === '3') return 'from2008'
  if (code === '4' || code === '6') return 'capital-through2008'
  if (code === '7') return 'capital-from2008'
  if (code === '9') return 'capital-route'

  const label = normalizeText(row.periodLabel)
  if (/לאחר\s*חוק\s*ההסדרים|אחרי\s*חוק\s*ההסדרים/.test(label)) return 'after2000'
  if (/עד\s*חוק\s*ההסדרים/.test(label)) return 'before2000'
  if (/לפני\s*2000|עד\s*2000|31\/12\/1999|1999/.test(label)) return 'before2000'
  if (/2000\s*ואילך|אחרי\s*2000|לאחר\s*2000|משנת\s*2000|החל\s*מ-?\s*2000/.test(label)) return 'after2000'
  if (/עד\s*2008/.test(label)) return 'through2008'
  if (/מ-?\s*2008|אחרי\s*2008/.test(label)) return 'from2008'
  if (/קצבתי/.test(label)) return 'pension-route'
  if (/הוני/.test(label)) return 'capital-route'
  return 'other'
}

function getInfrastructureBucket(row: InfrastructurePeriodRow) {
  if (row.componentKind === 'compensation') {
    return row.balanceKind === 'capital' ? 'compensationCapital' : 'compensationPension'
  }

  if (row.componentKind !== 'contribution') return ''

  const layerCode = clean(row.periodCode)
  if (layerCode === '1') return row.balanceKind === 'capital' ? 'capitalBefore2008' : 'pensionBefore2000'
  if (layerCode === '2') return row.balanceKind === 'capital' ? 'capitalAfter2008' : 'pensionAfter2000'
  if (layerCode === '3' || layerCode === '5') return 'capitalBefore2008'
  if (layerCode === '4' || layerCode === '6') return 'capitalBefore2008'
  if (layerCode === '7') return row.balanceKind === 'capital' ? 'capitalAfter2008' : 'pensionAfter2000'
  if (layerCode === '9') return row.balanceKind === 'capital' ? 'capitalAfter2008' : 'pensionAfter2000'

  if (row.layerKind === 'before2000') return row.balanceKind === 'capital' ? 'capitalBefore2008' : 'pensionBefore2000'
  if (row.layerKind === 'after2000') return row.balanceKind === 'capital' ? 'capitalAfter2008' : 'pensionAfter2000'
  if (row.layerKind === 'through2008') return row.balanceKind === 'capital' ? 'capitalAfter2008' : 'pensionAfter2000'
  if (row.layerKind === 'from2008') return 'capitalBefore2008'
  if (row.layerKind === 'capital-through2008') return 'capitalBefore2008'
  if (row.layerKind === 'capital-from2008') return row.balanceKind === 'capital' ? 'capitalAfter2008' : 'pensionAfter2000'
  if (row.layerKind === 'capital-route') return row.balanceKind === 'capital' ? 'capitalAfter2008' : 'pensionAfter2000'
  if (row.layerKind === 'pension-route') return 'pensionAfter2000'

  if (row.balanceKind === 'capital') return 'capitalAfter2008'
  if (row.balanceKind === 'pension') return 'pensionAfter2000'
  return ''
}

export function normalizeInfrastructureRows(rows: PeriodRow[] = []) {
  const seenContributionRows = new Set<string>()
  return rows.reduce<InfrastructurePeriodRow[]>((acc, row) => {
    const amount = toInfrastructureNumber(row.amount)
    if (!(amount > 0)) return acc
    const normalized: InfrastructurePeriodRow = {
      ...row,
      amount,
      layerKind: getInfrastructureLayerKind(row),
      balanceKind: getInfrastructureBalanceKind(row),
      componentKind: getInfrastructureComponentKind(row),
    }
    if (normalized.componentKind === 'contribution') {
      const duplicateKey = [
        normalized.layerKind,
        normalized.balanceKind,
        normalized.componentCode || '',
        normalized.componentLabel || '',
        roundNumber(amount, 2),
      ].join('|')
      if (seenContributionRows.has(duplicateKey)) return acc
      seenContributionRows.add(duplicateKey)
    }
    acc.push(normalized)
    return acc
  }, [])
}

export function getInfrastructureYieldMode(fund: Fund) {
  if (/כן/i.test(fund.guaranteedYieldFlag || '')) return 'כולל אינדיקציה להבטחת תשואה'
  if (fund.investmentTrack) return fund.investmentTrack
  return 'לפי נתוני הדוח'
}

export function isInfrastructureFund(fund: Fund, infrastructureIds: string[]) {
  return infrastructureIds.includes(String(fund.id || '')) || clean(fund.genderScore) === 'משוך קצבה'
}

export function buildInfrastructureRows(sourceFunds: Fund[] = [], infrastructureIds?: string[]): InfrastructureRow[] {
  const funds = infrastructureIds ? sourceFunds.filter(fund => isInfrastructureFund(fund, infrastructureIds)) : sourceFunds
  return funds.map((fund, index) => {
    const rows = normalizeInfrastructureRows(fund.periodRows || [])
    const bucketOf = (row: InfrastructurePeriodRow) => getInfrastructureBucket(row)

    let compensationPension = sumBy(rows.filter(row => bucketOf(row) === 'compensationPension'), row => row.amount)
    let compensationCapital = sumBy(rows.filter(row => bucketOf(row) === 'compensationCapital'), row => row.amount)
    let capitalBefore2008 = sumBy(rows.filter(row => bucketOf(row) === 'capitalBefore2008'), row => row.amount)
    let capitalAfter2008 = sumBy(rows.filter(row => bucketOf(row) === 'capitalAfter2008'), row => row.amount)
    let pensionBefore2000 = sumBy(rows.filter(row => bucketOf(row) === 'pensionBefore2000'), row => row.amount)
    let pensionAfter2000 = sumBy(rows.filter(row => bucketOf(row) === 'pensionAfter2000'), row => row.amount)
    let total = compensationPension + compensationCapital + capitalBefore2008 + capitalAfter2008 + pensionBefore2000 + pensionAfter2000

    const referenceTotal = firstPositive(
      toInfrastructureNumber(fund.retirementCapital),
      toInfrastructureNumber(fund.currentBalance),
      total,
      0,
    )

    if (referenceTotal > 0 && total <= 0) {
      const fundTypeText = `${fund.productType || ''} ${fund.productName || ''} ${fund.planName || ''}`
      if (/(פנסיה|ביטוח מנהלים|קצבה)/i.test(fundTypeText)) {
        pensionAfter2000 = referenceTotal
      } else {
        capitalAfter2008 = referenceTotal
      }
      total = compensationPension + compensationCapital + capitalBefore2008 + capitalAfter2008 + pensionBefore2000 + pensionAfter2000
    }

    return {
      id: fund.id || `${fund.accountNumber || index}`,
      index: index + 1,
      manufacturer: fund.manufacturer,
      accountNumber: fund.accountNumber,
      startDate: fund.startDate || fund.joinDate || 'לא זמין',
      yieldMode: getInfrastructureYieldMode(fund),
      compensationPension,
      compensationCapital,
      capitalBefore2008,
      capitalAfter2008,
      pensionBefore2000,
      pensionAfter2000,
      importedPension: toInfrastructureNumber(fund.importedPension),
      total,
    }
  })
}

export function getInfrastructureTotals(rows: InfrastructureRow[]) {
  return {
    count: rows.length,
    capital: sumBy(rows, row => row.compensationCapital + row.capitalBefore2008 + row.capitalAfter2008),
    pension: sumBy(rows, row => row.compensationPension + row.pensionBefore2000 + row.pensionAfter2000),
    total: sumBy(rows, row => row.total),
    importedPension: sumBy(rows, row => row.importedPension),
    contributionCapital: sumBy(rows, row => row.capitalBefore2008 + row.capitalAfter2008),
    contributionPension: sumBy(rows, row => row.pensionBefore2000 + row.pensionAfter2000),
    compensationCapital: sumBy(rows, row => row.compensationCapital),
    compensationPension: sumBy(rows, row => row.compensationPension),
    capitalBefore2008: sumBy(rows, row => row.capitalBefore2008),
    capitalAfter2008: sumBy(rows, row => row.capitalAfter2008),
    pensionBefore2000: sumBy(rows, row => row.pensionBefore2000),
    pensionAfter2000: sumBy(rows, row => row.pensionAfter2000),
  }
}
