'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { buildInfrastructureRows, getInfrastructureTotals } from '@/lib/infrastructure'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import type { Fund } from '@/types/fund'
import { DEFAULT_RATIONALE, formatRecommendationLine, isAutoRationale, recommendationKind } from '@/lib/recommendation-text'
import type { InsurancePolicy } from '@/types/insurance'
import type {
  MeetingFact,
  MeetingFollowUp,
  MeetingRecommendation,
  MeetingScreenshot,
  MeetingSummaryData,
  NeedsAssessmentData,
} from '@/types/summary'

type AdviceType = 'pension' | 'retirement'

const MONTHS_HE = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
]

const USER_SETTINGS_KEY = 'abd_user_settings'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function num(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value: unknown) {
  return num(value).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  })
}

function moneyOrDash(value: unknown) {
  return num(value) > 0 ? money(value) : '-'
}

function clean(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function compactLines(lines: Array<string | false | null | undefined>) {
  return lines.filter(line => typeof line === 'string' && line.trim()).join('\n')
}

function clientName(client: ReturnType<typeof useWorkspaceStore.getState>['client']) {
  if (!client) return 'לקוח'
  return client.fullName || [client.firstName, client.lastName].filter(Boolean).join(' ') || 'לקוח'
}

function defaultTitle(type: AdviceType) {
  return type === 'retirement'
    ? 'הנדון: תכנון פרישה - מסמך מרכז'
    : 'הנדון: תכנון פנסיוני - מסמך מרכז'
}

function defaultIntro(type: AdviceType) {
  return type === 'retirement'
    ? 'מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת ניהול מיטבי של עתידך הפנסיוני.'
    : 'מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת קבלת החלטות מושכלת וניהול מיטבי של החיסכון הפנסיוני.'
}

function defaultSummary(client: ReturnType<typeof useWorkspaceStore.getState>['client']): MeetingSummaryData {
  const adviceType: AdviceType = 'retirement'
  return {
    documentDate: todayIso(),
    adviceType,
    brandName: 'ABD Finance',
    documentTitle: defaultTitle(adviceType),
    clientLine: `עבור ${clientName(client)}${client?.idNumber ? ` ת.ז ${client.idNumber}` : ''}`,
    introText: defaultIntro(adviceType),
    showFundsSummaryTable: true,
    showNeedsSection: true,
    showFactsTable: true,
    showPensionSnapshotTable: true,
    showInfrastructureTable: true,
    showMigrationTable: true,
    facts: [],
    hiddenAutoFacts: [],
    recommendations: [],
    hiddenAutoRecommendations: [],
    manualFollowUps: [],
    hiddenAutoFollowUps: [],
    screenshots: [],
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateStr
  return `${date.getDate()} ב${MONTHS_HE[date.getMonth()]} ${date.getFullYear()}`
}

function getNeedsTotals(needs: NeedsAssessmentData) {
  const income = [
    'incomeWorkPrimary',
    'incomeWorkSpouse',
    'incomeBituachPrimary',
    'incomeBituachSpouse',
    'incomePensionPrimary',
    'incomePensionSpouse',
    'incomeRentPrimary',
    'incomeRentSpouse',
    'incomeOtherPrimary',
    'incomeOtherSpouse',
  ].reduce((sum, key) => sum + num(needs[key]), 0)
  const expenses = num(needs.fixedExpenses) + num(needs.variableExpenses)
  const assets = [
    'assetBank',
    'assetPortfolio',
    'assetPolicies',
    'assetProvident',
    'assetStudyFunds',
    'assetInheritance',
    'assetRealEstate',
    'assetOther',
  ].reduce((sum, key) => sum + num(needs[key]), 0)
  return { income, expenses, assets, balance: income - expenses }
}

function buildNeedsRows(needs: NeedsAssessmentData) {
  const incomeRows = [
    ['שכר עבודה', 'incomeWorkPrimary', 'incomeWorkSpouse'],
    ['קצבת זקנה ביטוח לאומי', 'incomeBituachPrimary', 'incomeBituachSpouse'],
    ['פנסיה עתידית', 'incomePensionPrimary', 'incomePensionSpouse'],
    ['שכר דירה', 'incomeRentPrimary', 'incomeRentSpouse'],
    ['אחר', 'incomeOtherPrimary', 'incomeOtherSpouse'],
  ].map(([label, primaryKey, spouseKey]) => ({
    label,
    primary: num(needs[primaryKey]),
    spouse: num(needs[spouseKey]),
  })).filter(row => row.primary > 0 || row.spouse > 0)

  const expenseRows = [
    { label: 'הוצאות קבועות', amount: num(needs.fixedExpenses), note: clean(needs.fixedNotes) },
    { label: 'הוצאות משתנות', amount: num(needs.variableExpenses), note: clean(needs.variableNotes) },
  ].filter(row => row.amount > 0 || row.note)

  const assetRows = [
    ['בנק', 'assetBank'],
    ['תיק השקעות', 'assetPortfolio'],
    ['פוליסות חיסכון', 'assetPolicies'],
    ['קופות גמל', 'assetProvident'],
    ['קרנות השתלמות', 'assetStudyFunds'],
    ['ירושה עתידית', 'assetInheritance'],
    ['נדל"ן', 'assetRealEstate'],
    ['אחר', 'assetOther'],
  ].map(([label, key]) => ({ label, amount: num(needs[key]) })).filter(row => row.amount > 0)

  return { incomeRows, expenseRows, assetRows, totals: getNeedsTotals(needs) }
}

function recommendedMonthlyDeposit(needs: NeedsAssessmentData, trackingDeals: Record<string, unknown>[]) {
  const legacyIndependentDeposit = num(needs.independentMonthlyDeposit)
  const dealsDeposit = trackingDeals.reduce((sum, deal) => {
    const salary = num(deal.salary)
    const rates = num(deal.employeeRate) + num(deal.employerRate) + num(deal.compensationRate)
    if (salary > 0 && rates > 0) return sum + (salary * rates / 100)
    return sum
  }, 0)
  return legacyIndependentDeposit + dealsDeposit
}

function cashflowRows(needs: NeedsAssessmentData, trackingDeals: Record<string, unknown>[]) {
  const totals = getNeedsTotals(needs)
  const deposit = recommendedMonthlyDeposit(needs, trackingDeals)
  return {
    before: totals.balance,
    deposit,
    after: totals.balance - deposit,
  }
}

function guaranteeLabel(track?: string) {
  switch (track) {
    case 'g60':
      return 'הבטחת 60 תשלומים'
    case 'g120':
      return 'הבטחת 120 תשלומים'
    case 'g240':
      return 'הבטחת 240 תשלומים'
    case 'spouse60':
      return '60% לבן/בת זוג'
    case 'spouse100':
      return '100% לבן/בת זוג'
    default:
      return 'ללא הבטחה'
  }
}

function fundCapital(fund: Fund) {
  return num(fund.retirementCapital) || num(fund.currentBalance)
}

function migrationDetails(fund: Fund) {
  if (fund.recommendationTemplateId !== 'move_new_product' || !fund.migrationPlan) return ''
  const plan = fund.migrationPlan
  const parts = [
    plan.targetProduct ? `מוצר יעד: ${plan.targetProduct}` : '',
    plan.targetCompany ? `יצרן יעד: ${plan.targetCompany}` : '',
    plan.investmentTrack || plan.targetTrack ? `מסלול: ${plan.investmentTrack || plan.targetTrack}` : '',
    plan.targetTrackNumber ? `מספר מסלול: ${plan.targetTrackNumber}` : '',
    plan.managementFeeBalance ? `דמי ניהול מצבירה: ${plan.managementFeeBalance}%` : '',
    plan.managementFeeDeposit ? `דמי ניהול מהפקדה: ${plan.managementFeeDeposit}%` : '',
    plan.reason ? `סיבת ההמלצה: ${plan.reason}` : '',
    plan.professionalNotes ? `הערות מקצועיות: ${plan.professionalNotes}` : '',
  ].filter(Boolean)
  return parts.length ? `פרטי הניוד: ${parts.join(' | ')}.` : ''
}

function buildAutoFacts(params: {
  client: ReturnType<typeof useWorkspaceStore.getState>['client']
  funds: Fund[]
  insurancePolicies: InsurancePolicy[]
  selectedInsurancePolicyIds: string[]
  infrastructureSelectedIds: string[]
  needsAssessment: NeedsAssessmentData
  activeTrack: string
}) {
  const selectedFunds = params.funds.filter(fund => params.infrastructureSelectedIds.includes(fund.id) || fund.genderScore === 'משוך קצבה')
  const capital = selectedFunds.reduce((sum, fund) => sum + fundCapital(fund), 0)
  const importedPension = selectedFunds.reduce((sum, fund) => sum + num(fund.importedPension), 0)
  const needsTotals = getNeedsTotals(params.needsAssessment)
  return [
    { id: 'auto-client-name', isAuto: true, label: 'שם הלקוח', value: clientName(params.client) },
    { id: 'auto-client-id', isAuto: true, label: 'תעודת זהות', value: params.client?.idNumber || 'לא עודכן' },
    { id: 'auto-funds-count', isAuto: true, label: 'מספר קופות בדוח', value: String(params.funds.length) },
    { id: 'auto-insurance-count', isAuto: true, label: 'מספר פוליסות ביטוח', value: String(params.insurancePolicies.length) },
    { id: 'auto-selected-insurance-count', isAuto: true, label: 'פוליסות שנבחרו לסיכום', value: String(params.selectedInsurancePolicyIds.length) },
    { id: 'auto-pension-target-count', isAuto: true, label: 'קופות שסומנו לחישוב קצבה', value: String(selectedFunds.length) },
    { id: 'auto-pension-capital', isAuto: true, label: 'הון לקצבה', value: moneyOrDash(capital) },
    { id: 'auto-estimated-pension', isAuto: true, label: 'קצבה משוערת', value: moneyOrDash(importedPension || capital / 140) },
    { id: 'auto-guarantee-track', isAuto: true, label: 'מסלול הבטחה גלובלי', value: guaranteeLabel(params.activeTrack) },
    { id: 'auto-needs-balance', isAuto: true, label: 'מאזן חודשי מבירור צרכים', value: money(needsTotals.balance) },
  ] satisfies MeetingFact[]
}

function buildAutoRecommendations(funds: Fund[], trackingDeals: Record<string, unknown>[], trackingRisks: Record<string, unknown>[]) {
  // A fund whose recommendation was created via FundModal's "add recommendation" flow gets
  // BOTH a trackingDeals entry (below, fromDeals) AND fund.recommendation mirrored onto the
  // fund itself (FundsWorkspace.tsx addRecommendation/updateRecommendation) — that fund.recommendation
  // is only the RAW SOURCE for genuinely imported recommendations (clearing-house "המלצה" column,
  // never turned into a trackingDeals entry). Skip funds already covered by a deal so the same
  // recommendation doesn't produce two summary lines.
  const fundIdsWithDeals = new Set(trackingDeals.map(deal => deal.fromFundId).filter(Boolean))
  const fromFunds = funds
    .filter(fund => !fundIdsWithDeals.has(fund.id))
    .filter(fund => clean(fund.recommendation) || migrationDetails(fund))
    .map(fund => ({
      id: `auto-fund-${fund.id}`,
      sourceFundId: fund.id,
      text: compactLines([
        `${fund.manufacturer || 'קופה'} ${fund.accountNumber || ''}: ${clean(fund.recommendation) || 'המלצת ניוד / טיפול בקופה'}`,
        migrationDetails(fund),
      ]),
      isAuto: true,
    }))

  // One concise line per recommendation, built from the structured deal +
  // its source fund (see lib/recommendation-text) — never a concatenation of
  // every field plus a boilerplate reason.
  const fundById = new Map(funds.map(fund => [fund.id, fund]))
  const fromDeals = trackingDeals.map(action => {
    const source = fundById.get(String(action.fromFundId || ''))
    return {
      id: `action-${action.id}`,
      text: formatRecommendationLine({
        actionType: String(action.actionType || ''),
        sourceProductType: source?.productType,
        sourceManufacturer: source?.manufacturer,
        sourceAccountNumber: source?.accountNumber,
        targetProductType: String(action.productType || ''),
        targetManufacturer: String(action.manufacturer || ''),
        track: String(action.track || ''),
        feeDeposit: action.managementFeeDeposit as string | undefined,
        feeBalance: action.managementFeeBalance as string | undefined,
        amount: action.amount as number | undefined,
        reason: String(action.reason || action.notes || ''),
      }),
      isAuto: true,
    }
  })

  const fromRisks = trackingRisks.map(action => ({
    id: `risk-${action.id}`,
    text: `המלצה ברובד הביטוח: ${clean(action.title || action.actionType || 'טיפול')} ${clean(action.notes)}`.trim(),
    isAuto: true,
  }))

  return [...fromFunds, ...fromDeals, ...fromRisks] satisfies MeetingRecommendation[]
}

function mergeFacts(summary: MeetingSummaryData, autoFacts: MeetingFact[]) {
  const hidden = new Set(summary.hiddenAutoFacts || [])
  const manual = (summary.facts || []).filter(fact => !fact.isAuto)
  return [...autoFacts.filter(fact => !hidden.has(fact.id)), ...manual]
}

function mergeRecommendations(summary: MeetingSummaryData, auto: MeetingRecommendation[]) {
  const hidden = new Set(summary.hiddenAutoRecommendations || [])
  const manual = (summary.recommendations || []).filter(item => !item.isAuto)
  return [...auto.filter(item => !hidden.has(item.id)), ...manual]
}

function loadUserSettings() {
  try {
    return JSON.parse(localStorage.getItem(USER_SETTINGS_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

export default function MeetingSummaryPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hydrated = useWorkspaceStore(state => state.hydrated)
  const hydrate = useWorkspaceStore(state => state.hydrate)
  const client = useWorkspaceStore(state => state.client)
  const funds = useWorkspaceStore(state => state.funds)
  const insurancePolicies = useWorkspaceStore(state => state.insurancePolicies)
  const selectedInsurancePolicyIds = useWorkspaceStore(state => state.selectedInsurancePolicyIds)
  const infrastructureSelectedIds = useWorkspaceStore(state => state.infrastructureSelectedIds)
  const needsAssessment = useWorkspaceStore(state => state.needsAssessment)
  const trackingDeals = useWorkspaceStore(state => state.trackingDeals)
  const trackingRisks = useWorkspaceStore(state => state.trackingRisks)
  const activeTrack = useWorkspaceStore(state => state.calc.activeTrack)
  const summaryFromStore = useWorkspaceStore(state => state.meetingSummary)
  const setMeetingSummary = useWorkspaceStore(state => state.setMeetingSummary)
  const [summary, setSummary] = useState<MeetingSummaryData>(() => defaultSummary(null))
  const [aiBusy, setAiBusy] = useState(false)
  const [aiStatus, setAiStatus] = useState('')

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    if (!hydrated) return
    setSummary({ ...defaultSummary(client), ...summaryFromStore })
  }, [client, hydrated, summaryFromStore])

  useEffect(() => {
    if (!hydrated) return
    const facts = buildAutoFacts({
      client,
      funds,
      insurancePolicies,
      selectedInsurancePolicyIds,
      infrastructureSelectedIds,
      needsAssessment,
      activeTrack,
    })
    const recommendations = buildAutoRecommendations(funds, trackingDeals, trackingRisks)
    setSummary(current => {
      const next = {
        ...current,
        facts: mergeFacts(current, facts),
        recommendations: mergeRecommendations(current, recommendations),
      }
      queueMicrotask(() => setMeetingSummary(next))
      return next
    })
  }, [activeTrack, client, funds, hydrated, infrastructureSelectedIds, insurancePolicies, needsAssessment, selectedInsurancePolicyIds, setMeetingSummary, trackingDeals, trackingRisks])

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const imageItem = Array.from(event.clipboardData?.items || []).find(item => item.type.startsWith('image/'))
      const file = imageItem?.getAsFile()
      if (file) void addScreenshotFile(file)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  })

  const adviceType = summary.adviceType || 'retirement'
  const infrastructureRows = useMemo(() => buildInfrastructureRows(funds, infrastructureSelectedIds), [funds, infrastructureSelectedIds])
  const infrastructureTotals = useMemo(() => getInfrastructureTotals(infrastructureRows), [infrastructureRows])
  const selectedInsurancePolicies = useMemo(
    () => insurancePolicies.filter(policy => selectedInsurancePolicyIds.includes(policy.id)),
    [insurancePolicies, selectedInsurancePolicyIds],
  )
  const needsRows = useMemo(() => buildNeedsRows(needsAssessment), [needsAssessment])
  const recommendationCashflow = useMemo(() => cashflowRows(needsAssessment, trackingDeals), [needsAssessment, trackingDeals])
  const followUps = useMemo(() => {
    const auto: MeetingFollowUp[] = [
      trackingDeals.length ? { id: 'auto-deals', text: 'להמשיך טיפול בביצוע הניודים והפעולות שנרשמו בטבלת המעקב.', isAuto: true } : null,
      trackingRisks.length ? { id: 'auto-risks', text: 'להשלים טיפול בסיכונים ובפוליסות שסומנו להמשך בדיקה.', isAuto: true } : null,
      summary.showInfrastructureTable !== false ? { id: 'auto-infra', text: 'לבצע בדיקת תשתיות לקצבה מול אישורי המס והנתונים המעודכנים.', isAuto: true } : null,
    ].filter(Boolean) as MeetingFollowUp[]
    const hidden = new Set(summary.hiddenAutoFollowUps || [])
    return [...auto.filter(item => !hidden.has(item.text)), ...(summary.manualFollowUps || [])]
  }, [summary.hiddenAutoFollowUps, summary.manualFollowUps, summary.showInfrastructureTable, trackingDeals.length, trackingRisks.length])
  const settings = useMemo(() => hydrated ? loadUserSettings() : {}, [hydrated])

  function persist(next: MeetingSummaryData) {
    setSummary(next)
    setMeetingSummary(next)
  }

  function updateSummary(patch: Partial<MeetingSummaryData>) {
    persist({ ...summary, ...patch })
  }

  function updateInline(field: keyof MeetingSummaryData, value: string) {
    updateSummary({ [field]: value } as Partial<MeetingSummaryData>)
  }

  function changeAdviceType(type: AdviceType) {
    const previousType = summary.adviceType || 'retirement'
    updateSummary({
      adviceType: type,
      documentTitle: !summary.documentTitle || summary.documentTitle === defaultTitle(previousType) ? defaultTitle(type) : summary.documentTitle,
      introText: !summary.introText || summary.introText === defaultIntro(previousType) ? defaultIntro(type) : summary.introText,
    })
  }

  function addFact() {
    updateSummary({ facts: [...(summary.facts || []), { id: `fact-${Date.now()}`, isAuto: false, label: '', value: '' }] })
  }

  function updateFact(id: string, patch: Partial<MeetingFact>) {
    updateSummary({ facts: (summary.facts || []).map(fact => fact.id === id ? { ...fact, ...patch, isAuto: false } : fact) })
  }

  function removeFact(id: string) {
    const fact = (summary.facts || []).find(item => item.id === id)
    if (fact?.isAuto) updateSummary({ hiddenAutoFacts: Array.from(new Set([...(summary.hiddenAutoFacts || []), id])) })
    else updateSummary({ facts: (summary.facts || []).filter(item => item.id !== id) })
  }

  function addRecommendation() {
    updateSummary({
      recommendations: [...(summary.recommendations || []), { id: `rec-${Date.now()}`, text: '', isAuto: false }],
    })
  }

  function updateRecommendation(id: string, text: string) {
    const current = (summary.recommendations || []).find(item => item.id === id)
    if (current && !current.isAuto) {
      updateSummary({ recommendations: (summary.recommendations || []).map(item => item.id === id ? { ...item, text } : item) })
      return
    }
    updateSummary({
      hiddenAutoRecommendations: Array.from(new Set([...(summary.hiddenAutoRecommendations || []), id])),
      recommendations: [...(summary.recommendations || []).filter(item => item.id !== id), { id: `rec-edit-${Date.now()}`, text, isAuto: false }],
    })
  }

  function removeRecommendation(id: string) {
    const item = (summary.recommendations || []).find(entry => entry.id === id)
    if (item?.isAuto) {
      updateSummary({ hiddenAutoRecommendations: Array.from(new Set([...(summary.hiddenAutoRecommendations || []), id])) })
    } else {
      updateSummary({ recommendations: (summary.recommendations || []).filter(entry => entry.id !== id) })
    }
  }

  function addFollowUp() {
    updateSummary({ manualFollowUps: [...(summary.manualFollowUps || []), { id: `follow-${Date.now()}`, text: '', isAuto: false }] })
  }

  function updateFollowUp(id: string, text: string) {
    const isManual = (summary.manualFollowUps || []).some(item => item.id === id)
    if (isManual) {
      updateSummary({ manualFollowUps: (summary.manualFollowUps || []).map(item => item.id === id ? { ...item, text } : item) })
      return
    }
    const source = followUps.find(item => item.id === id)?.text
    updateSummary({
      hiddenAutoFollowUps: source ? Array.from(new Set([...(summary.hiddenAutoFollowUps || []), source])) : summary.hiddenAutoFollowUps,
      manualFollowUps: [...(summary.manualFollowUps || []), { id: `follow-edit-${Date.now()}`, text, isAuto: false }],
    })
  }

  function removeFollowUp(id: string) {
    const source = followUps.find(item => item.id === id)
    if (source?.isAuto) {
      updateSummary({ hiddenAutoFollowUps: Array.from(new Set([...(summary.hiddenAutoFollowUps || []), source.text])) })
      return
    }
    updateSummary({ manualFollowUps: (summary.manualFollowUps || []).filter(item => item.id !== id) })
  }

  async function addScreenshotFile(file: File) {
    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    updateSummary({ screenshots: [...(summary.screenshots || []), { id: `shot-${Date.now()}`, imageData, caption: '' }] })
  }

  function updateScreenshot(id: string, patch: Partial<MeetingScreenshot>) {
    updateSummary({ screenshots: (summary.screenshots || []).map(item => item.id === id ? { ...item, ...patch } : item) })
  }

  function removeScreenshot(id: string) {
    updateSummary({ screenshots: (summary.screenshots || []).filter(item => item.id !== id) })
  }

  function buildPlainTextSummary() {
    const fundsLines = summary.showFundsSummaryTable === false ? [] : funds.map(fund => compactLines([
      `${fund.manufacturer || 'יצרן לא עודכן'} | ${fund.productType || 'סוג מוצר לא עודכן'} | ${fund.accountNumber || 'מספר קופה לא עודכן'}`,
      fund.investmentTrack ? `מסלול: ${fund.investmentTrack}` : '',
      `צבירה: ${moneyOrDash(fund.currentBalance)} | הון לקצבה: ${moneyOrDash(fundCapital(fund))} | קצבה מיובאת: ${moneyOrDash(fund.importedPension)}`,
    ]))
    const recommendations = (summary.recommendations || []).filter(item => clean(item.text))
    return compactLines([
      summary.brandName || settings.companyName || 'ABD Finance',
      summary.documentTitle || defaultTitle(adviceType),
      summary.clientLine || `עבור ${clientName(client)}`,
      `תאריך: ${formatDate(summary.documentDate)}`,
      '',
      `שלום ${clientName(client)},`,
      settings.summaryOpening || summary.introText || defaultIntro(adviceType),
      '',
      fundsLines.length ? '=== תמצית הכספים הפנסיוניים ===' : '',
      ...fundsLines,
      '',
      infrastructureRows.length && summary.showInfrastructureTable !== false ? '=== תשתיות לקצבה ===' : '',
      infrastructureRows.length && summary.showInfrastructureTable !== false ? `סה"כ תשתיות: ${money(infrastructureTotals.total)} | רכיב הוני: ${money(infrastructureTotals.capital)} | רכיב קצבתי: ${money(infrastructureTotals.pension)}` : '',
      '',
      recommendations.length ? '=== המלצות ===' : '',
      ...recommendations.map((item, index) => `${index + 1}. ${clean(item.text)}`),
      '',
      followUps.length ? '=== משימות המשך ===' : '',
      ...followUps.map(item => `- ${clean(item.text)}`),
      '',
      settings.summaryClosing || 'נשמח להמשיך ללוות אותך בקבלת החלטות פיננסיות ופנסיוניות.',
      '',
      settings.emailSignature || `בברכה,\n${settings.advisorName || ''}${settings.companyName || 'ABD Finance'}`.trim(),
    ])
  }

  /**
   * AI draft: sends STRUCTURED portfolio-shaped data only — product types,
   * manufacturers, balances, recommendation texts. No client name, no ID
   * number, no account/policy numbers (privacy by architecture — the model
   * never receives identifying data). Output is a draft the advisor edits.
   */
  async function generateAiDraft() {
    setAiBusy(true)
    setAiStatus('')
    try {
      const lines: string[] = []
      lines.push(`סוג ייעוץ: ${adviceType === 'retirement' ? 'תכנון פרישה' : 'תכנון פנסיוני'}`)
      if (funds.length) {
        lines.push(`קופות (${funds.length}):`)
        for (const fund of funds.slice(0, 20)) {
          lines.push(`- ${fund.productType || 'מוצר'} ב${fund.manufacturer || 'יצרן'}: צבירה ${fund.currentBalance || 0} ₪${fund.investmentTrack ? `, מסלול ${fund.investmentTrack}` : ''}`)
        }
      }
      if (trackingDeals.length) {
        lines.push(`פעולות/ניודים שסוכמו (${trackingDeals.length}):`)
        for (const deal of trackingDeals.slice(0, 15) as Array<Record<string, unknown>>) {
          const source = funds.find(fund => fund.id === deal.fromFundId)
          lines.push(`- ${formatRecommendationLine({ actionType: String(deal.actionType || ''), sourceProductType: source?.productType, sourceManufacturer: source?.manufacturer, sourceAccountNumber: source?.accountNumber, targetProductType: String(deal.productType || ''), targetManufacturer: String(deal.manufacturer || ''), track: String(deal.track || ''), feeDeposit: deal.managementFeeDeposit as string | undefined, feeBalance: deal.managementFeeBalance as string | undefined, amount: deal.amount as number | undefined, reason: String(deal.reason || deal.notes || '') })}`)
        }
      }
      if (trackingRisks.length) {
        lines.push(`פעולות ברובד הביטוח (${trackingRisks.length}):`)
        for (const risk of trackingRisks.slice(0, 10) as Array<Record<string, unknown>>) {
          lines.push(`- ${risk.title || risk.actionType || 'טיפול'}${risk.notes ? `: ${risk.notes}` : ''}`)
        }
      }

      const response = await fetch('/api/ai/meeting-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingData: lines.join('\n') }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string }
        setAiStatus(data.error === 'no-provider-available'
          ? 'אין ספק AI זמין בסביבה זו (בפרודקשן: Workers AI פעיל אוטומטית).'
          : 'יצירת הטיוטה נכשלה — נסה שוב.')
        return
      }
      const result = await response.json() as { draftSummary?: string; suggestedFollowUps?: string[]; provider?: string }
      const patch: Partial<MeetingSummaryData> = {}
      if (result.draftSummary) patch.introText = result.draftSummary
      if (result.suggestedFollowUps?.length) {
        patch.manualFollowUps = [
          ...(summary.manualFollowUps || []),
          ...result.suggestedFollowUps.map((text, index) => ({ id: `ai-follow-${Date.now()}-${index}`, text, isAuto: false })),
        ]
      }
      updateSummary(patch)
      setAiStatus(`טיוטת AI נוצרה (${result.provider}) — עברו על הנוסח וערכו לפי הצורך.`)
    } catch {
      setAiStatus('יצירת הטיוטה נכשלה — בדוק חיבור ונסה שוב.')
    } finally {
      setAiBusy(false)
    }
  }

  async function copySummary() {
    const html = document.querySelector('.summary-paper')?.outerHTML || ''
    await navigator.clipboard.writeText(html || buildPlainTextSummary())
    alert('הסיכום הועתק ללוח')
  }

  function sendEmail() {
    const subject = encodeURIComponent(summary.documentTitle || `סיכום פגישה - ${clientName(client)}`)
    const body = encodeURIComponent(buildPlainTextSummary())
    window.open(`mailto:${client?.email || ''}?subject=${subject}&body=${body}`)
  }

  function printSummary() {
    const previousTitle = document.title
    document.title = clean(summary.documentTitle || 'סיכום פגישה').replace(/[\\/:*?"<>|]/g, '-')
    document.body.classList.add('summary-print-mode')
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('summary-print-mode')
      document.title = previousTitle
    }, { once: true })
    window.print()
  }

  const estimatedPension = infrastructureTotals.importedPension || infrastructureTotals.total / 140
  const screenshots = summary.screenshots || []

  return (
    <div dir="rtl" style={pageStyle}>
      <style>{printCss}</style>
      <div className="no-print">
        <Toolbar
          title="סיכום פגישה"
          subtitle="מסמך חי שמסתנכרן מהקופות, בירור הצרכים, התשתיות, הפוליסות וההמלצות"
          actions={(
            <>
              <Button variant="primary" size="sm" onClick={printSummary}>הדפסה / PDF</Button>
              <Button variant="secondary" size="sm" onClick={sendEmail}>שליחה למייל</Button>
              <Button variant="secondary" size="sm" onClick={copySummary}>העתק</Button>
              <Button variant="secondary" size="sm" disabled={aiBusy} onClick={() => void generateAiDraft()}>{aiBusy ? 'יוצר טיוטה…' : 'טיוטת AI'}</Button>
            </>
          )}
        />
        {aiStatus && <div style={aiStatusStyle}>{aiStatus}</div>}
      </div>

      <section style={layoutStyle}>
        <aside style={editorPanelStyle} className="no-print">
          <h2 style={panelTitleStyle}>הגדרות מסמך</h2>
          <Field label="תאריך">
            <input type="date" value={summary.documentDate || todayIso()} onChange={event => updateSummary({ documentDate: event.target.value })} style={inputStyle} />
          </Field>
          <Field label="סוג ייעוץ">
            <select value={adviceType} onChange={event => changeAdviceType(event.target.value as AdviceType)} style={inputStyle}>
              <option value="retirement">תכנון פרישה</option>
              <option value="pension">תכנון פנסיוני</option>
            </select>
          </Field>
          <p style={inlineEditNoticeStyle}>את הכותרות, הפתיח, העובדות, ההמלצות והמשימות עורכים ישירות על גבי המסמך.</p>

          <h2 style={panelTitleStyle}>מקטעים</h2>
          <Toggle label="תמצית כספים" checked={summary.showFundsSummaryTable !== false} onChange={checked => updateSummary({ showFundsSummaryTable: checked })} />
          <Toggle label="בירור צרכים" checked={summary.showNeedsSection !== false} onChange={checked => updateSummary({ showNeedsSection: checked })} />
          <Toggle label="עובדות מרכזיות" checked={summary.showFactsTable !== false} onChange={checked => updateSummary({ showFactsTable: checked })} />
          {adviceType === 'retirement' && (
            <>
              <Toggle label="תמונת קצבה" checked={summary.showPensionSnapshotTable !== false} onChange={checked => updateSummary({ showPensionSnapshotTable: checked })} />
              <Toggle label="תשתיות לקצבה" checked={summary.showInfrastructureTable !== false} onChange={checked => updateSummary({ showInfrastructureTable: checked })} />
            </>
          )}
          <Toggle label="טבלת ניודים / פעולות" checked={summary.showMigrationTable !== false} onChange={checked => updateSummary({ showMigrationTable: checked })} />

          <EditorBlock title="עובדות" action="הוסף שורה" onAction={addFact} />
          <EditorBlock title="המלצות" action="הוסף המלצה" onAction={addRecommendation} />
          <EditorBlock title="משימות המשך" action="הוסף משימה" onAction={addFollowUp} />
          <EditorBlock title="תמונות" action="הוסף צילום" onAction={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} hidden type="file" accept="image/*" onChange={event => {
              const file = event.target.files?.[0]
              if (file) void addScreenshotFile(file)
              event.currentTarget.value = ''
            }} />
            {screenshots.map(item => (
              <div key={item.id} style={screenshotEditorStyle}>
                <img src={item.imageData} alt="" style={screenshotThumbStyle} />
                <button type="button" onClick={() => removeScreenshot(item.id)} style={miniDangerStyle}>×</button>
              </div>
            ))}
          </EditorBlock>
        </aside>

        <section className="summary-print-root" style={previewWrapStyle}>
          <article className="summary-paper" style={paperStyle}>
            <div className="summary-paper-top" style={paperTopStyle}>
              <span>בס&quot;ד</span>
              <span>{formatDate(summary.documentDate)}</span>
            </div>

            <div className="summary-paper-brand" style={brandStyle}>
              <strong contentEditable suppressContentEditableWarning onBlur={event => updateInline('brandName', event.currentTarget.textContent?.trim() || '')}>
                {summary.brandName || settings.companyName || 'ABD Finance'}
              </strong>
            </div>
            <EditableHeading value={summary.documentTitle || defaultTitle(adviceType)} onBlur={value => updateInline('documentTitle', value)} style={paperH1Style} as="h1" />
            <EditableHeading value={summary.clientLine || `עבור ${clientName(client)}`} onBlur={value => updateInline('clientLine', value)} style={paperH2Style} as="h2" />
            <EditableParagraph value={summary.introText || defaultIntro(adviceType)} onBlur={value => updateInline('introText', value)} />
            <p style={legalDisclaimerStyle}>
              המידע המוצג נועד לסייע בארגון וסיכום מידע בלבד ואינו מהווה ייעוץ פנסיוני, ביטוחי, משפטי, השקעות או מס. האחריות לבדיקת הנתונים וקבלת ההחלטות חלה על המשתמש.
            </p>

            {summary.showFundsSummaryTable !== false && (
              <PaperSection title="תמצית הכספים הפנסיוניים">
                <Table headers={['יצרן', 'סוג מוצר', "מס' פוליסה", 'מסלול השקעה', 'דמ"נ', 'צבירה', 'הון לקצבה', 'קצבה מיובאת']}>
                  {funds.map(fund => (
                    <tr key={fund.id}>
                      <td>{fund.manufacturer || '-'}</td>
                      <td>{fund.productType || '-'}</td>
                      <td>{fund.accountNumber || '-'}</td>
                      <td>{fund.investmentTrack || fund.productName || '-'}</td>
                      <td>{fund.managementFeeText || '-'}</td>
                      <td>{moneyOrDash(fund.currentBalance)}</td>
                      <td>{moneyOrDash(fundCapital(fund))}</td>
                      <td>{moneyOrDash(fund.importedPension)}</td>
                    </tr>
                  ))}
                </Table>
              </PaperSection>
            )}

            {selectedInsurancePolicies.length > 0 && (
              <PaperSection title="פוליסות ביטוח שנבחרו">
                <Table headers={['חברה', 'ענף', 'שם תוכנית', 'פרמיה', 'סכום ביטוח', 'תקופה']}>
                  {selectedInsurancePolicies.map(policy => (
                    <tr key={policy.id}>
                      <td>{policy.manufacturer || policy.company || '-'} {policy.sourceLabel ? `(${policy.sourceLabel})` : ''}</td>
                      <td>{[policy.mainBranch, policy.secondaryBranch].filter(Boolean).join(' / ') || '-'}</td>
                      <td>{policy.planName || policy.policyName || '-'}</td>
                      <td>{policy.premiumText || moneyOrDash(policy.premium)}</td>
                      <td>{policy.coverageAmountText || moneyOrDash(policy.coverageAmount)}</td>
                      <td>{policy.periodText || '-'}</td>
                    </tr>
                  ))}
                </Table>
              </PaperSection>
            )}

            {summary.showNeedsSection !== false && (needsRows.incomeRows.length > 0 || needsRows.expenseRows.length > 0 || needsRows.assetRows.length > 0) && (
              <PaperSection title="בירור צרכים">
                <div style={needsGridStyle}>
                  <NeedsCard title="הכנסות נטו">
                    {needsRows.incomeRows.map(row => <NeedsLine key={row.label} label={row.label} value={`${money(row.primary)} / ${money(row.spouse)}`} />)}
                    <NeedsLine label='סה"כ הכנסות' value={money(needsRows.totals.income)} total />
                  </NeedsCard>
                  <NeedsCard title="הוצאות">
                    {needsRows.expenseRows.map(row => <NeedsLine key={row.label} label={row.label} value={money(row.amount)} note={row.note} />)}
                    <NeedsLine label='סה"כ הוצאות' value={money(needsRows.totals.expenses)} total />
                  </NeedsCard>
                  <NeedsCard title="נכסים קיימים">
                    {needsRows.assetRows.map(row => <NeedsLine key={row.label} label={row.label} value={money(row.amount)} />)}
                    <NeedsLine label='סה"כ נכסים' value={money(needsRows.totals.assets)} total />
                  </NeedsCard>
                </div>
                {(recommendationCashflow.deposit > 0 || recommendationCashflow.before !== 0) && (
                  <div style={cashflowSummaryStyle}>
                    <Fact label="תזרים לפני המלצות" value={money(recommendationCashflow.before)} />
                    <Fact label="הפקדה חודשית לפי ההמלצות" value={money(recommendationCashflow.deposit)} />
                    <Fact label="תזרים לאחר המלצות" value={money(recommendationCashflow.after)} />
                  </div>
                )}
              </PaperSection>
            )}

            {summary.showFactsTable !== false && (
              <PaperSection title="עובדות מרכזיות">
                <Table headers={['שדה', 'ערך', '']}>
                  {(summary.facts || []).map(fact => (
                    <tr key={fact.id}>
                      <td contentEditable suppressContentEditableWarning onBlur={event => updateFact(fact.id, { label: event.currentTarget.textContent?.trim() || '' })}>{fact.label}</td>
                      <td contentEditable suppressContentEditableWarning onBlur={event => updateFact(fact.id, { value: event.currentTarget.textContent?.trim() || '' })}>{fact.value}</td>
                      <td className="no-print"><button type="button" onClick={() => removeFact(fact.id)} style={rowRemoveStyle}>×</button></td>
                    </tr>
                  ))}
                </Table>
              </PaperSection>
            )}

            {adviceType === 'retirement' && summary.showPensionSnapshotTable !== false && (
              <PaperSection title="תמונת קצבה">
                <div style={factsGridStyle}>
                  <Fact label="קצבה משוערת" value={moneyOrDash(estimatedPension)} />
                  <Fact label="מקדם" value={infrastructureTotals.total > 0 && estimatedPension > 0 ? String(Math.round(infrastructureTotals.total / estimatedPension)) : '-'} />
                  <Fact label="הון" value={moneyOrDash(infrastructureTotals.total)} />
                  <Fact label="פער מול דוח" value={money(estimatedPension - infrastructureTotals.importedPension)} />
                </div>
              </PaperSection>
            )}

            {adviceType === 'retirement' && summary.showInfrastructureTable !== false && infrastructureRows.length > 0 && (
              <PaperSection title="תשתיות לקצבה">
                <div style={summaryPillStripStyle}>
                  <span>רכיב הוני: <strong>{money(infrastructureTotals.capital)}</strong></span>
                  <span>רכיב קצבתי: <strong>{money(infrastructureTotals.pension)}</strong></span>
                  <span>סה"כ תשתיות: <strong>{money(infrastructureTotals.total)}</strong></span>
                </div>
                <Table headers={['יצרן', "מס' פוליסה", 'פיצויים למס', 'פיצויים מעסיק הון', 'תגמולי הון עד 2008', 'תגמולי הון מ-2008', 'תגמולים לקצבה עד 2000', 'תגמולים לקצבה אחרי 2000', 'סה"כ']}>
                  {infrastructureRows.map(row => (
                    <tr key={row.id}>
                      <td>{row.manufacturer || '-'}</td>
                      <td>{row.accountNumber || '-'}</td>
                      <td>{money(row.compensationPension)}</td>
                      <td>{money(row.compensationCapital)}</td>
                      <td>{money(row.capitalBefore2008)}</td>
                      <td>{money(row.capitalAfter2008)}</td>
                      <td>{money(row.pensionBefore2000)}</td>
                      <td>{money(row.pensionAfter2000)}</td>
                      <td>{money(row.total)}</td>
                    </tr>
                  ))}
                </Table>
              </PaperSection>
            )}

            {summary.showMigrationTable !== false && (
              <MigrationSection funds={funds} trackingDeals={trackingDeals} trackingRisks={trackingRisks} />
            )}

            {(summary.recommendations || []).length > 0 && (
              <PaperSection title="המלצות">
                <ol style={recommendationListStyle}>
                  {(summary.recommendations || []).map((item, index) => (
                    <li key={item.id} style={index === 0 ? firstRecommendationStyle : undefined}>
                      <span contentEditable suppressContentEditableWarning onBlur={event => updateRecommendation(item.id, event.currentTarget.textContent?.trim() || '')}>
                        {item.text}
                      </span>
                      <button type="button" className="no-print" onClick={() => removeRecommendation(item.id)} style={rowRemoveStyle}>×</button>
                    </li>
                  ))}
                </ol>
              </PaperSection>
            )}

            {followUps.length > 0 && (
              <PaperSection title="משימות המשך">
                <ul style={recommendationListStyle}>
                  {followUps.map(item => (
                    <li key={item.id}>
                      <span contentEditable suppressContentEditableWarning onBlur={event => updateFollowUp(item.id, event.currentTarget.textContent?.trim() || '')}>
                        {item.text}
                      </span>
                      <button type="button" className="no-print" onClick={() => removeFollowUp(item.id)} style={rowRemoveStyle}>×</button>
                    </li>
                  ))}
                </ul>
              </PaperSection>
            )}

            {screenshots.length > 0 && (
              <PaperSection title="צילומי מסך / תמונות">
                <div style={screenshotsGridStyle}>
                  {screenshots.map(item => (
                    <figure key={item.id} style={figureStyle}>
                      <button type="button" className="no-print" onClick={() => removeScreenshot(item.id)} style={imageRemoveStyle}>×</button>
                      <img src={item.imageData} alt="" style={figureImageStyle} />
                      <figcaption contentEditable suppressContentEditableWarning onBlur={event => updateScreenshot(item.id, { caption: event.currentTarget.textContent || '' })}>
                        {item.caption || 'לחץ להוספת כיתוב'}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </PaperSection>
            )}
          </article>
        </section>
      </section>
    </div>
  )
}

function MigrationSection({ funds, trackingDeals, trackingRisks }: { funds: Fund[]; trackingDeals: Record<string, unknown>[]; trackingRisks: Record<string, unknown>[] }) {
  const fundMigrations = funds.filter(fund => fund.recommendationTemplateId === 'move_new_product' && fund.migrationPlan)
  if (!fundMigrations.length && !trackingDeals.length && !trackingRisks.length) return null
  return (
    <PaperSection title="טבלת ניודים / פעולות">
      <Table headers={['קופה קיימת / פעולה', 'מוצר יעד', 'יצרן יעד', 'מסלול', 'מצבירה', 'מהפקדה', 'סיבת ההמלצה']}>
        {/* A migration created in the fund modal exists BOTH as fund.migrationPlan and as a
            trackingDeals entry — show it once, from the deal (which carries fees + rationale). */}
        {fundMigrations.filter(fund => !trackingDeals.some(action => String(action.fromFundId || '') === fund.id)).map(fund => {
          const plan = fund.migrationPlan || {}
          return (
            <tr key={fund.id}>
              <td>{[fund.manufacturer, fund.accountNumber].filter(Boolean).join(' | ') || '-'}</td>
              <td>{plan.targetProduct || '-'}</td>
              <td>{plan.targetCompany || '-'}</td>
              <td>{plan.investmentTrack || plan.targetTrack || '-'}</td>
              <td>{plan.managementFeeBalance ? `${plan.managementFeeBalance}%` : '-'}</td>
              <td>{plan.managementFeeDeposit ? `${plan.managementFeeDeposit}%` : '-'}</td>
              <td>{plan.reason || plan.professionalNotes || '-'}</td>
            </tr>
          )
        })}
        {trackingDeals.map(action => {
          const source = funds.find(fund => fund.id === String(action.fromFundId || ''))
          const sourceLabel = source ? [source.manufacturer, source.accountNumber].filter(Boolean).join(' | ') : ''
          return (
            <tr key={String(action.id)}>
              <td>{String(action.actionType || 'פעולה')}{sourceLabel ? ` — ${sourceLabel}` : ''}</td>
              <td>{String(action.productType || '-')}</td>
              <td>{String(action.manufacturer || '-')}</td>
              <td>{String(action.track || '-')}</td>
              <td>{action.managementFeeBalance ? `${action.managementFeeBalance}%` : '-'}</td>
              <td>{action.managementFeeDeposit ? `${action.managementFeeDeposit}%` : '-'}</td>
              <td>{isAutoRationale(String(action.reason || '')) ? (DEFAULT_RATIONALE[recommendationKind(String(action.actionType || ''))] || '-') : String(action.reason || action.notes || '-')}</td>
            </tr>
          )
        })}
        {trackingRisks.map(action => (
          <tr key={String(action.id)}>
            <td>{String(action.title || 'סיכון')}</td>
            <td colSpan={5}>{String(action.severity || '-')}</td>
            <td>{String(action.notes || '-')}</td>
          </tr>
        ))}
      </Table>
    </PaperSection>
  )
}

function EditableHeading({ value, onBlur, style, as }: { value: string; onBlur: (value: string) => void; style: React.CSSProperties; as: 'h1' | 'h2' }) {
  const Tag = as
  return <Tag className="summary-inline-edit" contentEditable suppressContentEditableWarning onBlur={event => onBlur(event.currentTarget.textContent?.trim() || '')} style={style}>{value}</Tag>
}

function EditableParagraph({ value, onBlur }: { value: string; onBlur: (value: string) => void }) {
  return <p className="summary-inline-edit" contentEditable suppressContentEditableWarning onBlur={event => onBlur(event.currentTarget.textContent?.trim() || '')} style={paperParagraphStyle}>{value}</p>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={fieldStyle}><span>{label}</span>{children}</label>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label style={toggleStyle}><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /> {label}</label>
}

function EditorBlock({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children?: React.ReactNode }) {
  return (
    <section style={editorBlockStyle}>
      <div style={editorBlockHeaderStyle}>
        <h2 style={panelTitleStyle}>{title}</h2>
        <button type="button" onClick={onAction} style={smallButtonStyle}>{action}</button>
      </div>
      {children}
    </section>
  )
}

function PaperSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={paperSectionStyle}>
      <div className="summary-paper-title" style={paperSectionTitleStyle}><h3>{title}</h3></div>
      {children}
    </section>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="summary-preview-table-wrap" style={tableWrapStyle}>
      <table className="summary-preview-table" style={tableStyle}>
        <thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div style={factStyle}><span>{label}</span><strong>{value}</strong></div>
}

function NeedsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={needsCardStyle}><h4>{title}</h4>{children}</div>
}

function NeedsLine({ label, value, note, total }: { label: string; value: string; note?: string; total?: boolean }) {
  return <div style={total ? needsTotalLineStyle : needsLineStyle}><span>{label}{note ? ` - ${note}` : ''}</span><strong>{value}</strong></div>
}

const pageStyle: React.CSSProperties = { fontFamily: 'var(--font-main)', color: 'var(--text-body)' }
const aiStatusStyle: React.CSSProperties = { background: 'var(--bg-surface-sunken)', color: 'var(--text-heading)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: 14, fontWeight: 600, fontSize: 13.5 }
const layoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 20, alignItems: 'start' }
const editorPanelStyle: React.CSSProperties = { position: 'sticky', top: 84, display: 'grid', gap: 10, background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-1)' }
const panelTitleStyle: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 15, fontWeight: 700, margin: '6px 0' }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 6, color: 'var(--abd-primary)', fontWeight: 800 }
const inputStyle: React.CSSProperties = { minHeight: 38, border: '1px solid var(--separator-strong)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontFamily: 'var(--font-main)', color: 'var(--text-heading)', background: 'var(--bg-surface-sunken)' }
const toggleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 34, color: 'var(--abd-primary)', fontWeight: 800 }
const inlineEditNoticeStyle: React.CSSProperties = { color: 'var(--text-muted)', background: 'var(--bg-surface-sunken)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: 12, lineHeight: 1.55, fontSize: 13 }
const editorBlockStyle: React.CSSProperties = { borderTop: '1px solid #E6EEF7', paddingTop: 10 }
const editorBlockHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }
const smallButtonStyle: React.CSSProperties = { border: '1px solid #CFE6FA', borderRadius: 999, background: '#F8FBFF', color: 'var(--abd-primary)', padding: '7px 10px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const miniDangerStyle: React.CSSProperties = { border: '1px solid #F5B5B5', borderRadius: 10, background: '#FFF5F5', color: '#B42318', width: 34, minHeight: 34, fontWeight: 900, cursor: 'pointer' }
const hintStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 13 }
const screenshotEditorStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '56px auto', gap: 8, alignItems: 'center', marginTop: 8 }
const screenshotThumbStyle: React.CSSProperties = { width: 56, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #D7EAFB' }
const previewWrapStyle: React.CSSProperties = { overflow: 'auto' }
const paperStyle: React.CSSProperties = { width: 'min(100%, 920px)', margin: '0 auto 32px', padding: '36px 40px 44px', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', color: 'var(--text-body)', boxShadow: 'var(--shadow-floating)', border: '1px solid var(--separator)' }
const paperTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 16 }
const brandStyle: React.CSSProperties = { textAlign: 'center', marginBottom: 16, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, letterSpacing: '.02em' }
const paperH1Style: React.CSSProperties = { color: 'var(--text-heading)', textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 8 }
const paperH2Style: React.CSSProperties = { color: 'var(--text-muted)', textAlign: 'center', fontSize: 17, fontWeight: 600, marginBottom: 14 }
const paperParagraphStyle: React.CSSProperties = { color: '#2F3A4C', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 8 }
const legalDisclaimerStyle: React.CSSProperties = { margin: '16px 0', padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', border: '1px solid color-mix(in srgb, var(--warning) 35%, transparent)', color: 'var(--warning-text)', lineHeight: 1.65, fontWeight: 500, fontSize: 12.5 }
const inlineHintStyle: React.CSSProperties = { color: '#7EA0C9', fontSize: 12, textAlign: 'center' }
const paperSectionStyle: React.CSSProperties = { marginTop: 16 }
const paperSectionTitleStyle: React.CSSProperties = { marginBottom: 8, borderBottom: '2px solid rgba(30,63,111,0.14)', paddingBottom: 5, color: '#1E3F6F' }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 }
const needsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }
const cashflowSummaryStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 12 }
const needsCardStyle: React.CSSProperties = { border: '1px solid #E0E8F3', borderRadius: 12, overflow: 'hidden', background: '#FBFDFF' }
const needsLineStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 10px', borderBottom: '1px solid #EEF3FA', color: '#2F3A4C' }
const needsTotalLineStyle: React.CSSProperties = { ...needsLineStyle, fontWeight: 900, color: '#1E3F6F', borderBottom: 0 }
const factsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }
const factStyle: React.CSSProperties = { display: 'grid', gap: 4, border: '1px solid #D7EAFB', borderRadius: 12, padding: 10, background: '#FBFDFF', color: '#1E3F6F' }
const summaryPillStripStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, color: '#1E3F6F' }
const recommendationListStyle: React.CSSProperties = { display: 'grid', gap: 8, paddingInlineStart: 24, color: '#2F3A4C', lineHeight: 1.65 }
const firstRecommendationStyle: React.CSSProperties = { fontWeight: 800, color: '#1E3F6F' }
const rowRemoveStyle: React.CSSProperties = { marginInlineStart: 8, border: '1px solid #F5B5B5', borderRadius: 8, background: '#FFF5F5', color: '#B42318', fontWeight: 900, cursor: 'pointer' }
const screenshotsGridStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const figureStyle: React.CSSProperties = { position: 'relative', margin: 0, border: '1px solid #E0E8F3', borderRadius: 12, overflow: 'hidden' }
const figureImageStyle: React.CSSProperties = { width: '100%', maxHeight: 420, objectFit: 'contain', background: '#F8FBFF' }
const imageRemoveStyle: React.CSSProperties = { ...rowRemoveStyle, position: 'absolute', top: 8, left: 8, zIndex: 1 }

const printCss = `
.summary-paper th,
.summary-paper td {
  border: 1px solid #d6deea;
  padding: 7px 8px;
  text-align: right;
  vertical-align: top;
}
.summary-paper th {
  background: #edf2fa;
  color: #1e3f6f;
}
.summary-paper h4 {
  margin: 0;
  padding: 8px 10px;
  background: #f6ead2;
  color: #7d5d22;
}
.summary-inline-edit,
.summary-paper [contenteditable="true"] {
  outline: none;
  border-radius: 6px;
}
.summary-inline-edit:hover,
.summary-paper [contenteditable="true"]:hover {
  box-shadow: 0 0 0 1px rgba(37,99,235,.25);
  background: rgba(239,246,255,.6);
}
@media print {
  body.summary-print-mode * {
    visibility: hidden !important;
  }
  body.summary-print-mode .summary-print-root,
  body.summary-print-mode .summary-print-root * {
    visibility: visible !important;
  }
  body.summary-print-mode .summary-print-root {
    position: absolute;
    inset: 0;
    overflow: visible !important;
  }
  .no-print {
    display: none !important;
  }
  .summary-paper {
    width: 100% !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    padding: 8mm 7mm !important;
    color: #000 !important;
  }
  .summary-paper * {
    color: #000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: A4;
    margin: 12mm;
  }
}
`

