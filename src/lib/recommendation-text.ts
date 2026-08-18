import { normalizeManufacturerName } from '@/lib/returns-catalog'

/**
 * ONE place that turns a recommendation (a trackingDeals entry + its source
 * fund) into the sentence the advisor and the client read — in the meeting
 * summary, the recommendations tab, the PDF and the recommendation modal's
 * preview. Format agreed with the advisor:
 *
 *   ניוד של קופ"ג באלטשולר שמספרה 1234567 לקופ"ג במיטב במסלול X בדמי ניהול
 *   0.5% מצבירה (סך של 206,271 ש"ח) בהתאם לדמי הניהול ותשואות מסלול ההשקעה.
 *
 * Short, one line, every fact once. The free-text "נימוק" is the closing
 * clause of the sentence (defaults per action type); it never repeats the
 * product/manufacturer/amount that already appear before it.
 */

export type RecommendationKind = 'migrate' | 'keep' | 'pension' | 'redeem' | 'service' | 'other'

export type RecommendationLineInput = {
  actionType?: string
  sourceProductType?: string
  sourceManufacturer?: string
  sourceAccountNumber?: string
  targetProductType?: string
  targetManufacturer?: string
  track?: string
  feeDeposit?: string | number | null
  feeBalance?: string | number | null
  amount?: number | string | null
  /** The advisor's rationale — closing clause. Defaults per kind when empty/auto. */
  reason?: string
}

export const DEFAULT_RATIONALE: Record<RecommendationKind, string> = {
  migrate: 'בהתאם לדמי הניהול ותשואות מסלול ההשקעה',
  keep: 'בכפוף להמשך מעקב אחר דמי הניהול, תשואות המסלול והתאמתו לצורכי הלקוח',
  pension: 'לצורך תכנון מסלול הפרישה',
  redeem: 'לאחר בדיקת השלכות מס, נזילות והתאמה לצורכי התזרים',
  service: 'עדכון פרטים, מינוי סוכן, השלמת מסמכים ומעקב אחר ביצוע',
  other: '',
}

export function recommendationKind(actionType?: string): RecommendationKind {
  const text = String(actionType || '')
  if (/ניוד|העבר|new-product|migrat/i.test(text)) return 'migrate'
  if (/השאר|keep/i.test(text)) return 'keep'
  if (/קצבה|pension/i.test(text)) return 'pension'
  if (/פדיון|משיכה|redeem/i.test(text)) return 'redeem'
  if (/טיפול|שוטף|service/i.test(text)) return 'service'
  return 'other'
}

/** Product type → the short form advisors actually write. */
export function shortProduct(productType?: string): string {
  const text = String(productType || '').trim()
  if (!text) return 'קופה'
  if (/השתלמות/.test(text)) return 'קה"ש'
  if (/גמל\s*להשקעה/.test(text)) return 'גמל להשקעה'
  if (/ילד/.test(text)) return 'חיסכון לכל ילד'
  if (/גמל/.test(text)) return 'קופ"ג'
  if (/פנסיה/.test(text)) return 'קרן פנסיה'
  if (/מנהלים/.test(text)) return 'ביטוח מנהלים'
  if (/פוליסה|פיננס/.test(text)) return 'פוליסה פיננסית'
  if (/ביטוח/.test(text)) return 'פוליסת ביטוח'
  return text
}

/** "מיטב דש גמל ופנסיה בע"מ" → "מיטב"; unknown names lose only the legal suffixes. */
export function shortManufacturer(name?: string): string {
  const text = String(name || '').trim()
  if (!text) return ''
  const known = normalizeManufacturerName(text)
  if (known && known !== text && known.length < text.length) return known
  return text
    .replace(/בע["״']?מ/g, '')
    .replace(/חברה לניהול|חברה לביטוח|קופות גמל|קרנות השתלמות|פנסיה וגמל|גמל ופנסיה|ניהול/g, '')
    .replace(/[.,()"״']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || text
}

function formatMoney(value: number | string | null | undefined): string {
  const number = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(number) || number <= 0) return ''
  return `${Math.round(number).toLocaleString('he-IL')} ש"ח`
}

function formatFeePercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const number = Number(String(value).replace(/[^\d.]/g, ''))
  if (!Number.isFinite(number) || number < 0) return ''
  if (number === 0 && String(value).trim() === '') return ''
  return `${String(Number(number.toFixed(3))).replace(/\.?0+$/, '')}%`
}

export function formatFees(feeDeposit?: string | number | null, feeBalance?: string | number | null): string {
  const deposit = formatFeePercent(feeDeposit)
  const balance = formatFeePercent(feeBalance)
  if (deposit && balance) return `${balance} מצבירה ו-${deposit} מהפקדה`
  if (balance) return `${balance} מצבירה`
  if (deposit) return `${deposit} מהפקדה`
  return ''
}

/** Legacy auto-generated reasons (the long boilerplate) — treated as "no custom rationale". */
const LEGACY_AUTO_PATTERNS = [
  /מומלץ לבחון ניוד של/, /התאמה זו טרם נבדקה במערכת/, /בשלב זה מומלץ להשאיר/, /מומלץ לסמן את/,
  /מומלץ לבחון אפשרות פדיון/, /מומלץ לבצע טיפול המשך/, /המלצה לביצוע ניוד בהתאם לצורכי הלקוח/,
]

export function isAutoRationale(reason?: string): boolean {
  const text = String(reason || '').trim()
  if (!text) return true
  if (LEGACY_AUTO_PATTERNS.some(pattern => pattern.test(text))) return true
  return Object.values(DEFAULT_RATIONALE).some(value => value && text.replace(/[.\s]+$/, '') === value)
}

function rationaleFor(kind: RecommendationKind, reason?: string): string {
  const custom = String(reason || '').trim().replace(/[.\s]+$/, '')
  if (custom && !isAutoRationale(custom)) return custom
  return DEFAULT_RATIONALE[kind]
}

function fundRef(productType?: string, manufacturer?: string, accountNumber?: string): string {
  const product = shortProduct(productType)
  const maker = shortManufacturer(manufacturer)
  const acct = String(accountNumber || '').trim()
  return `${product}${maker ? ` ב${maker}` : ''}${acct ? ` שמספרה ${acct}` : ''}`
}

/**
 * The full one-line recommendation. Never returns an empty string for a
 * known kind; for unknown kinds falls back to the raw reason/notes.
 */
export function formatRecommendationLine(input: RecommendationLineInput): string {
  const kind = recommendationKind(input.actionType)
  const source = fundRef(input.sourceProductType, input.sourceManufacturer, input.sourceAccountNumber)
  const amount = formatMoney(input.amount)
  const amountPart = amount ? ` (סך של ${amount})` : ''
  const rationale = rationaleFor(kind, input.reason)
  const end = rationale ? ` ${rationale}.` : '.'

  if (kind === 'migrate') {
    const target = `${shortProduct(input.targetProductType || input.sourceProductType)}${input.targetManufacturer ? ` ב${shortManufacturer(input.targetManufacturer)}` : ''}`
    const track = String(input.track || '').trim()
    const fees = formatFees(input.feeDeposit, input.feeBalance)
    return `ניוד של ${source} ל${target}${track ? ` במסלול ${track}` : ''}${fees ? ` בדמי ניהול ${fees}` : ''}${amountPart}${end}`
  }
  if (kind === 'keep') {
    const track = String(input.track || '').trim()
    return `השארת ${source} במוצר הקיים${track ? ` במסלול ${track}` : ''}${amountPart}${end}`
  }
  if (kind === 'pension') return `סימון ${source}${amountPart} כתשתית לקצבה${rationale ? ` ${rationale}` : ''}.`
  if (kind === 'redeem') return `פדיון כספים מ${source}${amountPart}${end}`
  if (kind === 'service') return `טיפול שוטף ב${source}${rationale ? ` — ${rationale}` : ''}.`
  const raw = String(input.reason || '').trim()
  return raw || `${input.actionType || 'המלצה'}: ${source}${amountPart}.`
}
