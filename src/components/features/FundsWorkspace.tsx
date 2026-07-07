'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart2, Briefcase, FileText, Shield, Upload } from 'lucide-react'
import { importWorkspaceFiles, type ClientRecord, type FundRecord } from '@/lib/client-importers'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import {
  findAbdTrackForFund,
  getManufacturersByProductType,
  getTrackDetails,
  getTracksByProductAndManufacturer,
  isAllowedAbdReturnManufacturer,
  normalizeManufacturerName,
  normalizeProductType,
  type AbdTrack,
} from '@/lib/returns-catalog'
import { ManufacturerLogo as SharedManufacturerLogo } from '@/components/shared/ManufacturerLogo'
import { buildInfrastructureRows } from '@/lib/infrastructure'

type SortDirection = 'asc' | 'desc'
type FundActivityView = 'employers' | 'deposits' | 'beneficiaries'

type Recommendation = {
  id: string
  fromFundId?: string
  sourceFundIds?: string[]
  sourcePartIds?: string[]
  sourceParts?: Array<{ key: string; label: string; amount: number }>
  sourceSelectionLabel?: string
  actionType?: string
  productType: string
  manufacturer: string
  track: string
  trackId?: string
  managementFeeBalance?: string
  managementFeeDeposit?: string
  reason: string
  notes?: string
  professionalNotes?: string
  amount: number
  returns?: AbdTrack['returns']
}

type NeedsState = {
  clientFullName: string
  clientIdNumber: string
  clientBirthDate: string
  clientIssueDate: string
  clientPhone: string
  clientEmail: string
  spouseFullName: string
  spouseIdNumber: string
  spouseBirthDate: string
  spouseIssueDate: string
  spousePhone: string
  spouseEmail: string
  incomeWorkPrimary: string
  incomeWorkSpouse: string
  incomeBituachPrimary: string
  incomeBituachSpouse: string
  incomePensionPrimary: string
  incomePensionSpouse: string
  incomeRentPrimary: string
  incomeRentSpouse: string
  incomeOtherPrimary: string
  incomeOtherSpouse: string
  fixedExpenses: string
  fixedNotes: string
  variableExpenses: string
  variableNotes: string
  assetBank: string
  assetPortfolio: string
  assetPolicies: string
  assetProvident: string
  assetStudyFunds: string
  assetInheritance: string
  assetRealEstate: string
  assetOther: string
  independentMonthlyDeposit: string
}

const FUNDS_KEY = 'abd_next_funds'
const INSURANCE_KEY = 'abd_next_insurance'
const CLIENT_KEY = 'abd_next_client'
const NEEDS_KEY = 'abd_next_needs'
const RECOMMENDATIONS_KEY = 'abd_next_recommendations'
const INFRASTRUCTURE_IDS_KEY = 'abd_next_infrastructure_ids'
const FUNDS_COLUMN_ORDER_KEY = 'abd_next_funds_column_order'
const FUNDS_COLUMN_WIDTHS_KEY = 'abd_next_funds_column_widths'

const columns: Array<{ key: keyof FundRecord; label: string; numeric?: boolean; width: number; minWidth: number }> = [
  { key: 'genderScore', label: 'יעד / מיועד לקצבה', width: 138, minWidth: 116 },
  { key: 'manufacturer', label: 'יצרן', width: 150, minWidth: 116 },
  { key: 'productType', label: 'סוג מוצר', width: 132, minWidth: 112 },
  { key: 'accountNumber', label: 'מס׳ פוליסה/חשבון', width: 150, minWidth: 124 },
  { key: 'standing', label: 'מעמד', width: 86, minWidth: 72 },
  { key: 'investmentTrack', label: 'מסלול השקעה', width: 270, minWidth: 180 },
  { key: 'managementFeeText', label: 'דמי ניהול', width: 180, minWidth: 142 },
  { key: 'status', label: 'סטטוס', width: 112, minWidth: 94 },
  { key: 'currentBalance', label: 'צבירה נוכחית', numeric: true, width: 138, minWidth: 118 },
]
const defaultColumnOrder = columns.map(column => String(column.key))

const productTypes = ['קרן פנסיה', 'קרן השתלמות', 'קופת גמל', 'קופת גמל להשקעה', 'ביטוח מנהלים']
const migrationRules: Record<string, string[]> = {
  'קרן פנסיה': ['קרן פנסיה', 'קופת גמל', 'ביטוח מנהלים'],
  'קופת גמל': ['קרן פנסיה', 'קופת גמל', 'ביטוח מנהלים'],
  'קרן השתלמות': ['קרן השתלמות'],
  'קופת גמל להשקעה': ['קופת גמל להשקעה'],
  'פוליסה פיננסית': [],
  'ביטוח מנהלים': ['ביטוח מנהלים', 'קרן פנסיה', 'קופת גמל'],
}
const migrationTargetCompanies: Record<string, string[]> = {
  'קרן פנסיה': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור'],
  'קופת גמל': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור', 'אנליסט', 'ילין לפידות'],
  'קרן השתלמות': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור', 'אנליסט', 'ילין לפידות'],
  'קופת גמל להשקעה': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור', 'אנליסט', 'ילין לפידות'],
  'פוליסה פיננסית': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים'],
  'ביטוח מנהלים': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים'],
}
const recommendationActions = [
  { id: 'new-product', label: 'ניוד למוצר חדש', description: 'בחירת מוצר יעד, יצרן ומסלול השקעה' },
  { id: 'keep', label: 'השארה בקופה', description: 'שמירת המוצר הקיים עם נימוק מקצועי' },
  { id: 'pension', label: 'התחלת קצבה', description: 'ייעוד הקופה לתשתיות ולמשיכת קצבה' },
  { id: 'redeem', label: 'פדיון כספים', description: 'סימון הקופה לבחינת פדיון / משיכה' },
  { id: 'service', label: 'טיפול שוטף', description: 'מינוי סוכן, מעקב או השלמת מסמכים' },
] as const

type RecommendationActionId = typeof recommendationActions[number]['id']
const recommendationTemplateIds: Record<RecommendationActionId, string> = {
  'new-product': 'move_new_product',
  keep: 'keep_existing',
  pension: 'start_pension',
  redeem: 'redeem_funds',
  service: 'ongoing_service',
}

const migrationSourceParts = [
  { key: 'compensationPension', label: 'פיצויים לקצבה' },
  { key: 'compensationCapital', label: 'פיצויים הוניים' },
  { key: 'capitalBefore2008', label: 'תגמולי הון עד 2008' },
  { key: 'capitalAfter2008', label: 'תגמולי הון מ-2008' },
  { key: 'pensionBefore2000', label: 'תגמולים לקצבה עד 2000' },
  { key: 'pensionAfter2000', label: 'תגמולים לקצבה אחרי 2000' },
] as const

type MigrationSourcePartKey = typeof migrationSourceParts[number]['key']

const emptyNeeds: NeedsState = {
  clientFullName: '',
  clientIdNumber: '',
  clientBirthDate: '',
  clientIssueDate: '',
  clientPhone: '',
  clientEmail: '',
  spouseFullName: '',
  spouseIdNumber: '',
  spouseBirthDate: '',
  spouseIssueDate: '',
  spousePhone: '',
  spouseEmail: '',
  incomeWorkPrimary: '',
  incomeWorkSpouse: '',
  incomeBituachPrimary: '',
  incomeBituachSpouse: '',
  incomePensionPrimary: '',
  incomePensionSpouse: '',
  incomeRentPrimary: '',
  incomeRentSpouse: '',
  incomeOtherPrimary: '',
  incomeOtherSpouse: '',
  fixedExpenses: '',
  fixedNotes: '',
  variableExpenses: '',
  variableNotes: '',
  assetBank: '',
  assetPortfolio: '',
  assetPolicies: '',
  assetProvident: '',
  assetStudyFunds: '',
  assetInheritance: '',
  assetRealEstate: '',
  assetOther: '',
  independentMonthlyDeposit: '',
}

function toNumber(value: unknown) {
  const parsed = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function editableNumber(value: unknown, maxFractionDigits = 3) {
  if (value === null || value === undefined || value === '') return ''
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return ''
  return numberValue.toLocaleString('en-US', {
    useGrouping: false,
    maximumFractionDigits: maxFractionDigits,
  })
}

function money(value: unknown) {
  return toNumber(value).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  })
}

function moneyOrEmpty(value: unknown) {
  return Number.isFinite(Number(value)) ? money(value) : 'אין נתון'
}

function percentOrEmpty(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? `${numberValue.toLocaleString('he-IL')}%` : 'אין נתון'
}

function isFundInsuranceCoverageRelevant(fund: FundRecord) {
  const text = [fund.productType, fund.productName, fund.planName].filter(Boolean).join(' ')
  return text.includes('קרן פנסיה') || text.includes('פנסיה') || text.includes('ביטוח מנהלים') || text.includes('מנהלים')
}

function getFundPeriodBreakdown(fund: FundRecord) {
  const rows = fund.periodRows || []
  return rows.reduce(
    (totals, row) => {
      const amount = toNumber(row.amount)
      if (!(amount > 0)) return totals
      const componentCode = String(row.componentCode || '').trim()
      const componentLabel = String(row.componentLabel || '')
      if (componentCode === '1' || componentLabel.includes('פיצויים')) {
        totals.compensation += amount
      } else if (['2', '3', '4'].includes(componentCode) || componentLabel.includes('תגמולים')) {
        totals.pension += amount
      }
      return totals
    },
    { pension: 0, compensation: 0 },
  )
}

function getFundMigrationSourceParts(fund: FundRecord) {
  const infrastructureRow = buildInfrastructureRows([fund])[0]
  if (!infrastructureRow) return []
  return migrationSourceParts
    .map(part => ({
      key: part.key,
      label: part.label,
      amount: Number(infrastructureRow[part.key]) || 0,
    }))
    .filter(part => part.amount > 0)
}

function isActiveStatus(status?: string) {
  const value = String(status || '')
  return value.includes('פעיל') && !value.includes('לא')
}

function averageFee(funds: FundRecord[]) {
  const values = funds
    .flatMap(fund => String(fund.managementFeeText || '').match(/[\d.]+/g) || [])
    .map(Number)
    .filter(Number.isFinite)
  if (!values.length) return 'אין נתון'
  return `${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)}%`
}

function fundMergeKey(fund: FundRecord) {
  return [
    String(fund.accountNumber || '').replace(/\D/g, '').replace(/^0+(?=\d)/, ''),
    normalizeManufacturerName(fund.manufacturer || ''),
  ].filter(Boolean).join('|') || fund.id
}

function mergeFunds(current: FundRecord[], incoming: FundRecord[]) {
  const map = new Map<string, FundRecord>()
  current.forEach(fund => map.set(fundMergeKey(fund), fund))
  incoming.forEach(fund => {
    const key = fundMergeKey(fund)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, fund)
      return
    }
    map.set(key, {
      ...existing,
      ...fund,
      id: existing.id,
      genderScore: existing.genderScore || fund.genderScore,
      recommendation: existing.recommendation || fund.recommendation,
      notes: existing.notes || fund.notes,
    })
  })
  return Array.from(map.values())
}

function policyMergeKey(policy: { id: string; policyNumber?: string; manufacturer?: string; company?: string; planName?: string; policyName?: string; source?: string }) {
  return [
    policy.source || '',
    String(policy.policyNumber || '').replace(/\s+/g, ''),
    normalizeManufacturerName(policy.manufacturer || policy.company || ''),
    policy.planName || policy.policyName || '',
  ].filter(Boolean).join('|') || policy.id
}

function mergePolicies<T extends { id: string; policyNumber?: string; manufacturer?: string; company?: string; planName?: string; policyName?: string; source?: string }>(current: T[], incoming: T[]) {
  const map = new Map<string, T>()
  current.forEach(policy => map.set(policyMergeKey(policy), policy))
  incoming.forEach(policy => {
    const key = policyMergeKey(policy)
    const existing = map.get(key)
    map.set(key, existing ? { ...existing, ...policy, id: existing.id } : policy)
  })
  return Array.from(map.values())
}

function loadArray<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readStoredClient(): ClientRecord | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CLIENT_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function loadColumnOrder() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FUNDS_COLUMN_ORDER_KEY) || '[]')
    if (!Array.isArray(parsed)) return defaultColumnOrder
    const allowed = new Set(defaultColumnOrder)
    const saved = parsed.filter(item => allowed.has(String(item))).map(String)
    const missing = defaultColumnOrder.filter(key => !saved.includes(key))
    return [...saved, ...missing]
  } catch {
    return defaultColumnOrder
  }
}

function loadColumnWidths() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FUNDS_COLUMN_WIDTHS_KEY) || '{}')
    return { ...Object.fromEntries(columns.map(column => [column.key, column.width])), ...(parsed || {}) }
  } catch {
    return Object.fromEntries(columns.map(column => [column.key, column.width]))
  }
}

function getAllowedDestinationProducts(sourceProductType?: string) {
  return migrationRules[normalizeMigrationProductType(sourceProductType)] || []
}

function normalizeMigrationProductType(sourceProductType?: string) {
  const text = String(sourceProductType || '')
  if (/ביטוח\s*מנהלים|מנהלים/i.test(text)) return 'ביטוח מנהלים'
  if (/גמל\s*להשקעה/i.test(text)) return 'קופת גמל להשקעה'
  if (/השתלמות/i.test(text)) return 'קרן השתלמות'
  if (/פוליסה\s*פיננסית|חיסכון\s*פיננסי/i.test(text)) return 'פוליסה פיננסית'
  if (/פנסיה/i.test(text)) return 'קרן פנסיה'
  if (/גמל/i.test(text)) return 'קופת גמל'
  if (/ביטוח/i.test(text)) return 'ביטוח מנהלים'
  return 'קופת גמל'
}

function defaultRecommendationReason(action: RecommendationActionId, fund: FundRecord, productType: string, manufacturer: string) {
  const fundLabel = [fund.manufacturer, fund.accountNumber].filter(Boolean).join(' ')
  switch (action) {
    case 'new-product':
      return `ניוד למוצר חדש: מומלץ לבחון ניוד של ${fundLabel || 'הקופה'} אל ${productType || 'מוצר מתאים'}${manufacturer ? ` ב${manufacturer}` : ''}, בהתאם לצורכי הלקוח, רמת הסיכון, דמי הניהול ותשואות מסלול ההשקעה.`
    case 'keep':
      return `השארה: בשלב זה מומלץ להשאיר את ${fundLabel || 'הקופה'} במוצר הקיים, בכפוף להמשך מעקב אחר דמי הניהול, תשואות המסלול והתאמתו לצורכי הלקוח.`
    case 'pension':
      return `התחלת קצבה: מומלץ לסמן את ${fundLabel || 'הקופה'} כחלק מתשתיות הקצבה ולבחון את שילובה במסלול הפרישה המתאים.`
    case 'redeem':
      return `פדיון כספים: מומלץ לבחון אפשרות פדיון / משיכה של הכספים בקופה, לאחר בדיקת השלכות מס, נזילות והתאמה לצורכי התזרים.`
    case 'service':
      return `טיפול שוטף: מומלץ לבצע טיפול המשך בקופה, לרבות עדכון פרטים, מינוי סוכן, השלמת מסמכים ומעקב אחר ביצוע.`
  }
}

export default function FundsWorkspace() {
  const [mounted, setMounted] = useState(false)
  const [funds, setFunds] = useState<FundRecord[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [infrastructureIds, setInfrastructureIds] = useState<string[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => Object.fromEntries(columns.map(column => [column.key, column.width])))
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<keyof FundRecord>('currentBalance')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [status, setStatus] = useState('מוכן לייבוא קבצים')
  const [selectedFund, setSelectedFund] = useState<FundRecord | null>(null)
  const [needsOpen, setNeedsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hydrated = useWorkspaceStore(state => state.hydrated)
  const storeFunds = useWorkspaceStore(state => state.funds)
  const storeClient = useWorkspaceStore(state => state.client)
  const storeRecommendations = useWorkspaceStore(state => state.trackingDeals)
  const storeInfrastructureIds = useWorkspaceStore(state => state.infrastructureSelectedIds)
  const hydrateWorkspace = useWorkspaceStore(state => state.hydrate)
  const setStoreFunds = useWorkspaceStore(state => state.setFunds)
  const setStoreInsurancePolicies = useWorkspaceStore(state => state.setInsurancePolicies)
  const setStoreTrackingDeals = useWorkspaceStore(state => state.setTrackingDeals)
  const setStoreInfrastructureIds = useWorkspaceStore(state => state.setInfrastructureIds)
  const updateStoreFund = useWorkspaceStore(state => state.updateFund)
  const applyImportedDataset = useWorkspaceStore(state => state.applyImportedDataset)

  useEffect(() => {
    setMounted(true)
    hydrateWorkspace()
    setColumnOrder(loadColumnOrder())
    setColumnWidths(loadColumnWidths())
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const nextFunds = storeFunds.length ? storeFunds as FundRecord[] : loadArray<FundRecord>(FUNDS_KEY)
    const nextRecommendations = storeRecommendations.length ? storeRecommendations as Recommendation[] : loadArray<Recommendation>(RECOMMENDATIONS_KEY)
    const nextInfrastructureIds = storeInfrastructureIds.length ? storeInfrastructureIds : loadArray<string>(INFRASTRUCTURE_IDS_KEY)
    setFunds(nextFunds)
    setRecommendations(nextRecommendations)
    setInfrastructureIds(nextInfrastructureIds)
  }, [hydrated, storeFunds, storeInfrastructureIds, storeRecommendations])

  const sortedFunds = useMemo(() => {
    return [...funds].sort((a, b) => {
      const av = sortKey === 'currentBalance' ? Number(a.currentBalance || 0) : String(a[sortKey] || '')
      const bv = sortKey === 'currentBalance' ? Number(b.currentBalance || 0) : String(b[sortKey] || '')
      const result = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'he')
      return sortDirection === 'asc' ? result : -result
    })
  }, [funds, sortDirection, sortKey])

  const totalBalance = funds.reduce((sum, fund) => sum + Number(fund.currentBalance || 0), 0)
  const activeFunds = funds.filter(fund => isActiveStatus(fund.status)).length
  const selectedForPension = funds.filter(fund => infrastructureIds.includes(fund.id) || fund.genderScore === 'משוך קצבה').length
  const selectedFunds = funds.filter(fund => selectedIds.includes(fund.id))
  const selectedBalance = selectedFunds.reduce((sum, fund) => sum + Number(fund.currentBalance || 0), 0)
  const orderedColumns = useMemo(() => {
    const byKey = new Map(columns.map(column => [String(column.key), column]))
    return columnOrder.map(key => byKey.get(key)).filter(Boolean) as typeof columns
  }, [columnOrder])

  function persistFunds(nextFunds: FundRecord[]) {
    setFunds(nextFunds)
    localStorage.setItem(FUNDS_KEY, JSON.stringify(nextFunds))
    setStoreFunds(nextFunds)
  }

  function persistRecommendations(next: Recommendation[]) {
    setRecommendations(next)
    localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(next))
    setStoreTrackingDeals(next)
  }

  function updateFund(updatedFund: FundRecord) {
    const next = funds.map(fund => fund.id === updatedFund.id ? updatedFund : fund)
    persistFunds(next)
    updateStoreFund(updatedFund)
    setSelectedFund(updatedFund)
  }

  function toggleFundSelection(id: string, checked: boolean) {
    setSelectedIds(current => checked ? Array.from(new Set([...current, id])) : current.filter(item => item !== id))
  }

  function togglePensionTarget(fund: FundRecord) {
    setInfrastructureIds(current => {
      const exists = current.includes(fund.id) || fund.genderScore === 'משוך קצבה'
      const next = exists ? current.filter(id => id !== fund.id) : Array.from(new Set([...current, fund.id]))
      localStorage.setItem(INFRASTRUCTURE_IDS_KEY, JSON.stringify(next))
      setStoreInfrastructureIds(next)
      if (fund.genderScore === 'משוך קצבה') updateFund({ ...fund, genderScore: '' })
      return next
    })
  }

  function createConsolidationRecommendation() {
    if (selectedIds.length < 2) return
    const selected = funds.filter(fund => selectedIds.includes(fund.id))
    if (selected.length < 2) return
    const leadingFund = selected[0]
    const targetProductType = normalizeProductType(leadingFund.productType || 'קופת גמל')
    const targetManufacturer = normalizeManufacturerName(leadingFund.manufacturer || '')
    const matchedTrack = findAbdTrackForFund(targetProductType, targetManufacturer, leadingFund.investmentTrack || leadingFund.productName)
    const selectedNames = selected
      .map(fund => [fund.manufacturer, fund.accountNumber].filter(Boolean).join(' '))
      .filter(Boolean)
      .join(', ')
    const next: Recommendation = {
      id: `consolidation-${Date.now()}`,
      sourceFundIds: selected.map(fund => fund.id),
      actionType: 'איחוד צבירות',
      productType: targetProductType,
      manufacturer: targetManufacturer || leadingFund.manufacturer || '',
      track: matchedTrack?.trackName || leadingFund.investmentTrack || '',
      trackId: matchedTrack?.trackId,
      reason: `איחוד צבירות: מומלץ לבחון איחוד של ${selectedNames || 'הקופות שסומנו'} לצורך ריכוז כספים, מעקב יעיל והמשך התאמת מסלול ההשקעה לצורכי הלקוח.`,
      notes: selectedNames,
      amount: selectedBalance,
      returns: matchedTrack?.returns,
    }
    persistRecommendations([next, ...recommendations])
    setSelectedIds([])
    setStatus(`נוצרה פעולת איחוד צבירות עבור ${selected.length} קופות בסך ${money(selectedBalance)}`)
  }

  function startColumnResize(event: React.MouseEvent, column: (typeof columns)[number]) {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = columnWidths[String(column.key)] || column.width
    const onMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(column.minWidth, startWidth - (moveEvent.clientX - startX))
      setColumnWidths(current => {
        const next = { ...current, [column.key]: nextWidth }
        localStorage.setItem(FUNDS_COLUMN_WIDTHS_KEY, JSON.stringify(next))
        return next
      })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function applySort(key: keyof FundRecord) {
    if (sortKey === key) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDirection(key === 'currentBalance' ? 'desc' : 'asc')
  }

  function moveColumn(sourceKey: string, targetKey: string) {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return
    setColumnOrder(current => {
      const next = [...current]
      const from = next.indexOf(sourceKey)
      const to = next.indexOf(targetKey)
      if (from < 0 || to < 0) return current
      next.splice(from, 1)
      next.splice(to, 0, sourceKey)
      localStorage.setItem(FUNDS_COLUMN_ORDER_KEY, JSON.stringify(next))
      return next
    })
  }

  function resetColumnLayout() {
    setColumnOrder(defaultColumnOrder)
    const widths = Object.fromEntries(columns.map(column => [column.key, column.width]))
    setColumnWidths(widths)
    localStorage.setItem(FUNDS_COLUMN_ORDER_KEY, JSON.stringify(defaultColumnOrder))
    localStorage.setItem(FUNDS_COLUMN_WIDTHS_KEY, JSON.stringify(widths))
  }

  function renderFundCell(fund: FundRecord, column: (typeof columns)[number]) {
    const width = columnWidths[String(column.key)] || column.width
    const baseStyle = { ...tdStyle, width, minWidth: column.minWidth }
    switch (column.key) {
      case 'genderScore':
        return (
          <td key={column.key} style={baseStyle}>
            <button type="button" onClick={event => { event.stopPropagation(); togglePensionTarget(fund) }} style={targetButtonStyle(infrastructureIds.includes(fund.id) || fund.genderScore === 'משוך קצבה' ? 'משוך קצבה' : '')}>
              {infrastructureIds.includes(fund.id) || fund.genderScore === 'משוך קצבה' ? 'מיועד לקצבה' : 'יעד'}
            </button>
          </td>
        )
      case 'manufacturer':
        return (
          <td key={column.key} style={{ ...baseStyle, color: 'var(--abd-primary)', fontWeight: 900 }}>
            <SharedManufacturerLogo name={fund.manufacturer} />
          </td>
        )
      case 'status':
        return <td key={column.key} style={baseStyle}><StatusBadge status={fund.status} /></td>
      case 'currentBalance':
        return <td key={column.key} style={{ ...baseStyle, fontWeight: 900 }}>{money(fund.currentBalance)}</td>
      case 'standing':
        return <td key={column.key} style={baseStyle}>{fund.standing || 'שכיר'}</td>
      case 'investmentTrack':
        return <td key={column.key} style={baseStyle}>{fund.investmentTrack || fund.productName || 'אין נתון'}</td>
      default:
        return <td key={column.key} style={baseStyle}>{String(fund[column.key] || 'אין נתון')}</td>
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setStatus(`מייבא ${files.length} קבצים...`)
    try {
      const currentClient = storeClient || readStoredClient()
      const imported = await importWorkspaceFiles(files, currentClient)
      const nextFunds = mergeFunds(funds, imported.funds)
      persistFunds(nextFunds)
      if (imported.insurancePolicies.length) {
        const existingPolicies = loadArray<{ id: string }>(INSURANCE_KEY)
        const nextPolicies = mergePolicies(existingPolicies, imported.insurancePolicies)
        localStorage.setItem(INSURANCE_KEY, JSON.stringify(nextPolicies))
        setStoreInsurancePolicies(nextPolicies)
      }
      if (imported.client) localStorage.setItem(CLIENT_KEY, JSON.stringify(imported.client))
      applyImportedDataset({ workbookName: files[0]?.name, client: imported.client, funds: nextFunds, insurancePolicies: imported.insurancePolicies })
      setStatus(imported.messages.join(' | ') || 'הייבוא הסתיים')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ייבוא הקבצים נכשל')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const visibleFunds = mounted ? sortedFunds : []

  if (mounted && !funds.length) {
    return (
      <main dir="rtl" style={pageStyle}>
        <input ref={inputRef} hidden multiple type="file" accept=".zip,.xml,.xlsx,.xls,.xlsm" onChange={event => void handleFiles(event.target.files)} />
        <section style={welcomeShellStyle}>
          <div style={welcomeTopStripStyle}>
            <div>
              <strong>סביבת עבודה חדשה</strong>
              <span>ייבוא נתוני לקוח והתחלת תהליך פרישה</span>
            </div>
            <button type="button" onClick={() => inputRef.current?.click()} style={welcomeStripButtonStyle}>
              <Upload size={16} /> ייבוא קבצים
            </button>
          </div>

          <div style={welcomeHeroGridStyle}>
            <div style={welcomeUploadCardStyle}>
              <div style={welcomeUploadIconStyle}><Upload size={30} /></div>
              <h2 style={{ margin: 0, color: 'var(--abd-primary)', fontSize: 34, fontWeight: 900 }}>התחלת עבודה</h2>
              <button type="button" onClick={() => inputRef.current?.click()} style={welcomePrimaryCtaStyle}>
                <Upload size={19} /> בחירת קבצים
              </button>
              <div style={welcomeStatusStyle}>
                <strong>{status}</strong>
                <span>נתמך: zip / xml / xlsx / xls / xlsm</span>
              </div>
            </div>

            <div style={welcomeBrandStyle}>
              <div style={welcomeLogoFrameStyle}>
                <img src="/assets/abd-finance-logo.png" alt="ABD Finance" style={welcomeLogoStyle} />
              </div>
              <h1 style={welcomeTitleStyle}>מערכת עבודה פיננסית</h1>
              <div style={welcomeFeatureGridStyle}>
                <article style={welcomeFeatureStyle}><Briefcase size={19} /><strong>דשבורד קופות</strong></article>
                <article style={welcomeFeatureStyle}><Shield size={19} /><strong>בדיקת לקוח</strong></article>
                <article style={welcomeFeatureStyle}><BarChart2 size={19} /><strong>תשואות והשוואות</strong></article>
                <article style={welcomeFeatureStyle}><FileText size={19} /><strong>סיכום פגישה</strong></article>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>דשבורד קופות</h1>
          <p style={mutedStyle}>{status}</p>
        </div>
        <div style={actionsStyle}>
          <input ref={inputRef} hidden multiple type="file" accept=".zip,.xml,.xlsx,.xls,.xlsm" onChange={event => void handleFiles(event.target.files)} />
          <button type="button" onClick={() => inputRef.current?.click()} style={primaryButtonStyle}><Upload size={17} /> ייבוא קבצים</button>
          <button type="button" onClick={() => setNeedsOpen(true)} style={ghostButtonStyle}>בירור צרכים</button>
          <button type="button" onClick={() => persistFunds([])} style={ghostButtonStyle}>ניקוי קופות</button>
        </div>
      </header>

      <section style={kpiGridStyle}>
        <KpiCard title="לקוח" value={mounted ? getClientName() : 'ממתין'} sub={storeClient?.idNumber || ''} icon={<Briefcase size={18} />} />
        <KpiCard title="קופות" value={mounted ? String(funds.length) : '0'} sub="" icon={<BarChart2 size={18} />} />
        <KpiCard title="קופות פעילות" value={mounted ? String(activeFunds) : '0'} sub="" icon={<Shield size={18} />} />
        <KpiCard title="הון לקצבה" value={mounted ? money(totalBalance) : money(0)} sub={`${selectedForPension} קופות שסומנו לחישוב`} icon={<FileText size={18} />} />
        <KpiCard title="דמי ניהול" value={mounted ? averageFee(funds) : '0'} sub="" icon={<BarChart2 size={18} />} />
      </section>

      <section style={tableCardStyle}>
        <div style={toolbarStyle}>
          <span style={mutedStyle}>{selectedIds.length > 1 ? `איחוד צבירות: ${money(selectedBalance)} מתוך ${selectedIds.length} קופות` : selectedForPension ? `${selectedForPension} קופות מיועדות לקצבה` : ''}</span>
          <div style={actionsStyle}>
            {selectedIds.length > 1 && (
              <button type="button" onClick={createConsolidationRecommendation} style={primaryButtonStyle}>
                איחוד צבירות
              </button>
            )}
            <button type="button" onClick={resetColumnLayout} style={ghostButtonStyle}>
              איפוס עמודות
            </button>
          </div>
        </div>

        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 44 }} />
                {orderedColumns.map(column => (
                  <th
                    key={column.key}
                    draggable
                    onClick={() => applySort(column.key)}
                    onDragStart={event => {
                      setDraggedColumn(String(column.key))
                      event.dataTransfer.setData('text/plain', String(column.key))
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={event => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={event => {
                      event.preventDefault()
                      event.stopPropagation()
                      moveColumn(event.dataTransfer.getData('text/plain') || draggedColumn || '', String(column.key))
                      setDraggedColumn(null)
                    }}
                    onDragEnd={() => setDraggedColumn(null)}
                    style={{ ...thStyle, width: columnWidths[String(column.key)], minWidth: column.minWidth }}
                  >
                    <span style={headerLabelStyle}>
                      <span style={dragGripStyle}>⋮⋮</span>
                      <span>{column.label} {sortKey === column.key ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</span>
                    </span>
                    <span aria-hidden="true" title="גרור לשינוי רוחב עמודה" onMouseDown={event => startColumnResize(event, column)} style={resizeHandleStyle} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!visibleFunds.length && (
                <tr>
                  <td colSpan={columns.length + 1} style={emptyCellStyle}>
                    אין קופות להצגה.
                  </td>
                </tr>
              )}
              {visibleFunds.map((fund, index) => (
                <tr key={fund.id} onClick={() => setSelectedFund(fund)} style={{ background: index % 2 ? '#EEF7FF' : '#FFFFFF', cursor: 'pointer' }}>
                  <td style={{ ...tdStyle, width: 44 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(fund.id)}
                      onClick={event => event.stopPropagation()}
                      onChange={event => toggleFundSelection(fund.id, event.target.checked)}
                      style={checkboxStyle}
                    />
                  </td>
                  {orderedColumns.map(column => renderFundCell(fund, column))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedFund && (
        <FundModal
          fund={selectedFund}
          isInfrastructureTarget={infrastructureIds.includes(selectedFund.id) || selectedFund.genderScore === 'משוך קצבה'}
          recommendations={recommendations}
          onClose={() => setSelectedFund(null)}
          onUpdateFund={updateFund}
          onToggleInfrastructureTarget={togglePensionTarget}
          onSaveRecommendations={persistRecommendations}
        />
      )}
      {needsOpen && <NeedsModal onClose={() => setNeedsOpen(false)} funds={funds} />}
    </main>
  )
}

function getClientName() {
  try {
    const client = JSON.parse(localStorage.getItem(CLIENT_KEY) || '{}')
    return client.fullName || [client.firstName, client.lastName].filter(Boolean).join(' ') || 'לקוח פעיל'
  } catch {
    return 'לקוח פעיל'
  }
}

function FundModal({
  fund,
  isInfrastructureTarget,
  recommendations,
  onClose,
  onUpdateFund,
  onToggleInfrastructureTarget,
  onSaveRecommendations,
}: {
  fund: FundRecord
  isInfrastructureTarget: boolean
  recommendations: Recommendation[]
  onClose: () => void
  onUpdateFund: (fund: FundRecord) => void
  onToggleInfrastructureTarget: (fund: FundRecord) => void
  onSaveRecommendations: (recommendations: Recommendation[]) => void
}) {
  const matchedTrack = findAbdTrackForFund(fund.productType, fund.manufacturer, fund.investmentTrack || fund.productName)
  const sourceMigrationProduct = useMemo(() => normalizeMigrationProductType([fund.productType, fund.planName, fund.productName].filter(Boolean).join(' ')), [fund.planName, fund.productName, fund.productType])
  const allowedProducts = useMemo(() => getAllowedDestinationProducts(sourceMigrationProduct), [sourceMigrationProduct])
  const existingPlan = fund.migrationPlan || {}
  const [activeRecommendationAction, setActiveRecommendationAction] = useState<RecommendationActionId | null>(null)
  const [productType, setProductType] = useState(existingPlan.targetProduct || allowedProducts[0] || normalizeProductType(fund.productType || 'קופת גמל'))
  const [manufacturer, setManufacturer] = useState(normalizeManufacturerName(existingPlan.targetCompany || fund.manufacturer || ''))
  const [trackId, setTrackId] = useState(existingPlan.investmentTrackId || '')
  const [managementFeeBalance, setManagementFeeBalance] = useState(existingPlan.managementFeeBalance || '')
  const [managementFeeDeposit, setManagementFeeDeposit] = useState(existingPlan.managementFeeDeposit || '')
  const [reason, setReason] = useState('')
  const [professionalNotes, setProfessionalNotes] = useState(existingPlan.professionalNotes || '')
  const [activityView, setActivityView] = useState<FundActivityView>('deposits')
  const [insuranceCoverageOpen, setInsuranceCoverageOpen] = useState(false)
  const [migrationSourceMode, setMigrationSourceMode] = useState<'whole' | 'parts'>(existingPlan.sourcePartIds?.length ? 'parts' : 'whole')
  const [migrationSourcePartIds, setMigrationSourcePartIds] = useState<string[]>(existingPlan.sourcePartIds || [])
  const fundRecommendations = recommendations.filter(item => item.fromFundId === fund.id)
  const manufacturers = useMemo(() => {
    const fromReturns = getManufacturersByProductType(productType)
    const fromRules = migrationTargetCompanies[productType] || []
    return Array.from(new Set([...fromReturns, ...fromRules]))
      .map(normalizeManufacturerName)
      .filter(isAllowedAbdReturnManufacturer)
  }, [productType])
  const tracks = useMemo(() => getTracksByProductAndManufacturer(productType, manufacturer), [manufacturer, productType])
  const selectedTrack = trackId ? getTrackDetails(trackId) : tracks[0]
  const periodBreakdown = getFundPeriodBreakdown(fund)
  const pensionBalance = periodBreakdown.pension || fund.pensionBalance
  const compensationBalance = periodBreakdown.compensation || fund.compensationBalance
  const sourceParts = useMemo(() => getFundMigrationSourceParts(fund), [fund])
  const showInsuranceCoverageButton = isFundInsuranceCoverageRelevant(fund)
  const selectedSourceParts = useMemo(
    () => sourceParts.filter(part => migrationSourcePartIds.includes(part.key)),
    [migrationSourcePartIds, sourceParts],
  )
  const migrationSourceAmount = migrationSourceMode === 'parts'
    ? selectedSourceParts.reduce((sum, part) => sum + part.amount, 0)
    : Number(fund.currentBalance || 0)
  const migrationSourceLabel = migrationSourceMode === 'parts' && selectedSourceParts.length
    ? selectedSourceParts.map(part => part.label).join(', ')
    : 'כל הקופה'

  useEffect(() => {
    if (!allowedProducts.includes(productType)) {
      const nextProduct = allowedProducts[0] || productType
      setProductType(nextProduct)
      setManufacturer('')
      setTrackId('')
    }
  }, [allowedProducts, productType])

  useEffect(() => {
    if ((!manufacturer || !manufacturers.includes(manufacturer)) && manufacturers[0]) {
      setManufacturer(manufacturers[0])
    }
  }, [manufacturer, manufacturers])

  useEffect(() => {
    if (!trackId && tracks[0]) setTrackId(tracks[0].id)
    if (trackId && !tracks.some(track => track.id === trackId)) {
      setTrackId(tracks[0]?.id || '')
    }
  }, [trackId, tracks])

  async function copyAccount() {
    if (fund.accountNumber) await navigator.clipboard.writeText(fund.accountNumber)
  }

  function updateFundField<K extends keyof FundRecord>(key: K, value: FundRecord[K]) {
    onUpdateFund({ ...fund, [key]: value })
  }

  function updateFundNumber(key: keyof FundRecord, value: string) {
    onUpdateFund({ ...fund, [key]: toNumber(value) })
  }

  function toggleMigrationSourcePart(partKey: MigrationSourcePartKey, checked: boolean) {
    setMigrationSourcePartIds(current => checked
      ? Array.from(new Set([...current, partKey]))
      : current.filter(key => key !== partKey))
  }

  function addRecommendation() {
    if (!activeRecommendationAction) return
    if (activeRecommendationAction === 'new-product' && !selectedTrack) return
    const isMigration = activeRecommendationAction === 'new-product'
    if (isMigration && !(migrationSourceAmount > 0)) return
    const savedSourceParts = isMigration && migrationSourceMode === 'parts' ? selectedSourceParts : []
    const migrationPlan = isMigration ? {
      sourcePartIds: migrationSourceMode === 'parts' ? migrationSourcePartIds : [],
      sourceParts: savedSourceParts,
      sourceSelectionLabel: migrationSourceLabel,
      sourceAmount: migrationSourceAmount,
      targetProduct: productType,
      targetCompany: manufacturer,
      managementFeeBalance,
      managementFeeDeposit,
      investmentTrackId: selectedTrack?.id || trackId,
      investmentTrack: selectedTrack?.trackName || '',
      targetTrack: selectedTrack?.trackName || '',
      targetTrackNumber: selectedTrack?.trackId || '',
      targetTrackReturns: selectedTrack?.returns,
      reason,
      professionalNotes,
    } : undefined
    const next: Recommendation = {
      id: `${Date.now()}`,
      fromFundId: fund.id,
      sourcePartIds: isMigration && migrationSourceMode === 'parts' ? migrationSourcePartIds : [],
      sourceParts: savedSourceParts,
      sourceSelectionLabel: isMigration ? migrationSourceLabel : undefined,
      actionType: recommendationActions.find(action => action.id === activeRecommendationAction)?.label || 'ניוד',
      productType: isMigration ? productType : normalizeProductType(fund.productType || productType),
      manufacturer: isMigration ? manufacturer : normalizeManufacturerName(fund.manufacturer || manufacturer),
      track: isMigration ? (selectedTrack?.trackName || '') : (fund.investmentTrack || ''),
      trackId: isMigration ? selectedTrack?.trackId : fund.accountNumber,
      managementFeeBalance: isMigration ? managementFeeBalance : undefined,
      managementFeeDeposit: isMigration ? managementFeeDeposit : undefined,
      reason,
      professionalNotes,
      amount: isMigration ? migrationSourceAmount : Number(fund.currentBalance || 0),
      returns: isMigration ? selectedTrack?.returns : undefined,
    }
    onSaveRecommendations([next, ...recommendations])
    onUpdateFund({
      ...fund,
      recommendation: reason,
      recommendationTemplateId: recommendationTemplateIds[activeRecommendationAction],
      migrationPlan,
    })
  }

  function selectRecommendationAction(actionId: RecommendationActionId) {
    if (activeRecommendationAction === actionId) {
      setActiveRecommendationAction(null)
      setReason('')
      setProfessionalNotes('')
      return
    }
    setActiveRecommendationAction(actionId)
    const nextProduct = actionId === 'new-product' ? (allowedProducts[0] || productType) : normalizeProductType(fund.productType || productType)
    if (actionId === 'new-product') {
      setProductType(nextProduct)
      setManufacturer('')
      setTrackId('')
      setManagementFeeBalance('')
      setManagementFeeDeposit('')
      setProfessionalNotes('')
      setMigrationSourceMode('whole')
      setMigrationSourcePartIds([])
    }
    setReason(defaultRecommendationReason(actionId, fund, nextProduct, manufacturer))
    if (actionId === 'pension' && !isInfrastructureTarget) {
      onToggleInfrastructureTarget(fund)
    }
  }

  function updateRecommendation(id: string, patch: Partial<Recommendation>) {
    const next = recommendations.map(item => item.id === id ? { ...item, ...patch } : item)
    onSaveRecommendations(next)
    const updated = next.find(item => item.id === id)
    if (updated?.fromFundId === fund.id && typeof patch.reason === 'string') {
      onUpdateFund({ ...fund, recommendation: patch.reason })
    }
  }

  function removeRecommendation(id: string) {
    const removed = recommendations.find(item => item.id === id)
    const next = recommendations.filter(item => item.id !== id)
    onSaveRecommendations(next)
    if (removed?.fromFundId === fund.id) {
      const nextForFund = next.find(item => item.fromFundId === fund.id)
      onUpdateFund({ ...fund, recommendation: nextForFund?.reason || '' })
      if (!nextForFund) setReason('')
    }
  }

  return (
    <div style={fundModalOverlayStyle} onClick={onClose}>
      <section style={fundModalStyle} onClick={event => event.stopPropagation()}>
        <button type="button" aria-label="סגירה" onClick={onClose} style={modalCloseStyle}>×</button>
        <header style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{fund.manufacturer || 'יצרן לא ידוע'}</h2>
          <p style={mutedStyle}>
            {fund.productType || 'מוצר'} |{' '}
            <button type="button" onClick={copyAccount} style={copyNumberStyle}>{fund.accountNumber || 'אין מספר קופה'}</button>
          </p>
        </header>

        <div style={modalGridStyle}>
          <ModalCell label="תוכנית" value={fund.productName || fund.planName || 'אין נתון'} strong />
          <ModalCell label="מספר קופה" value={<button type="button" onClick={copyAccount} style={copyNumberStyle}>{fund.accountNumber || 'אין נתון'}</button>} strong />
          <ModalCell label="מועד הצטרפות" value={fund.joinDate || fund.startDate || 'אין נתון'} />
          <ModalCell label="יצרן" value={fund.manufacturer || 'אין נתון'} strong />
          <ModalCell label="סוג מוצר" value={fund.productType || 'אין נתון'} />
          <ModalCell label="סטטוס" value={<StatusBadge status={fund.status} />} />
          <ModalCell label='סה"כ צבירה' value={money(fund.currentBalance)} strong />
          <ModalCell label="הון צפוי לפרישה" value={money(fund.retirementCapital)} strong />
          <ModalCell label="קצבה חודשית מיובאת" value={money(fund.importedPension)} />
          <ModalCell label="מקדם מיובא / בסיס" value={fund.guaranteedCoefficient ? String(fund.guaranteedCoefficient) : 'אין נתון'} />
          <ModalCell label="תגמולים" value={money(pensionBalance)} />
          <ModalCell label="פיצויים" value={money(compensationBalance)} />
          <ModalCell label="הפקדה חודשית אחרונה" value={money(fund.monthlyDeposit)} />
          <ModalCell label="מעסיק" value={fund.employer || 'אין נתון'} />
          <ModalCell label="דמי ניהול הפקדה" value={fund.depositFee || 'אין נתון'} />
          <ModalCell label="דמי ניהול צבירה" value={fund.balanceFee || 'אין נתון'} />
          <ModalCell label="תאריך נזילות" value={fund.liquidityDate || 'אין נתון'} />
        </div>

        <div style={trackBoxStyle}>
          <span>מסלול השקעה</span>
          <strong>{fund.investmentTrack || 'אין נתון'}</strong>
          <div style={trackActionsStyle}>
            {showInsuranceCoverageButton && (
              <button
                type="button"
                onClick={() => setInsuranceCoverageOpen(current => !current)}
                style={smallButtonStyle}
              >
                כיסוי ביטוחי בקופה
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggleInfrastructureTarget(fund)}
              style={smallButtonStyle}
            >
              {isInfrastructureTarget ? 'הסר יעד קצבה' : 'משוך קצבה'}
            </button>
          </div>
        </div>

        {showInsuranceCoverageButton && insuranceCoverageOpen && (
          <FundInsuranceCoveragePanel fund={fund} />
        )}

        <section style={editPanelStyle}>
          <h3 style={sectionTitleStyle}>עדכון נתוני קופה</h3>
          <div style={editGridStyle}>
            <Field label='סה"כ צבירה'>
              <input dir="ltr" type="number" step="0.001" value={editableNumber(fund.currentBalance)} onChange={event => updateFundNumber('currentBalance', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="הון צפוי לפרישה">
              <input dir="ltr" type="number" step="0.001" value={editableNumber(fund.retirementCapital)} onChange={event => updateFundNumber('retirementCapital', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="קצבה חודשית מיובאת">
              <input dir="ltr" type="number" step="0.001" value={editableNumber(fund.importedPension)} onChange={event => updateFundNumber('importedPension', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="מקדם מיובא / בסיס">
              <input dir="ltr" type="number" step="0.001" value={editableNumber(fund.guaranteedCoefficient)} onChange={event => updateFundNumber('guaranteedCoefficient', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="סטטוס">
              <select value={fund.status || 'לא ידוע'} onChange={event => updateFundField('status', event.target.value)} style={inputStyle}>
                <option value="פעיל">פעיל</option>
                <option value="לא פעיל">לא פעיל</option>
                <option value="מוקפא">מוקפא</option>
                <option value="לא ידוע">לא ידוע</option>
              </select>
            </Field>
            <Field label="תאריך נזילות">
              <input value={fund.liquidityDate || ''} onChange={event => updateFundField('liquidityDate', event.target.value)} style={inputStyle} />
            </Field>
          </div>
        </section>

        <FundActivityTabs fund={fund} activeView={activityView} onChange={setActivityView} />

        <section style={recommendationPanelStyle}>
          <h3 style={sectionTitleStyle}>המלצה לקופה</h3>
          <div style={recommendationButtonsStyle}>
            {recommendationActions.map(action => (
              <button
                key={action.id}
                type="button"
                onClick={() => selectRecommendationAction(action.id)}
                style={recommendationActionButtonStyle(activeRecommendationAction === action.id)}
              >
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </button>
            ))}
          </div>

          {!activeRecommendationAction && (
            <div style={mappingNoticeStyle}>
              <strong>לא נבחרה המלצה.</strong>
            </div>
          )}

          {activeRecommendationAction === 'new-product' && !allowedProducts.length && (
            <div style={mappingNoticeStyle}>
              <strong>מיפוי מוצרי יעד:</strong>
              <span>{sourceMigrationProduct} לא ניתן לניוד למוצר חדש.</span>
            </div>
          )}

          {activeRecommendationAction === 'new-product' && allowedProducts.length > 0 && (
            <>
              <div style={mappingNoticeStyle}>
                <strong>מוצר יעד:</strong>
                <span>
                  {allowedProducts.join(' / ')}
                </span>
              </div>
              <div style={sourceSelectionStyle}>
                <div style={sourceSelectionHeaderStyle}>
                  <strong>מקור הניוד</strong>
                  <span>{money(migrationSourceAmount)}</span>
                </div>
                <div style={sourceModeButtonsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      setMigrationSourceMode('whole')
                      setMigrationSourcePartIds([])
                    }}
                    style={sourceModeButtonStyle(migrationSourceMode === 'whole')}
                  >
                    כל הקופה
                  </button>
                  <button
                    type="button"
                    onClick={() => setMigrationSourceMode('parts')}
                    disabled={!sourceParts.length}
                    style={sourceModeButtonStyle(migrationSourceMode === 'parts')}
                  >
                    חלק מקופה
                  </button>
                </div>
                {migrationSourceMode === 'parts' && (
                  sourceParts.length ? (
                    <div style={sourcePartsGridStyle}>
                      {sourceParts.map(part => (
                        <label key={part.key} style={sourcePartStyle}>
                          <input
                            type="checkbox"
                            checked={migrationSourcePartIds.includes(part.key)}
                            onChange={event => toggleMigrationSourcePart(part.key, event.target.checked)}
                          />
                          <span>{part.label}</span>
                          <strong>{money(part.amount)}</strong>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={mappingNoticeStyle}>אין פירוט שכבות לקופה הזו. ניתן לנייד רק את כל הקופה.</div>
                  )
                )}
              </div>
              <div style={recommendationGridStyle}>
                <Field label="סוג מוצר מקבל">
                  {allowedProducts.length === 1 ? (
                    <div style={lockedProductStyle}>{allowedProducts[0]}</div>
                  ) : (
                    <select value={productType} onChange={event => { setProductType(event.target.value); setManufacturer(''); setTrackId('') }} style={inputStyle}>
                      {allowedProducts.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="יצרן מקבל">
                  <select value={manufacturer} onChange={event => { setManufacturer(event.target.value); setTrackId('') }} style={inputStyle}>
                    {manufacturers.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="מסלול השקעה">
                  <select value={trackId} onChange={event => setTrackId(event.target.value)} style={inputStyle}>
                    {tracks.map(item => <option key={item.id} value={item.id}>{item.trackName}</option>)}
                  </select>
                </Field>
                <Field label="דמי ניהול מצבירה">
                  <input dir="ltr" type="number" min="0" step="0.01" value={managementFeeBalance} onChange={event => setManagementFeeBalance(event.target.value)} placeholder="%" style={inputStyle} />
                </Field>
                <Field label="דמי ניהול מהפקדה">
                  <input dir="ltr" type="number" min="0" step="0.01" value={managementFeeDeposit} onChange={event => setManagementFeeDeposit(event.target.value)} placeholder="%" style={inputStyle} />
                </Field>
              </div>
              {selectedTrack && (
                <div style={returnsGridStyle}>
                  <span>מספר מסלול: <strong>{selectedTrack.trackId || 'אין נתון'}</strong></span>
                  <span>שנה: <strong>{selectedTrack.returns?.periodAccumulated ?? 'אין נתון'}%</strong></span>
                  <span>3 שנים: <strong>{selectedTrack.returns?.annual3 ?? 'אין נתון'}%</strong></span>
                  <span>5 שנים: <strong>{selectedTrack.returns?.annual5 ?? 'אין נתון'}%</strong></span>
                </div>
              )}
            </>
          )}
          {activeRecommendationAction && (
            <Field label="נימוק המלצה">
              <textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
          )}
          {activeRecommendationAction === 'new-product' && (
            <Field label="הערות מקצועיות">
              <textarea value={professionalNotes} onChange={event => setProfessionalNotes(event.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
          )}
          <button
            type="button"
            onClick={addRecommendation}
            disabled={!activeRecommendationAction || (activeRecommendationAction === 'new-product' && (!allowedProducts.length || !(migrationSourceAmount > 0)))}
            style={!activeRecommendationAction || (activeRecommendationAction === 'new-product' && (!allowedProducts.length || !(migrationSourceAmount > 0))) ? disabledButtonStyle : primaryButtonStyle}
          >
            שמור המלצה לקופה
          </button>

          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {fundRecommendations.map(item => (
              <article key={item.id} style={savedRecommendationStyle}>
                <div style={savedRecommendationHeaderStyle}>
                  <strong>{item.manufacturer} | {item.track}</strong>
                  <button type="button" onClick={() => removeRecommendation(item.id)} style={miniDangerStyle}>×</button>
                </div>
                <span>{item.sourceSelectionLabel ? `${item.sourceSelectionLabel} | ` : ''}{item.trackId ? `מספר מסלול ${item.trackId} | ` : ''}{money(item.amount)}</span>
                {(item.managementFeeBalance || item.managementFeeDeposit || item.professionalNotes) && (
                  <small style={{ color: 'var(--text-muted)' }}>
                    {item.managementFeeBalance ? ` מצבירה ${item.managementFeeBalance}%` : ''}
                    {item.managementFeeDeposit ? ` | מהפקדה ${item.managementFeeDeposit}%` : ''}
                    {item.professionalNotes ? ` | ${item.professionalNotes}` : ''}
                  </small>
                )}
                <textarea
                  value={item.reason}
                  onChange={event => updateRecommendation(item.id, { reason: event.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}

function NeedsModal({ funds, onClose }: { funds: FundRecord[]; onClose: () => void }) {
  const storeClient = useWorkspaceStore(state => state.client)
  const storeNeeds = useWorkspaceStore(state => state.needsAssessment)
  const applyImportedDataset = useWorkspaceStore(state => state.applyImportedDataset)
  const setStoreNeedsAssessment = useWorkspaceStore(state => state.setNeedsAssessment)
  const [needs, setNeeds] = useState<NeedsState>(emptyNeeds)
  const [step, setStep] = useState<'personal' | 'needs'>('personal')
  const [folding, setFolding] = useState(false)

  useEffect(() => {
    try {
      const stored = Object.keys(storeNeeds || {}).length ? storeNeeds : JSON.parse(localStorage.getItem(NEEDS_KEY) || 'null')
      const client = storeClient || JSON.parse(localStorage.getItem(CLIENT_KEY) || '{}')
      const provident = funds
        .filter(fund => String(fund.productType || '').includes('גמל'))
        .reduce((sum, fund) => sum + Number(fund.currentBalance || 0), 0)
      const study = funds
        .filter(fund => String(fund.productType || '').includes('השתלמות'))
        .reduce((sum, fund) => sum + Number(fund.currentBalance || 0), 0)
      setNeeds({
        ...emptyNeeds,
        clientFullName: client.fullName || [client.firstName, client.lastName].filter(Boolean).join(' ') || '',
        clientIdNumber: client.idNumber || '',
        clientBirthDate: client.birthDate || '',
        clientIssueDate: client.issueDate || '',
        clientPhone: client.phone || '',
        clientEmail: client.email || '',
        assetProvident: String(provident || ''),
        assetStudyFunds: String(study || ''),
        ...(stored || {}),
      })
    } catch {
      setNeeds(emptyNeeds)
    }
  }, [funds, storeClient, storeNeeds])

  function update(key: keyof NeedsState, value: string) {
    const next = { ...needs, [key]: value }
    setNeeds(next)
    localStorage.setItem(NEEDS_KEY, JSON.stringify(next))
    setStoreNeedsAssessment(next)
  }

  function continueToNeeds() {
    const existingClient = storeClient || JSON.parse(localStorage.getItem(CLIENT_KEY) || '{}')
    const nextClient = {
      ...existingClient,
      idNumber: needs.clientIdNumber || existingClient.idNumber,
      fullName: needs.clientFullName || existingClient.fullName,
      birthDate: needs.clientBirthDate,
      issueDate: needs.clientIssueDate,
      phone: needs.clientPhone,
      email: needs.clientEmail,
    }
    localStorage.setItem(CLIENT_KEY, JSON.stringify(nextClient))
    localStorage.setItem(NEEDS_KEY, JSON.stringify(needs))
    setStoreNeedsAssessment(needs)
    applyImportedDataset({ client: nextClient })
    setFolding(true)
    window.setTimeout(() => {
      setStep('needs')
      setFolding(false)
    }, 620)
  }

  const primaryIncome = toNumber(needs.incomeWorkPrimary) + toNumber(needs.incomeBituachPrimary) + toNumber(needs.incomePensionPrimary) + toNumber(needs.incomeRentPrimary) + toNumber(needs.incomeOtherPrimary)
  const spouseIncome = toNumber(needs.incomeWorkSpouse) + toNumber(needs.incomeBituachSpouse) + toNumber(needs.incomePensionSpouse) + toNumber(needs.incomeRentSpouse) + toNumber(needs.incomeOtherSpouse)
  const totalExpenses = toNumber(needs.fixedExpenses) + toNumber(needs.variableExpenses)
  const totalAssets = toNumber(needs.assetBank) + toNumber(needs.assetPortfolio) + toNumber(needs.assetPolicies) + toNumber(needs.assetProvident) + toNumber(needs.assetStudyFunds) + toNumber(needs.assetInheritance) + toNumber(needs.assetRealEstate) + toNumber(needs.assetOther)

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <section style={{ ...modalStyle, width: 'min(1180px, 96vw)' }} onClick={event => event.stopPropagation()}>
        <style>{`
          .personal-fold-card {
            transform-origin: top center;
            transform-style: preserve-3d;
            animation: personalSlideIn .38s ease both;
          }
          .personal-fold-card.is-folding {
            animation: personalFoldAway .62s cubic-bezier(.2,.78,.18,1) forwards;
          }
          .needs-reveal {
            animation: needsReveal .42s ease both;
          }
          @keyframes personalSlideIn {
            from { opacity: 0; transform: translateY(16px) scale(.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes personalFoldAway {
            0% { opacity: 1; transform: perspective(1200px) rotateX(0) translateY(0) scale(1); max-height: 720px; }
            65% { opacity: .45; transform: perspective(1200px) rotateX(-68deg) translateY(-22px) scale(.96); max-height: 720px; }
            100% { opacity: 0; transform: perspective(1200px) rotateX(-86deg) translateY(-44px) scale(.92); max-height: 0; margin: 0; padding-top: 0; padding-bottom: 0; overflow: hidden; }
          }
          @keyframes needsReveal {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <button type="button" aria-label="סגירה" onClick={onClose} style={modalCloseStyle}>×</button>
        {step === 'personal' ? (
          <div className={`personal-fold-card${folding ? ' is-folding' : ''}`}>
            <header style={screenHeaderStyle}>
              <h2 style={modalTitleStyle}>פרטים אישיים</h2>
            </header>

            <div style={personalLayoutStyle}>
              <section style={personalCardStyle}>
                <div style={personalCardHeadStyle}>
                  <strong>פרטי הלקוח</strong>
                  <span>עריכה / השלמה ידנית</span>
                </div>
                <PersonalInput label="שם מלא" value={needs.clientFullName} onChange={value => update('clientFullName', value)} />
                <PersonalInput label="ת.ז" value={needs.clientIdNumber} onChange={value => update('clientIdNumber', value)} />
                <PersonalInput label="תאריך לידה" type="date" value={needs.clientBirthDate} onChange={value => update('clientBirthDate', value)} />
                <PersonalInput label="תאריך הנפקה" type="date" value={needs.clientIssueDate} onChange={value => update('clientIssueDate', value)} />
                <PersonalInput label="טלפון" value={needs.clientPhone} onChange={value => update('clientPhone', value)} />
                <PersonalInput label="מייל" type="email" value={needs.clientEmail} onChange={value => update('clientEmail', value)} />
              </section>

              <section style={personalCardStyle}>
                <div style={personalCardHeadStyle}>
                  <strong>פרטי בן / בת זוג</strong>
                  <span>הוספה ידנית לפי הצורך</span>
                </div>
                <PersonalInput label="שם מלא" value={needs.spouseFullName} onChange={value => update('spouseFullName', value)} />
                <PersonalInput label="ת.ז" value={needs.spouseIdNumber} onChange={value => update('spouseIdNumber', value)} />
                <PersonalInput label="תאריך לידה" type="date" value={needs.spouseBirthDate} onChange={value => update('spouseBirthDate', value)} />
                <PersonalInput label="תאריך הנפקה" type="date" value={needs.spouseIssueDate} onChange={value => update('spouseIssueDate', value)} />
                <PersonalInput label="טלפון" value={needs.spousePhone} onChange={value => update('spousePhone', value)} />
                <PersonalInput label="מייל" type="email" value={needs.spouseEmail} onChange={value => update('spouseEmail', value)} />
              </section>
            </div>

            <div style={personalFooterStyle}>
              <span />
              <button type="button" onClick={continueToNeeds} style={primaryButtonStyle}>שמירה והמשך לבירור צרכים</button>
            </div>
          </div>
        ) : (
          <div className="needs-reveal">
            <header style={screenHeaderStyle}>
              <h2 style={modalTitleStyle}>בירור צרכים</h2>
            </header>

            <button type="button" onClick={() => setStep('personal')} style={{ ...ghostButtonStyle, marginBottom: 14 }}>
              חזרה לפרטים אישיים
            </button>

            <div style={needsSummaryStyle}>
              <KpiCard title="סה״כ הכנסות" value={money(primaryIncome + spouseIncome)} sub="מבוטח/ת + בן/בת זוג" icon={<BarChart2 size={18} />} />
              <KpiCard title="סה״כ הוצאות" value={money(totalExpenses)} sub="קבועות + משתנות" icon={<FileText size={18} />} />
              <KpiCard title="סה״כ נכסים" value={money(totalAssets)} sub="נכסים קיימים משוערים" icon={<Briefcase size={18} />} />
            </div>

            <div style={needsLayoutStyle}>
              <section style={needsCardStyle}>
                <h3 style={sectionTitleStyle}>הכנסות נטו</h3>
                <table style={needsTableStyle}>
                  <thead><tr><th>סעיף</th><th>מבוטח/ת</th><th>בן/בת זוג</th></tr></thead>
                  <tbody>
                    <NeedsDualRow label="שכר עבודה" p={needs.incomeWorkPrimary} s={needs.incomeWorkSpouse} onP={value => update('incomeWorkPrimary', value)} onS={value => update('incomeWorkSpouse', value)} />
                    <NeedsDualRow label="קצבת זקנה ב.לאומי" p={needs.incomeBituachPrimary} s={needs.incomeBituachSpouse} onP={value => update('incomeBituachPrimary', value)} onS={value => update('incomeBituachSpouse', value)} />
                    <NeedsDualRow label="פנסיה עתידית" p={needs.incomePensionPrimary} s={needs.incomePensionSpouse} onP={value => update('incomePensionPrimary', value)} onS={value => update('incomePensionSpouse', value)} />
                    <NeedsDualRow label="שכר דירה" p={needs.incomeRentPrimary} s={needs.incomeRentSpouse} onP={value => update('incomeRentPrimary', value)} onS={value => update('incomeRentSpouse', value)} />
                    <NeedsDualRow label="אחר" p={needs.incomeOtherPrimary} s={needs.incomeOtherSpouse} onP={value => update('incomeOtherPrimary', value)} onS={value => update('incomeOtherSpouse', value)} />
                  </tbody>
                </table>
                <div style={needsTotalStyle}><span>סה״כ הכנסות נטו</span><strong>{money(primaryIncome)} | {money(spouseIncome)}</strong></div>
              </section>

              <section style={needsCardStyle}>
                <h3 style={sectionTitleStyle}>הוצאות</h3>
                <NeedsInput label="הוצאות קבועות" value={needs.fixedExpenses} onChange={value => update('fixedExpenses', value)} />
                <textarea placeholder="לדוגמה: חשמל, אוכל, ארנונה, ביגוד, תקשורת, משכנתא/הלוואות, שכר דירה" value={needs.fixedNotes} onChange={event => update('fixedNotes', event.target.value)} style={{ ...inputStyle, minHeight: 78 }} />
                <NeedsInput label="הוצאות משתנות" value={needs.variableExpenses} onChange={value => update('variableExpenses', value)} />
                <textarea placeholder="לדוגמה: טיולים, שינויים, בלתי צפוי" value={needs.variableNotes} onChange={event => update('variableNotes', event.target.value)} style={{ ...inputStyle, minHeight: 78 }} />
                <div style={needsTotalStyle}><span>סה״כ הוצאות</span><strong>{money(totalExpenses)}</strong></div>
              </section>

              <section style={needsCardStyle}>
                <h3 style={sectionTitleStyle}>נכסים קיימים משוערים של הזוג</h3>
                <NeedsInput label="בנק" value={needs.assetBank} onChange={value => update('assetBank', value)} />
                <NeedsInput label="תיק השקעות" value={needs.assetPortfolio} onChange={value => update('assetPortfolio', value)} />
                <NeedsInput label="פוליסות חיסכון" value={needs.assetPolicies} onChange={value => update('assetPolicies', value)} />
                <NeedsInput label="קופות גמל" value={needs.assetProvident} onChange={value => update('assetProvident', value)} />
                <NeedsInput label="קרנות השתלמות" value={needs.assetStudyFunds} onChange={value => update('assetStudyFunds', value)} />
                <NeedsInput label="ירושה עתידית" value={needs.assetInheritance} onChange={value => update('assetInheritance', value)} />
                <NeedsInput label='נדל"ן' value={needs.assetRealEstate} onChange={value => update('assetRealEstate', value)} />
                <NeedsInput label="אחר" value={needs.assetOther} onChange={value => update('assetOther', value)} />
                <div style={needsTotalStyle}><span>סה״כ</span><strong>{money(totalAssets)}</strong></div>
              </section>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function KpiCard({ title, value, sub, icon }: { title: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <article style={kpiStyle}>
      <span style={kpiIconStyle}>{icon}</span>
      <span style={{ color: '#7EA0C9', fontWeight: 900 }}>{title}</span>
      <strong style={{ color: 'var(--abd-primary)', fontSize: 26, lineHeight: 1.1 }}>{value}</strong>
      <small style={{ color: 'var(--text-muted)' }}>{sub}</small>
    </article>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const active = isActiveStatus(status)
  return <span style={{ ...statusStyle, background: active ? 'var(--status-active-bg)' : 'var(--status-danger-bg)', color: active ? 'var(--status-active-text)' : 'var(--status-danger-text)' }}>{status || 'לא ידוע'}</span>
}

function ModalCell({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return <div style={modalCellStyle}><span>{label}</span><div style={{ fontWeight: strong ? 900 : 700 }}>{value}</div></div>
}

function FundInsuranceCoveragePanel({ fund }: { fund: FundRecord }) {
  const coverage = fund.insuranceCoverage || {}
  const groups = [
    {
      title: 'פרטי ביטוח כלליים',
      items: [
        ['תאריך ערך לנתונים', coverage.dataValueDate || 'אין נתון'],
        ['עמית מבוטח בקרן פנסיה?', coverage.insuredInPensionFund || 'אין נתון'],
        ['מסלול ביטוח', coverage.insuranceTrack || 'אין נתון'],
      ],
    },
    {
      title: 'שכר קובע',
      items: [
        ['שכר קובע לכיסוי נכות ושאירים', moneyOrEmpty(coverage.salaryForDisabilityAndSurvivors)],
        ['תאריך נכונות שכר קובע', coverage.salaryValidityDate || 'אין נתון'],
      ],
    },
    {
      title: 'עלויות כיסויים',
      items: [
        ['עלות כיסוי נכות', moneyOrEmpty(coverage.disabilityCoverageCost)],
        ['עלות כיסוי שארים', moneyOrEmpty(coverage.survivorsCoverageCost)],
        ['עלות כיסוי פנסיית שארים של נכה', moneyOrEmpty(coverage.disabledSurvivorsPensionCoverageCost)],
      ],
    },
    {
      title: 'שיעורי כיסוי',
      items: [
        ['שיעור כיסוי נכות', percentOrEmpty(coverage.disabilityCoverageRate)],
        ['שיעור כיסוי ביטוחי לאלמן/ת', percentOrEmpty(coverage.widowerCoverageRate)],
        ['שיעור כיסוי ביטוחי ליתום', percentOrEmpty(coverage.orphanCoverageRate)],
        ['שיעור כיסוי ביטוחי להורה נתמך', percentOrEmpty(coverage.supportedParentCoverageRate)],
      ],
    },
    {
      title: 'קצבאות',
      items: [
        ['סך פנסיית נכות (לפי נכות מלאה)', moneyOrEmpty(coverage.fullDisabilityPension)],
        ['קצבת שארים לאלמן/ת', moneyOrEmpty(coverage.widowerSurvivorsPension)],
        ['קצבת שארים ליתום', moneyOrEmpty(coverage.orphanSurvivorsPension)],
        ['קצבת שארים להורה נתמך', moneyOrEmpty(coverage.supportedParentSurvivorsPension)],
      ],
    },
    {
      title: 'ויתורים',
      items: [
        ['ויתור על כיסוי ביטוחי לנכות (מעל גיל 60)', coverage.disabilityCoverageWaiverOver60 || 'אין נתון'],
      ],
    },
  ]

  return (
    <section style={insuranceCoveragePanelStyle}>
      <h3 style={sectionTitleStyle}>כיסוי ביטוחי בקופה</h3>
      <div style={insuranceCoverageGridStyle}>
        {groups.map(group => (
          <article key={group.title} style={insuranceCoverageGroupStyle}>
            <h4>{group.title}</h4>
            {group.items.map(([label, value]) => (
              <div key={label} style={insuranceCoverageRowStyle}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}

function FundActivityTabs({ fund, activeView, onChange }: { fund: FundRecord; activeView: FundActivityView; onChange: (view: FundActivityView) => void }) {
  const depositRows = fund.depositRows || []
  const employers = fund.employers || []
  const beneficiaries = fund.beneficiaries || []

  if (!depositRows.length && !employers.length && !beneficiaries.length) {
    return null
  }

  return (
    <section style={activityPanelStyle}>
      <div style={activityHeaderStyle}>
        <h3 style={sectionTitleStyle}>פעילות הקופה</h3>
        <div style={activityTabsStyle}>
          <button type="button" onClick={() => onChange('employers')} style={activityTabStyle(activeView === 'employers')}>מעסיקים {employers.length}</button>
          <button type="button" onClick={() => onChange('deposits')} style={activityTabStyle(activeView === 'deposits')}>הפקדות {depositRows.length}</button>
          <button type="button" onClick={() => onChange('beneficiaries')} style={activityTabStyle(activeView === 'beneficiaries')}>מוטבים {beneficiaries.length}</button>
        </div>
      </div>

      {activeView === 'employers' && employers.length > 0 && (
        <div style={activityGridStyle}>
          {employers.map((employer, index) => (
            <div key={`${employer.name}-${index}`} style={activityCardStyle}>
              <strong>{employer.name || 'מעסיק לא ידוע'}</strong>
              <span>{employer.idNumber || 'אין מספר מזהה'}</span>
              <small>{employer.isCurrent ? 'מעסיק נוכחי' : 'מעסיק בדוח'}</small>
            </div>
          ))}
        </div>
      )}

      {activeView === 'deposits' && depositRows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={activityTableStyle}>
            <thead>
              <tr>
                <th>חודש שכר</th>
                <th>מעסיק</th>
                <th>תגמולי עובד</th>
                <th>תגמולי מעסיק</th>
                <th>פיצויים</th>
                <th>סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {depositRows.map((row, index) => (
                <tr key={`${row.month}-${index}`}>
                  <td>{row.month || 'אין נתון'}</td>
                  <td>{row.employerName || 'אין נתון'}</td>
                  <td>{money(row.employeeContribution)}</td>
                  <td>{money(row.employerContribution)}</td>
                  <td>{money(row.compensation)}</td>
                  <td><strong>{money(row.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'beneficiaries' && beneficiaries.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={activityTableStyle}>
            <thead>
              <tr>
                <th>שם מוטב</th>
                <th>קרבה</th>
                <th>שיעור</th>
                <th>סוג מוטב</th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((beneficiary, index) => (
                <tr key={beneficiary.id || `${beneficiary.name}-${index}`}>
                  <td>{beneficiary.name || 'אין נתון'}</td>
                  <td>{beneficiary.relationship || 'אין נתון'}</td>
                  <td>{beneficiary.share ? `${beneficiary.share}%` : 'אין נתון'}</td>
                  <td>{beneficiary.type || 'אין נתון'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'employers' && !employers.length && <p style={mutedStyle}>אין מעסיקים להצגה בקופה זו.</p>}
      {activeView === 'deposits' && !depositRows.length && <p style={mutedStyle}>אין הפקדות להצגה בקופה זו.</p>}
      {activeView === 'beneficiaries' && !beneficiaries.length && <p style={mutedStyle}>אין מוטבים להצגה בקופה זו.</p>}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={fieldStyle}><span>{label}</span>{children}</label>
}

function NeedsDualRow({ label, p, s, onP, onS }: { label: string; p: string; s: string; onP: (value: string) => void; onS: (value: string) => void }) {
  return (
    <tr>
      <td>{label}</td>
      <td><input value={p} onChange={event => onP(event.target.value)} style={smallInputStyle} type="number" min="0" step="100" /></td>
      <td><input value={s} onChange={event => onS(event.target.value)} style={smallInputStyle} type="number" min="0" step="100" /></td>
    </tr>
  )
}

function NeedsInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={needsInputRowStyle}><span>{label}</span><input value={value} onChange={event => onChange(event.target.value)} style={smallInputStyle} type="number" min="0" step="100" /></label>
}

function PersonalInput({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string
  value: string
  type?: string
  onChange: (value: string) => void
}) {
  return (
    <label style={personalInputStyle}>
      <span>{label}</span>
      <input
        value={value}
        type={type}
        onChange={event => onChange(event.target.value)}
        style={personalInputFieldStyle}
        dir={type === 'email' ? 'ltr' : undefined}
      />
    </label>
  )
}

const pageStyle: React.CSSProperties = { fontFamily: 'var(--font-main)' }
const welcomeShellStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 1000, minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 22, padding: 'clamp(18px, 3vw, 42px)', background: 'radial-gradient(circle at 76% 18%, rgba(37,99,235,.14), transparent 32%), linear-gradient(135deg, #FFFFFF 0%, #F7FBFF 46%, #EEF7FF 100%)', border: 0, borderRadius: 0, boxShadow: 'none', overflow: 'auto' }
const welcomeTopStripStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '14px 16px', border: '1px solid #D7EAFB', borderRadius: 20, background: 'rgba(255,255,255,.82)', color: 'var(--abd-primary)', boxShadow: '0 10px 28px rgba(27,58,107,.06)' }
const welcomeStripButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 38, border: 0, borderRadius: 12, background: 'var(--abd-accent)', color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 900, padding: '0 14px', cursor: 'pointer' }
const welcomeHeroGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(380px, .82fr) minmax(520px, 1.18fr)', gap: 34, alignItems: 'center' }
const welcomeBrandStyle: React.CSSProperties = { display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 18, color: 'var(--abd-primary)' }
const welcomeLogoFrameStyle: React.CSSProperties = { width: 'min(420px, 70vw)', aspectRatio: '1.68 / 1', display: 'grid', placeItems: 'center', borderRadius: 18, background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F7FF 100%)', boxShadow: '0 24px 70px rgba(27,58,107,.12)' }
const welcomeLogoStyle: React.CSSProperties = { width: '72%', maxHeight: 240, objectFit: 'contain', filter: 'drop-shadow(0 18px 24px rgba(27,58,107,.10))' }
const welcomeTitleStyle: React.CSSProperties = { margin: 0, fontSize: 'clamp(46px, 5.6vw, 82px)', lineHeight: 1.02, fontWeight: 900, color: 'var(--abd-primary)', letterSpacing: 0 }
const welcomeTextStyle: React.CSSProperties = { maxWidth: 760, margin: 0, color: '#6F8DB5', lineHeight: 1.85, fontSize: 18, fontWeight: 800 }
const welcomeFeatureGridStyle: React.CSSProperties = { width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 4 }
const welcomeFeatureStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '5px 10px', padding: 17, border: '1px solid #D7EAFB', borderRadius: 18, background: 'rgba(255,255,255,.82)', color: 'var(--abd-primary)', boxShadow: 'var(--shadow-card)', textAlign: 'right' }
const welcomeUploadCardStyle: React.CSSProperties = { minHeight: 370, display: 'grid', gap: 16, alignContent: 'center', justifyItems: 'center', textAlign: 'center', padding: 'clamp(26px, 4vw, 48px)', border: '1px dashed #9CCDF5', borderRadius: 30, background: 'linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(248,251,255,.94) 100%)', boxShadow: '0 24px 64px rgba(27, 58, 107, .12)' }
const welcomeUploadIconStyle: React.CSSProperties = { width: 72, height: 72, borderRadius: 24, display: 'grid', placeItems: 'center', color: 'var(--abd-primary)', background: 'linear-gradient(180deg, #EAF4FF 0%, #D8ECFF 100%)', border: '1px solid #CFE6FA', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)' }
const welcomePrimaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, minWidth: 190, border: 0, borderRadius: 15, background: 'var(--abd-accent)', color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 900, padding: '0 18px', cursor: 'pointer', fontSize: 17, boxShadow: '0 14px 28px rgba(37,99,235,.22)' }
const welcomeStatusStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: '12px 16px', border: '1px solid #D7EAFB', borderRadius: 16, background: '#FFFFFF', color: 'var(--abd-primary)' }
const welcomeFlowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, padding: 10, border: '1px solid #D7EAFB', borderRadius: 18, background: 'rgba(255,255,255,.82)', color: 'var(--abd-primary)', fontWeight: 900, textAlign: 'center' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 20 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 34, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: '#7898C2', lineHeight: 1.7 }
const actionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const primaryButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 42, border: 0, borderRadius: 13, background: 'var(--abd-accent)', color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 900, padding: '0 16px', cursor: 'pointer' }
const disabledButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: '#CBD5E1', cursor: 'not-allowed' }
const ghostButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: '#fff', color: 'var(--abd-primary)', border: '1px solid #CFE6FA' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14, marginBottom: 18 }
const kpiStyle: React.CSSProperties = { display: 'grid', gap: 8, minHeight: 132, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 18, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }
const kpiIconStyle: React.CSSProperties = { width: 34, height: 24, display: 'inline-grid', placeItems: 'center', borderRadius: 12, background: '#DBEEFF', color: 'var(--abd-accent)' }
const tabBarStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 8, marginBottom: 24, boxShadow: 'var(--shadow-card)' }
const tabStyle: React.CSSProperties = { textDecoration: 'none', color: 'var(--abd-primary)', fontWeight: 900, borderRadius: 12, padding: '12px 18px' }
const activeTabStyle: React.CSSProperties = { ...tabStyle, color: '#fff', background: 'var(--abd-primary)' }
const tableCardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #D7EAFB', borderRadius: 20, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }
const toolbarStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid #E6EEF7' }
const tableScrollStyle: React.CSSProperties = { overflowX: 'auto', scrollbarGutter: 'stable' }
const tableStyle: React.CSSProperties = { width: 'max-content', minWidth: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '0 8px', padding: '10px 0' }
const thStyle: React.CSSProperties = { position: 'relative', padding: '14px 15px', textAlign: 'right', fontSize: 15, lineHeight: 1.35, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--abd-primary)', background: '#E7F4FF', borderBottom: '1px solid #CFE6FA', userSelect: 'none' }
const headerLabelStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7 }
const dragGripStyle: React.CSSProperties = { color: '#7EA0C9', fontWeight: 900, letterSpacing: -2, cursor: 'grab' }
const resizeHandleStyle: React.CSSProperties = { position: 'absolute', top: 8, bottom: 8, left: 0, width: 7, borderLeft: '2px solid #B8DDF6', cursor: 'col-resize', opacity: 0.8 }
const tdStyle: React.CSSProperties = { padding: '13px 15px', color: 'var(--text-body)', fontSize: 16, lineHeight: 1.45, fontWeight: 700, verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis' }
const checkboxStyle: React.CSSProperties = { width: 16, height: 16, accentColor: 'var(--abd-accent)', cursor: 'pointer' }
const pillStyle: React.CSSProperties = { display: 'inline-flex', justifyContent: 'center', minWidth: 86, border: '1px solid #B9DDF7', borderRadius: 999, padding: '6px 12px', color: 'var(--abd-primary)', fontWeight: 900, background: '#F8FBFF' }
const targetButtonStyle = (value?: string): React.CSSProperties => ({ ...pillStyle, cursor: 'pointer', background: value === 'משוך קצבה' ? '#E5F8EE' : '#F8FBFF', borderColor: value === 'משוך קצבה' ? '#93E0B3' : '#B9DDF7', color: value === 'משוך קצבה' ? '#047857' : 'var(--abd-primary)' })
const emptyCellStyle: React.CSSProperties = { padding: 34, textAlign: 'center', color: 'var(--text-muted)' }
const statusStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '5px 11px', fontSize: 13, fontWeight: 900 }
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'start center', overflowY: 'auto', background: 'rgba(191,219,254,0.55)', backdropFilter: 'blur(2px)', padding: '72px 24px 24px' }
const fundModalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'rgba(191,219,254,0.55)', backdropFilter: 'blur(2px)', padding: 28, boxSizing: 'border-box' }
const modalStyle: React.CSSProperties = { position: 'relative', width: 'min(860px, 96vw)', maxHeight: 'calc(100dvh - 96px)', overflow: 'auto', background: '#fff', border: '1px solid #D7EAFB', borderRadius: 24, padding: 24, boxShadow: '0 24px 70px rgba(15,25,41,0.18)' }
const fundModalStyle: React.CSSProperties = { ...modalStyle, width: 'min(1320px, calc(100vw - 56px))', maxHeight: 'calc(100dvh - 56px)', padding: 30, boxSizing: 'border-box' }
const modalCloseStyle: React.CSSProperties = { position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: 14, border: '1px solid #CFE6FA', background: '#fff', color: 'var(--abd-primary)', fontSize: 24, cursor: 'pointer' }
const modalHeaderStyle: React.CSSProperties = { textAlign: 'center', marginBottom: 18 }
const modalTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 26, fontWeight: 900 }
const modalGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', border: '1px solid #D7EAFB', borderRadius: 16, overflow: 'hidden' }
const modalCellStyle: React.CSSProperties = { minHeight: 82, display: 'grid', gap: 6, alignContent: 'center', justifyItems: 'center', padding: 12, borderLeft: '1px solid #E6EEF7', borderBottom: '1px solid #E6EEF7', textAlign: 'center', color: 'var(--abd-primary)' }
const trackBoxStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: 14, alignItems: 'center', border: '1px solid #D7EAFB', borderRadius: 14, padding: 14, marginTop: 14, color: 'var(--abd-primary)' }
const trackActionsStyle: React.CSSProperties = { display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }
const editPanelStyle: React.CSSProperties = { display: 'grid', gap: 12, border: '1px solid #D7EAFB', borderRadius: 16, padding: 16, marginTop: 14, background: '#FBFDFF' }
const editGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }
const smallButtonStyle: React.CSSProperties = { ...ghostButtonStyle, minHeight: 36, padding: '0 12px' }
const miniDangerStyle: React.CSSProperties = { border: '1px solid #F5B5B5', borderRadius: 10, background: '#FFF5F5', color: '#B42318', width: 34, minHeight: 34, fontWeight: 900, cursor: 'pointer' }
const insuranceCoveragePanelStyle: React.CSSProperties = { display: 'grid', gap: 12, border: '1px solid #D7EAFB', borderRadius: 16, padding: 16, marginTop: 14, background: '#FFFFFF', color: 'var(--abd-primary)' }
const insuranceCoverageGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }
const insuranceCoverageGroupStyle: React.CSSProperties = { display: 'grid', gap: 8, border: '1px solid #E3F0FB', borderRadius: 14, padding: 12, background: '#F8FBFF' }
const insuranceCoverageRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', borderBottom: '1px solid #E6EEF7', paddingBottom: 7, fontWeight: 800 }
const activityPanelStyle: React.CSSProperties = { display: 'grid', gap: 12, border: '1px solid #D7EAFB', borderRadius: 16, padding: 16, marginTop: 14, background: '#FFFFFF' }
const activityHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }
const activityTabsStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const activityTabStyle = (active: boolean): React.CSSProperties => ({ border: '1px solid #CFE6FA', borderRadius: 999, background: active ? 'var(--abd-accent)' : '#FFFFFF', color: active ? '#FFFFFF' : 'var(--abd-primary)', padding: '7px 12px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' })
const activityGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }
const activityCardStyle: React.CSSProperties = { display: 'grid', gap: 4, border: '1px solid #D7EAFB', borderRadius: 12, padding: 12, color: 'var(--abd-primary)', background: '#F8FBFF' }
const activityTableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', color: 'var(--abd-primary)', fontSize: 13 }
const recommendationPanelStyle: React.CSSProperties = { display: 'grid', gap: 12, border: '1px solid #D7EAFB', borderRadius: 16, padding: 16, marginTop: 14, background: '#F8FBFF' }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 21, fontWeight: 900 }
const recommendationButtonsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }
const recommendationActionButtonStyle = (active: boolean): React.CSSProperties => ({
  display: 'grid',
  gap: 5,
  minHeight: 78,
  border: active ? '1px solid var(--abd-accent)' : '1px solid #CFE6FA',
  borderRadius: 16,
  background: active ? 'linear-gradient(180deg, #EAF4FF 0%, #D8ECFF 100%)' : '#FFFFFF',
  color: 'var(--abd-primary)',
  padding: 12,
  textAlign: 'right',
  fontFamily: 'var(--font-main)',
  cursor: 'pointer',
  boxShadow: active ? '0 10px 24px rgba(37, 99, 235, 0.16)' : '0 4px 14px rgba(15,25,41,0.05)',
})
const mappingNoticeStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', border: '1px solid #CFE6FA', borderRadius: 14, padding: '10px 12px', background: '#FFFFFF', color: 'var(--abd-primary)' }
const lockedProductStyle: React.CSSProperties = { width: '100%', minHeight: 42, border: '1px solid #CFE6FA', borderRadius: 12, padding: '9px 12px', background: '#EFF6FF', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', display: 'flex', alignItems: 'center', fontWeight: 900 }
const recommendationGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const sourceSelectionStyle: React.CSSProperties = { display: 'grid', gap: 10, border: '1px solid #D7EAFB', borderRadius: 14, padding: 12, background: '#FFFFFF', color: 'var(--abd-primary)' }
const sourceSelectionHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontWeight: 900 }
const sourceModeButtonsStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const sourceModeButtonStyle = (active: boolean): React.CSSProperties => ({ border: '1px solid #CFE6FA', borderRadius: 999, background: active ? 'var(--abd-accent)' : '#F8FBFF', color: active ? '#FFFFFF' : 'var(--abd-primary)', padding: '8px 14px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' })
const sourcePartsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }
const sourcePartStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8, border: '1px solid #E3F0FB', borderRadius: 12, padding: '9px 10px', background: '#F8FBFF', fontWeight: 800 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 7, color: 'var(--abd-primary)', fontWeight: 900 }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 42, border: '1px solid #CFE6FA', borderRadius: 12, padding: '9px 12px', background: '#fff', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)' }
const returnsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, padding: 12, borderRadius: 12, background: '#EFF6FF', color: 'var(--abd-primary)' }
const savedRecommendationStyle: React.CSSProperties = { display: 'grid', gap: 5, border: '1px solid #D7EAFB', borderRadius: 12, padding: 12, background: '#fff', color: 'var(--abd-primary)' }
const savedRecommendationHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }
const copyNumberStyle: React.CSSProperties = { border: 0, background: 'transparent', color: 'var(--abd-primary)', fontWeight: 900, cursor: 'pointer', fontFamily: 'var(--font-main)', padding: 0 }
const screenHeaderStyle: React.CSSProperties = { borderBottom: '1px solid #D7EAFB', marginBottom: 18, paddingBottom: 14 }
const needsSummaryStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }
const cashflowBarStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr minmax(260px, 360px) 1.2fr', gap: 14, alignItems: 'center', marginBottom: 18, padding: 18, border: '1px solid #CFE6FA', borderRadius: 22, background: 'linear-gradient(135deg, #FFFFFF 0%, #F4FAFF 58%, #EAF4FF 100%)', color: 'var(--abd-primary)', boxShadow: '0 14px 36px rgba(27,58,107,.08)' }
const needsLayoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))', gap: 18, alignItems: 'start' }
const needsCardStyle: React.CSSProperties = { display: 'grid', gap: 12, background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)', border: '1px solid #D7EAFB', borderRadius: 22, padding: 20, boxShadow: '0 14px 36px rgba(15,25,41,.07)' }
const needsTableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', color: 'var(--abd-primary)' }
const smallInputStyle: React.CSSProperties = { width: '100%', minHeight: 40, border: '1px solid #CFE6FA', borderRadius: 12, padding: '7px 11px', color: 'var(--abd-primary)', background: '#FBFDFF', fontFamily: 'var(--font-main)', fontWeight: 800 }
const needsInputRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 10, alignItems: 'center', marginTop: 10, padding: 10, border: '1px solid #E3F0FB', borderRadius: 14, background: '#FBFDFF', color: 'var(--abd-primary)', fontWeight: 800 }
const needsTotalStyle: React.CSSProperties = { marginTop: 14, padding: 14, borderRadius: 16, background: 'linear-gradient(180deg, #F8EBCB, #EEDAAE)', display: 'flex', justifyContent: 'space-between', color: '#835A11', fontWeight: 900, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' }
const personalLayoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }
const personalCardStyle: React.CSSProperties = { display: 'grid', gap: 12, background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)', border: '1px solid #D7EAFB', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-card)' }
const personalCardHeadStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E6EEF7', color: 'var(--abd-primary)' }
const personalInputStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, alignItems: 'center', color: 'var(--abd-primary)', fontWeight: 900 }
const personalInputFieldStyle: React.CSSProperties = { minHeight: 42, border: '1px solid #CFE6FA', borderRadius: 13, background: '#fff', color: 'var(--abd-primary)', padding: '8px 12px', fontFamily: 'var(--font-main)', fontWeight: 800 }
const personalFooterStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 18, padding: 16, border: '1px solid #D7EAFB', borderRadius: 18, background: '#F4FAFF', color: 'var(--abd-primary)', fontWeight: 800 }

