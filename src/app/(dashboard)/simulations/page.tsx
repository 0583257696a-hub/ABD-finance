'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  buildInfrastructureRows,
  getInfrastructureTotals,
  isInfrastructureFund,
  type InfrastructureRow,
} from '@/lib/infrastructure'
import type { Fund } from '@/types/fund'
import { Toolbar } from '@/components/ui/Toolbar'
import { Tabs } from '@/components/ui/Tabs'
import {
  buildScenarioRows,
  calculateCompoundProjection,
  defaultCompoundInputs as defaultSharedCompoundInputs,
  type AnnualRow,
  type CompoundInputs as SharedCompoundInputs,
  type MonthlyRow,
  type TaxType,
} from '@/lib/compound-calculator'
import { phoenixAgeAt, phoenixConversionFactor, phoenixMaxGuaranteeMonths, PHOENIX_REGULATIONS_EDITION } from '@/lib/phoenix/factor-engine'
import { buildPhoenixAutofill } from '@/lib/phoenix/autofill'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, ChartLegend)

const FUNDS_KEY = 'abd_next_funds'
const INFRASTRUCTURE_IDS_KEY = 'abd_next_infrastructure_ids'
const INFRASTRUCTURE_COLUMN_WIDTHS_KEY = 'abd_next_infrastructure_column_widths'
const ACTIVE_SIM_VIEW_KEY = 'abd_next_simulations_active_view'
const COMPOUND_INPUTS_KEY = 'abd_next_simulations_compound_inputs'

type SimView = 'compound' | 'phoenix' | 'infrastructure'
type ChartMode = 'nominal' | 'real' | 'both'
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

// Extends the shared engine's input type with a UI-only "advanced panel open" flag,
// which this screen happens to persist alongside the calc inputs.
type CompoundInputs = SharedCompoundInputs & { advOpen: boolean }

const defaultCompoundInputs: CompoundInputs = { ...defaultSharedCompoundInputs, advOpen: false }

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

/**
 * Column heading for the scenario tables. Phoenix caps the guarantee at age
 * 87 (max = (87 − age) × 12, at most 240), so for a member above ~67 the
 * "240" scenario is really computed at the cap. Say so in the header
 * instead of showing a 234-month factor under a 240-month label.
 */
function guaranteeColumnLabel(option: number, maxGuarantee?: number) {
  if (maxGuarantee == null || option <= maxGuarantee) return `${option} חודשים`
  return `${option} → ${Math.floor(maxGuarantee)} חודשים (מקסימום לגיל)`
}
const PHOENIX_INPUTS_KEY = 'abd_next_phoenix_inputs'
const PHOENIX_AUTOFILL_SIG_KEY = 'abd_next_phoenix_autofill_sig'
const PHOENIX_SELECTION_KEY = 'abd_next_phoenix_selected_parts'

const phoenixSelectionParts: PhoenixSelectionPart[] = [
  { key: 'compensationPension', label: 'פיצויים לקצבה' },
  { key: 'compensationCapital', label: 'פיצויים הוניים' },
  { key: 'capitalBefore2008', label: 'תגמולי הון עד 2008' },
  { key: 'capitalAfter2008', label: 'תגמולי הון מ-2008' },
  { key: 'pensionBefore2000', label: 'תגמולים לקצבה עד 2000' },
  { key: 'pensionAfter2000', label: 'תגמולים לקצבה אחרי 2000' },
]

// 'returns'/'abdReturns' sub-views were removed 2026-08-13: they embedded the exact
// same ReturnsPage/AbdReturnsPage components already reachable from the sidebar
// ("תשואות הלקוח" / "תשואות השוק") — two navigation paths to identical content.
const simViews: Array<{ id: SimView; label: string; note: string }> = [
  { id: 'compound', label: 'מחשבון ריבית דריבית', note: 'חישוב צבירה, מס, דמי ניהול ותרחישים' },
  { id: 'phoenix', label: 'מחשבון קצבה', note: 'מקדם קצבת זקנה וקצבה חודשית לפי תקנון הפניקס' },
  { id: 'infrastructure', label: 'תשתיות לקצבה', note: 'פילוח שכבות תגמולים ופיצויים' },
]

// Widths sized for a ~1150px total so the table fits typical content areas
// without horizontal scroll; multi-word headers wrap to two lines (thStyle
// deliberately does NOT set nowrap) instead of forcing wide columns.
const infrastructureColumns = [
  { key: 'index', label: '#', width: 36, minWidth: 32 },
  { key: 'manufacturer', label: 'יצרן', width: 96, minWidth: 76 },
  { key: 'accountNumber', label: 'מס׳ פוליסה', width: 96, minWidth: 80 },
  { key: 'startDate', label: 'תחילת ביטוח', width: 86, minWidth: 72 },
  { key: 'compensationPension', label: 'פיצויים למס', width: 96, minWidth: 80 },
  { key: 'compensationCapital', label: 'פיצויים מעסיק הון', width: 100, minWidth: 84 },
  { key: 'capitalBefore2008', label: 'תגמולי הון עד 2008', width: 100, minWidth: 84 },
  { key: 'capitalAfter2008', label: 'תגמולי הון מ-2008', width: 100, minWidth: 84 },
  { key: 'pensionBefore2000', label: 'תגמולים לקצבה עד 2000', width: 104, minWidth: 88 },
  { key: 'pensionAfter2000', label: 'תגמולים לקצבה אחרי 2000', width: 104, minWidth: 88 },
  { key: 'total', label: 'סה"כ', width: 100, minWidth: 84 },
  { key: 'yieldMode', label: 'אופן תשואה / מסלול', width: 128, minWidth: 100 },
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

function formatCurrency(value: unknown) {
  return money(value)
}

function formatPercent(value: unknown) {
  const parsed = num(value)
  return Number.isFinite(parsed) ? `${parsed.toLocaleString('he-IL', { maximumFractionDigits: 2 })}%` : '-'
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000
}

function parsePhoenixDate(value: string) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Conversion factor for one (guarantee, survivor-rate) scenario, via the
 * exact Phoenix engine (src/lib/phoenix/factor-engine.ts). Returns the
 * factor WITHOUT retro months — the caller adds those (retro is added to the
 * factor linearly, per Phoenix's spec, not to the pension).
 *
 * The previous in-file engine used a hand-fitted mortality curve and an
 * invented improvement decay; measured against Phoenix's own simulator it
 * overstated the factor by ~20-24% in every scenario (understating the
 * client's monthly pension by ~20%). It was replaced, not tuned — see the
 * engine file header and scripts/check-phoenix-factor.ts.
 *
 * Throws PhoenixEngineError for retirement age < 55 (Phoenix's own tables
 * start there); the caller surfaces that as a validation message.
 */
function computePhoenixScenario(model: NonNullable<PhoenixModel>, guaranteeMonths: number, spousePercent: number) {
  return phoenixConversionFactor({
    birthPensioner: model.memberBirth,
    birthSpouse: model.isMarried ? model.spouseBirth : null,
    isMale: model.gender === 'male',
    retirementYear: model.calcDate.getFullYear(),
    retirementMonth: model.calcDate.getMonth() + 1,
    guaranteeMonths,
    spouseRate: model.isMarried ? spousePercent : 0,
    fund: model.fund,
    retroMonths: 0,
  }).factor
}

function buildPhoenixModel(inputs: PhoenixInputs) {
  const calcDate = new Date(Number(inputs.retirementYear), Number(inputs.retirementMonth) - 1, 1)
  const memberBirth = parsePhoenixDate(inputs.memberBirth)
  const spouseBirth = parsePhoenixDate(inputs.spouseBirth)
  const isMarried = inputs.maritalStatus === 'married'
  if (!memberBirth) return null
  if (isMarried && !spouseBirth) return null

  // Age per Phoenix's convention: 1st of the month FOLLOWING the birth month.
  const memberExactAge = phoenixAgeAt(memberBirth, calcDate)
  const spouseExactAge = isMarried && spouseBirth ? phoenixAgeAt(spouseBirth, calcDate) : null
  if (Number.isNaN(memberExactAge)) return null

  const maxGuarantee = phoenixMaxGuaranteeMonths(memberExactAge)
  const guaranteeInput = Math.max(0, Number(inputs.guaranteeMonths) || 0)
  const effectiveGuarantee = Math.min(guaranteeInput, maxGuarantee)
  // Displayed for transparency. NOTE: the engine derives net interest from
  // the fund type + Phoenix's regulated 0.3% fee (rounded to 4 dp, per the
  // regulations) — the user-editable feeRate field is no longer an input to
  // the factor. It stays in the form for backwards compatibility of saved
  // inputs but is informational only.
  const grossRate = inputs.fund === 'comprehensive' ? 0.0438 : 0.04
  const netAnnualRate = round4((1 + grossRate) * (1 - 0.003) - 1)

  return {
    calcDate,
    calcYear: calcDate.getFullYear(),
    fund: inputs.fund,
    memberBirth,
    spouseBirth,
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
    /** Retirement below 55 is outside Phoenix's tables — the engine throws. */
    belowMinimumAge: memberExactAge < 55,
  }
}

function calculatePhoenix(inputs: PhoenixInputs) {
  const model = buildPhoenixModel(inputs)
  // Below 55 the engine throws (Phoenix's reduction table starts at 55) —
  // surface as "no result" and let the UI explain, rather than crashing.
  if (!model || model.belowMinimumAge) return { model, result: null, coefficientRows: [], pensionRows: [] }
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
    <div dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar title="סימולציות" />

      <section style={{ marginBottom: 20 }} aria-label="בחירת סימולציה">
        <Tabs items={simViews.map(view => ({ value: view.id, label: view.label }))} value={activeView} onChange={setView} />
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
    </div>
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
  const [showMonthlyRows, setShowMonthlyRows] = useState(false)
  const multiplier = result.investmentMultiplier
  const mid = result.annualRows[Math.floor(result.annualRows.length / 2)]
  const validation = result.validation
  const chartData = {
    labels: result.annualRows.map(row => `שנה ${row.year}`),
    datasets: [
      ...(chartMode === 'nominal' || chartMode === 'both'
        ? [{
          label: 'שווי נומינלי',
          data: result.annualRows.map(row => row.netBalance),
          borderColor: '#475569',
          backgroundColor: 'rgba(71, 85, 105, 0.12)',
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
            <Field label="סכום התחלתי" suffix="₪" value={inputs.initialAmount} error={validation.errors.initialAmount} onChange={value => onFieldChange('initialAmount', value)} />
            <Field label="הפקדה חודשית" suffix="₪" value={inputs.monthlyDeposit} error={validation.errors.monthlyDeposit} onChange={value => onFieldChange('monthlyDeposit', value)} />
            <Field label="תשואה שנתית" suffix="%" value={inputs.annualReturn} error={validation.errors.annualReturn} onChange={value => onFieldChange('annualReturn', value)} />
            <Field label="מספר שנים" suffix="שנים" value={inputs.years} error={validation.errors.years} onChange={value => onFieldChange('years', value)} />
          </div>

          <button type="button" onClick={() => onFieldChange('advOpen', !inputs.advOpen)} style={advancedButtonStyle}>
            {inputs.advOpen ? 'הסתר הגדרות מתקדמות' : 'הגדרות מתקדמות'}
          </button>

          {inputs.advOpen && (
            <div style={advancedGridStyle}>
              <Field label="דמי ניהול מהפקדה" suffix="%" value={inputs.depositFee} error={validation.errors.depositFee} onChange={value => onFieldChange('depositFee', value)} />
              <Field label="דמי ניהול מצבירה" suffix="%" value={inputs.annualFee} error={validation.errors.annualFee} onChange={value => onFieldChange('annualFee', value)} />
              <Field label="אינפלציה שנתית" suffix="%" value={inputs.inflation} error={validation.errors.inflation} onChange={value => onFieldChange('inflation', value)} />
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
          {!validation.valid && (
            <div style={validationBoxStyle}>
              {validation.messages.map(message => (
                <div key={message}>{message}</div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>תוצאות</h2>
          <div style={simKpisStyle}>
            <Kpi title="שווי נומינלי נטו" value={formatCurrency(result.netFinal)} note={`אחרי ${inputs.years || 0} שנים ודמי ניהול`} />
            <Kpi title="שווי ריאלי" value={formatCurrency(result.realFinal)} note={`בערכי היום לפי ${formatPercent(inputs.inflation || 0)} אינפלציה`} />
            <Kpi title='סה"כ הפקדות' value={formatCurrency(result.grossDeposits)} note="סכום התחלתי + הפקדות ברוטו" />
            <Kpi title="רווח נומינלי נטו" value={formatCurrency(result.nominalProfit)} note={result.grossDeposits > 0 ? `${fmtNumber((result.nominalProfit / result.grossDeposits) * 100, 2)}% על ההשקעה` : '—'} />
            <Kpi title="רווח ריאלי" value={formatCurrency(result.realProfit)} note="חישוב ריאלי מקורב" />
            <Kpi title='דמי ניהול שנגבו' value={formatCurrency(result.totalFees)} note={`מהפקדות ${formatCurrency(result.totalDepositFees)} | מצבירה ${formatCurrency(result.totalAccumulationFees)}`} />
            <Kpi title="השפעת דמי ניהול" value={formatCurrency(result.feeImpact)} note="שווי סופי ללא דמי ניהול פחות השווי בפועל" danger />
            <Kpi title="מס" value={formatCurrency(result.taxFinal)} note={inputs.taxType === 'exempt' ? 'פטור ממס' : inputs.taxType === 'nominal' ? '25% נומינלי' : '25% ריאלי'} />
            <Kpi title="שווי לאחר מס" value={formatCurrency(result.afterTaxFinal)} note={`מס משוער: ${formatCurrency(result.taxFinal)}`} />
            <Kpi title="מכפיל השקעה" value={multiplier ? `${fmtNumber(multiplier, 2)}x` : '—'} note={mid ? `שנת מחצית: ${mid.year} (${formatCurrency(mid.netBalance)})` : 'לא רלוונטי ללא הפקדות'} />
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

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>פירוט חודשי</h2>
          <button type="button" onClick={() => setShowMonthlyRows(prev => !prev)} style={smallButtonStyle}>
            {showMonthlyRows ? 'הסתר פירוט חודשי' : 'הצג פירוט חודשי'}
          </button>
        </div>
        {showMonthlyRows && (
          <div style={monthlyTableWrapStyle}>
            <table style={monthlyTableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>חודש</th>
                  <th style={thStyle}>יתרת פתיחה</th>
                  <th style={thStyle}>הפקדה ברוטו</th>
                  <th style={thStyle}>דמי ניהול מהפקדה</th>
                  <th style={thStyle}>הפקדה נטו</th>
                  <th style={thStyle}>תשואה חודשית</th>
                  <th style={thStyle}>דמי ניהול מצבירה</th>
                  <th style={thStyle}>יתרת סוף חודש</th>
                </tr>
              </thead>
              <tbody>
                {result.monthlyRows.length ? result.monthlyRows.map(row => (
                  <tr key={row.month} style={row.month % 2 === 0 ? activeRowStyle : undefined}>
                    <td style={tdCenterStyle}>{row.month}</td>
                    <td style={tdMoneyStyle}>{formatCurrency(row.openingBalance)}</td>
                    <td style={tdMoneyStyle}>{formatCurrency(row.grossDeposit)}</td>
                    <td style={tdMoneyStyle}>{formatCurrency(row.depositFeeAmount)}</td>
                    <td style={tdMoneyStyle}>{formatCurrency(row.netDeposit)}</td>
                    <td style={tdMoneyStyle}>{formatCurrency(row.monthlyReturnAmount)}</td>
                    <td style={tdMoneyStyle}>{formatCurrency(row.accumulationFeeAmount)}</td>
                    <td style={tdMoneyStyle}>{formatCurrency(row.closingBalance)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} style={tdCenterStyle}>אין נתוני חודשים להצגה. בדוק את תקינות הפרמטרים.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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

  // --- Auto-fill from the client file (מסלקה / בירור צרכים / שאלון) -------
  // The workspace store is the source of truth for client + needs assessment.
  const storeHydrated = useWorkspaceStore(state => state.hydrated)
  const hydrateStore = useWorkspaceStore(state => state.hydrate)
  const storeClient = useWorkspaceStore(state => state.client)
  const storeNeeds = useWorkspaceStore(state => state.needsAssessment)
  useEffect(() => { if (!storeHydrated) hydrateStore() }, [hydrateStore, storeHydrated])
  const autofill = useMemo(() => buildPhoenixAutofill({ client: storeClient, needs: storeNeeds }), [storeClient, storeNeeds])
  const [autofillNotice, setAutofillNotice] = useState<'applied' | 'refreshed' | null>(null)

  const applyAutofill = useCallback((mode: 'auto' | 'manual') => {
    if (!Object.keys(autofill.patch).length) return
    setInputs(prev => ({ ...prev, ...autofill.patch }))
    // Pre-select every pension-relevant fund for the accumulation when nothing is selected yet.
    setSelectedPartIds(prev => prev.length || !selectionRows.length ? prev : selectionRows.map(row => phoenixSelectionId(row.id, 'total')))
    localStorage.setItem(PHOENIX_AUTOFILL_SIG_KEY, autofill.signature)
    setAutofillNotice(mode === 'auto' ? 'applied' : 'refreshed')
  }, [autofill, selectionRows])

  // Apply once per client-data signature: a new/changed client file overwrites
  // the calculator inputs; the advisor's own tweaks survive otherwise.
  useEffect(() => {
    if (!storeHydrated) return
    if (!Object.keys(autofill.patch).length) return
    const applied = localStorage.getItem(PHOENIX_AUTOFILL_SIG_KEY)
    if (applied === autofill.signature) return
    // Deferred: applying inside the effect body would be a sync setState-in-effect.
    const handle = window.setTimeout(() => applyAutofill('auto'), 0)
    return () => window.clearTimeout(handle)
  }, [applyAutofill, autofill, storeHydrated])
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
      background: activeRow && activeCol ? 'var(--bg-surface-sunken)' : activeCol ? 'var(--bg-canvas)' : activeRow ? 'var(--bg-canvas)' : undefined,
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

      {(autofill.profile.name || autofill.profile.idNumber || autofill.filled.length > 0) && (
        <section style={phoenixClientCardStyle} aria-label="נתוני הלקוח שנטענו למחשבון">
          <div style={{ minWidth: 0, display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text-heading)', fontSize: 16 }}>{autofill.profile.name || 'לקוח ללא שם'}</strong>
              {autofill.profile.idNumber && <span style={softTextStyle}>ת.ז {autofill.profile.idNumber}</span>}
              {autofill.profile.birthDate && <span style={softTextStyle}>נולד/ה {autofill.profile.birthDate.split('-').reverse().join('.')}</span>}
            </div>
            <div style={{ ...softTextStyle, fontSize: 12.5 }}>
              {autofill.filled.length
                ? <>נטען אוטומטית: {autofill.filled.map(item => `${item.field} (${item.source})`).join(' · ')}{selectedCapital > 0 ? ' · צבירה מהקופות שסומנו' : ''}</>
                : 'לא נמצאו נתונים רלוונטיים למחשבון בתיק הלקוח.'}
              {autofillNotice === 'refreshed' && <strong style={{ color: 'var(--success)', marginInlineStart: 8 }}>עודכן מהתיק ✓</strong>}
            </div>
          </div>
          <button type="button" onClick={() => applyAutofill('manual')} disabled={!autofill.filled.length} style={chipStyle} title="דריסת השדות במחשבון בנתונים העדכניים מתיק הלקוח">
            טען מחדש מתיק הלקוח
          </button>
        </section>
      )}

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
          </div>
          {model?.belowMinimumAge && (
            <div style={warningStyle}>גיל פרישה נמוך מ-55 — לוחות התקנון של הפניקס מתחילים בגיל 55, ולא ניתן לחשב מקדם מתחתיו.</div>
          )}
          {!model && <div style={warningStyle}>נתוני חישוב חסרים.</div>}
          <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.6 }}>
            החישוב לפי תקנון הפניקס מהדורת {PHOENIX_REGULATIONS_EDITION} — לוחות תמותה פ1–פ5 ולוחות שיפורי תמותה (חוזר 2024-9-8), ריבית תקנונית ודמי ניהול 0.3% הכלולים בשיעור ההיוון. המקדם המחייב הוא זה שבהצעת הגוף המנהל.
          </p>
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
                {phoenixGuaranteeOptions.map(option => <th key={option} style={String(option) === inputs.guaranteeMonths ? activeThStyle : thStyle}>{guaranteeColumnLabel(option, model?.maxGuarantee)}</th>)}
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
                {phoenixGuaranteeOptions.map(option => <th key={option} style={String(option) === inputs.guaranteeMonths ? activeThStyle : thStyle}>{guaranteeColumnLabel(option, model?.maxGuarantee)}</th>)}
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
                  <tr key={row.id} style={{ background: index % 2 ? 'var(--bg-surface-sunken)' : 'var(--bg-surface)' }}>
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
      <span style={{ color: 'var(--text-muted)', fontWeight: 900 }}>{title}</span>
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

function Field({
  label,
  suffix,
  value,
  error,
  onChange,
}: {
  label: string
  suffix: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={labelStyle}>{label}</span>
      <div style={error ? invalidInputWrapStyle : inputWrapStyle}>
        <input dir="ltr" value={value} onChange={event => onChange(event.target.value)} inputMode="decimal" style={inputStyle} />
        <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>{suffix}</span>
      </div>
      {error && <span style={fieldErrorStyle}>{error}</span>}
    </label>
  )
}

const simLayoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18, marginBottom: 18 }
const phoenixCalculatorLayoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(360px, 0.95fr) minmax(420px, 1.05fr)', gap: 18, marginBottom: 18, alignItems: 'start' }
const compoundGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 18 }
const advancedButtonStyle: React.CSSProperties = { marginTop: 16, border: '1px solid var(--separator)', background: 'var(--bg-canvas)', color: 'var(--abd-primary)', borderRadius: 999, padding: '9px 14px', fontWeight: 900, cursor: 'pointer', fontFamily: 'var(--font-main)' }
const advancedGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--separator)' }
const scenarioBarStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--separator)' }
const chipStyle: React.CSSProperties = { border: '1px solid var(--separator)', background: 'var(--bg-surface)', color: 'var(--abd-primary)', borderRadius: 999, padding: '8px 13px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const activeChipStyle: React.CSSProperties = { ...chipStyle, background: 'var(--bg-surface-sunken)', borderColor: 'var(--abd-accent)', color: 'var(--abd-accent)' }
const selectStyle: React.CSSProperties = { minHeight: 42, border: '1px solid var(--separator)', borderRadius: 12, background: 'var(--bg-canvas)', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontWeight: 800, padding: '0 12px' }
const labelStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontWeight: 800 }
const dateInputStyle: React.CSSProperties = { ...selectStyle, direction: 'ltr', textAlign: 'right' }
const warningStyle: React.CSSProperties = { marginTop: 14, border: '1px solid var(--destructive)', background: 'var(--destructive-bg)', color: 'var(--destructive-text)', borderRadius: 14, padding: 12, fontWeight: 800 }
const phoenixClientCardStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 14 }
const phoenixHeroStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card)', marginBottom: 18 }
const phoenixFundToggleStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }
const phoenixFundsListStyle: React.CSSProperties = { display: 'grid', gap: 10, maxHeight: 520, overflowY: 'auto', paddingInlineEnd: 4 }
const phoenixFundRowStyle: React.CSSProperties = { border: '1px solid var(--separator)', borderRadius: 16, background: 'var(--bg-canvas)', overflow: 'hidden' }
const phoenixFundLineStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 10, alignItems: 'center', padding: 12 }
const checkboxLabelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, color: 'var(--abd-primary)', fontWeight: 900 }
const softTextStyle: React.CSSProperties = { display: 'block', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, lineHeight: 1.5 }
const miniButtonStyle: React.CSSProperties = { border: '1px solid var(--separator)', background: 'var(--bg-surface)', color: 'var(--abd-primary)', borderRadius: 999, padding: '7px 10px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }
const moneyBadgeStyle: React.CSSProperties = { color: 'var(--abd-accent)', background: 'var(--bg-surface-sunken)', borderRadius: 999, padding: '7px 10px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
const phoenixPartsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, padding: '0 12px 12px' }
const partCheckStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: 8, alignItems: 'center', border: '1px solid var(--separator)', borderRadius: 12, background: 'var(--bg-surface)', padding: 9, color: 'var(--abd-primary)', fontSize: 12, fontWeight: 800 }
const emptyStateStyle: React.CSSProperties = { border: '1px dashed var(--separator)', borderRadius: 16, padding: 18, color: 'var(--text-muted)', fontWeight: 800, lineHeight: 1.8 }
const chartTabsStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const simKpisStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 18 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 22 }
const kpiStyle: React.CSSProperties = { display: 'grid', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 18, padding: 18, boxShadow: 'var(--shadow-card)', color: 'var(--abd-primary)', fontWeight: 800 }
const layoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginTop: 18 }
const cardStyle: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-card)', marginBottom: 18 }
const sectionHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900 }
const countBadgeStyle: React.CSSProperties = { color: 'var(--abd-primary)', background: 'var(--bg-surface-sunken)', border: '1px solid var(--separator)', borderRadius: 999, padding: '8px 14px', fontWeight: 900, whiteSpace: 'nowrap' }
const tableActionsStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const smallButtonStyle: React.CSSProperties = { border: '1px solid var(--separator)', background: 'var(--bg-surface)', color: 'var(--abd-primary)', borderRadius: 999, padding: '8px 13px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const pillStripStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }
const pillStyle: React.CSSProperties = { color: 'var(--abd-primary)', background: 'var(--bg-canvas)', border: '1px solid var(--separator)', borderRadius: 999, padding: '8px 12px', fontWeight: 800, fontSize: 13 }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid var(--separator)', borderRadius: 16 }
const tableStyle: React.CSSProperties = { width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: 13, color: 'var(--abd-primary)' }
const thStyle: React.CSSProperties = { position: 'relative', background: 'var(--bg-surface-sunken)', color: 'var(--abd-primary)', textAlign: 'right', padding: '10px 8px', fontWeight: 900, lineHeight: 1.35, verticalAlign: 'bottom', userSelect: 'none', borderBottom: '1px solid var(--separator)' }
const resizeHandleStyle: React.CSSProperties = { position: 'absolute', insetBlock: 8, left: 0, width: 9, cursor: 'col-resize', borderLeft: '2px solid rgba(100, 116, 139, 0.45)', opacity: 0.9 }
const tdStyle: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid var(--separator)', verticalAlign: 'top', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }
const tdCenterStyle: React.CSSProperties = { ...tdStyle, textAlign: 'center', fontWeight: 900 }
const tdStrongStyle: React.CSSProperties = { ...tdStyle, color: 'var(--text-heading)', fontWeight: 900 }
const tdMonoStyle: React.CSSProperties = { ...tdStyle, fontVariantNumeric: 'tabular-nums', direction: 'ltr', textAlign: 'right' }
const tdMoneyStyle: React.CSSProperties = { ...tdStyle, fontWeight: 900, whiteSpace: 'nowrap' }
const tdTotalMoneyStyle: React.CSSProperties = { ...tdMoneyStyle, background: 'var(--warning-bg)' }
const activeThStyle: React.CSSProperties = { ...thStyle, background: 'var(--bg-surface-sunken)', color: 'var(--abd-accent)' }
const activeRowStyle: React.CSSProperties = { background: 'var(--bg-surface-sunken)' }
const clickableTdStyle: React.CSSProperties = { ...tdMoneyStyle, padding: 0 }
const activeCellStyle: React.CSSProperties = { ...clickableTdStyle, background: 'var(--bg-surface-sunken)', boxShadow: 'inset 0 0 0 2px var(--abd-accent)' }
const matrixButtonStyle: React.CSSProperties = { width: '100%', minHeight: 42, border: 0, background: 'transparent', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const positiveMoneyStyle: React.CSSProperties = { ...tdMoneyStyle, color: 'var(--success)' }
const negativeMoneyStyle: React.CSSProperties = { ...tdMoneyStyle, color: 'var(--destructive)' }
const tfStyle: React.CSSProperties = { background: 'var(--warning-bg)', color: 'var(--abd-primary)', padding: '12px 10px', fontWeight: 900 }
const tfMoneyStyle: React.CSSProperties = { ...tfStyle, whiteSpace: 'nowrap' }
const emptyStyle: React.CSSProperties = { display: 'grid', justifyItems: 'center', gap: 12, padding: 34, color: 'var(--abd-primary)', background: 'var(--bg-canvas)', borderRadius: 16, textAlign: 'center' }
const inputWrapStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10, border: '1px solid var(--separator)', borderRadius: 12, padding: '0 12px', background: 'var(--bg-canvas)' }
const invalidInputWrapStyle: React.CSSProperties = { ...inputWrapStyle, borderColor: 'var(--destructive)', background: 'var(--destructive-bg)' }
const inputStyle: React.CSSProperties = { minHeight: 42, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)', fontWeight: 800 }
const fieldErrorStyle: React.CSSProperties = { color: 'var(--destructive-text)', fontSize: 12, fontWeight: 800, lineHeight: 1.5 }
const validationBoxStyle: React.CSSProperties = { marginTop: 14, border: '1px solid var(--destructive)', background: 'var(--destructive-bg)', color: 'var(--destructive-text)', borderRadius: 14, padding: 12, display: 'grid', gap: 4, fontWeight: 800, lineHeight: 1.6 }
const monthlyTableWrapStyle: React.CSSProperties = { ...tableWrapStyle, maxHeight: 420, overflow: 'auto' }
const monthlyTableStyle: React.CSSProperties = { ...tableStyle, minWidth: 980 }
const projectionStyle: React.CSSProperties = { display: 'block', color: 'var(--abd-primary)', fontSize: 30, fontWeight: 900, marginTop: 16 }
const miniMetricsStyle: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, color: 'var(--abd-primary)' }
const legendGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, margin: '16px 0' }
const legendStyle: React.CSSProperties = { display: 'grid', gap: 8, border: '1px solid var(--separator)', borderRadius: 14, padding: 14, background: 'var(--bg-canvas)', color: 'var(--abd-primary)', lineHeight: 1.5 }
const phoenixFrameStyle: React.CSSProperties = { width: '100%', height: 720, border: '1px solid var(--separator)', borderRadius: 16, background: 'var(--bg-surface)' }

