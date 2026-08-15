'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildScenarioRows,
  calculateCompoundProjection,
  defaultCompoundInputs,
  type CompoundInputs,
} from '@/lib/compound-calculator'
import { Toolbar } from '@/components/ui/Toolbar'
import { Surface } from '@/components/ui/Surface'

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

const FUNDS_KEY = 'abd_next_funds'
const INFRASTRUCTURE_IDS_KEY = 'abd_next_infrastructure_ids'

function toNumber(value: unknown) {
  const parsed = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value: unknown) {
  return toNumber(value).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  })
}

export default function CalculatorsPage() {
  const [funds, setFunds] = useState<FundRow[]>([])
  const [capital, setCapital] = useState('1000000')
  const [factor, setFactor] = useState('200')
  const [taxRate, setTaxRate] = useState('0')
  const [compound, setCompound] = useState<CompoundInputs>({
    ...defaultCompoundInputs,
    initialAmount: '250000',
    annualReturn: '4',
    years: '10',
  })

  useEffect(() => {
    try {
      const storedFunds = JSON.parse(localStorage.getItem(FUNDS_KEY) || '[]')
      const list: FundRow[] = Array.isArray(storedFunds) ? storedFunds : []
      setFunds(list)
      const storedInfrastructureIds = JSON.parse(localStorage.getItem(INFRASTRUCTURE_IDS_KEY) || '[]')
      const infrastructureIds: string[] = Array.isArray(storedInfrastructureIds) ? storedInfrastructureIds : []
      // Must match FundsWorkspace's marking mechanism exactly — funds are marked via
      // infrastructureIds (localStorage), not the legacy genderScore field alone.
      const pensionFunds = list.filter(fund => infrastructureIds.includes(String(fund.id || '')) || fund.genderScore === 'משוך קצבה')
      const pensionCapital = pensionFunds.reduce((sum, fund) => sum + (toNumber(fund.retirementCapital) || toNumber(fund.currentBalance)), 0)
      const importedPension = pensionFunds.reduce((sum, fund) => sum + toNumber(fund.importedPension), 0)
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
  const scenarioRows = useMemo(() => buildScenarioRows(compound), [compound])
  const selectedFunds = useMemo(() => funds.filter(fund => fund.genderScore === 'משוך קצבה'), [funds])

  function updateCompound(key: keyof CompoundInputs, value: string | boolean) {
    setCompound(current => ({ ...current, [key]: value }))
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar title="מחשבונים" />

      <section style={gridStyle}>
        <Surface style={cardStyle}>
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
        </Surface>

        <Surface style={cardStyle}>
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
        </Surface>
      </section>

      <section style={resultGridStyle}>
        <Result label="צבירה נטו" value={money(compoundResult.netFinal)} />
        <Result label="צבירה לאחר מס" value={money(compoundResult.afterTaxFinal)} />
        <Result label="רווח נטו" value={money(compoundResult.profits)} />
        <Result label="דמי ניהול והשפעה" value={money(compoundResult.feeImpact)} />
      </section>

      <section style={gridStyle}>
        <Surface style={cardStyle}>
          <h2 style={sectionTitleStyle}>השוואת תרחישים</h2>
          <table style={tableStyle}>
            <thead><tr><th>תרחיש</th><th>צבירה נטו</th><th>לאחר מס</th><th>פער מבסיס</th></tr></thead>
            <tbody>
              {scenarioRows.map(row => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{money(row.netFinal)}</td>
                  <td>{money(row.afterTaxFinal)}</td>
                  <td style={{ color: row.gapFromBase >= 0 ? 'var(--success)' : 'var(--destructive)', fontWeight: 900 }}>{money(row.gapFromBase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>

        <Surface style={cardStyle}>
          <h2 style={sectionTitleStyle}>פירוט שנתי</h2>
          <table style={tableStyle}>
            <thead><tr><th>שנה</th><th>צבירה נטו</th><th>הפקדות</th><th>מס</th></tr></thead>
            <tbody>
              {compoundResult.annualRows.slice(-10).map(row => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{money(row.netBalance)}</td>
                  <td>{money(row.grossDeposits)}</td>
                  <td>{money(row.taxAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      </section>
    </div>
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

const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, marginBottom: 18 }
const cardStyle: React.CSSProperties = { padding: 22 }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 20, fontWeight: 800, marginBottom: 18 }
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8, marginBottom: 14, color: 'var(--text-heading)', fontWeight: 700 }
const inputWrapStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '0 12px', background: 'var(--bg-canvas)', color: 'var(--text-muted)' }
const inputStyle: React.CSSProperties = { minHeight: 44, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--font-main)', color: 'var(--text-heading)', fontWeight: 700 }
const selectStyle: React.CSSProperties = { minHeight: 44, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '0 12px', background: 'var(--bg-canvas)', color: 'var(--text-heading)', fontFamily: 'var(--font-main)', fontWeight: 700 }
const resultStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-sunken)', color: 'var(--text-heading)', fontWeight: 700 }
const resultGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }
const miniListStyle: React.CSSProperties = { display: 'grid', gap: 8, marginTop: 16 }
const miniRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: 10, color: 'var(--text-heading)' }
const modeToggleStyle: React.CSSProperties = { display: 'flex', gap: 6, padding: 5, border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-canvas)' }
const modeButtonStyle: React.CSSProperties = { border: 0, borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-heading)', padding: '10px 14px', fontFamily: 'var(--font-main)', fontWeight: 700, cursor: 'pointer' }
const activeModeStyle: React.CSSProperties = { ...modeButtonStyle, background: 'var(--abd-accent)', color: '#fff' }
const checkboxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-heading)', fontWeight: 700, marginBottom: 12 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', color: 'var(--text-heading)' }

