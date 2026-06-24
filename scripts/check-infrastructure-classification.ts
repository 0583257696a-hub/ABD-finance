import { buildInfrastructureRows, getInfrastructureTotals } from '../src/lib/infrastructure'
import type { Fund, PeriodRow } from '../src/types/fund'

function period(amount: number, componentCode: string, balanceTypeCode: string, periodCode: string): PeriodRow {
  return {
    id: `${componentCode}-${balanceTypeCode}-${periodCode}-${amount}`,
    amount,
    componentCode,
    balanceTypeCode,
    periodCode,
  }
}

function fund(accountNumber: string, rows: PeriodRow[]): Fund {
  return {
    id: accountNumber,
    accountNumber,
    manufacturer: 'מגדל חברה לביטוח בע"מ',
    productType: 'קצבה+הון',
    status: 'פעיל',
    currentBalance: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    retirementCapital: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    importedPension: 0,
    recommendation: '',
    beneficiaries: [],
    employers: [],
    depositRows: [],
    periodRows: rows,
  }
}

const funds: Fund[] = [
  fund('14103120', [
    period(945263, '1', '3', '3'),
    period(3525, '1', '1', '4'),
    period(27831, '2', '1', '4'),
    period(49254, '2', '3', '1'),
    period(1854214, '2', '3', '7'),
  ]),
  fund('14133472', [
    period(33657, '1', '3', '3'),
    period(1081, '1', '1', '4'),
    period(10574, '2', '1', '4'),
    period(9899, '2', '3', '1'),
    period(31961, '2', '3', '7'),
  ]),
  fund('411132688', [
    period(143076, '1', '3', '3'),
    period(82206, '2', '1', '4'),
    period(146404, '2', '3', '7'),
  ]),
  fund('1421912', [
    period(38812, '2', '1', '4'),
  ]),
  fund('14421252', [
    period(376560, '1', '3', '3'),
    period(617968, '2', '3', '7'),
  ]),
  fund('14497501', [
    period(2850, '2', '1', '4'),
    period(13534, '2', '3', '7'),
  ]),
  fund('14902481', [
    period(94176, '1', '3', '3'),
    period(38767, '1', '1', '4'),
    period(134971, '2', '1', '4'),
    period(105426, '2', '3', '7'),
  ]),
  fund('44911421', [
    period(127973, '2', '3', '7'),
  ]),
  fund('20453081', [
    period(291, '2', '3', '7'),
  ]),
]

const totals = getInfrastructureTotals(buildInfrastructureRows(funds))
const expected = {
  total: 4_890_273,
  compensationPension: 1_592_732,
  compensationCapital: 43_373,
  capitalBefore2008: 297_244,
  capitalAfter2008: 0,
  pensionBefore2000: 59_153,
  pensionAfter2000: 2_897_771,
}

const actual = {
  total: totals.total,
  compensationPension: totals.compensationPension,
  compensationCapital: totals.compensationCapital,
  capitalBefore2008: totals.capitalBefore2008,
  capitalAfter2008: totals.capitalAfter2008,
  pensionBefore2000: totals.pensionBefore2000,
  pensionAfter2000: totals.pensionAfter2000,
}

for (const [key, value] of Object.entries(expected)) {
  if (Math.round(actual[key as keyof typeof actual]) !== value) {
    console.error('Infrastructure classification mismatch', { key, expected: value, actual: actual[key as keyof typeof actual] })
    process.exit(1)
  }
}

console.info('Infrastructure classification check passed', actual)
