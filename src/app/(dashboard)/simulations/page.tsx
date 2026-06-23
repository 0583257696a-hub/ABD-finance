'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend as ChartLegend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import ReturnsPage from '@/app/(dashboard)/returns/page'
import AbdReturnsPage from '@/app/(dashboard)/abd-returns/page'
import {
  buildInfrastructureRows,
  getInfrastructureTotals,
  isInfrastructureFund,
  type InfrastructureRow,
} from '@/lib/infrastructure'
import type { Fund } from '@/types/fund'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, ChartLegend)

const FUNDS_KEY = 'abd_next_funds'
const INFRASTRUCTURE_IDS_KEY = 'abd_next_infrastructure_ids'
const INFRASTRUCTURE_COLUMN_WIDTHS_KEY = 'abd_next_infrastructure_column_widths'
const ACTIVE_SIM_VIEW_KEY = 'abd_next_simulations_active_view'
const COMPOUND_INPUTS_KEY = 'abd_next_simulations_compound_inputs'

type SimView = 'compound' | 'phoenix' | 'returns' | 'abdReturns' | 'infrastructure'
type ChartMode = 'nominal' | 'real' | 'both'
type Scenario = 'conservative' | 'base' | 'optimistic'
type TaxType = 'real' | 'nominal' | 'exempt'
type PhoenixFund = 'comprehensive' | 'general'
type PhoenixGender = 'male' | 'female'
type PhoenixMaritalStatus = 'single' | 'married'

type PhoenixInputs = {
  fund: PhoenixFund
  retirementMonth: string
  retirementYear: string
  memberBirth: string
  memberGender: PhoenixGender
  maritalStatus: PhoenixMaritalStatus
  spouseRate: string
  spouseBirth: string
  guaranteeMonths: string
  retroMonths: string
  accumulation: string
  feeRate: string
}

type PhoenixModel = ReturnType<typeof buildPhoenixModel>

type PhoenixSelectionPart = {
  key: keyof Pick<
    InfrastructureRow,
    'compensationPension' |
    'compensationCapital' |
    'capitalBefore2008' |
    'capitalAfter2008' |
    'pensionBefore2000' |
    'pensionAfter2000'
  >
  label: string
}

type CompoundInputs = {
  initialAmount: string
  monthlyDeposit: string
  annualReturn: string
  years: string
  depositFee: string
  annualFee: string
  inflation: string
  taxType: TaxType
  linked: boolean
  scenario: Scenario
  advOpen: boolean
}

type AnnualRow = {
  year: number
  grossDeposits: number
  netBalance: number
  realBalance: number
  nominalGain: number
  taxAmount: number
  afterTax: number
  totalFees: number
}

const defaultCompoundInputs: CompoundInputs = {
  initialAmount: '100000',
  monthlyDeposit: '1500',
  annualReturn: '6',
  years: '20',
  depositFee: '0',
  annualFee: '0.6',
  inflation: '2',
  taxType: 'real',
  linked: false,
  scenario: 'base',
  advOpen: false,
}

const defaultPhoenixInputs: PhoenixInputs = {
  fund: 'comprehensive',
  retirementMonth: '6',
  retirementYear: '2026',
  memberBirth: '1961-06-18',
  memberGender: 'male',
  maritalStatus: 'married',
  spouseRate: '0.7',
  spouseBirth: '1964-02-14',
  guaranteeMonths: '120',
  retroMonths: '0',
  accumulation: '1500000',
  feeRate: '0.003',
}

const phoenixScenarioRows = [
  { label: '0% - עבור מצב משפחתי "לא נשוי"', spousePercent: 0 },
  { label: '30%', spousePercent: 0.3 },
  { label: '40%', spousePercent: 0.4 },
  { label: '50%', spousePercent: 0.5 },
  { label: '60%', spousePercent: 0.6 },
  { label: '70%', spousePercent: 0.7 },
  { label: '80%', spousePercent: 0.8 },
  { label: '90%', spousePercent: 0.9 },
  { label: '100%', spousePercent: 1 },
]
const phoenixGuaranteeOptions = [0, 60, 120, 180, 240]
const PHOENIX_INPUTS_KEY = 'abd_next_phoenix_inputs'
const PHOENIX_SELECTION_KEY = 'abd_next_phoenix_selected_parts'

const phoenixSelectionParts: PhoenixSelectionPart[] = [
  { key: 'compensationPension', label: 'פיצויים לקצבה' },
  { key: 'compensationCapital', label: 'פיצויים הוניים' },
  { key: 'capitalBefore2008', label: 'תגמולי הון עד 2008' },
  { key: 'capitalAfter2008', label: 'תגמולי הון מ-2008' },
  { key: 'pensionBefore2000', label: 'תגמולים לקצבה עד 2000' },
  { key: 'pensionAfter2000', label: 'תגמולים לקצבה אחרי 2000' },
]

const simViews: Array<{ id: SimView; label: string; note: string }> = [
  { id: 'compound', label: 'מחשבון ריבית דריבית', note: 'חישוב צבירה, מס, דמי ניהול ותרחישים' },
  { id: 'phoenix', label: 'מחשבון קצבה הפניקס', note: 'סימולטור הקצבה המקורי בתוך המערכת' },
  { id: 'returns', label: 'טבלאות תשואות', note: 'תשואות לקופות הלקוח בלבד' },
  { id: 'abdReturns', label: 'תשואות ABD FINANCE', note: 'מאגר רשות שוק ההון לפי סוג מוצר ומסלול' },
  { id: 'infrastructure', label: 'תשתיות לקצבה', note: 'פילוח שכבות תגמולים ופיצויים' },
]

const infrastructureColumns = [
  { key: 'index', label: '#', width: 54, minWidth: 44 },
  { key: 'manufacturer', label: 'יצרן', width: 130, minWidth: 90 },
  { key: 'accountNumber', label: 'מס׳ פוליסה', width: 140, minWidth: 100 },
  { key: 'startDate', label: 'תחילת ביטוח', width: 120, minWidth: 96 },
  { key: 'compensationPension', label: 'פיצויים למס', width: 150, minWidth: 110 },
  { key: 'compensationCapital', label: 'פיצויים מעסיק הון', width: 160, minWidth: 120 },
  { key: 'capitalBefore2008', label: 'תגמולי הון עד 2008', width: 170, minWidth: 130 },
  { key: 'capitalAfter2008', label: 'תגמולי הון מ-2008', width: 180, minWidth: 130 },
  { key: 'pensionBefore2000', label: 'תגמולים לקצבה עד 2000', width: 190, minWidth: 140 },
  { key: 'pensionAfter2000', label: 'תגמולים לקצבה אחרי 2000', width: 200, minWidth: 150 },
  { key: 'total', label: 'סה"כ', width: 150, minWidth: 110 },
  { key: 'yieldMode', label: 'אופן תשואה / מסלול', width: 220, minWidth: 150 },
] as const

type InfrastructureColumnKey = typeof infrastructureColumns[number]['key']

function num(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/[^\d.,-]/g, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + (Number(getValue(item)) || 0), 0)
}

function money(value: unknown) {
  return num(value).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  })
}

function fmtNumber(value: unknown, digits = 2) {
  const parsed = num(value)
  return Number.isFinite(parsed) ? parsed.toLocaleString('he-IL', { maximumFractionDigits: digits }) : '-'
}

function percent(value: unknown) {
  const parsed = num(value)
  return parsed > 0 ? parsed.toFixed(2) : '-'
}

function scenarioAnnualReturn(inputs: CompoundInputs) {
  const base = num(inputs.annualReturn)
  if (inputs.scenario === 'conservative') return base - 2
  if (inputs.scenario === 'optimistic') return base + 2
  return base
}

function calculateCompoundProjection(inputs: CompoundInputs) {
  const years = Math.max(0, Math.round(num(inputs.years)))
  const months = years * 12
  const annualReturn = scenarioAnnualReturn(inputs)
  const annualFee = num(inputs.annualFee)
  const depositFee = num(inputs.depositFee)
  const inflation = num(inputs.inflation)
  const monthlyReturn = Math.pow(1 + annualReturn / 100, 1 / 12) - 1
  const monthlyBalanceFee = Math.max(0, annualFee / 100 / 12)
  const monthlyInflation = Math.pow(1 + inflation / 100, 1 / 12) - 1
  let balance = Math.max(0, num(inputs.initialAmount))
  let totalDeposits = balance
  let totalFees = 0
  let monthlyDeposit = Math.max(0, num(inputs.monthlyDeposit))
  const annualRows: AnnualRow[] = []

  for (let month = 1; month <= months; month += 1) {
    const depositFeeAmount = monthlyDeposit * (depositFee / 100)
    const netDeposit = monthlyDeposit - depositFeeAmount
    balance += netDeposit
    totalDeposits += monthlyDeposit
    totalFees += depositFeeAmount
    balance *= 1 + monthlyReturn
    const balanceFeeAmount = balance * monthlyBalanceFee
    balance -= balanceFeeAmount
    totalFees += balanceFeeAmount

    if (inputs.linked) monthlyDeposit *= 1 + monthlyInflation

    if (month % 12 === 0) {
      const year = month / 12
      const realBalance = balance / Math.pow(1 + inflation / 100, year)
      const nominalGain = Math.max(0, balance - totalDeposits)
      const taxableGain = inputs.taxType === 'real'
        ? Math.max(0, realBalance - totalDeposits)
        : nominalGain
      const taxAmount = inputs.taxType === 'exempt' ? 0 : taxableGain * 0.25
      annualRows.push({
        year,
        grossDeposits: totalDeposits,
        netBalance: balance,
        realBalance,
        nominalGain,
        taxAmount,
        afterTax: balance - taxAmount,
        totalFees,
      })
    }
  }

  const last = annualRows.at(-1) || {
    year: 0,
    grossDeposits: totalDeposits,
    netBalance: balance,
    realBalance: balance,
    nominalGain: Math.max(0, balance - totalDeposits),
    taxAmount: 0,
    afterTax: balance,
    totalFees,
  }

  return {
    inputs,
    annualRows,
    effectiveMonthlyReturn: monthlyReturn - monthlyBalanceFee,
    annualReturnWithScenario: annualReturn,
    grossDeposits: last.grossDeposits,
    netFinal: last.netBalance,
    realFinal: last.realBalance,
    taxFinal: last.taxAmount,
    afterTaxFinal: last.afterTax,
    profits: Math.max(0, last.netBalance - last.grossDeposits),
    totalBalanceFees: last.totalFees,
    feeImpact: last.totalFees,
  }
}

function buildScenarioRows(inputs: CompoundInputs) {
  const scenarios: Array<{ id: Scenario; label: string }> = [
    { id: 'conservative', label: 'שמרני' },
    { id: 'base', label: 'בסיס' },
    { id: 'optimistic', label: 'אופטימי' },
  ]
  const base = calculateCompoundProjection({ ...inputs, scenario: 'base' })
  return scenarios.map((scenario) => {
    const result = calculateCompoundProjection({ ...inputs, scenario: scenario.id })
    return {
      ...scenario,
      netFinal: result.netFinal,
      realFinal: result.realFinal,
      afterTaxFinal: result.afterTaxFinal,
      gapFromBase: result.netFinal - base.netFinal,
    }
  })
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000
}

function parsePhoenixDate(value: string) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function firstOfNextBirthMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function exactAgeOn(calcDate: Date, birthDate: Date | null) {
  if (!calcDate || !birthDate) return null
  const ageCalcDate = firstOfNextBirthMonth(birthDate)
  const months = (calcDate.getFullYear() - ageCalcDate.getFullYear()) * 12 +
    (calcDate.getMonth() - ageCalcDate.getMonth())
  return months / 12
}

function annualMortality(age: number, gender: PhoenixGender, role: 'pensioner' | 'spouse' | 'widow') {
  const safeAge = Math.max(18, age)
  const genderOffset = gender === 'male' ? 0.0012 : -0.0005
  const roleOffset = role === 'widow' ? 0.0015 : role === 'spouse' ? -0.0002 : 0
  const baseline = 0.0048 + Math.exp((safeAge - 74) / 11.4) * 0.0036
  return Math.min(0.34, Math.max(0.0015, baseline + genderOffset + roleOffset))
}

function mortalityImprovement(age: number, calcYear: number) {
  const yearsForward = Math.max(0, calcYear - 2025)
  const ageImpact = Math.max(0.94, 1 - Math.max(0, age - 67) * 0.0012)
  return Math.max(0.88, Math.pow(0.9975, yearsForward) * ageImpact)
}

function monthlyMortality(age: number, gender: PhoenixGender, role: 'pensioner' | 'spouse' | 'widow', calcYear: number) {
  const annual = annualMortality(age, gender, role)
  const monthly = 1 - Math.pow(1 - annual, 1 / 12)
  return Math.min(0.35, monthly * mortalityImprovement(age, calcYear))
}

function computePhoenixScenario(model: NonNullable<PhoenixModel>, guaranteeMonths: number, spousePercent: number) {
  const monthlyDiscount = Math.pow(1 + model.netAnnualRate, -1 / 12)
  let pensionerSurvival = 1
  let spouseAliveSurvival = 1
  let widowSurvival = 1
  let newWidowProbability = 0
  let factor = 0
  let prevPensionerQ = 0
  let prevWidowQ = 0
  let prevPensionerSurvival = 1

  for (let month = 1; month <= 1500; month += 1) {
    const memberAge = model.memberExactAge + (month - 1) / 12
    const spouseAge = (model.spouseExactAge || 0) + (month - 1) / 12
    const pensionerPay = month <= guaranteeMonths && memberAge < model.maxGuaranteeAge
      ? 1
      : pensionerSurvival

    if (month > 1) {
      newWidowProbability = (newWidowProbability * (1 - prevWidowQ)) +
        (prevPensionerQ * prevPensionerSurvival * spouseAliveSurvival * spousePercent)
    }

    const widowPay = month <= 1 || spouseAge >= model.maxAge
      ? 0
      : (month <= guaranteeMonths && memberAge < model.maxGuaranteeAge ? 0 : newWidowProbability)

    factor += (pensionerPay + widowPay) * Math.pow(monthlyDiscount, month)

    const pensionerQ = memberAge >= model.maxAge
      ? 1
      : monthlyMortality(memberAge, model.gender, 'pensioner', model.calcYear)
    const spouseQ = model.isMarried && spouseAge < model.maxAge
      ? monthlyMortality(spouseAge, model.spouseGender, 'spouse', model.calcYear)
      : 1
    const widowQ = model.isMarried && spouseAge < model.maxAge
      ? monthlyMortality(spouseAge, model.spouseGender, 'widow', model.calcYear)
      : 1

    prevPensionerQ = pensionerQ
    prevWidowQ = widowQ
    prevPensionerSurvival = pensionerSurvival
    pensionerSurvival = memberAge >= model.maxAge ? 0 : pensionerSurvival * (1 - pensionerQ)
    spouseAliveSurvival = spouseAge >= model.maxAge ? 0 : spouseAliveSurvival * (1 - spouseQ)
    widowSurvival = spouseAge >= model.maxAge ? 0 : widowSurvival * (1 - widowQ)

    if (
      month > guaranteeMonths &&
      pensionerSurvival < 0.000001 &&
      spouseAliveSurvival < 0.000001 &&
      widowSurvival < 0.000001 &&
      newWidowProbability < 0.000001
    ) {
      break
    }
  }

  return factor
}

function buildPhoenixModel(inputs: PhoenixInputs) {
  const calcDate = new Date(Number(inputs.retirementYear), Number(inputs.retirementMonth) - 1, 1)
  const memberBirth = parsePhoenixDate(inputs.memberBirth)
  const spouseBirth = parsePhoenixDate(inputs.spouseBirth)
  const isMarried = inputs.maritalStatus === 'married'
  const memberExactAge = exactAgeOn(calcDate, memberBirth)
  const spouseExactAge = isMarried && spouseBirth ? exactAgeOn(calcDate, spouseBirth) : null
  if (memberExactAge == null || Number.isNaN(memberExactAge)) return null
  if (isMarried && (spouseExactAge == null || Number.isNaN(spouseExactAge))) return null

  const maxGuaranteeRaw = Math.max(0, Math.floor((87 - memberExactAge) * 12))
  const maxGuarantee = Math.min(240, maxGuaranteeRaw)
  const guaranteeInput = Math.max(0, Number(inputs.guaranteeMonths) || 0)
  const effectiveGuarantee = Math.min(guaranteeInput, maxGuarantee)
  const grossRate = inputs.fund === 'comprehensive' ? 0.0438 : 0.04
  const feeRate = Math.max(0, Number(inputs.feeRate) || 0)
  const netAnnualRate = round4((1 + grossRate) * (1 - feeRate) - 1)

  return {
    calcDate,
    calcYear: calcDate.getFullYear(),
    gender: inputs.memberGender,
    spouseGender: inputs.memberGender === 'male' ? 'female' as const : 'male' as const,
    isMarried,
    memberExactAge,
    spouseExactAge,
    memberAgeFloor: Math.floor(memberExactAge),
    spouseAgeFloor: spouseExactAge == null ? null : Math.floor(spouseExactAge),
    ageGap: spouseExactAge == null ? null : Math.floor(spouseExactAge) - Math.floor(memberExactAge),
    maxGuarantee,
    maxGuaranteeAge: 87,
    guaranteeInput,
    effectiveGuarantee,
    retroMonths: Math.max(0, Number(inputs.retroMonths) || 0),
    spousePercent: isMarried ? Number(inputs.spouseRate) : 0,
    accumulation: Math.max(0, Number(inputs.accumulation) || 0),
    netAnnualRate,
    maxAge: 119,
  }
}

function calculatePhoenix(inputs: PhoenixInputs) {
  const model = buildPhoenixModel(inputs)
  if (!model || model.netAnnualRate <= -0.99) return { model, result: null, coefficientRows: [], pensionRows: [] }
  const baseCoefficient = computePhoenixScenario(model, model.effectiveGuarantee, model.spousePercent)
  const coefficient = baseCoefficient + model.retroMonths
  const monthlyPension = coefficient > 0 ? model.accumulation / coefficient : 0
  const coefficientRows = phoenixScenarioRows.map(row => ({
    ...row,
    values: phoenixGuaranteeOptions.map(guarantee => {
      const effectiveGuarantee = Math.min(guarantee, model.maxGuarantee)
      const spousePercent = row.spousePercent === 0 ? 0 : (model.isMarried ? row.spousePercent : 0)
      return computePhoenixScenario(model, effectiveGuarantee, spousePercent) + model.retroMonths
    }),
  }))
  const pensionRows = coefficientRows.map(row => ({
    ...row,
    values: row.values.map(coefficientValue => coefficientValue > 0 ? model.accumulation / coefficientValue : 0),
  }))
  return {
    model,
    result: { baseCoefficient, coefficient, monthlyPension },
    coefficientRows,
    pensionRows,
  }
}

function phoenixSelectionId(fundId: string, partKey: string) {
  return `${fundId}__${partKey}`
}

export default function SimulationsPage() {
  const [mounted, setMounted] = useState(false)
  const [activeView, setActiveView] = useState<SimView>('compound')
  const [funds, setFunds] = useState<Fund[]>([])
  const [infrastructureIds, setInfrastructureIds] = useState<string[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [compoundInputs, setCompoundInputs] = useState<CompoundInputs>(defaultCompoundInputs)
  const [chartMode, setChartMode] = useState<ChartMode>('nominal')
  const resizingRef = useRef<{
    key: InfrastructureColumnKey
    startX: number
    startWidth: number
    minWidth: number
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const storedFunds = JSON.parse(localStorage.getItem(FUNDS_KEY) || '[]')
      const storedInfrastructureIds = JSON.parse(localStorage.getItem(INFRASTRUCTURE_IDS_KEY) || '[]')
      const storedColumnWidths = JSON.parse(localStorage.getItem(INFRASTRUCTURE_COLUMN_WIDTHS_KEY) || '{}')
      const storedView = localStorage.getItem(ACTIVE_SIM_VIEW_KEY) as SimView | null
      const storedCompound = JSON.parse(localStorage.getItem(COMPOUND_INPUTS_KEY) || 'null')
      setFunds(Array.isArray(storedFunds) ? storedFunds : [])
      setInfrastructureIds(Array.isArray(storedInfrastructureIds) ? storedInfrastructureIds : [])
      setColumnWidths(storedColumnWidths && typeof storedColumnWidths === 'object' ? storedColumnWidths : {})
      if (storedView && simViews.some(view => view.id === storedView)) setActiveView(storedView)
      if (storedCompound && typeof storedCompound === 'object') {
        setCompoundInputs({ ...defaultCompoundInputs, ...storedCompound })
      }
    } catch {
      setFunds([])
      setInfrastructureIds([])
      setColumnWidths({})
    }
  }, [])

  function setView(view: SimView) {
    setActiveView(view)
    if (typeof window !== 'undefined') localStorage.setItem(ACTIVE_SIM_VIEW_KEY, view)
  }

  function updateCompoundField<K extends keyof CompoundInputs>(key: K, value: CompoundInputs[K]) {
    setCompoundInputs(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(COMPOUND_INPUTS_KEY, JSON.stringify(next))
      return next
    })
  }

  function columnWidth(key: InfrastructureColumnKey) {
    return columnWidths[key] || infrastructureColumns.find(column => column.key === key)?.width || 120
  }

  function cellWidthStyle(key: InfrastructureColumnKey): React.CSSProperties {
    const column = infrastructureColumns.find(item => item.key === key)
    return {
      width: columnWidth(key),
      minWidth: column?.minWidth || 80,
      maxWidth: columnWidth(key),
    }
  }

  function startColumnResize(event: React.MouseEvent, key: InfrastructureColumnKey) {
    event.preventDefault()
    event.stopPropagation()
    const column = infrastructureColumns.find(item => item.key === key)
    resizingRef.current = {
      key,
      startX: event.clientX,
      startWidth: columnWidth(key),
      minWidth: column?.minWidth || 80,
    }

    const onMove = (moveEvent: MouseEvent) => {
      const current = resizingRef.current
      if (!current) return
      const nextWidth = Math.max(current.minWidth, current.startWidth + current.startX - moveEvent.clientX)
      setColumnWidths(prev => {
        const next = { ...prev, [current.key]: nextWidth }
        localStorage.setItem(INFRASTRUCTURE_COLUMN_WIDTHS_KEY, JSON.stringify(next))
        return next
      })
    }

    const onUp = () => {
      resizingRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function resetColumnWidths() {
    setColumnWidths({})
    localStorage.removeItem(INFRASTRUCTURE_COLUMN_WIDTHS_KEY)
  }

  const selectedFunds = useMemo(
    () => funds.filter(fund => isInfrastructureFund(fund, infrastructureIds)),
    [funds, infrastructureIds],
  )
  const infrastructureRows = useMemo(() => buildInfrastructureRows(selectedFunds), [selectedFunds])
  const totals = useMemo(() => getInfrastructureTotals(infrastructureRows), [infrastructureRows])
  const allCapital = useMemo(() => sumBy(funds, fund => num(fund.currentBalance)), [funds])
  const weightedCoefficient = totals.importedPension > 0
    ? totals.total / totals.importedPension
    : sumBy(selectedFunds, fund => num(fund.guaranteedCoefficient)) / Math.max(selectedFunds.length, 1)
  const compoundResult = useMemo(() => calculateCompoundProjection(compoundInputs), [compoundInputs])
  const scenarioRows = useMemo(() => buildScenarioRows(compoundInputs), [compoundInputs])

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>סימולציות</h1>
        </div>
      </header>

      <section style={segmentsStyle} aria-label="בחירת סימולציה">
        {simViews.map(view => (
          <button
            key={view.id}
            type="button"
            onClick={() => setView(view.id)}
            style={activeView === view.id ? activeSegmentStyle : segmentStyle}
          >
            <strong>{view.label}</strong>
          </button>
        ))}
      </section>

      {activeView === 'compound' && (
        <CompoundView
          inputs={compoundInputs}
          result={compoundResult}
          scenarioRows={scenarioRows}
          chartMode={chartMode}
          onChartModeChange={setChartMode}
          onFieldChange={updateCompoundField}
        />
      )}

      {activeView === 'phoenix' && <PhoenixView funds={funds} />}

      {activeView === 'returns' && (
        <section style={embeddedPanelStyle}>
          <ReturnsPage />
        </section>
      )}

      {activeView === 'abdReturns' && (
        <section style={embeddedPanelStyle}>
          <AbdReturnsPage />
        </section>
      )}

      {activeView === 'infrastructure' && (
        <InfrastructureView
          mounted={mounted}
          funds={funds}
          totals={totals}
          rows={infrastructureRows}
          allCapital={allCapital}
          weightedCoefficient={weightedCoefficient}
          cellWidthStyle={cellWidthStyle}
          startColumnResize={startColumnResize}
          resetColumnWidths={resetColumnWidths}
        />
      )}
    </main>
  )
}

function CompoundView({
  inputs,
  result,
  scenarioRows,
  chartMode,
  onChartModeChange,
  onFieldChange,
}: {
  inputs: CompoundInputs
  result: ReturnType<typeof calculateCompoundProjection>
  scenarioRows: ReturnType<typeof buildScenarioRows>
  chartMode: ChartMode
  onChartModeChange: (mode: ChartMode) => void
  onFieldChange: <K extends keyof CompoundInputs>(key: K, value: CompoundInputs[K]) => void
}) {
  const multiplier = result.grossDeposits > 0 ? result.netFinal / result.grossDeposits : 0
  const mid = result.annualRows[Math.floor(result.annualRows.length / 2)]
  const chartData = {
    labels: result.annualRows.map(row => `שנה ${row.year}`),
    datasets: [
      ...(chartMode === 'nominal' || chartMode === 'both'
        ? [{
          label: 'שווי נומינלי',
          data: result.annualRows.map(row => row.netBalance),
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          fill: chartMode === 'nominal',
          tension: 0.35,
        }]
        : []),
      ...(chartMode === 'real' || chartMode === 'both'
        ? [{
          label: 'שווי ריאלי',
          data: result.annualRows.map(row => row.realBalance),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.10)',
          fill: chartMode === 'real',
          tension: 0.35,
        }]
        : []),
    ],
  }

  return (
    <>
      <section style={simLayoutStyle}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>פרמטרי ההשקעה</h2>
          <div style={compoundGridStyle}>
            <Field label="סכום התחלתי" suffix="₪" value={inputs.initialAmount} onChange={value => onFieldChange('initialAmount', value)} />
            <Field label="הפקדה חודשית" suffix="₪" value={inputs.monthlyDeposit} onChange={value => onFieldChange('monthlyDeposit', value)} />
            <Field label="תשואה שנתית" suffix="%" value={inputs.annualReturn} onChange={value => onFieldChange('annualReturn', value)} />
            <Field label="מספר שנים" suffix="שנים" value={inputs.years} onChange={value => onFieldChange('years', value)} />
          </div>

          <button type="button" onClick={() => onFieldChange('advOpen', !inputs.advOpen)} style={advancedButtonStyle}>
            {inputs.advOpen ? 'הסתר הגדרות מתקדמות' : 'הגדרות מתקדמות'}
          </button>

          {inputs.advOpen && (
            <div style={advancedGridStyle}>
              <Field label="דמי ניהול מהפקדה" suffix="%" value={inputs.depositFee} onChange={value => onFieldChange('depositFee', value)} />
              <Field label="דמי ניהול מצבירה" suffix="%" value={inputs.annualFee} onChange={value => onFieldChange('annualFee', value)} />
              <Field label="אינפלציה שנתית" suffix="%" value={inputs.inflation} onChange={value => onFieldChange('inflation', value)} />
              <label style={{ display: 'grid', gap: 8 }}>
                <span style={labelStyle}>סוג מס</span>
                <select
                  value={inputs.taxType}
                  onChange={event => onFieldChange('taxType', event.target.value as TaxType)}
                  style={selectStyle}
                >
                  <option value="real">25% ריאלי</option>
                  <option value="nominal">25% נומינלי</option>
                  <option value="exempt">פטור ממס</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => onFieldChange('linked', !inputs.linked)}
                style={inputs.linked ? activeChipStyle : chipStyle}
              >
                {inputs.linked ? 'הפקדות מוצמדות לאינפלציה' : 'ללא הצמדת הפקדות'}
              </button>
            </div>
          )}

          <div style={scenarioBarStyle}>
            <button type="button" onClick={() => onFieldChange('scenario', 'conservative')} style={inputs.scenario === 'conservative' ? activeChipStyle : chipStyle}>
              שמרני (-2%)
            </button>
            <button type="button" onClick={() => onFieldChange('scenario', 'base')} style={inputs.scenario === 'base' ? activeChipStyle : chipStyle}>
              בסיס
            </button>
            <button type="button" onClick={() => onFieldChange('scenario', 'optimistic')} style={inputs.scenario === 'optimistic' ? activeChipStyle : chipStyle}>
              אופטימי (+2%)
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>תוצאות</h2>
          <div style={simKpisStyle}>
            <Kpi title="שווי נומינלי נטו" value={money(result.netFinal)} note={`אחרי ${inputs.years || 0} שנים ודמי ניהול`} />
            <Kpi title="שווי ריאלי" value={money(result.realFinal)} note={`בערכי היום לפי ${inputs.inflation || 0}% אינפלציה`} />
            <Kpi title="לאחר מס" value={money(result.afterTaxFinal)} note={`מס משוער: ${money(result.taxFinal)}`} />
            <Kpi title='סה"כ הפקדות' value={money(result.grossDeposits)} note="כולל סכום התחלתי" />
            <Kpi title="רווח נומינלי נטו" value={money(result.profits)} note={result.grossDeposits > 0 ? `${fmtNumber((result.profits / result.grossDeposits) * 100, 0)}% על ההשקעה` : ''} />
            <Kpi title="מכפיל השקעה" value={`${fmtNumber(multiplier, 1)}x`} note={mid ? `שנת מחצית: ${mid.year} (${money(mid.netBalance)})` : '-'} />
            <Kpi title='עלות ד"נ מצבירה' value={money(result.totalBalanceFees)} note="מצטבר לאורך התקופה" />
            <Kpi title="השפעת דמי ניהול" value={money(result.feeImpact)} note="פוטנציאל אבוד לפרישה" danger />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>ציר זמן</h2>
          <div style={chartTabsStyle}>
            <button type="button" onClick={() => onChartModeChange('nominal')} style={chartMode === 'nominal' ? activeChipStyle : chipStyle}>נומינלי</button>
            <button type="button" onClick={() => onChartModeChange('real')} style={chartMode === 'real' ? activeChipStyle : chipStyle}>ריאלי</button>
            <button type="button" onClick={() => onChartModeChange('both')} style={chartMode === 'both' ? activeChipStyle : chipStyle}>השוואה</button>
          </div>
        </div>
        <div style={{ height: 320 }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Heebo' } } },
                tooltip: {
                  callbacks: {
                    label: item => `${item.dataset.label}: ${money(item.parsed.y)}`,
                  },
                },
              },
              scales: {
                y: { ticks: { callback: value => money(Number(value)).replace('₪', '') } },
              },
            }}
          />
        </div>
      </section>
    </>
  )
}

function PhoenixView({ funds }: { funds: Fund[] }) {
  const [inputs, setInputs] = useState<PhoenixInputs>(() => {
    if (typeof window === 'undefined') return defaultPhoenixInputs
    try {
      return { ...defaultPhoenixInputs, ...JSON.parse(localStorage.getItem(PHOENIX_INPUTS_KEY) || '{}') }
    } catch {
      return defaultPhoenixInputs
    }
  })
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = JSON.parse(localStorage.getItem(PHOENIX_SELECTION_KEY) || '[]')
      return Array.isArray(stored) ? stored : []
    } catch {
      return []
    }
  })
  const [openFundIds, setOpenFundIds] = useState<string[]>([])
  const selectionRows = useMemo(() => buildInfrastructureRows(funds), [funds])
  const selectedCapital = useMemo(() => {
    return selectionRows.reduce((sum, row) => {
      const totalId = phoenixSelectionId(row.id, 'total')
      if (selectedPartIds.includes(totalId)) return sum + (Number(row.total) || 0)
      return sum + phoenixSelectionParts.reduce((partSum, part) => {
        const partId = phoenixSelectionId(row.id, part.key)
        return selectedPartIds.includes(partId) ? partSum + (Number(row[part.key]) || 0) : partSum
      }, 0)
    }, 0)
  }, [selectionRows, selectedPartIds])
  const calculation = useMemo(() => calculatePhoenix(inputs), [inputs])
  const model = calculation.model
  const result = calculation.result
  const monthNames = useMemo(
    () => Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1),
      label: new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(new Date(2026, index, 1)),
    })),
    [],
  )

  useEffect(() => {
    localStorage.setItem(PHOENIX_INPUTS_KEY, JSON.stringify(inputs))
  }, [inputs])

  useEffect(() => {
    localStorage.setItem(PHOENIX_SELECTION_KEY, JSON.stringify(selectedPartIds))
  }, [selectedPartIds])

  useEffect(() => {
    if (!(selectedCapital > 0)) return
    const nextCapital = String(Math.round(selectedCapital * 100) / 100)
    setInputs(prev => prev.accumulation === nextCapital ? prev : { ...prev, accumulation: nextCapital })
  }, [selectedCapital])

  function update<K extends keyof PhoenixInputs>(key: K, value: PhoenixInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  function selectScenario(spouseRate: string, guaranteeMonths: number) {
    setInputs(prev => ({
      ...prev,
      spouseRate,
      guaranteeMonths: String(guaranteeMonths),
      maritalStatus: spouseRate === '0' ? prev.maritalStatus : 'married',
    }))
  }

  function toggleSelection(partId: string, checked: boolean) {
    setSelectedPartIds(prev => {
      const fundId = partId.split('__')[0]
      const totalId = phoenixSelectionId(fundId, 'total')
      let next = prev.filter(id => id !== partId)
      if (!checked) return next
      if (partId.endsWith('__total')) {
        next = next.filter(id => !id.startsWith(`${fundId}__`))
        return [...next, partId]
      }
      next = next.filter(id => id !== totalId)
      return [...next, partId]
    })
  }

  function toggleFundOpen(fundId: string) {
    setOpenFundIds(prev => prev.includes(fundId) ? prev.filter(id => id !== fundId) : [...prev, fundId])
  }

  function scenarioCellStyle(rowSpousePercent: number, guarantee: number): React.CSSProperties {
    const activeRow = String(rowSpousePercent) === String(inputs.spouseRate)
    const activeCol = String(guarantee) === String(inputs.guaranteeMonths)
    return {
      ...tdMonoStyle,
      textAlign: 'center',
      cursor: 'pointer',
      background: activeRow && activeCol ? '#DCEEFF' : activeCol ? '#F0F8FF' : activeRow ? '#F8FBFF' : undefined,
      boxShadow: activeRow && activeCol ? 'inset 0 0 0 2px var(--abd-accent)' : undefined,
      color: activeRow && activeCol ? 'var(--abd-accent)' : 'var(--abd-primary)',
      fontWeight: activeRow || activeCol ? 900 : 800,
    }
  }

  return (
    <>
      <section style={phoenixHeroStyle}>
        <h2 style={{ ...sectionTitleStyle, fontSize: 26 }}>סימולטור מקדם קצבת זקנה</h2>
        <div style={phoenixFundToggleStyle}>
          <button type="button" onClick={() => update('fund', 'comprehensive')} style={inputs.fund === 'comprehensive' ? activeChipStyle : chipStyle}>מקיפה</button>
          <button type="button" onClick={() => update('fund', 'general')} style={inputs.fund === 'general' ? activeChipStyle : chipStyle}>כללית</button>
        </div>
      </section>

      <section style={phoenixCalculatorLayoutStyle}>
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h3 style={sectionTitleStyle}>קופות לחישוב</h3>
              <p style={softTextStyle}>סמן קופה מלאה או פתח חלקים ובחר תגמולים / פיצויים לפי שכבה.</p>
            </div>
            <strong style={countBadgeStyle}>{money(selectedCapital)}</strong>
          </div>
          <div style={phoenixFundsListStyle}>
            {selectionRows.length ? selectionRows.map(row => {
              const totalId = phoenixSelectionId(row.id, 'total')
              const wholeChecked = selectedPartIds.includes(totalId)
              const open = openFundIds.includes(row.id)
              return (
                <div key={row.id} style={phoenixFundRowStyle}>
                  <div style={phoenixFundLineStyle}>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={wholeChecked}
                        onChange={event => toggleSelection(totalId, event.target.checked)}
                      />
                      <span>
                        <strong>{row.manufacturer || 'יצרן לא ידוע'}</strong>
                        <small style={softTextStyle}>{row.accountNumber || 'ללא מספר'} · {row.yieldMode || 'לפי נתוני הדוח'}</small>
                      </span>
                    </label>
                    <button type="button" onClick={() => toggleFundOpen(row.id)} style={miniButtonStyle}>
                      {open ? 'סגור חלקים' : 'בחר חלקים'}
                    </button>
                    <strong style={moneyBadgeStyle}>{money(row.total)}</strong>
                  </div>
                  {open && (
                    <div style={phoenixPartsGridStyle}>
                      {phoenixSelectionParts.map(part => {
                        const amount = Number(row[part.key]) || 0
                        const partId = phoenixSelectionId(row.id, part.key)
                        return (
                          <label key={part.key} style={{ ...partCheckStyle, opacity: wholeChecked || amount <= 0 ? 0.55 : 1 }}>
                            <input
                              type="checkbox"
                              checked={selectedPartIds.includes(partId)}
                              disabled={wholeChecked || amount <= 0}
                              onChange={event => toggleSelection(partId, event.target.checked)}
                            />
                            <span>{part.label}</span>
                            <strong>{money(amount)}</strong>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }) : (
              <div style={emptyStateStyle}>לא נטענו קופות. לאחר ייבוא קובץ מסלקה או אקסל תופיע כאן רשימת קופות לבחירה.</div>
            )}
          </div>
        </div>

        <div>
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>נתוני חישוב</h3>
          <div style={compoundGridStyle}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={labelStyle}>חודש פרישה</span>
              <select value={inputs.retirementMonth} onChange={event => update('retirementMonth', event.target.value)} style={selectStyle}>
                {monthNames.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
              </select>
            </label>
            <Field label="שנת פרישה" suffix="" value={inputs.retirementYear} onChange={value => update('retirementYear', value)} />
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={labelStyle}>תאריך לידה</span>
              <input type="date" value={inputs.memberBirth} onChange={event => update('memberBirth', event.target.value)} style={dateInputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={labelStyle}>מין</span>
              <select value={inputs.memberGender} onChange={event => update('memberGender', event.target.value as PhoenixGender)} style={selectStyle}>
                <option value="male">גבר</option>
                <option value="female">אישה</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={labelStyle}>מצב משפחתי</span>
              <select value={inputs.maritalStatus} onChange={event => update('maritalStatus', event.target.value as PhoenixMaritalStatus)} style={selectStyle}>
                <option value="single">לא נשוי/אה</option>
                <option value="married">נשוי/אה</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={labelStyle}>אחוז לבן/בת זוג</span>
              <select
                value={inputs.maritalStatus === 'married' ? inputs.spouseRate : '0'}
                onChange={event => update('spouseRate', event.target.value)}
                style={selectStyle}
                disabled={inputs.maritalStatus !== 'married'}
              >
                {phoenixScenarioRows.map(row => (
                  <option key={row.spousePercent} value={String(row.spousePercent)}>
                    {row.spousePercent === 0 ? '0%' : `${Math.round(row.spousePercent * 100)}%`}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={labelStyle}>תאריך לידה בן/בת זוג</span>
              <input type="date" value={inputs.spouseBirth} onChange={event => update('spouseBirth', event.target.value)} style={dateInputStyle} disabled={inputs.maritalStatus !== 'married'} />
            </label>
            <Field label="חודשי הבטחה" suffix="" value={inputs.guaranteeMonths} onChange={value => update('guaranteeMonths', value)} />
            <Field label="חודשי רטרו" suffix="" value={inputs.retroMonths} onChange={value => update('retroMonths', value)} />
            <Field label="צבירה" suffix="₪" value={inputs.accumulation} onChange={value => update('accumulation', value)} />
            <Field label="דמי ניהול" suffix="" value={inputs.feeRate} onChange={value => update('feeRate', value)} />
          </div>
          {!result && <div style={warningStyle}>נתוני חישוב חסרים.</div>}
        </div>

        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>תוצאה</h3>
          <div style={simKpisStyle}>
            <Kpi title="מקדם זקנה" value={result ? fmtNumber(result.coefficient, 2) : '-'} note="" />
            <Kpi title="קצבה חודשית משוערת" value={result ? money(result.monthlyPension) : '-'} note="" />
            <Kpi title="ריבית נטו" value={model ? `${fmtNumber(model.netAnnualRate * 100, 2)}%` : '-'} note="" />
            <Kpi title="מקסימום הבטחה" value={model ? `${Math.round(model.maxGuarantee)} חודשים` : '-'} note="" />
            <Kpi title="גיל עמית" value={model ? `${fmtNumber(model.memberExactAge, 2)} שנים` : '-'} note="" />
            <Kpi title="גיל בן/בת זוג" value={model?.spouseExactAge != null ? `${fmtNumber(model.spouseExactAge, 2)} שנים` : '-'} note="" />
          </div>
        </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>טבלת מקדמים</h3>
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>אחוז בן/בת זוג</th>
                {phoenixGuaranteeOptions.map(option => <th key={option} style={String(option) === inputs.guaranteeMonths ? activeThStyle : thStyle}>{option} חודשים</th>)}
              </tr>
            </thead>
            <tbody>
              {calculation.coefficientRows.map(row => (
                <tr key={row.label}>
                  <td style={tdStrongStyle}>{row.label}</td>
                  {row.values.map((value, index) => {
                    const guarantee = phoenixGuaranteeOptions[index]
                    return (
                      <td
                        key={guarantee}
                        onClick={() => selectScenario(String(row.spousePercent), guarantee)}
                        style={scenarioCellStyle(row.spousePercent, guarantee)}
                      >
                        {fmtNumber(value, 2)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>קצבה חודשית ראשונה</h3>
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>אחוז בן/בת זוג</th>
                {phoenixGuaranteeOptions.map(option => <th key={option} style={String(option) === inputs.guaranteeMonths ? activeThStyle : thStyle}>{option} חודשים</th>)}
              </tr>
            </thead>
            <tbody>
              {calculation.pensionRows.map(row => (
                <tr key={row.label}>
                  <td style={tdStrongStyle}>{row.label}</td>
                  {row.values.map((value, index) => {
                    const guarantee = phoenixGuaranteeOptions[index]
                    return (
                      <td
                        key={guarantee}
                        onClick={() => selectScenario(String(row.spousePercent), guarantee)}
                        style={scenarioCellStyle(row.spousePercent, guarantee)}
                      >
                        {money(value)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function InfrastructureView({
  mounted,
  funds,
  totals,
  rows,
  allCapital,
  weightedCoefficient,
  cellWidthStyle,
  startColumnResize,
  resetColumnWidths,
}: {
  mounted: boolean
  funds: Fund[]
  totals: ReturnType<typeof getInfrastructureTotals>
  rows: ReturnType<typeof buildInfrastructureRows>
  allCapital: number
  weightedCoefficient: number
  cellWidthStyle: (key: InfrastructureColumnKey) => React.CSSProperties
  startColumnResize: (event: React.MouseEvent, key: InfrastructureColumnKey) => void
  resetColumnWidths: () => void
}) {
  const projectedCapital = totals.total || allCapital
  return (
    <>
      <section style={kpiGridStyle}>
        <Kpi title="קופות בטבלה" value={mounted ? String(totals.count) : '0'} note="" />
        <Kpi title="רכיב הוני" value={mounted ? money(totals.capital) : money(0)} note="" />
        <Kpi title="רכיב קצבתי" value={mounted ? money(totals.pension) : money(0)} note="" />
        <Kpi title='סה"כ' value={mounted ? money(totals.total) : money(0)} note="" />
      </section>

      <section style={layoutStyle}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>תחזית ראשונית</h2>
          <strong style={projectionStyle}>{mounted ? money(projectedCapital) : money(0)}</strong>
          <div style={miniMetricsStyle}>
            <span>קצבה מיובאת: <strong>{mounted ? money(totals.importedPension) : money(0)}</strong></span>
            <span>מקדם משוקלל: <strong>{mounted ? percent(weightedCoefficient) : '-'}</strong></span>
            <span>קופות נטענו: <strong>{mounted ? funds.length : 0}</strong></span>
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>תשתיות לקצבה</h2>
          <div style={tableActionsStyle}>
            <button type="button" onClick={resetColumnWidths} style={smallButtonStyle}>איפוס רוחב עמודות</button>
            <span style={countBadgeStyle}>{mounted ? totals.count : 0} קופות</span>
          </div>
        </div>

        <PillStrip totals={totals} mounted={mounted} />

        {mounted && rows.length > 0 ? (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {infrastructureColumns.map(column => (
                    <th key={column.key} style={{ ...thStyle, ...cellWidthStyle(column.key) }}>
                      <span>{column.label}</span>
                      <span
                        role="separator"
                        aria-label={`שינוי רוחב עמודה ${column.label}`}
                        onMouseDown={event => startColumnResize(event, column.key)}
                        style={resizeHandleStyle}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} style={{ background: index % 2 ? '#F3FAFF' : '#FFFFFF' }}>
                    <td style={{ ...tdCenterStyle, ...cellWidthStyle('index') }}>{row.index}</td>
                    <td style={{ ...tdStrongStyle, ...cellWidthStyle('manufacturer') }}>{row.manufacturer || '-'}</td>
                    <td style={{ ...tdMonoStyle, ...cellWidthStyle('accountNumber') }}>{row.accountNumber || '-'}</td>
                    <td style={{ ...tdStyle, ...cellWidthStyle('startDate') }}>{row.startDate || '-'}</td>
                    <MoneyCell value={row.compensationPension} style={cellWidthStyle('compensationPension')} />
                    <MoneyCell value={row.compensationCapital} style={cellWidthStyle('compensationCapital')} />
                    <MoneyCell value={row.capitalBefore2008} style={cellWidthStyle('capitalBefore2008')} />
                    <MoneyCell value={row.capitalAfter2008} style={cellWidthStyle('capitalAfter2008')} />
                    <MoneyCell value={row.pensionBefore2000} style={cellWidthStyle('pensionBefore2000')} />
                    <MoneyCell value={row.pensionAfter2000} style={cellWidthStyle('pensionAfter2000')} />
                    <MoneyCell value={row.total} strong style={cellWidthStyle('total')} />
                    <td style={{ ...tdStyle, ...cellWidthStyle('yieldMode') }}>{row.yieldMode || 'לפי נתוני הדוח'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...tfStyle, ...cellWidthStyle('index') }}>סה"כ</td>
                  <td style={{ ...tfStyle, ...cellWidthStyle('manufacturer') }} />
                  <td style={{ ...tfStyle, ...cellWidthStyle('accountNumber') }} />
                  <td style={{ ...tfStyle, ...cellWidthStyle('startDate') }} />
                  <td style={{ ...tfMoneyStyle, ...cellWidthStyle('compensationPension') }}>{money(totals.compensationPension)}</td>
                  <td style={{ ...tfMoneyStyle, ...cellWidthStyle('compensationCapital') }}>{money(totals.compensationCapital)}</td>
                  <td style={{ ...tfMoneyStyle, ...cellWidthStyle('capitalBefore2008') }}>{money(totals.capitalBefore2008)}</td>
                  <td style={{ ...tfMoneyStyle, ...cellWidthStyle('capitalAfter2008') }}>{money(totals.capitalAfter2008)}</td>
                  <td style={{ ...tfMoneyStyle, ...cellWidthStyle('pensionBefore2000') }}>{money(totals.pensionBefore2000)}</td>
                  <td style={{ ...tfMoneyStyle, ...cellWidthStyle('pensionAfter2000') }}>{money(totals.pensionAfter2000)}</td>
                  <td style={{ ...tfMoneyStyle, ...cellWidthStyle('total') }}>{money(totals.total)}</td>
                  <td style={{ ...tfStyle, ...cellWidthStyle('yieldMode') }} />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div style={emptyStyle}>
            <h3>לא סומנו קופות לתשתיות לקצבה</h3>
          </div>
        )}
      </section>
    </>
  )
}

function Kpi({ title, value, note, danger }: { title: string; value: string; note: string; danger?: boolean }) {
  return (
    <article style={kpiStyle}>
      <span style={{ color: '#7EA0C9', fontWeight: 900 }}>{title}</span>
      <strong style={{ color: danger ? 'var(--status-danger)' : 'var(--abd-primary)' }}>{value}</strong>
      <small style={{ color: 'var(--text-muted)' }}>{note}</small>
    </article>
  )
}

function PillStrip({ totals, mounted }: { totals: ReturnType<typeof getInfrastructureTotals>; mounted: boolean }) {
  const rows = [
    ['סך צבירה', totals.total],
    ['סך תגמולים הון', totals.contributionCapital],
    ['סך תגמולים לקצבה', totals.contributionPension],
    ['סך פיצויים הון', totals.compensationCapital],
    ['סך פיצויים לקצבה', totals.compensationPension],
    ['קצבה חזויה', totals.importedPension],
  ] as const
  return (
    <div style={pillStripStyle}>
      {rows.map(([label, amount]) => (
        <span key={label} style={pillStyle}>{label}: <strong>{mounted ? money(amount) : money(0)}</strong></span>
      ))}
    </div>
  )
}

function MoneyCell({ value, strong, style }: { value: number; strong?: boolean; style?: React.CSSProperties }) {
  return <td style={{ ...(strong ? tdTotalMoneyStyle : tdMoneyStyle), ...style }}>{value > 0 ? money(value) : '-'}</td>
}

function Field({ label, suffix, value, onChange }: { label: string; suffix: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={labelStyle}>{label}</span>
      <div style={inputWrapStyle}>
        <input dir="ltr" value={value} onChange={event => onChange(event.target.value)} inputMode="decimal" style={inputStyle} />
        <span style={{ color: '#7EA0C9', fontWeight: 800 }}>{suffix}</span>
      </div>
    </label>
  )
}

const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 32, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.7 }
const mutedSmallStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 13, marginTop: 4, lineHeight: 1.6 }
const primaryButtonStyle: React.CSSProperties = { textDecoration: 'none', borderRadius: 12, padding: '11px 18px', background: 'var(--abd-accent)', color: '#fff', border: '1px solid var(--abd-accent)', fontWeight: 900 }
const segmentsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 12, boxShadow: 'var(--shadow-card)', marginBottom: 18 }
const segmentStyle: React.CSSProperties = { display: 'grid', gap: 4, textAlign: 'right', border: '1px solid #CFE6FA', background: '#F8FBFF', color: 'var(--abd-primary)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', fontFamily: 'var(--font-main)' }
const activeSegmentStyle: React.CSSProperties = { ...segmentStyle, background: 'var(--abd-accent)', color: '#fff', borderColor: 'var(--abd-accent)', boxShadow: '0 10px 24px rgba(37, 99, 235, 0.22)' }
const embeddedPanelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 8, boxShadow: 'var(--shadow-card)' }
const simLayoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18, marginBottom: 18 }
const phoenixCalculatorLayoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(360px, 0.95fr) minmax(420px, 1.05fr)', gap: 18, marginBottom: 18, alignItems: 'start' }
const compoundGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 18 }
const advancedButtonStyle: React.CSSProperties = { marginTop: 16, border: '1px solid #CFE6FA', background: '#F4FAFF', color: 'var(--abd-primary)', borderRadius: 999, padding: '9px 14px', fontWeight: 900, cursor: 'pointer', fontFamily: 'var(--font-main)' }
const advancedGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 14, paddingTop: 14, borderTop: '1px solid #E4F2FF' }
const scenarioBarStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: '1px solid #E4F2FF' }
const chipStyle: React.CSSProperties = { border: '1px solid #CFE6FA', background: '#fff', color: 'var(--abd-primary)', borderRadius: 999, padding: '8px 13px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const activeChipStyle: React.CSSProperties = { ...chipStyle, background: '#EAF6FF', borderColor: 'var(--abd-accent)', color: 'var(--abd-accent)' }
const selectStyle: React.CSSProperties = { minHeight: 42, border: '1px solid #CFE6FA', borderRadius: 12, background: '#FBFDFF', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontWeight: 800, padding: '0 12px' }
const labelStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontWeight: 800 }
const dateInputStyle: React.CSSProperties = { ...selectStyle, direction: 'ltr', textAlign: 'right' }
const warningStyle: React.CSSProperties = { marginTop: 14, border: '1px solid #FECACA', background: '#FEF2F2', color: '#991B1B', borderRadius: 14, padding: 12, fontWeight: 800 }
const phoenixHeroStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card)', marginBottom: 18 }
const phoenixFundToggleStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }
const phoenixFundsListStyle: React.CSSProperties = { display: 'grid', gap: 10, maxHeight: 520, overflowY: 'auto', paddingInlineEnd: 4 }
const phoenixFundRowStyle: React.CSSProperties = { border: '1px solid #D7EAFB', borderRadius: 16, background: '#FBFDFF', overflow: 'hidden' }
const phoenixFundLineStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 10, alignItems: 'center', padding: 12 }
const checkboxLabelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, color: 'var(--abd-primary)', fontWeight: 900 }
const softTextStyle: React.CSSProperties = { display: 'block', color: '#6B86AA', fontSize: 12, fontWeight: 700, lineHeight: 1.5 }
const miniButtonStyle: React.CSSProperties = { border: '1px solid #CFE6FA', background: '#fff', color: 'var(--abd-primary)', borderRadius: 999, padding: '7px 10px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }
const moneyBadgeStyle: React.CSSProperties = { color: 'var(--abd-accent)', background: '#EAF6FF', borderRadius: 999, padding: '7px 10px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
const phoenixPartsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, padding: '0 12px 12px' }
const partCheckStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: 8, alignItems: 'center', border: '1px solid #E4F2FF', borderRadius: 12, background: '#fff', padding: 9, color: 'var(--abd-primary)', fontSize: 12, fontWeight: 800 }
const emptyStateStyle: React.CSSProperties = { border: '1px dashed #BFE2FB', borderRadius: 16, padding: 18, color: '#6B86AA', fontWeight: 800, lineHeight: 1.8 }
const chartTabsStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const simKpisStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 18 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 22 }
const kpiStyle: React.CSSProperties = { display: 'grid', gap: 8, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 18, boxShadow: 'var(--shadow-card)', color: 'var(--abd-primary)', fontWeight: 800 }
const layoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginTop: 18 }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-card)', marginBottom: 18 }
const sectionHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900 }
const countBadgeStyle: React.CSSProperties = { color: 'var(--abd-primary)', background: '#EAF6FF', border: '1px solid #CFE6FA', borderRadius: 999, padding: '8px 14px', fontWeight: 900, whiteSpace: 'nowrap' }
const tableActionsStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const smallButtonStyle: React.CSSProperties = { border: '1px solid #CFE6FA', background: '#fff', color: 'var(--abd-primary)', borderRadius: 999, padding: '8px 13px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const pillStripStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }
const pillStyle: React.CSSProperties = { color: 'var(--abd-primary)', background: '#F4FAFF', border: '1px solid #CFE6FA', borderRadius: 999, padding: '8px 12px', fontWeight: 800, fontSize: 13 }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid #D7EAFB', borderRadius: 16 }
const tableStyle: React.CSSProperties = { width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: 13, color: 'var(--abd-primary)' }
const thStyle: React.CSSProperties = { position: 'relative', background: '#EAF6FF', color: 'var(--abd-primary)', textAlign: 'right', padding: '12px 14px', fontWeight: 900, whiteSpace: 'nowrap', userSelect: 'none', borderBottom: '1px solid #BFE2FB' }
const resizeHandleStyle: React.CSSProperties = { position: 'absolute', insetBlock: 8, left: 0, width: 9, cursor: 'col-resize', borderLeft: '2px solid rgba(37,99,235,0.45)', opacity: 0.9 }
const tdStyle: React.CSSProperties = { padding: '11px 10px', borderBottom: '1px solid #DCEFFC', verticalAlign: 'top', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }
const tdCenterStyle: React.CSSProperties = { ...tdStyle, textAlign: 'center', fontWeight: 900 }
const tdStrongStyle: React.CSSProperties = { ...tdStyle, color: '#006633', fontWeight: 900 }
const tdMonoStyle: React.CSSProperties = { ...tdStyle, fontVariantNumeric: 'tabular-nums', direction: 'ltr', textAlign: 'right' }
const tdMoneyStyle: React.CSSProperties = { ...tdStyle, fontWeight: 900, whiteSpace: 'nowrap' }
const tdTotalMoneyStyle: React.CSSProperties = { ...tdMoneyStyle, background: '#FFF4C2' }
const activeThStyle: React.CSSProperties = { ...thStyle, background: '#DFF0FF', color: 'var(--abd-accent)' }
const activeRowStyle: React.CSSProperties = { background: '#F2F8FF' }
const clickableTdStyle: React.CSSProperties = { ...tdMoneyStyle, padding: 0 }
const activeCellStyle: React.CSSProperties = { ...clickableTdStyle, background: '#E8F4FF', boxShadow: 'inset 0 0 0 2px var(--abd-accent)' }
const matrixButtonStyle: React.CSSProperties = { width: '100%', minHeight: 42, border: 0, background: 'transparent', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const positiveMoneyStyle: React.CSSProperties = { ...tdMoneyStyle, color: '#00A63E' }
const negativeMoneyStyle: React.CSSProperties = { ...tdMoneyStyle, color: '#DC2626' }
const tfStyle: React.CSSProperties = { background: '#F7E7BD', color: 'var(--abd-primary)', padding: '12px 10px', fontWeight: 900 }
const tfMoneyStyle: React.CSSProperties = { ...tfStyle, whiteSpace: 'nowrap' }
const emptyStyle: React.CSSProperties = { display: 'grid', justifyItems: 'center', gap: 12, padding: 34, color: 'var(--abd-primary)', background: '#F8FBFF', borderRadius: 16, textAlign: 'center' }
const inputWrapStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10, border: '1px solid #CFE6FA', borderRadius: 12, padding: '0 12px', background: '#FBFDFF' }
const inputStyle: React.CSSProperties = { minHeight: 42, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)', fontWeight: 800 }
const projectionStyle: React.CSSProperties = { display: 'block', color: 'var(--abd-primary)', fontSize: 30, fontWeight: 900, marginTop: 16 }
const miniMetricsStyle: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, color: 'var(--abd-primary)' }
const legendGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, margin: '16px 0' }
const legendStyle: React.CSSProperties = { display: 'grid', gap: 8, border: '1px solid #D7EAFB', borderRadius: 14, padding: 14, background: '#F8FBFF', color: 'var(--abd-primary)', lineHeight: 1.5 }
const phoenixFrameStyle: React.CSSProperties = { width: '100%', height: 720, border: '1px solid #CFE6FA', borderRadius: 16, background: '#fff' }

