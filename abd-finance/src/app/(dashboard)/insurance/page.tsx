'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { importWorkspaceFiles, type ClientRecord } from '@/lib/client-importers'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import { ManufacturerLogo } from '@/components/shared/ManufacturerLogo'
import type { Fund } from '@/types/fund'
import type { InsurancePolicy } from '@/types/insurance'
import type { TrackingRisk } from '@/types/recommendations'

const INSURANCE_KEY = 'abd_next_insurance'
const FUNDS_KEY = 'abd_next_funds'
const CLIENT_KEY = 'abd_next_client'

const recommendationTemplates = [
  {
    id: 'agent-appointment',
    label: 'מינוי סוכן',
    color: '#F59E0B',
    text: 'מומלץ לבצע מינוי סוכן לפוליסה כדי לאפשר טיפול שוטף, קבלת מידע מלא מהחברה וביצוע שינויים נדרשים עבור הלקוח.',
  },
  {
    id: 'policy-changes',
    label: 'שינויים בפוליסה',
    color: '#48B84A',
    text: 'מומלץ לבצע שינויים בפוליסה בהתאם לצורכי הלקוח, לרבות התאמת מסלול, סכום ביטוח, מוטבים, תנאי גבייה או פרטי המבוטח.',
  },
  {
    id: 'cancel-policy',
    label: 'ביטול פוליסה',
    color: '#7C6CE8',
    text: 'מומלץ לבחון ביטול הפוליסה בכפוף לבדיקה מקצועית שאין צורך ביטוחי פעיל, שאין פגיעה בזכויות קיימות ושאין כיסוי חלופי נדרש.',
  },
  {
    id: 'renew-policy',
    label: 'חידוש פוליסה',
    color: '#2684FF',
    text: 'מומלץ לבחון חידוש הפוליסה או חידוש הכיסוי הביטוחי בהתאם לצורך הביטוחי העדכני ולתנאים המוצעים על ידי חברת הביטוח.',
  },
  {
    id: 'additional-coverages',
    label: 'כיסויים נוספים',
    color: '#FF2D20',
    text: 'מומלץ לבחון הוספת כיסויים נוספים לפוליסה בהתאם לפערים שעלו בבדיקת התיק הביטוחי ולמצב המשפחתי, הבריאותי והכלכלי של הלקוח.',
  },
  {
    id: 'replacement',
    label: 'שחלוף',
    color: '#0F2B46',
    text: 'מומלץ לבחון שחלוף הפוליסה לפוליסה מתאימה יותר, לאחר השוואת תנאים, עלויות, חריגים, תקופות אכשרה ושמירה על רצף זכויות ככל שנדרש.',
  },
]

function money(value: unknown) {
  const numeric = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric)
    ? numeric.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
    : 'אין נתון'
}

function clean(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeMergeText(value: unknown) {
  return clean(value).replace(/בע"מ/g, '').trim()
}

function company(policy: InsurancePolicy) {
  return policy.manufacturer || policy.company || 'אין נתון'
}

function policyType(policy: InsurancePolicy) {
  return policy.insuranceType || policy.productType || policy.mainBranch || policy.policyName || 'אין נתון'
}

function policyName(policy: InsurancePolicy) {
  return policy.planName || policy.policyName || policy.productType || policy.secondaryBranch || 'אין נתון'
}

function policyMergeKey(policy: InsurancePolicy) {
  return [
    policy.source || '',
    String(policy.policyNumber || '').replace(/\s+/g, ''),
    normalizeMergeText(policy.manufacturer || policy.company),
    policy.planName || policy.policyName || policy.productType || '',
  ].filter(Boolean).join('|') || policy.id
}

function mergePolicies(current: InsurancePolicy[], incoming: InsurancePolicy[]) {
  const map = new Map<string, InsurancePolicy>()
  current.forEach(policy => map.set(policyMergeKey(policy), policy))
  incoming.forEach(policy => {
    const key = policyMergeKey(policy)
    const existing = map.get(key)
    map.set(key, existing ? { ...existing, ...policy, id: existing.id } : policy)
  })
  return Array.from(map.values())
}

function fundMergeKey(fund: Fund) {
  return [
    String(fund.accountNumber || '').replace(/\D/g, '').replace(/^0+(?=\d)/, ''),
    normalizeMergeText(fund.manufacturer),
  ].filter(Boolean).join('|') || fund.id
}

function mergeFunds(current: Fund[], incoming: Fund[]) {
  const map = new Map<string, Fund>()
  current.forEach(fund => map.set(fundMergeKey(fund), fund))
  incoming.forEach(fund => {
    const key = fundMergeKey(fund)
    const existing = map.get(key)
    map.set(key, existing ? { ...existing, ...fund, id: existing.id } : fund)
  })
  return Array.from(map.values())
}

function readStoredClient(): ClientRecord | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CLIENT_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export default function InsurancePage() {
  const hydrated = useWorkspaceStore(state => state.hydrated)
  const hydrate = useWorkspaceStore(state => state.hydrate)
  const storeClient = useWorkspaceStore(state => state.client)
  const storePolicies = useWorkspaceStore(state => state.insurancePolicies)
  const selectedInsurancePolicyIds = useWorkspaceStore(state => state.selectedInsurancePolicyIds)
  const setStorePolicies = useWorkspaceStore(state => state.setInsurancePolicies)
  const setSelectedInsurancePolicyIds = useWorkspaceStore(state => state.setSelectedInsurancePolicyIds)
  const trackingRisks = useWorkspaceStore(state => state.trackingRisks)
  const setTrackingRisks = useWorkspaceStore(state => state.setTrackingRisks)
  const [mounted, setMounted] = useState(false)
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [activePolicy, setActivePolicy] = useState<InsurancePolicy | null>(null)
  const [status, setStatus] = useState('מוכן לייבוא הר הביטוח')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    setMounted(true)
    try {
      const legacy = JSON.parse(localStorage.getItem(INSURANCE_KEY) || '[]')
      const next = storePolicies.length ? storePolicies : Array.isArray(legacy) ? legacy : []
      setPolicies(next)
      if (!storePolicies.length && next.length) setStorePolicies(next)
    } catch {
      setPolicies(storePolicies)
    }
  }, [setStorePolicies, storePolicies])

  const activePolicies = useMemo(
    () => policies.filter(policy => clean(policy.status).includes('פעיל') && !clean(policy.status).includes('לא')).length,
    [policies],
  )
  const totalPremium = useMemo(
    () => policies.reduce((sum, policy) => sum + Number(policy.premium || 0), 0),
    [policies],
  )

  function persist(next: InsurancePolicy[]) {
    setPolicies(next)
    setStorePolicies(next)
    localStorage.setItem(INSURANCE_KEY, JSON.stringify(next))
  }

  async function handleImport(files: FileList | null) {
    if (!files?.length) return
    setStatus(`מייבא ${files.length} קבצים...`)
    try {
      const currentClient = storeClient || readStoredClient()
      const imported = await importWorkspaceFiles(files, currentClient)
      const nextPolicies = mergePolicies(policies, imported.insurancePolicies)
      persist(nextPolicies)
      if (imported.funds.length) {
        const existingFunds = JSON.parse(localStorage.getItem(FUNDS_KEY) || '[]')
        localStorage.setItem(FUNDS_KEY, JSON.stringify(mergeFunds(existingFunds, imported.funds)))
      }
      if (imported.client) localStorage.setItem(CLIENT_KEY, JSON.stringify(imported.client))
      setStatus(imported.messages.join(' | ') || 'הייבוא הסתיים')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ייבוא הר הביטוח נכשל')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function togglePolicySelection(policyId: string, checked?: boolean) {
    const exists = selectedInsurancePolicyIds.includes(policyId)
    const shouldSelect = checked ?? !exists
    const next = shouldSelect
      ? Array.from(new Set([...selectedInsurancePolicyIds, policyId]))
      : selectedInsurancePolicyIds.filter(id => id !== policyId)
    setSelectedInsurancePolicyIds(next)
  }

  function savePolicyRecommendation(policy: InsurancePolicy, recommendation: TrackingRisk) {
    const next = [
      recommendation,
      ...trackingRisks.filter(item => item.id !== recommendation.id && item.policyId !== policy.id),
    ]
    setTrackingRisks(next)
    togglePolicySelection(policy.id, true)
    setActivePolicy(null)
  }

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>פוליסות ביטוח</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input ref={inputRef} hidden multiple type="file" accept=".xlsx,.xls,.xlsm,.zip,.xml" onChange={event => void handleImport(event.target.files)} />
          <button type="button" onClick={() => inputRef.current?.click()} style={primaryButtonStyle}>ייבוא קבצים</button>
          <button type="button" onClick={() => persist([])} style={secondaryButtonStyle}>ניקוי פוליסות</button>
        </div>
      </header>

      <section style={kpiGridStyle}>
        <Kpi label="מספר פוליסות" value={mounted ? String(policies.length) : '0'} />
        <Kpi label="פוליסות פעילות" value={mounted ? String(activePolicies) : '0'} />
        <Kpi label="פרמיה חודשית" value={mounted ? money(totalPremium) : money(0)} />
        <Kpi label="נבחרו לסיכום" value={mounted ? String(selectedInsurancePolicyIds.length) : '0'} />
      </section>

      <section style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}></th>
              <th style={thStyle}>חברה</th>
              <th style={thStyle}>ענף ראשי</th>
              <th style={thStyle}>ענף משני / מוצר</th>
              <th style={thStyle}>שם תוכנית</th>
              <th style={thStyle}>מספר פוליסה</th>
              <th style={thStyle}>פרמיה</th>
              <th style={thStyle}>סכום כיסוי</th>
              <th style={thStyle}>סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy, index) => (
              <tr key={policy.id} onClick={() => setActivePolicy(policy)} style={{ background: index % 2 ? '#F8FAFC' : '#fff', cursor: 'pointer' }}>
                <td style={tdStyle} onClick={event => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedInsurancePolicyIds.includes(policy.id)}
                    onChange={event => togglePolicySelection(policy.id, event.target.checked)}
                    style={checkboxStyle}
                  />
                </td>
                <td style={tdStrongStyle}><ManufacturerLogo name={company(policy)} compact /></td>
                <td style={tdStyle}>{policy.mainBranch || policyType(policy)}</td>
                <td style={tdStyle}>{policy.secondaryBranch || policy.productType || '-'}</td>
                <td style={tdStyle}>{policyName(policy)}</td>
                <td style={{ ...tdStyle, fontWeight: 800, color: 'var(--abd-primary)' }}>{policy.policyNumber || 'אין נתון'}</td>
                <td style={tdStyle}>{policy.premiumText || money(policy.premium)}</td>
                <td style={tdStyle}>{policy.coverageAmountText || money(policy.coverageAmount)}</td>
                <td style={tdStyle}>{policy.status || 'לא ידוע'}</td>
              </tr>
            ))}
            {!policies.length && (
              <tr>
                <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>אין פוליסות להצגה.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {activePolicy && (
        <PolicyModal
          policy={activePolicy}
          existingRecommendation={trackingRisks.find(item => item.policyId === activePolicy.id)}
          onClose={() => setActivePolicy(null)}
          onSave={recommendation => savePolicyRecommendation(activePolicy, recommendation)}
        />
      )}
    </main>
  )
}

function PolicyModal({
  policy,
  existingRecommendation,
  onClose,
  onSave,
}: {
  policy: InsurancePolicy
  existingRecommendation?: TrackingRisk
  onClose: () => void
  onSave: (recommendation: TrackingRisk) => void
}) {
  const initialTemplate = recommendationTemplates.find(template => template.label === existingRecommendation?.actionType) || recommendationTemplates[0]
  const [templateId, setTemplateId] = useState(initialTemplate.id)
  const [notes, setNotes] = useState(existingRecommendation?.notes || initialTemplate.text)
  const [severity, setSeverity] = useState(existingRecommendation?.severity || 'בדיקה רגילה')
  const selectedTemplate = recommendationTemplates.find(template => template.id === templateId) || recommendationTemplates[0]

  function selectTemplate(id: string) {
    const template = recommendationTemplates.find(item => item.id === id) || recommendationTemplates[0]
    setTemplateId(id)
    setNotes(template.text)
  }

  function save() {
    onSave({
      id: existingRecommendation?.id || `risk-${Date.now()}`,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      manufacturer: company(policy),
      productType: policyType(policy),
      actionType: selectedTemplate.label,
      title: `${selectedTemplate.label}: ${company(policy)} ${policy.policyNumber || ''}`.trim(),
      severity,
      notes,
      status: 'פתוח',
      premium: policy.premium,
      coverageAmount: policy.coverageAmount,
    })
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <section style={modalStyle} onClick={event => event.stopPropagation()}>
        <button type="button" aria-label="סגירה" onClick={onClose} style={modalCloseStyle}>×</button>
        <header style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{company(policy)}</h2>
        </header>

        <div style={modalGridStyle}>
          <ModalCell label="ענף ראשי" value={policy.mainBranch || '-'} />
          <ModalCell label="ענף משני" value={policy.secondaryBranch || '-'} />
          <ModalCell label="שם תוכנית" value={policyName(policy)} strong />
          <ModalCell label="מספר פוליסה" value={policy.policyNumber || '-'} strong />
          <ModalCell label="תקופה" value={policy.periodText || [policy.startDate, policy.endDate].filter(Boolean).join(' - ') || '-'} />
          <ModalCell label="פרמיה" value={policy.premiumText || money(policy.premium)} strong />
          <ModalCell label="סכום ביטוח" value={policy.coverageAmountText || money(policy.coverageAmount)} strong />
          <ModalCell label="סטטוס" value={policy.status || 'לא ידוע'} />
          <ModalCell label="מקור" value={policy.sourceLabel || policy.source || 'הר הביטוח'} />
        </div>

        <section style={recommendationPanelStyle}>
          <h3 style={sectionTitleStyle}>המלצה / טיפול בפוליסה</h3>
          <div style={recommendationButtonsStyle}>
            {recommendationTemplates.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => selectTemplate(template.id)}
                style={recommendationButtonStyle(template.id === templateId, template.color)}
              >
                {template.label}
              </button>
            ))}
          </div>
          <label style={fieldStyle}>
            רמת דחיפות
            <select value={severity} onChange={event => setSeverity(event.target.value)} style={inputStyle}>
              <option>בדיקה רגילה</option>
              <option>דחוף</option>
              <option>מעקב</option>
              <option>הושלם</option>
            </select>
          </label>
          <label style={fieldStyle}>
            נוסח המלצה
            <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          <button type="button" onClick={save} style={primaryButtonStyle}>שמור המלצה וסנכרן לסיכום</button>
        </section>
      </section>
    </div>
  )
}

function ModalCell({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div style={modalCellStyle}>
      <span style={{ color: '#7EA0C9', fontWeight: 900 }}>{label}</span>
      <strong style={{ fontWeight: strong ? 900 : 700 }}>{value}</strong>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div style={kpiStyle}><span style={{ color: '#7EA0C9', fontWeight: 800 }}>{label}</span><strong style={{ color: 'var(--abd-primary)', fontSize: 26 }}>{value}</strong></div>
}

const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 32, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', marginTop: 6 }
const primaryButtonStyle: React.CSSProperties = { border: 0, borderRadius: 12, padding: '11px 18px', background: 'var(--abd-accent)', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-main)', cursor: 'pointer' }
const secondaryButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: '#fff', color: 'var(--abd-primary)', border: '1px solid #CFE6FA' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 22 }
const kpiStyle: React.CSSProperties = { display: 'grid', gap: 8, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 18, boxShadow: 'var(--shadow-card)' }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, boxShadow: 'var(--shadow-card)', overflow: 'auto' }
const thStyle: React.CSSProperties = { textAlign: 'right', padding: 13, background: 'var(--abd-primary)', color: '#fff', fontWeight: 900, whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: 13, borderBottom: '1px solid #E6EEF7', color: 'var(--text-body)', whiteSpace: 'nowrap' }
const tdStrongStyle: React.CSSProperties = { ...tdStyle, color: 'var(--abd-primary)', fontWeight: 900 }
const checkboxStyle: React.CSSProperties = { width: 16, height: 16, accentColor: 'var(--abd-accent)', cursor: 'pointer' }
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'rgba(191,219,254,0.55)', backdropFilter: 'blur(2px)', padding: 24 }
const modalStyle: React.CSSProperties = { position: 'relative', width: 'min(820px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', border: '1px solid #D7EAFB', borderRadius: 24, padding: 24, boxShadow: '0 24px 70px rgba(15,25,41,0.18)' }
const modalCloseStyle: React.CSSProperties = { position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: 14, border: '1px solid #CFE6FA', background: '#fff', color: 'var(--abd-primary)', fontSize: 24, cursor: 'pointer' }
const modalHeaderStyle: React.CSSProperties = { textAlign: 'center', marginBottom: 18 }
const modalTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 26, fontWeight: 900 }
const modalGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', border: '1px solid #D7EAFB', borderRadius: 16, overflow: 'hidden' }
const modalCellStyle: React.CSSProperties = { minHeight: 82, display: 'grid', gap: 6, alignContent: 'center', justifyItems: 'center', padding: 12, borderLeft: '1px solid #E6EEF7', borderBottom: '1px solid #E6EEF7', textAlign: 'center', color: 'var(--abd-primary)' }
const recommendationPanelStyle: React.CSSProperties = { display: 'grid', gap: 12, border: '1px solid #D7EAFB', borderRadius: 16, padding: 16, marginTop: 14, background: '#F8FBFF' }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 21, fontWeight: 900 }
const recommendationButtonsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }
const recommendationButtonStyle = (active: boolean, color = 'var(--abd-accent)'): React.CSSProperties => ({
  minHeight: 48,
  border: `1.5px solid ${color}`,
  borderRadius: 999,
  background: active ? `${color}18` : '#fff',
  color,
  fontFamily: 'var(--font-main)',
  fontSize: 15,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: active ? `0 8px 20px ${color}22` : 'none',
  transition: 'background .15s ease, box-shadow .15s ease, transform .15s ease',
})
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 7, color: 'var(--abd-primary)', fontWeight: 900 }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 42, border: '1px solid #CFE6FA', borderRadius: 12, padding: '9px 12px', background: '#fff', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)' }

