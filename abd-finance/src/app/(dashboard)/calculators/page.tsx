'use client'

import { useEffect, useMemo, useState } from 'react'

type FundRow = {
  id?: string
  genderScore?: string
  manufacturer?: string
  productType?: string
  accountNumber?: string
  currentBalance?: number
  retirementCapital?: number
  importedPension?: number
  guaranteedCoefficient?: number
}

type CompoundInput = {
  initialAmount: string
  monthlyDeposit: string
  annualReturn: string
  years: string
  annualFee: string
  depositFee: string
  inflation: string
  taxType: 'real' | 'nominal' | 'exempt'
  linked: boolean
  scenario: 'conservative' | 'base' | 'optimistic'
}

const FUNDS_KEY = 'abd_next_funds'

function toNumber(value: unknown) {
  const parsed = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function money(value: unknown) {
  return toNumber(value).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  })
}

function getScenarioShift(scenario: CompoundInput['scenario']) {
  if (scenario === 'conservative') return -2
  if (scenario === 'optimistic') return 2
  return 0
}

function sanitizeCompoundInput(raw: CompoundInput) {
  return {
    initialAmount: clamp(toNumber(raw.initialAmount), 0, 100000000),
    monthlyDeposit: clamp(toNumber(raw.monthlyDeposit), 0, 1000000),
    annualReturn: clamp(toNumber(raw.annualReturn), -5, 30),
    years: clamp(Math.round(toNumber(raw.years)), 1, 50),
    annualFee: clamp(toNumber(raw.annualFee), 0, 10),
    depositFee: clamp(toNumber(raw.depositFee), 0, 6),
    inflation: clamp(toNumber(raw.inflation || 2), 0, 20),
    taxType: raw.taxType,
    linked: Boolean(raw.linked),
    scenario: raw.scenario,
  }
}

function calculateCompoundProjection(input: CompoundInput) {
  const data = sanitizeCompoundInput(input)
  const annualReturnWithScenario = data.annualReturn + getScenarioShift(data.scenario)
  const monthlyReturn = Math.pow(1 + annualReturnWithScenario / 100, 1 / 12) - 1
  const monthlyBalanceFeeRate = data.annualFee > 0 ? (1 - Math.pow(1 - data.annualFee / 100, 1 / 12)) : 0
  const monthlyIndex = data.linked ? (Math.pow(1.02, 1 / 12) - 1) : 0
  const monthlyInflation = data.inflation > 0 ? (Math.pow(1 + data.inflation / 100, 1 / 12) - 1) : 0
  const depositFeeRate = data.depositFee / 100
  const totalMonths = data.years * 12

  let grossBalance = data.initialAmount
  let netBalance = data.initialAmount
  let grossDeposits = data.initialAmount
  let netDeposits = data.initialAmount
  let totalBalanceFees = 0
  let totalDepositFees = 0
  let cumulativeInflationFactor = 1
  const annualRows: Array<{
    year: number
    grossBalance: number
    netBalance: number
    realBalance: number
    afterTax: number
    grossDeposits: number
    netDeposits: number
    totalFees: number
    nominalGain: number
    taxAmount: number
  }> = []

  for (let month = 1; month <= totalMonths; month += 1) {
    const indexedFactor = Math.pow(1 + monthlyIndex, month - 1)
    const rawDeposit = data.monthlyDeposit * indexedFactor
    const depositFeeAmount = rawDeposit * depositFeeRate
    const netMonthlyDeposit = rawDeposit - depositFeeAmount

    grossDeposits += rawDeposit
    netDeposits += netMonthlyDeposit
    totalDepositFees += depositFeeAmount

    grossBalance *= (1 + monthlyReturn)
    grossBalance += rawDeposit

    netBalance *= (1 + monthlyReturn)
    const balanceFeeForMonth = netBalance * monthlyBalanceFeeRate
    totalBalanceFees += balanceFeeForMonth
    netBalance -= balanceFeeForMonth
    netBalance += netMonthlyDeposit

    cumulativeInflationFactor *= (1 + monthlyInflation)

    if (month % 12 === 0) {
      const realBalance = cumulativeInflationFactor > 0 ? netBalance / cumulativeInflationFactor : netBalance
      const nominalGain = netBalance - netDeposits
      const inflationAdjustedInvested = netDeposits * cumulativeInflationFactor
      const realGain = netBalance - inflationAdjustedInvested
      let taxAmount = 0
      if (data.taxType === 'nominal') taxAmount = Math.max(0, nominalGain) * 0.25
      else if (data.taxType === 'real') taxAmount = Math.max(0, realGain) * 0.25

      annualRows.push({
        year: month / 12,
        grossBalance,
        netBalance,
        realBalance,
        afterTax: netBalance - taxAmount,
        grossDeposits,
        netDeposits,
        totalFees: totalBalanceFees + totalDepositFees,
        nominalGain,
        taxAmount,
      })
    }
  }

  const realFinal = cumulativeInflationFactor > 0 ? netBalance / cumulativeInflationFactor : netBalance
  const finalNominalGain = netBalance - netDeposits
  const finalInflationAdjustedInvested = netDeposits * cumulativeInflationFactor
  const finalRealGain = netBalance - finalInflationAdjustedInvested
  let taxFinal = 0
  if (data.taxType === 'nominal') taxFinal = Math.max(0, finalNominalGain) * 0.25
  else if (data.taxType === 'real') taxFinal = Math.max(0, finalRealGain) * 0.25

  return {
    inputs: data,
    annualReturnWithScenario,
    effectiveMonthlyReturn: monthlyReturn,
    grossFinal: grossBalance,
    netFinal: netBalance,
    realFinal,
    afterTaxFinal: netBalance - taxFinal,
    taxFinal,
    grossDeposits,
    netDeposits,
    profits: netBalance - netDeposits,
    totalBalanceFees,
    totalDepositFees,
    feeImpact: grossBalance - netBalance,
    annualRows,
  }
}

function buildScenarioComparison(input: CompoundInput) {
  const scenarios: Array<{ id: CompoundInput['scenario']; label: string }> = [
    { id: 'conservative', label: 'שמרני' },
    { id: 'base', label: 'בסיס' },
    { id: 'optimistic', label: 'אופטימי' },
  ]
  const rows = scenarios.map(scenario => {
    const result = calculateCompoundProjection({ ...input, scenario: scenario.id })
    return { ...scenario, netFinal: result.netFinal, grossFinal: result.grossFinal, realFinal: result.realFinal, afterTaxFinal: result.afterTaxFinal }
  })
  const base = rows.find(row => row.id === 'base')
  return rows.map(row => ({ ...row, gapFromBase: base ? row.netFinal - base.netFinal : 0 }))
}

export default function CalculatorsPage() {
  const [funds, setFunds] = useState<FundRow[]>([])
  const [capital, setCapital] = useState('1000000')
  const [factor, setFactor] = useState('200')
  const [taxRate, setTaxRate] = useState('0')
  const [compound, setCompound] = useState<CompoundInput>({
    initialAmount: '250000',
    monthlyDeposit: '1500',
    annualReturn: '4',
    years: '10',
    annualFee: '0.6',
    depositFee: '0',
    inflation: '2',
    taxType: 'real',
    linked: false,
    scenario: 'base',
  })

  useEffect(() => {
    try {
      const storedFunds = JSON.parse(localStorage.getItem(FUNDS_KEY) || '[]')
      const list = Array.isArray(storedFunds) ? storedFunds : []
      setFunds(list)
      const pensionFunds = list.filter((fund: FundRow) => fund.genderScore === 'משוך קצבה')
      const pensionCapital = pensionFunds.reduce((sum: number, fund: FundRow) => sum + (toNumber(fund.retirementCapital) || toNumber(fund.currentBalance)), 0)
      const importedPension = pensionFunds.reduce((sum: number, fund: FundRow) => sum + toNumber(fund.importedPension), 0)
      if (pensionCapital > 0) setCapital(String(Math.round(pensionCapital)))
      if (pensionCapital > 0 && importedPension > 0) setFactor(String(Math.round((pensionCapital / importedPension) * 100) / 100))
    } catch {
      setFunds([])
    }
  }, [])

  const monthlyPension = useMemo(() => {
    const gross = toNumber(capital) / Math.max(1, toNumber(factor))
    return gross * (1 - toNumber(taxRate) / 100)
  }, [capital, factor, taxRate])

  const compoundResult = useMemo(() => calculateCompoundProjection(compound), [compound])
  const scenarioRows = useMemo(() => buildScenarioComparison(compound), [compound])
  const selectedFunds = useMemo(() => funds.filter(fund => fund.genderScore === 'משוך קצבה'), [funds])

  function updateCompound(key: keyof CompoundInput, value: string | boolean) {
    setCompound(current => ({ ...current, [key]: value }))
  }

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>מחשבונים</h1>
      </header>

      <section style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>מחשבון קצבה</h2>
          <Field label="הון לקצבה" value={capital} onChange={setCapital} suffix="₪" />
          <Field label="מקדם קצבה" value={factor} onChange={setFactor} suffix="" />
          <Field label="מס משוער" value={taxRate} onChange={setTaxRate} suffix="%" />
          <Result label="קצבה חודשית נטו" value={money(monthlyPension)} />
          <div style={miniListStyle}>
            {selectedFunds.map(fund => (
              <div key={fund.id} style={miniRowStyle}>
                <span>{fund.manufacturer || 'יצרן'} | {fund.accountNumber || 'קופה'}</span>
                <strong>{money(fund.retirementCapital || fund.currentBalance)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>מחשבון ריבית דריבית</h2>
          <div style={formGridStyle}>
            <CompoundField label="סכום התחלתי" value={compound.initialAmount} onChange={value => updateCompound('initialAmount', value)} suffix="₪" />
            <CompoundField label="הפקדה חודשית" value={compound.monthlyDeposit} onChange={value => updateCompound('monthlyDeposit', value)} suffix="₪" />
            <CompoundField label="תשואה שנתית" value={compound.annualReturn} onChange={value => updateCompound('annualReturn', value)} suffix="%" />
            <CompoundField label="שנים" value={compound.years} onChange={value => updateCompound('years', value)} suffix="" />
            <CompoundField label="דמי ניהול מצבירה" value={compound.annualFee} onChange={value => updateCompound('annualFee', value)} suffix="%" />
            <CompoundField label="דמי ניהול מהפקדה" value={compound.depositFee} onChange={value => updateCompound('depositFee', value)} suffix="%" />
            <CompoundField label="אינפלציה" value={compound.inflation} onChange={value => updateCompound('inflation', value)} suffix="%" />
            <label style={fieldStyle}>
              <span>מס</span>
              <select value={compound.taxType} onChange={event => updateCompound('taxType', event.target.value)} style={selectStyle}>
                <option value="real">מס ריאלי 25%</option>
                <option value="nominal">מס נומינלי 25%</option>
                <option value="exempt">פטור</option>
              </select>
            </label>
          </div>
          <label style={checkboxStyle}>
            <input type="checkbox" checked={compound.linked} onChange={event => updateCompound('linked', event.target.checked)} />
            הצמדת הפקדה חודשית 2% שנתי
          </label>
          <div style={modeToggleStyle}>
            {([
              ['conservative', 'שמרני'],
              ['base', 'בסיס'],
              ['optimistic', 'אופטימי'],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => updateCompound('scenario', id)} style={compound.scenario === id ? activeModeStyle : modeButtonStyle}>{label}</button>
            ))}
          </div>
        </div>
      </section>

      <section style={resultGridStyle}>
        <Result label="צבירה נטו" value={money(compoundResult.netFinal)} />
        <Result label="צבירה לאחר מס" value={money(compoundResult.afterTaxFinal)} />
        <Result label="רווח נטו" value={money(compoundResult.profits)} />
        <Result label="דמי ניהול והשפעה" value={money(compoundResult.feeImpact)} />
      </section>

      <section style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>השוואת תרחישים</h2>
          <table style={tableStyle}>
            <thead><tr><th>תרחיש</th><th>צבירה נטו</th><th>לאחר מס</th><th>פער מבסיס</th></tr></thead>
            <tbody>
              {scenarioRows.map(row => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{money(row.netFinal)}</td>
                  <td>{money(row.afterTaxFinal)}</td>
                  <td style={{ color: row.gapFromBase >= 0 ? '#00A63E' : '#DC2626', fontWeight: 900 }}>{money(row.gapFromBase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>פירוט שנתי</h2>
          <table style={tableStyle}>
            <thead><tr><th>שנה</th><th>צבירה נטו</th><th>הפקדות</th><th>מס</th></tr></thead>
            <tbody>
              {compoundResult.annualRows.slice(-10).map(row => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{money(row.netBalance)}</td>
                  <td>{money(row.netDeposits)}</td>
                  <td>{money(row.taxAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function Field({ label, value, suffix, onChange }: { label: string; value: string; suffix: string; onChange: (value: string) => void }) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      <div style={inputWrapStyle}>
        <input value={value} onChange={event => onChange(event.target.value)} inputMode="decimal" style={inputStyle} />
        {suffix && <strong>{suffix}</strong>}
      </div>
    </label>
  )
}

function CompoundField(props: { label: string; value: string; suffix: string; onChange: (value: string) => void }) {
  return <Field {...props} />
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div style={resultStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const headerStyle: React.CSSProperties = { marginBottom: 24 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 32, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.7 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, marginBottom: 18 }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-card)' }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900, marginBottom: 18 }
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8, marginBottom: 14, color: 'var(--abd-primary)', fontWeight: 800 }
const inputWrapStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', border: '1px solid #CFE6FA', borderRadius: 12, padding: '0 12px', background: '#FBFDFF', color: '#7EA0C9' }
const inputStyle: React.CSSProperties = { minHeight: 44, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)', fontWeight: 900 }
const selectStyle: React.CSSProperties = { minHeight: 44, border: '1px solid #CFE6FA', borderRadius: 12, padding: '0 12px', background: '#FBFDFF', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontWeight: 900 }
const resultStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, background: 'linear-gradient(180deg, #EFF6FF, #E7F4FF)', color: 'var(--abd-primary)', fontWeight: 900 }
const resultGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }
const miniListStyle: React.CSSProperties = { display: 'grid', gap: 8, marginTop: 16 }
const miniRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, border: '1px solid #D7EAFB', borderRadius: 12, padding: 10, color: 'var(--abd-primary)' }
const modeToggleStyle: React.CSSProperties = { display: 'flex', gap: 6, padding: 5, border: '1px solid #CFE6FA', borderRadius: 14, background: '#fff' }
const modeButtonStyle: React.CSSProperties = { border: 0, borderRadius: 10, background: 'transparent', color: 'var(--abd-primary)', padding: '10px 14px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const activeModeStyle: React.CSSProperties = { ...modeButtonStyle, background: 'var(--abd-accent)', color: '#fff' }
const checkboxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--abd-primary)', fontWeight: 900, marginBottom: 12 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', color: 'var(--abd-primary)' }

