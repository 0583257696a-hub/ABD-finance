import JSZip from 'jszip'
import * as XLSX from 'xlsx'

export type ClientRecord = {
  firstName?: string
  lastName?: string
  fullName?: string
  idNumber?: string
  birthDate?: string
  issueDate?: string
  email?: string
  phone?: string
  address?: string
  gender?: string
  age?: number | null
}

export type FundRecord = {
  id: string
  genderScore?: string
  manufacturer?: string
  productType?: string
  productName?: string
  planName?: string
  accountNumber?: string
  memberNumber?: string
  employer?: string
  standing?: string
  investmentTrack?: string
  managementFeeText?: string
  depositFee?: string
  balanceFee?: string
  status?: string
  currentBalance?: number
  trend?: string
  startDate?: string
  joinDate?: string
  liquidityDate?: string
  pensionBalance?: number
  compensationBalance?: number
  monthlyDeposit?: number
  retirementCapital?: number
  importedPension?: number
  guaranteedCoefficient?: number
  retirementAge?: number
  retirementTrackName?: string
  managementFeeDepositText?: string
  managementFeeBalanceText?: string
  employers?: Array<{ idNumber?: string; name?: string; isCurrent?: boolean }>
  depositRows?: Array<{
    employerName?: string
    employerId?: string
    month?: string
    contributionCodes?: string[]
    depositorCodes?: string[]
    employeeContribution?: number
    employerContribution?: number
    compensation?: number
    total?: number
  }>
  periodRows?: Array<{
    id: string
    productType?: string
    manufacturer?: string
    periodCode?: string
    periodLabel?: string
    componentCode?: string
    componentLabel?: string
    balanceTypeCode?: string
    balanceTypeLabel?: string
    amount?: number
    benefitCap?: string
  }>
  beneficiaries?: Array<{ id: string; name?: string; relationship?: string; share?: number; type?: string }>
  recommendationTemplateId?: string
  migrationPlan?: {
    targetProduct?: string
    targetCompany?: string
    managementFeeBalance?: string
    managementFeeDeposit?: string
    investmentTrackId?: string
    investmentTrack?: string
    targetTrack?: string
    targetTrackNumber?: string
    targetTrackReturns?: unknown
    reason?: string
    professionalNotes?: string
  }
  recommendation?: string
  notes?: string
}

export type InsurancePolicyRecord = {
  id: string
  source?: string
  sourceLabel?: string
  manufacturer?: string
  company?: string
  mainBranch?: string
  secondaryBranch?: string
  itemClass?: string
  policyNumber?: string
  productType?: string
  insuranceType?: string
  policyName?: string
  planName?: string
  periodText?: string
  premium?: number
  premiumText?: string
  premiumType?: string
  status?: string
  startDate?: string
  endDate?: string
  coverageAmount?: number
  coverageAmountText?: string
  exportDate?: string
  moreDetails?: string
}

export type ImportResult = {
  client?: ClientRecord
  funds: FundRecord[]
  insurancePolicies: InsurancePolicyRecord[]
  messages: string[]
  derivedFactor?: number
}

function cleanText(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalize(value: unknown) {
  return cleanText(value)
    .replace(/["'״׳]/g, '')
    .replace(/[./\\()[\]{}:;|_\-]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function numeric(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/[^\d.,-]/g, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function account(value: unknown) {
  return cleanText(value).replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

function trimLeadingZeros(value: unknown) {
  return cleanText(value).replace(/^0+(?=\d)/, '')
}

function normalizeDigits(value: unknown) {
  return cleanText(value).replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

function pick(record: Record<string, unknown>, aliases: string[]) {
  const keys = Object.keys(record)
  const aliasSet = aliases.map(normalize)
  const exact = keys.find(key => aliasSet.includes(normalize(key)))
  if (exact) return cleanText(record[exact])
  const partial = keys.find(key => {
    const normalizedKey = normalize(key)
    return aliasSet.some(alias => normalizedKey.includes(alias) || alias.includes(normalizedKey))
  })
  return partial ? cleanText(record[partial]) : ''
}

function pickExact(record: Record<string, unknown>, aliases: string[]) {
  const keys = Object.keys(record)
  const aliasSet = aliases.map(normalize)
  const exact = keys.find(key => aliasSet.includes(normalize(key)))
  return exact ? cleanText(record[exact]) : ''
}

function pickNumber(record: Record<string, unknown>, aliases: string[]) {
  return numeric(pick(record, aliases))
}

function round(value: number, digits = 2) {
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

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>()
  items.forEach(item => {
    const key = getKey(item)
    if (!key) return
    map.set(key, [...(map.get(key) || []), item])
  })
  return map
}

function mergeClientRecords(baseClient?: ClientRecord | null, incomingClient?: ClientRecord | null): ClientRecord | undefined {
  if (!baseClient) return incomingClient || undefined
  if (!incomingClient) return baseClient
  return {
    ...baseClient,
    ...Object.fromEntries(Object.entries(incomingClient).filter(([, value]) => value !== undefined && value !== null && value !== '')),
  }
}

export function shouldMergeClientRecords(baseClient?: ClientRecord | null, nextClient?: ClientRecord | null) {
  if (!nextClient || !baseClient) return true
  const currentId = normalizeDigits(baseClient.idNumber)
  const nextId = normalizeDigits(nextClient.idNumber)
  if (currentId && nextId) return currentId === nextId
  const currentName = normalize(baseClient.fullName || [baseClient.firstName, baseClient.lastName].filter(Boolean).join(' '))
  const nextName = normalize(nextClient.fullName || [nextClient.firstName, nextClient.lastName].filter(Boolean).join(' '))
  return !currentName || !nextName || currentName === nextName
}

export function assertSameClientUpload(baseClient?: ClientRecord | null, nextClient?: ClientRecord | null) {
  if (!nextClient || !baseClient) return
  const currentId = normalizeDigits(baseClient.idNumber)
  const nextId = normalizeDigits(nextClient.idNumber)
  if (currentId && nextId && currentId !== nextId) {
    throw new Error(`לא ניתן להעלות קבצים של לקוחות שונים. הלקוח הנוכחי: ${currentId}, הקובץ שהועלה: ${nextId}`)
  }
  if (!shouldMergeClientRecords(baseClient, nextClient)) {
    throw new Error('לא ניתן להעלות קבצים של לקוחות שונים')
  }
}

function formatMoneyText(value: number) {
  return Number(value || 0).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  })
}

function allRows(workbook: XLSX.WorkBook, sheetName: string) {
  return XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw: false,
  })
}

function rowsToRecords(rows: unknown[][], headerIndex: number) {
  const headers = (rows[headerIndex] || []).map(cleanText)
  return rows.slice(headerIndex + 1)
    .map(row => {
      const record: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        if (header) record[header] = Array.isArray(row) ? row[index] : ''
      })
      return record
    })
    .filter(record => Object.values(record).some(cleanText))
}

function recordsFromRows(rows: unknown[][], headerRowIndex = 0, prefixRowIndex?: number) {
  const prefixRow = prefixRowIndex === undefined ? [] : (rows[prefixRowIndex] || []).map(cleanText)
  const headers = (rows[headerRowIndex] || []).map((cell, index) => {
    const header = cleanText(cell)
    const prefix = cleanText(prefixRow[index])
    return [prefix, header].filter(Boolean).join(prefix && header ? ' | ' : '')
  })
  const seen = new Map<string, number>()
  const uniqueHeaders = headers.map(header => {
    if (!header) return ''
    const count = seen.get(header) || 0
    seen.set(header, count + 1)
    return count ? `${header} ${count + 1}` : header
  })
  return rows.slice(headerRowIndex + 1)
    .map(row => {
      const record: Record<string, unknown> = {}
      uniqueHeaders.forEach((header, index) => {
        if (header) record[header] = Array.isArray(row) ? row[index] : ''
      })
      return record
    })
    .filter(record => Object.values(record).some(cleanText))
}

function findHeaderIndex(rows: unknown[][], required: string[], minScore = 2) {
  let bestIndex = -1
  let bestScore = 0
  rows.forEach((row, index) => {
    if (!Array.isArray(row)) return
    const cells = row.map(normalize)
    const score = required.reduce(
      (sum, requiredName) => sum + (cells.some(cell => cell.includes(normalize(requiredName))) ? 1 : 0),
      0,
    )
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })
  return bestScore >= minScore ? bestIndex : -1
}

function sheetObjects(workbook: XLSX.WorkBook, nameAliases: string[], headerHints: string[]) {
  const byName = workbook.SheetNames.find(sheetName => {
    const normalized = normalize(sheetName)
    return nameAliases.some(alias => normalized.includes(normalize(alias)))
  })
  const candidates = byName ? [byName, ...workbook.SheetNames.filter(name => name !== byName)] : workbook.SheetNames
  for (const sheetName of candidates) {
    const rows = allRows(workbook, sheetName)
    const headerIndex = findHeaderIndex(rows, headerHints, Math.min(2, headerHints.length))
    if (headerIndex >= 0) return rowsToRecords(rows, headerIndex)
  }
  return []
}

function sheetObjectsStrict(workbook: XLSX.WorkBook, sheetAliases: string[], headerHints: string[]) {
  const sheetName = workbook.SheetNames.find(name => {
    const normalized = normalize(name)
    return sheetAliases.some(alias => normalized.includes(normalize(alias)))
  })
  if (!sheetName) return []
  const rows = allRows(workbook, sheetName)
  const headerIndex = findHeaderIndex(rows, headerHints, 1)
  return headerIndex >= 0 ? rowsToRecords(rows, headerIndex) : []
}

function sheetRecordsByName(
  workbook: XLSX.WorkBook,
  sheetAliases: string[],
  options: { headerRowIndex?: number; prefixRowIndex?: number } = {},
) {
  const sheetName = workbook.SheetNames.find(name => {
    const normalized = normalize(name)
    return sheetAliases.some(alias => normalized === normalize(alias) || normalized.includes(normalize(alias)))
  })
  if (!sheetName) return []
  return recordsFromRows(allRows(workbook, sheetName), options.headerRowIndex || 0, options.prefixRowIndex)
}

function detectHarHabituch(workbook: XLSX.WorkBook) {
  if (detectRetirementWorkbook(workbook)) return false
  return workbook.SheetNames.some(sheetName => findHarHabituchHeaderIndex(allRows(workbook, sheetName).slice(0, 60)) >= 0)
}

function findHarHabituchHeaderIndex(rows: unknown[][]) {
  let bestIndex = -1
  let bestScore = 0
  rows.forEach((row, index) => {
    if (!Array.isArray(row)) return
    const cells = row.map(cell => normalize(cell))
    const hasPolicyNumber = cells.some(cell =>
      cell.includes(normalize('מספר פוליסה')) ||
      cell.includes(normalize("מס' פוליסה")) ||
      cell.includes(normalize('מס פוליסה')) ||
      cell.includes(normalize('פוליסה')),
    )
    if (!hasPolicyNumber) return
    let score = 0
    if (hasPolicyNumber) score += 3
    if (cells.some(cell => cell.includes(normalize('חברה')) || cell.includes(normalize('מבטח')))) score += 3
    if (cells.some(cell => cell.includes(normalize('ענף')) || cell.includes(normalize('תחום')))) score += 2
    if (cells.some(cell => cell.includes(normalize('פרמיה')) || cell.includes(normalize('דמי ביטוח')))) score += 2
    if (cells.some(cell => cell.includes(normalize('תוכנית')) || cell.includes(normalize('תכנית')))) score += 1
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })
  return bestScore >= 5 ? bestIndex : -1
}

function detectRetirementWorkbook(workbook: XLSX.WorkBook) {
  const sheetNames = workbook.SheetNames.map(normalize)
  if (sheetNames.some(name => name.includes(normalize('פרטי המוצרים שלי')))) return true
  if (sheetNames.some(name => name.includes(normalize('מעקב הפקדות')))) return true
  return workbook.SheetNames.some(sheetName => {
    const rows = allRows(workbook, sheetName).slice(0, 8)
    return rows.some(row => {
      const line = Array.isArray(row) ? row.map(cleanText).join(' ') : ''
      return line.includes('שם מוצר') && line.includes('שם חברה מנהלת') && line.includes('סך הכל חיסכון')
    })
  })
}

function inferProductType(text: string) {
  const value = cleanText(text)
  if (/חיסכון\s*לכל\s*ילד|חסכון\s*לכל\s*ילד/.test(value)) return 'חיסכון לכל ילד'
  if (/פנסיה|מקפת/.test(value)) return 'קרן פנסיה'
  if (/השתלמות/.test(value)) return 'קרן השתלמות'
  if (/גמל להשקעה/.test(value)) return 'קופת גמל להשקעה'
  if (/גמל/.test(value)) return 'קופת גמל'
  if (/מנהלים|ביטוח/.test(value)) return 'ביטוח מנהלים'
  return 'מוצר פנסיוני'
}

function isSavingsFund(productName: string, currentBalance: number) {
  const name = cleanText(productName)
  if (/סיכון טהור|ריסק|אכע|אובדן כושר|קולקטיב חיים/.test(name)) return false
  return currentBalance > 0 || /פנסיה|גמל|השתלמות|מנהלים|חיסכון|מקפת/.test(name)
}

function parseClient(row: Record<string, unknown>): ClientRecord {
  const firstName = pick(row, ['שם פרטי', 'פרטי'])
  const lastName = pick(row, ['שם משפחה', 'משפחה'])
  return {
    firstName,
    lastName,
    fullName: pick(row, ['שם מלא', 'שם לקוח', 'לקוח']) || [firstName, lastName].filter(Boolean).join(' '),
    idNumber: account(pick(row, ['מספר מזהה', 'תעודת זהות', 'ת.ז.', 'תז', 'מספר זהות'])),
    birthDate: pick(row, ['תאריך לידה', 'תאריך לידה מבוטח', 'לידה']),
    issueDate: pick(row, ['תאריך הנפקה', 'תאריך הנפקת תעודה']),
    email: pick(row, ['אימייל', 'דואר אלקטרוני', 'מייל']),
    phone: pick(row, ['טלפון', 'נייד', 'מספר פלאפון', 'סלולרי']),
    address: pick(row, ['כתובת']),
    gender: pick(row, ['מין']),
    age: pickNumber(row, ['גיל']) || null,
  }
}

function parseRetirementWorkbook(workbook: XLSX.WorkBook, fileName: string): ImportResult {
  const productRows = sheetObjectsStrict(
    workbook,
    ['פרטי המוצרים שלי', 'מוצרי חיסכון', 'מוצרים', 'חיסכון', 'קופות'],
    ['שם מוצר', 'שם חברה מנהלת', 'מספר פוליסה'],
  )
  const standardProductRows = sheetRecordsByName(workbook, ['מוצרי חיסכון'])
  const standardBalanceRows = sheetRecordsByName(workbook, ['יתרות'])
  const standardPeriodRows = sheetRecordsByName(workbook, ['יתרות לפי תקופה'])
  const standardRetirementRows = sheetRecordsByName(workbook, ['יתרות לפי גיל פרישה'], { prefixRowIndex: 0, headerRowIndex: 1 })
  const standardBeneficiaryRows = sheetRecordsByName(workbook, ['מוטבים'])
  const balanceRows = standardBalanceRows.length
    ? standardBalanceRows
    : sheetObjectsStrict(
      workbook,
      ['יתרות', 'יתרה'],
      ['מספר פוליסה', 'יתרה', 'צבירה'],
    )
  const depositRows = sheetObjectsStrict(
    workbook,
    ['מעקב הפקדות', 'הפקדות'],
    ['סוג מוצר', 'שם חברה מנהלת', 'מספר פוליסה'],
  )
  const coverageRows = sheetObjectsStrict(
    workbook,
    ['כיסויים ביטוחיים', 'כיסויים', 'ביטוחיים'],
    ['סוג הכיסוי הביטוחי', 'שם התוכנית', 'מס׳ פוליסה'],
  )
  const clientRows = sheetObjects(
    workbook,
    ['פרטי לקוח', 'לקוח'],
    ['שם פרטי', 'שם משפחה', 'תעודת זהות'],
  )

  const effectiveProductRows = standardProductRows.length ? standardProductRows : productRows
  const balances = new Map<string, number>()
  balanceRows.forEach(row => {
    const key = account(pick(row, [
      "מס' פוליסה/חשבון",
      'מס פוליסה/חשבון',
      'מספר פוליסה/חשבון',
      'מספר פוליסה',
      'מספר חשבון',
    ]))
    if (!key) return
    balances.set(key, (balances.get(key) || 0) + pickNumber(row, [
      'סה"כ חיסכון מצטבר',
      'סה"כ ערכי פדיון',
      'ערך פדיון',
      'יתרה',
      'צבירה',
    ]))
  })
  const periodsByAccount = groupBy(standardPeriodRows, row => account(pick(row, ["מס' פוליסה/חשבון", 'מס פוליסה/חשבון', 'מספר פוליסה'])))
  const retirementByAccount = new Map<string, Record<string, unknown>>()
  standardRetirementRows.forEach(row => {
    const key = account(pick(row, ["מס' פוליסה/חשבון", 'מס פוליסה/חשבון', 'מספר פוליסה']))
    if (key) retirementByAccount.set(key, row)
  })
  const beneficiariesByAccount = groupBy(standardBeneficiaryRows, row => account(pick(row, ["מס' פוליסה/חשבון", 'מס פוליסה/חשבון', 'מספר פוליסה'])))

  const funds = effectiveProductRows.map((row, index): FundRecord => {
    const accountNumber = account(pick(row, [
      "מס' פוליסה/חשבון",
      'מס פוליסה/חשבון',
      'מספר פוליסה/חשבון',
      'מספר פוליסה',
      'מספר חשבון',
      'מס קופה',
    ]))
    const retirement = retirementByAccount.get(accountNumber) || {}
    const balanceEntries = balanceRows.filter(balance => account(pick(balance, ["מס' פוליסה/חשבון", 'מס פוליסה/חשבון', 'מספר פוליסה'])) === accountNumber)
    const periodEntries = periodsByAccount.get(accountNumber) || []
    const beneficiaryEntries = beneficiariesByAccount.get(accountNumber) || []
    const productName = pick(row, ['מוצר', 'שם מוצר', 'שם תוכנית', 'שם תכנית', 'תוכנית'])
    const manufacturer = pick(row, ['יצרן', 'חברה מנהלת', 'שם יצרן', 'חברה'])
    const productType = pick(row, ['סוג מוצר', 'סוג', 'סוג קופה']) || inferProductType(productName)
    const investmentTrack = pick(row, ['מסלול השקעה', 'מסלולי השקעה', 'שם מסלול', 'מסלול']) || productName
    const balanceFee = pick(row, ['דמי ניהול מצבירה', 'דמי ניהול נכסים', 'דמי ניהול צבירה', 'שיעור דמי ניהול שנתי מחיסכון צבור'])
    const depositFee = pick(row, ['דמי ניהול מהפקדה', 'דמי ניהול הפקדה', 'שיעור דמי ניהול מהפקדות'])
    const currentBalance =
      firstPositive(
        pickNumber(row, ['צבירה', 'צבירה נוכחית', 'סך הכל חיסכון', 'סה"כ חיסכון מצטבר', 'יתרה']),
        sumBy(balanceEntries, balance => pickNumber(balance, ['סה"כ חיסכון מצטבר'])),
        sumBy(balanceEntries, balance => pickNumber(balance, ['סה"כ ערכי פדיון'])),
        balances.get(accountNumber) || 0,
      ) ||
      0
    const retirementCapital =
      firstPositive(
        pickNumber(retirement, ['קופה משלמת | סה"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (כולל פרמיות עתידיות)']),
        pickNumber(retirement, ['קופה משלמת | סה"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (ללא פרמיות עתידיות)']),
        pickNumber(retirement, ['קופה לא משלמת | סה"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (כולל פרמיות עתידיות)']),
        pickNumber(retirement, ['קופה לא משלמת | סה"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (ללא פרמיות עתידיות)']),
        pickNumber(retirement, ['סה"כ סכום חיסכון מצטבר צפוי בגיל פרישה (כולל פרמיות)']),
        pickNumber(retirement, ['צבירת חיסכון חזויה לגיל פרישה לחישוב (ללא פרמיות)']),
        pickNumber(row, ['חיסכון צפוי לגיל פרישה', 'חיסכון צפוי לגיל פרישה לא כולל פרמיות', 'צבירת חיסכון חזויה לגיל פרישה']),
        currentBalance,
      )
    const importedPension = firstPositive(
      pickNumber(retirement, ['קופה משלמת | סכום קצבת זקנה']),
      pickNumber(retirement, ['קופה משלמת | קצבת זקנה/גמלא חודשית צפויה (ללא פרמיות)']),
      pickNumber(retirement, ['קופה לא משלמת | סכום קצבת זקנה']),
      pickNumber(retirement, ['קופה לא משלמת | קצבת זקנה/גמלא חודשית צפויה (ללא פרמיות)']),
      pickNumber(retirement, ['סכום קצבת זקנה']),
      pickNumber(retirement, ['קצבת זקנה/גמלא חודשית צפויה']),
      pickNumber(row, [
        'קיצבה חודשית לגיל פרישה',
        'קצבה חודשית לגיל פרישה',
        'קיצבה חודשית לגיל פרישה לא כולל פרמיות',
        'קצבה חודשית לגיל פרישה לא כולל פרמיות',
      ]),
      0,
    )
    const guaranteedCoefficient = firstPositive(
      pickNumber(retirement, ['מקדם מובטח לפרישה']),
      importedPension > 0 && retirementCapital > 0 ? retirementCapital / importedPension : 0,
    )
    const calculatedCoefficient = importedPension > 0 && retirementCapital > 0
      ? round(retirementCapital / importedPension, 2)
      : 0
    return {
      id: `${fileName}-fund-${accountNumber || index}`,
      genderScore: pick(row, ['מין', 'ציון', 'Smart Score']) || 'ידי',
      manufacturer,
      productType,
      productName,
      planName: pick(row, ['שם תוכנית', 'שם תכנית']) || productName,
      accountNumber,
      memberNumber: pick(row, ['מספר עמית', 'מס עמית']),
      employer: pickExact(row, ['מעסיק', 'שם מעסיק']),
      standing: pick(row, ['מעמד', 'שכיר/עצמאי']) || 'שכיר',
      investmentTrack,
      balanceFee,
      depositFee,
      managementFeeText: [
        balanceFee ? `צבירה ${balanceFee}` : '',
        depositFee ? `הפקדה ${depositFee}` : '',
      ].filter(Boolean).join(' | ') || 'אין נתון',
      status: pick(row, ['סטטוס', 'מצב']) || 'לא ידוע',
      startDate: pick(row, ['מועד הצטרפות', 'תאריך הצטרפות', 'תאריך תחילת ביטוח']),
      currentBalance,
      joinDate: pick(row, ['מועד הצטרפות', 'תאריך הצטרפות', 'תאריך תחילת ביטוח']),
      liquidityDate: pick(row, ['תחנת משיכה קרובה', 'תאריך נזילות', 'מועד נזילות']),
      pensionBalance: pickNumber(row, ['תגמולים', 'תגמולי עובד', 'תגמולי מעסיק', 'הפקדות חוסך', 'הפקדות מעסיק']),
      compensationBalance: pickNumber(row, ['פיצויים', 'הפקדות מעסיק לפיצויים']),
      monthlyDeposit: pickNumber(row, ['הפקדה שוטפת', 'הפקדה חודשית', 'הפקדות חוסך']) + pickNumber(row, ['הפקדות מעסיק']),
      retirementCapital,
      importedPension,
      guaranteedCoefficient: round(guaranteedCoefficient || calculatedCoefficient, 2),
      retirementAge: pickNumber(retirement, ['גיל פרישה לחישוב']),
      managementFeeDepositText: depositFee,
      managementFeeBalanceText: balanceFee,
      beneficiaries: beneficiaryEntries.map((entry, beneficiaryIndex) => ({
        id: `${accountNumber}-beneficiary-${beneficiaryIndex + 1}`,
        name: [pick(entry, ['שם פרטי']), pick(entry, ['שם משפחה'])].filter(Boolean).join(' '),
        relationship: pick(entry, ['זיקת מוטב למבוטח']),
        share: pickNumber(entry, ['חלק המוטב באחוזים']),
        type: pick(entry, ['מהות מוטב', 'הגדרת מוטב']),
      })),
      periodRows: periodEntries.map((entry, periodIndex) => ({
        id: `${accountNumber}-period-${periodIndex + 1}`,
        periodLabel: pick(entry, ['תקופת יתרה']),
        componentLabel: pick(entry, ['רכיב יתרה לתקופה']),
        balanceTypeLabel: pick(entry, ['סוג יתרה לתקופה']),
        amount: pickNumber(entry, ['סה"כ יתרה תקופה']),
      })),
      trend: currentBalance > 0 ? 'יציב' : 'ללא צבירה',
    }
  }).filter(fund => isSavingsFund(fund.productName || fund.planName || '', fund.currentBalance || 0))

  const fundsByAccount = new Map(funds.map(fund => [account(fund.accountNumber), fund]))
  const depositsByAccount = new Map<string, NonNullable<FundRecord['depositRows']>>()
  depositRows.forEach(row => {
    const accountNumber = account(pick(row, ['מספר פוליסה', 'מס פוליסה', 'מס׳ פוליסה', "מס' פוליסה"]))
    const fund = fundsByAccount.get(accountNumber)
    if (!fund) return
    fund.employer ||= pick(row, ['שם מעסיק', 'מעסיק'])
    const employee = pickNumber(row, ['תגמולי עובד', 'תגמול עובד', 'תג׳ עובד', 'הפקדות עובד', 'הפקדות חוסך'])
    const employer = pickNumber(row, ['תגמולי מעסיק', 'תגמול מעסיק', 'תג׳ מעסיק', 'הפקדות מעסיק'])
    const compensation = pickNumber(row, ['פיצויים', 'הפקדות מעסיק לפיצויים', 'תגמולי פיצויים'])
    const total = employee + employer + compensation
    const depositRow = {
      employerName: pick(row, ['שם מעסיק', 'מעסיק']),
      month: pick(row, ['חודש שכר']),
      employeeContribution: employee,
      employerContribution: employer,
      compensation,
      total,
    }
    const rows = depositsByAccount.get(accountNumber) || []
    rows.push(depositRow)
    depositsByAccount.set(accountNumber, rows)
    if (total > 0) fund.monthlyDeposit = Math.max(Number(fund.monthlyDeposit || 0), total)
  })
  funds.forEach(fund => {
    const rows = depositsByAccount.get(account(fund.accountNumber)) || []
    fund.depositRows = rows
    const latestEmployer = rows.find(row => row.employerName)?.employerName
    if (latestEmployer) {
      fund.employer = latestEmployer
      fund.employers = [{ name: latestEmployer, isCurrent: true }]
    }
  })

  const insurancePolicies = coverageRows.map((row, index): InsurancePolicyRecord => {
    const policyNumber = account(pick(row, ['מספר פוליסה/חשבון', 'מספר פוליסה', 'מס׳ פוליסה', "מס' פוליסה"]))
    const policyName = pick(row, ['שם התוכנית', 'שם תוכנית', 'שם תכנית', 'שם מוצר'])
    const insuranceType = pick(row, ['סוג הכיסוי הביטוחי', 'סוג כיסוי', 'כיסוי'])
    return {
      id: `${fileName}-coverage-${policyNumber || index}`,
      manufacturer: pick(row, ['שם חברה מנהלת/מבטחת', 'שם חברה מנהלת', 'חברה מנהלת', 'חברה מבטחת', 'חברה']),
      company: pick(row, ['שם חברה מנהלת/מבטחת', 'שם חברה מנהלת', 'חברה מנהלת', 'חברה מבטחת', 'חברה']),
      policyNumber,
      insuranceType,
      productType: insuranceType,
      policyName,
      premium: 0,
      coverageAmount: pickNumber(row, ['סכום חד פעמי']) || pickNumber(row, ['קצבה חודשית']),
      status: 'לא ידוע',
      moreDetails: pick(row, ['מקבל התשלום']),
    }
  }).filter(policy => policy.insuranceType && (policy.policyNumber || policy.policyName || policy.manufacturer))

  return {
    client: clientRows[0] ? parseClient(clientRows[0]) : undefined,
    funds,
    insurancePolicies,
    messages: [`${fileName}: נטענו ${funds.length} קופות ו-${insurancePolicies.length} כיסויים/פוליסות`],
  }
}

function parseHarHabituchWorkbook(workbook: XLSX.WorkBook, fileName: string): ImportResult {
  const policies: InsurancePolicyRecord[] = []
  workbook.SheetNames.forEach(sheetName => {
    const rows = allRows(workbook, sheetName)
    const headerIndex = findHarHabituchHeaderIndex(rows)
    if (headerIndex < 0) return
    let currentBranch = ''
    rowsToRecords(rows, headerIndex).forEach((record, index) => {
      const mainBranch = pick(record, ['ענף ראשי', 'תחום ביטוח', 'תחום הביטוח', 'תחום', 'ענף', 'קבוצת ביטוח'])
      const secondaryBranch = pick(record, ['ענף (משני)', 'ענף משני', 'כיסוי', 'שם כיסוי', 'סוג כיסוי'])
      const policyNumber = pick(record, ['מספר פוליסה', "מס' פוליסה", 'מס פוליסה', 'פוליסה', 'מספר הפוליסה', 'מספר חוזה'])
      const manufacturer = pick(record, ['חברה', 'שם חברה', 'חברת ביטוח', 'שם חברת ביטוח', 'שם מבטח', 'מבטח', 'יצרן'])
      const explicitProductType = pick(record, ['סוג מוצר', 'מוצר', 'סוג ביטוח', 'סוג פוליסה'])
      const policyName = pick(record, ['סיווג תכנית', 'סיווג תוכנית', 'שם תוכנית', 'שם תכנית', 'שם פוליסה', 'שם מוצר'])
      const rowHasOnlyBranch = mainBranch.startsWith('תחום') && !policyNumber && !manufacturer && !secondaryBranch && !explicitProductType && !policyName
      if (rowHasOnlyBranch) {
        currentBranch = mainBranch
        return
      }
      const productType = explicitProductType || secondaryBranch || mainBranch
      if (!policyNumber && !manufacturer && !mainBranch && !secondaryBranch && !productType && !policyName) return
      const premium = pickNumber(record, ['פרמיה בש"ח', 'פרמיה חודשית', 'פרמיה', 'דמי ביטוח', 'עלות חודשית'])
      const coverageAmount = pickNumber(record, ['סכום ביטוח', 'סכום ביטוח בש"ח', 'סכום כיסוי', 'גובה כיסוי', 'סכום מבוטח'])
      const branch = mainBranch || currentBranch
      policies.push({
        id: `${fileName}-policy-${sheetName}-${policyNumber || index}`,
        source: 'har-habituach',
        sourceLabel: 'הר הביטוח',
        manufacturer,
        company: manufacturer,
        mainBranch: branch,
        secondaryBranch,
        itemClass: classifyHarHabituachPolicy(branch, productType, policyName),
        policyNumber,
        insuranceType: branch || productType,
        productType,
        policyName,
        planName: policyName,
        periodText: pick(record, ['תקופת ביטוח', 'מועד תחילת ביטוח', 'תאריך תחילה', 'תאריך הצטרפות']),
        premium,
        premiumText: premium ? formatMoneyText(premium) : pick(record, ['פרמיה בש"ח', 'פרמיה חודשית', 'פרמיה', 'דמי ביטוח', 'עלות חודשית']),
        premiumType: pick(record, ['סוג פרמיה', 'תדירות תשלום']),
        coverageAmount,
        coverageAmountText: coverageAmount ? formatMoneyText(coverageAmount) : pick(record, ['סכום ביטוח', 'סכום ביטוח בש"ח', 'סכום כיסוי', 'גובה כיסוי']),
        status: pick(record, ['סטטוס', 'מצב פוליסה']) || 'לא ידוע',
        startDate: pick(record, ['מועד תחילת ביטוח', 'תאריך תחילת ביטוח', 'תאריך תחילה', 'תאריך הצטרפות']),
        endDate: pick(record, ['מועד סיום ביטוח', 'תאריך סיום ביטוח', 'תאריך סיום']),
        exportDate: pick(record, ['תאריך הפקה', 'תאריך הדוח', 'מועד הפקת הדוח']),
        moreDetails: pick(record, ['פרטים נוספים', 'הערות']),
      })
    })
  })

  return {
    funds: [],
    insurancePolicies: policies,
    messages: [`${fileName}: נטענו ${policies.length} פוליסות מהר הביטוח`],
  }
}

function classifyHarHabituachPolicy(mainBranch: string, productType: string, classification: string) {
  const branchText = normalize(mainBranch)
  const combined = normalize(`${productType} ${classification}`)
  if (combined.includes(normalize('מנהלים')) || combined.includes(normalize('פוליסת חיסכון'))) return 'פוליסת חיסכון ביטוחית'
  if (branchText.includes(normalize('פנסיה'))) return 'חיסכון פנסיוני'
  if (
    branchText.includes(normalize('חיים')) ||
    branchText.includes(normalize('בריאות')) ||
    branchText.includes(normalize('תאונות')) ||
    branchText.includes(normalize('סיעוד'))
  ) return 'פוליסת ביטוח'
  return 'פוליסת ביטוח'
}

function tagText(root: Element | Document, names: string[]) {
  for (const name of names) {
    const node = root.getElementsByTagName(name)[0]
    if (node?.textContent?.trim()) return cleanText(node.textContent)
  }
  return ''
}

function firstXmlNode(root: Element | Document | null | undefined, tagName: string) {
  return root?.getElementsByTagName(tagName)[0] || null
}

function xmlNumber(root: Element | Document | null | undefined, names: string[]) {
  if (!root) return 0
  return numeric(tagText(root, names))
}

type ClearinghouseEmployerDirectory = Map<string, { idNumber?: string; taxFile?: string; name?: string }>

function normalizeEmployerIdForDisplay(value: unknown, employerName = '') {
  const normalizedName = normalize(employerName)
  if (normalizedName.includes(normalize('מגדל חברה לביטוח')) || normalizedName.includes(normalize('מגדל לביטוח'))) return '520004896'
  const digits = cleanText(value).replace(/\D/g, '')
  if (!digits) return ''
  const withoutWrapperZeros = digits.length > 9 ? digits.slice(-9) : digits
  return withoutWrapperZeros.length < 9 ? withoutWrapperZeros.padStart(9, '0') : withoutWrapperZeros
}

function registerEmployerDirectoryItem(map: ClearinghouseEmployerDirectory, item: { rawIdNumber?: string; idNumber?: string; taxFile?: string; name?: string }) {
  const keys = [
    item.rawIdNumber,
    trimLeadingZeros(item.rawIdNumber),
    item.idNumber,
    item.taxFile,
    trimLeadingZeros(item.taxFile),
    normalize(item.name),
  ].filter(Boolean) as string[]
  keys.forEach(key => {
    if (!map.has(key)) {
      map.set(key, { idNumber: item.idNumber || '', taxFile: item.taxFile || '', name: item.name || '' })
    }
  })
}

function findEmployerDirectoryItem(map: ClearinghouseEmployerDirectory, rawIdNumber?: string, idNumber?: string, name?: string) {
  const keys = [
    rawIdNumber,
    trimLeadingZeros(rawIdNumber),
    idNumber,
    normalizeEmployerIdForDisplay(rawIdNumber, name),
    normalize(name),
  ].filter(Boolean) as string[]
  for (const key of keys) {
    const item = map.get(key)
    if (item) return item
  }
  return null
}

function buildClearinghouseEmployerDirectory(xml: Document) {
  const directory: ClearinghouseEmployerDirectory = new Map()
  Array.from(xml.getElementsByTagName('YeshutMaasik')).forEach(node => {
    const rawIdNumber = account(tagText(node, ['MPR-MAASIK-BE-YATZRAN', 'MISPAR-MEZAHE-MAASIK', 'MISPAR-ZIHUY-MAASIK', 'MISPAR-ZIHUY-MESHALEM']))
    const taxFile = account(tagText(node, ['MISPAR-TIK-NIKUIIM']))
    const name = tagText(node, ['SHEM-MAASIK'])
    const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name)
    if (!idNumber && !taxFile && !name) return
    registerEmployerDirectoryItem(directory, { rawIdNumber, idNumber, taxFile, name })
  })
  return directory
}

function formatXmlDate(value: unknown) {
  const digits = cleanText(value).replace(/\D/g, '')
  if (digits.length === 8) return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`
  return ''
}

function formatXmlDateForInput(value: unknown) {
  const digits = cleanText(value).replace(/\D/g, '')
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  return ''
}

function formatDepositMonth(value: unknown) {
  const digits = cleanText(value).replace(/\D/g, '')
  if (digits.length >= 6) return `${digits.slice(4, 6)}/${digits.slice(0, 4)}`
  return cleanText(value)
}

function mapClearinghouseStatus(code: unknown) {
  switch (cleanText(code)) {
    case '1':
      return 'פעיל'
    case '2':
      return 'לא פעיל'
    case '3':
      return 'מוקפא'
    default:
      return 'לא ידוע'
  }
}

function mapClearinghouseLayerCode(code: unknown) {
  switch (cleanText(code)) {
    case '1': return 'לפני 2000'
    case '2': return 'עד 2008'
    case '3': return 'אחרי 2008'
    case '4': return 'הון עד 2008'
    case '5': return 'שכבה נוספת'
    case '6': return 'הון עד 2008'
    case '7': return 'הון אחרי 2008'
    case '9': return 'רכיב הוני'
    default: return `שכבה ${cleanText(code) || 'לא ידועה'}`
  }
}

function mapClearinghouseComponentCode(code: unknown) {
  switch (cleanText(code)) {
    case '1': return 'פיצויים'
    case '2': return 'תגמולים'
    case '3': return 'תגמולים לקצבה'
    case '4': return 'תגמולים 47'
    default: return `רכיב ${cleanText(code) || 'לא ידוע'}`
  }
}

function mapClearinghouseBalanceTypeCode(code: unknown) {
  switch (cleanText(code)) {
    case '1': return 'הון'
    case '2': return 'קצבה משלמת'
    case '3': return 'קצבה לא משלמת'
    case '4': return 'חייב'
    default: return `סוג ${cleanText(code) || 'לא ידוע'}`
  }
}

function extractSourceLabelFromFile(fileName: string) {
  const name = String(fileName || '').toUpperCase()
  if (name.includes('KHT') || name.includes('HISHTALMUT')) return 'קרן השתלמות'
  if (name.includes('KGM') || name.includes('GMEL')) return 'קופת גמל'
  if (name.includes('PNO') || name.includes('PNN') || name.includes('PENSION')) return 'קרן פנסיה'
  if (name.includes('ING') || name.includes('BITUAH') || name.includes('INS')) return 'ביטוח / חיסכון'
  return 'מסלקה'
}

function getClearinghouseProductType(entryName: string, planName: string, policyNode: Element) {
  const sourceLabel = extractSourceLabelFromFile(entryName)
  const normalizedPlan = normalize(planName)
  const productCode = tagText(policyNode, ['SUG-MUTZAR', 'SUG-TOCHNIT-O-CHESHBON'])
  if (normalizedPlan.includes(normalize('חיסכון לכל ילד')) || normalizedPlan.includes(normalize('חסכון לכל ילד'))) return 'חיסכון לכל ילד'
  if (normalizedPlan.includes(normalize('גמל להשקעה'))) return 'קופת גמל להשקעה'
  if (sourceLabel === 'קרן פנסיה') return 'קרן פנסיה'
  if (sourceLabel === 'קרן השתלמות' || normalizedPlan.includes(normalize('השתלמות'))) return 'קרן השתלמות'
  if (sourceLabel === 'קופת גמל') return 'קופת גמל'
  if (sourceLabel === 'ביטוח / חיסכון') {
    if (normalizedPlan.includes(normalize('חיסכון')) || normalizedPlan.includes(normalize('מנהלים'))) return 'פוליסה פיננסית'
    return 'ביטוח'
  }
  if (String(productCode) === '1') return 'ביטוח'
  if (String(productCode) === '4') return 'קופת גמל'
  return inferProductType(`${entryName} ${planName}`)
}

function isInsuranceSavingsProduct(productType: string, planName: string) {
  const combined = normalize(`${productType} ${planName}`)
  return combined.includes(normalize('מנהלים')) || combined.includes(normalize('פוליסת חיסכון')) || combined.includes(normalize('חיסכון'))
}

function isRetirementSavingsProduct(productType: string, planName: string) {
  const combined = normalize(`${productType} ${planName}`)
  return combined.includes(normalize('קרן השתלמות')) ||
    combined.includes(normalize('קופת גמל')) ||
    combined.includes(normalize('גמל להשקעה')) ||
    combined.includes(normalize('חיסכון לכל ילד')) ||
    combined.includes(normalize('חסכון לכל ילד')) ||
    combined.includes(normalize('קרן פנסיה')) ||
    combined.includes(normalize('פנסיה'))
}

function shouldIncludeClearinghouseCoverage(productType: string, planName: string, sourceLabel: string) {
  if (isRetirementSavingsProduct(productType, planName)) return false
  return normalize(sourceLabel).includes(normalize('ביטוח')) || isInsuranceSavingsProduct(productType, planName)
}

function isInsuranceLikeCoverageName(coverageName: string, planName: string) {
  const coverage = normalize(coverageName)
  if (!coverage || coverage === normalize(planName)) return false
  return ['ריסק', 'חיים', 'מוות', 'אובדן', 'נכות', 'סיעוד', 'בריאות', 'תאונ', 'מחלות', 'שארים', 'שאיר']
    .some(word => coverage.includes(normalize(word)))
}

function formatFee(value: number) {
  if (!Number.isFinite(value) || value <= 0) return ''
  return `${round(value, 4)}%`
}

function getClearinghouseManagementFees(policyNode: Element, trackNodes: Element[]) {
  const depositFee = firstPositive(
    xmlNumber(policyNode, ['SHEUR-DMEI-NIHUL-HAFKADA', 'SHIUR-DMEI-NIHUL-HAFKADA', 'SHEUR-DMEI-NIHUL-HAFKADA-MIVNE', 'SHIUR-DMEI-NIHUL-HAFKADA-MIVNE']),
    ...trackNodes.map(track => xmlNumber(track, ['SHEUR-DMEI-NIHUL-HAFKADA', 'SHIUR-DMEI-NIHUL-HAFKADA', 'SHEUR-DMEI-NIHUL-HAFKADA-MIVNE', 'SHIUR-DMEI-NIHUL-HAFKADA-MIVNE'])),
    0,
  )
  const balanceFee = firstPositive(
    xmlNumber(policyNode, ['SHEUR-DMEI-NIHUL-HISACHON', 'SHIUR-DMEI-NIHUL-HISACHON', 'SHEUR-DMEI-NIHUL-HISACHON-MIVNE', 'SHIUR-DMEI-NIHUL-HISACHON-MIVNE', 'SHEUR-DMEI-NIHUL-TZVIRA', 'SHIUR-DMEI-NIHUL-TZVIRA']),
    ...trackNodes.map(track => xmlNumber(track, ['SHEUR-DMEI-NIHUL-HISACHON', 'SHIUR-DMEI-NIHUL-HISACHON', 'SHEUR-DMEI-NIHUL-HISACHON-MIVNE', 'SHIUR-DMEI-NIHUL-HISACHON-MIVNE', 'SHEUR-DMEI-NIHUL-TZVIRA', 'SHIUR-DMEI-NIHUL-TZVIRA'])),
    0,
  )
  return {
    depositFee,
    balanceFee,
    depositFeeText: formatFee(depositFee),
    balanceFeeText: formatFee(balanceFee),
    managementFeeText: [
      depositFee > 0 ? `מהפקדה ${formatFee(depositFee)}` : '',
      balanceFee > 0 ? `מצבירה ${formatFee(balanceFee)}` : '',
    ].filter(Boolean).join(' | ') || 'אין נתון',
  }
}

function getClearinghousePolicyManufacturer(policyNode: Element, fallbackManufacturer: string) {
  return tagText(policyNode, ['SHEM-YATZRAN', 'SHEM-GUF-MOSDI', 'SHEM-HEVRA']) || fallbackManufacturer || 'אין יצרן'
}

function extractClearinghouseEmployers(policyNode: Element, employerDirectory: ClearinghouseEmployerDirectory) {
  const employers = new Map<string, { idNumber?: string; name?: string; isCurrent?: boolean }>()
  const activeEmployerIds = new Set<string>()
  Array.from(policyNode.getElementsByTagName('PirteiOved')).forEach(node => {
    const rawIdNumber = account(tagText(node, ['MPR-MAASIK-BE-YATZRAN', 'MISPAR-ZIHUY-MAASIK']))
    const nodeName = tagText(node, ['SHEM-MAASIK'])
    const directoryEntry = findEmployerDirectoryItem(employerDirectory, rawIdNumber, '', nodeName)
    const name = nodeName || directoryEntry?.name || ''
    const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name) || directoryEntry?.idNumber || ''
    const isCurrent = tagText(node, ['STATUS-MAASIK']) === '1'
    if (isCurrent && idNumber) activeEmployerIds.add(idNumber)
    if (!idNumber && !name) return
    const key = idNumber || normalize(name)
    const existing = employers.get(key) || {}
    employers.set(key, { idNumber: existing.idNumber || idNumber, name: existing.name || name, isCurrent: existing.isCurrent || isCurrent })
  })
  Array.from(policyNode.getElementsByTagName('NetuneiGvia')).forEach(node => {
    const rawIdNumber = account(tagText(node, ['MISPAR-ZIHUY-MESHALEM']))
    const nodeName = tagText(node, ['SHEM-MESHALEM'])
    const directoryEntry = findEmployerDirectoryItem(employerDirectory, rawIdNumber, '', nodeName)
    const name = nodeName || directoryEntry?.name || ''
    const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name) || directoryEntry?.idNumber || ''
    if (!idNumber && !name) return
    const key = idNumber || normalize(name)
    if (!employers.has(key)) employers.set(key, { idNumber, name, isCurrent: activeEmployerIds.has(idNumber) })
  })
  if (!employers.size && employerDirectory.size === 1) {
    const onlyEmployer = Array.from(employerDirectory.values())[0]
    employers.set(onlyEmployer.idNumber || normalize(onlyEmployer.name), { ...onlyEmployer, isCurrent: true })
  }
  const list = Array.from(employers.values())
  if (list.length && !list.some(item => item.isCurrent)) list[0].isCurrent = true
  return list
}

function normalizeDepositCode(value: string) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.replace(/^0+(?=\d)/, '')
}

function classifyDepositComponent(node: Element) {
  const depositorCode = normalizeDepositCode(tagText(node, ['SUG-MAFKID', 'SUG-HAMAFKID']))
  const contributionCode = normalizeDepositCode(tagText(node, ['SUG-HAFRASHA', 'KOD-SUG-HAFRASHA', 'KOD-SUG-HAFKADA']))
  const label = normalize([
    tagText(node, ['SHEM-SUG-HAFRASHA', 'TEUR-SUG-HAFRASHA', 'SHEM-REKIV', 'TEUR-REKIV']),
    tagText(node.parentElement || node, ['SHEM-SUG-HAFRASHA', 'TEUR-SUG-HAFRASHA', 'SHEM-REKIV', 'TEUR-REKIV']),
  ].filter(Boolean).join(' '))
  if (label.includes(normalize('פיצויים'))) return 'compensation'
  if (label.includes(normalize('עובד')) || label.includes(normalize('תגמולי עובד'))) return 'employee'
  if (label.includes(normalize('מעסיק')) || label.includes(normalize('מעביד')) || label.includes(normalize('תגמולי מעסיק'))) return 'employer'
  if (['3', '4', '10'].includes(contributionCode)) return 'compensation'
  if (['1', '8'].includes(contributionCode)) return 'employee'
  if (['2', '9'].includes(contributionCode)) return 'employer'
  if (depositorCode === '1') return 'employee'
  if (depositorCode === '2') return 'employer'
  return 'employer'
}

function extractClearinghouseDepositRows(policyNode: Element, employers: NonNullable<FundRecord['employers']>) {
  const currentEmployer = employers.find(item => item.isCurrent) || employers[0] || {}
  const nodesFromYear = Array.from(policyNode.getElementsByTagName('PerutHafkadotMetchilatShana'))
  const latestNodes = Array.from(policyNode.getElementsByTagName('PerutHafkadaAchrona'))
  const sourceNodes = nodesFromYear.length ? nodesFromYear : latestNodes
  const byMonth = new Map<string, NonNullable<FundRecord['depositRows']>[number]>()
  sourceNodes.forEach(node => {
    const amount = firstPositive(
      xmlNumber(node, ['SCHUM-HAFKADA-SHESHULAM']),
      xmlNumber(node, ['SCHUM-HAFRASHA']),
      xmlNumber(node, ['SCHUM-HAFKADA']),
      xmlNumber(node, ['SACH-HAFKADA']),
      xmlNumber(node, ['TOTAL-HAFKADA']),
      xmlNumber(node, ['TOTAL-HAFKADA-ACHRONA']),
      0,
    )
    if (!amount) return
    const month = formatDepositMonth(tagText(node, ['CHODESH-SACHAR', 'TAARICH-HAFKADA-ACHARON', 'TAARICH-ERECH-HAFKADA', 'TAARICH-MADAD']))
    const employerName = tagText(node, ['SHEM-MAASIK', 'SHEM-MESHALEM']) || currentEmployer.name || 'אין נתון'
    const key = `${month || 'ללא חודש'}|${normalize(employerName)}`
    const row = byMonth.get(key) || {
      employerName,
      employerId: currentEmployer.idNumber || '',
      month,
      contributionCodes: [],
      depositorCodes: [],
      employeeContribution: 0,
      employerContribution: 0,
      compensation: 0,
      total: 0,
    }
    const contributionCode = normalizeDepositCode(tagText(node, ['SUG-HAFRASHA', 'KOD-SUG-HAFRASHA', 'KOD-SUG-HAFKADA']))
    const depositorCode = normalizeDepositCode(tagText(node, ['SUG-MAFKID', 'SUG-HAMAFKID']))
    if (contributionCode && !row.contributionCodes?.includes(contributionCode)) row.contributionCodes?.push(contributionCode)
    if (depositorCode && !row.depositorCodes?.includes(depositorCode)) row.depositorCodes?.push(depositorCode)
    const component = classifyDepositComponent(node)
    if (component === 'employee') row.employeeContribution = Number(row.employeeContribution || 0) + amount
    if (component === 'employer') row.employerContribution = Number(row.employerContribution || 0) + amount
    if (component === 'compensation') row.compensation = Number(row.compensation || 0) + amount
    row.total = Number(row.total || 0) + amount
    byMonth.set(key, row)
  })
  return Array.from(byMonth.values()).sort((a, b) => cleanText(b.month).localeCompare(cleanText(a.month), 'he'))
}

async function parseClearinghouseZip(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const funds: FundRecord[] = []
  const insurancePolicies: InsurancePolicyRecord[] = []
  const client: ClientRecord = {}

  for (const entryName of Object.keys(zip.files).filter(name => name.toLowerCase().endsWith('.xml'))) {
    const xmlText = await zip.files[entryName].async('string')
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml')
    const employerDirectory = buildClearinghouseEmployerDirectory(xml)
    const clientNode = xml.getElementsByTagName('YeshutLakoach')[0] || xml
    client.firstName ||= tagText(clientNode, ['SHEM-PRATI'])
    client.lastName ||= tagText(clientNode, ['SHEM-MISHPACHA'])
    client.fullName ||= [client.firstName, client.lastName].filter(Boolean).join(' ')
    client.idNumber ||= account(tagText(clientNode, ['MISPAR-ZIHUY-LAKOACH']))
    client.birthDate ||= formatXmlDateForInput(tagText(clientNode, ['TAARICH-LEYDA']))
    client.email ||= tagText(clientNode, ['E-MAIL'])
    client.phone ||= tagText(clientNode, ['MISPAR-CELLULARI', 'MISPAR-TELEPHONE-KAVI'])

    const manufacturer = tagText(xml, ['SHEM-YATZRAN', 'SHEM-YATZRAN-METAFEL'])
    Array.from(xml.getElementsByTagName('HeshbonOPolisa')).forEach((node, index) => {
      const accountNumber = account(tagText(node, ['MISPAR-POLISA-O-HESHBON', 'MISPAR-POLISA-O-HESHBON-NEGDI']))
      const planName = tagText(node, ['SHEM-TOCHNIT', 'SHEM-MASLOL', 'SHEM-MUTZAR'])
      const startDate = formatXmlDate(tagText(node, ['TAARICH-HITZTARFUT-MUTZAR', 'TAARICH-TCHILAT-HABITUACH', 'TAARICH-TCHILAT-KISUY']))
      const endDate = formatXmlDate(tagText(node, ['TAARICH-TOM-TKUFAT-HABITUAH', 'TAARICH-TOM-KISUY', 'TAARICH-HAFSAKAT-TASHLUM']))
      const liquidityDate = formatXmlDate(tagText(node, [
        'MOED-NEZILUT-TAGMULIM',
        'MOED-NEZILUT',
        'MOED-NEZILUT-KESAFIM',
        'TAARICH-NEZILUT',
        'TAARICH-ZAKAUT-LEMESHICHA',
        'TAARICH-ZAKAUT-LE-MESHICHA',
        'TAARICH-TCHILAT-ZAKAUT-LEMESHICHA',
      ]))
      const trackNodes = Array.from(node.getElementsByTagName('PerutMasluleiHashkaa'))
      const yitrotNodes = Array.from(node.getElementsByTagName('PerutYitrot'))
      const periodNodes = Array.from(node.getElementsByTagName('PerutYitraLeTkufa'))
      const retirementNode = firstXmlNode(node, 'YitraLefiGilPrisha')
      const coverageNodes = Array.from(node.getElementsByTagName('ZihuiKisui'))
      const currentBalance = firstPositive(
        sumBy(yitrotNodes, row => firstPositive(
          xmlNumber(row, ['TOTAL-CHISACHON-MTZBR']),
          xmlNumber(row, ['TOTAL-ERKEI-PIDION', 'TOTAL-ERKEY-PIDION']),
          0,
        )),
        xmlNumber(node, ['TOTAL-CHISACHON-MTZBR']),
        xmlNumber(node, ['TOTAL-ERKEI-PIDION', 'TOTAL-ERKEY-PIDION']),
        0,
      )
      const retirementCapital = firstPositive(
        xmlNumber(retirementNode || node, [
          'TOTAL-SCHUM-MTZBR-TZAFUY-LEGIL-PRISHA-MECHUSHAV-LEKITZBA-IM-PREMIYOT',
          'TOTAL-SCHUM-MITZVTABER-TZFUY-LEGIL-PRISHA-MECHUSHAV-HAMEYOAD-LEKITZBA-LELO-PREMIYOT',
          'TOTAL-CHISACHON-MITZTABER-TZAFUY',
          'TZVIRAT-CHISACHON-CHAZUYA-LELO-PREMIYOT',
        ]),
        currentBalance,
        0,
      )
      const importedPension = firstPositive(
        xmlNumber(retirementNode || node, ['KITZVAT-HODSHIT-TZFUYA', 'SCHUM-KITZVAT-ZIKNA']),
        0,
      )
      const guaranteedCoefficient = firstPositive(
        xmlNumber(retirementNode || node, ['MEKADEM-MOVTACH-LEPRISHA']),
        importedPension > 0 && retirementCapital > 0 ? retirementCapital / importedPension : 0,
      )
      const investmentTrack = tagText(trackNodes[0] || node, ['SHEM-MASLUL-HASHKAA']) || planName
      const productType = getClearinghouseProductType(entryName, planName, node)
      const sourceLabel = extractSourceLabelFromFile(entryName)
      const policyManufacturer = getClearinghousePolicyManufacturer(node, manufacturer)
      const fees = getClearinghouseManagementFees(node, trackNodes)
      const employers = extractClearinghouseEmployers(node, employerDirectory)
      const depositRows = extractClearinghouseDepositRows(node, employers)
      const periodRows = periodNodes.map((periodNode, periodIndex) => {
        const componentCode = tagText(periodNode, ['REKIV-ITRA-LETKUFA'])
        const componentLabel = mapClearinghouseComponentCode(componentCode)
        return {
          id: `${accountNumber || index}-period-${periodIndex + 1}`,
          productType,
          manufacturer: policyManufacturer,
          periodCode: tagText(periodNode, ['KOD-TECHULAT-SHICHVA']),
          periodLabel: mapClearinghouseLayerCode(tagText(periodNode, ['KOD-TECHULAT-SHICHVA'])),
          componentCode,
          componentLabel,
          balanceTypeCode: tagText(periodNode, ['SUG-ITRA-LETKUFA']),
          balanceTypeLabel: mapClearinghouseBalanceTypeCode(tagText(periodNode, ['SUG-ITRA-LETKUFA'])),
          amount: xmlNumber(periodNode, ['SACH-ITRA-LESHICHVA-BESHACH']),
          benefitCap: tagText(periodNode, ['TIKRAT-HAFKADA-MUTEVET']),
        }
      })
      const periodCompensation = sumBy(periodRows, row => row.componentCode === '1' ? Number(row.amount || 0) : 0)
      const periodPension = sumBy(periodRows, row => ['2', '3', '4'].includes(row.componentCode || '') ? Number(row.amount || 0) : 0)
      const hasFundSignals = currentBalance > 0 || retirementCapital > 0 || importedPension > 0 || periodNodes.length > 0 || trackNodes.length > 0

      if (hasFundSignals) {
        funds.push({
          id: `${file.name}-${entryName}-fund-${accountNumber || index}`,
          accountNumber,
          manufacturer: policyManufacturer,
          productType,
          productName: planName || sourceLabel,
          planName: planName || sourceLabel,
          investmentTrack: investmentTrack || 'אין נתון',
          status: mapClearinghouseStatus(tagText(node, ['STATUS-POLISA-O-CHESHBON'])),
          currentBalance,
          retirementCapital,
          importedPension,
          guaranteedCoefficient: round(guaranteedCoefficient, 2),
          retirementAge: xmlNumber(retirementNode || node, ['GIL-PRISHA']),
          retirementTrackName: tagText(retirementNode || node, ['SHEM-MASLOL']),
          startDate,
          joinDate: startDate,
          liquidityDate,
          pensionBalance: firstPositive(xmlNumber(node, ['TOTAL-TAGMULIM']), periodPension, 0),
          compensationBalance: firstPositive(xmlNumber(node, ['TOTAL-PITZUIM']), periodCompensation, 0),
          monthlyDeposit: depositRows[0]?.total || xmlNumber(node, ['HAFKADA-SHOTEFET', 'TOTAL-HAFKADA-SHOTEFET']),
          depositFee: fees.depositFeeText,
          balanceFee: fees.balanceFeeText,
          managementFeeDepositText: fees.depositFeeText,
          managementFeeBalanceText: fees.balanceFeeText,
          managementFeeText: fees.managementFeeText,
          employers,
          employer: employers.find(item => item.isCurrent)?.name || employers[0]?.name,
          depositRows,
          beneficiaries: [],
          periodRows,
          standing: 'שכיר',
          trend: currentBalance > 0 ? 'יציב' : 'ללא צבירה',
          notes: sourceLabel,
        })
      } else if (!isRetirementSavingsProduct(productType, planName)) {
        const premium = firstPositive(xmlNumber(node, ['DMEI-BITUAH-LETASHLUM-BAPOAL', 'PREMIA-ZFOYA']), 0)
        const coverageAmount = firstPositive(xmlNumber(node, ['SCHUM-BITUACH', 'SCHUM-BITUAH-LEMAVET']), 0)
        insurancePolicies.push({
          id: `${file.name}-${entryName}-policy-${accountNumber || index}`,
          source: 'clearinghouse',
          sourceLabel: 'מסלקה',
          manufacturer: policyManufacturer,
          company: policyManufacturer,
          mainBranch: sourceLabel,
          secondaryBranch: '',
          itemClass: isInsuranceSavingsProduct(productType, planName) ? 'פוליסת חיסכון ביטוחית' : 'פוליסת ביטוח',
          productType: isInsuranceSavingsProduct(productType, planName) ? 'חיסכון עם רכיב ביטוחי' : 'פוליסת ביטוח',
          planName,
          policyName: planName,
          policyNumber: accountNumber,
          periodText: [startDate, endDate].filter(Boolean).join(' - '),
          premium,
          premiumText: premium ? formatMoneyText(premium) : '',
          coverageAmount,
          coverageAmountText: coverageAmount ? formatMoneyText(coverageAmount) : '',
          status: mapClearinghouseStatus(tagText(node, ['STATUS-POLISA-O-CHESHBON'])),
          startDate,
          endDate,
        })
      }

      if (!hasFundSignals && shouldIncludeClearinghouseCoverage(productType, planName, sourceLabel)) {
        coverageNodes.forEach((coverageNode, coverageIndex) => {
          const coverageName = tagText(coverageNode, ['SHEM-KISUI-YATZRAN']) || planName
          if (!isInsuranceLikeCoverageName(coverageName, planName)) return
          const premium = firstPositive(xmlNumber(coverageNode, ['DMEI-BITUAH-LETASHLUM-BAPOAL', 'PREMIA-ZFOYA']), 0)
          const coverageAmount = firstPositive(xmlNumber(coverageNode, ['SCHUM-BITUACH', 'SCHUM-BITUAH-LEMAVET', 'SCHUM-BITUH-ZFOY']), 0)
          insurancePolicies.push({
            id: `${file.name}-${entryName}-coverage-${accountNumber || index}-${coverageIndex}`,
            source: 'clearinghouse',
            sourceLabel: 'מסלקה',
            manufacturer: policyManufacturer,
            company: policyManufacturer,
            mainBranch: sourceLabel,
            secondaryBranch: coverageName,
            itemClass: 'כיסוי ביטוחי',
            productType: 'כיסוי',
            insuranceType: coverageName,
            planName: coverageName,
            policyName: coverageName,
            policyNumber: accountNumber,
            periodText: [startDate, endDate].filter(Boolean).join(' - '),
            premium,
            premiumText: premium ? formatMoneyText(premium) : '',
            coverageAmount,
            coverageAmountText: coverageAmount ? formatMoneyText(coverageAmount) : '',
            status: mapClearinghouseStatus(tagText(node, ['STATUS-POLISA-O-CHESHBON'])),
            startDate,
            endDate,
          })
        })
      }
    })
  }

  return {
    client,
    funds,
    insurancePolicies,
    messages: [`${file.name}: נטענו ${funds.length} קופות ו-${insurancePolicies.length} פוליסות/כיסויים ממסלקה`],
    derivedFactor: firstPositive(...funds.map(fund => Number(fund.guaranteedCoefficient || 0)), 140),
  }
}

async function parseXmlFile(file: File): Promise<ImportResult> {
  const zip = new JSZip()
  zip.file(file.name, await file.text())
  const blob = await zip.generateAsync({ type: 'blob' })
  return parseClearinghouseZip(new File([blob], `${file.name}.zip`))
}

async function parseExcelFile(file: File): Promise<ImportResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false, raw: false })
  if (detectHarHabituch(workbook)) return parseHarHabituchWorkbook(workbook, file.name)
  return parseRetirementWorkbook(workbook, file.name)
}

export async function importWorkspaceFiles(files: FileList | File[], baseClient?: ClientRecord | null): Promise<ImportResult> {
  const result: ImportResult = { funds: [], insurancePolicies: [], messages: [] }
  let comparisonClient = baseClient || undefined
  for (const file of Array.from(files)) {
    const lower = file.name.toLowerCase()
    const parsed = lower.endsWith('.zip')
      ? await parseClearinghouseZip(file)
      : lower.endsWith('.xml')
        ? await parseXmlFile(file)
        : await parseExcelFile(file)
    assertSameClientUpload(comparisonClient, parsed.client)
    comparisonClient = mergeClientRecords(comparisonClient, parsed.client)
    result.funds.push(...parsed.funds)
    result.insurancePolicies.push(...parsed.insurancePolicies)
    result.messages.push(...parsed.messages)
    result.client = mergeClientRecords(result.client, parsed.client)
  }
  result.client = mergeClientRecords(baseClient, result.client)
  return result
}
