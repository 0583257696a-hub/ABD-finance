/**
 * מנוע מקדם המרה לקצבת זקנה — פורט מדויק מהסימולטור הרשמי של הפניקס.
 *
 * מקור: __V2-סימולטור_מקדם_זקנה_-_הפניקס_062025.xlsm  (תקנון יוני 2025)
 * טבלאות: phoenix_actuarial_tables_2025_06.json (חולצו מהקובץ המקורי)
 * מפרט: PHOENIX_FACTOR_ENGINE.md (מסופק עם הקובץ המקורי)
 *
 * This REPLACES the previous approximate engine, which used a hand-fitted
 * exponential mortality curve and an invented improvement decay instead of
 * Phoenix's five real mortality tables + the regulator's improvement matrix.
 * Measured against the reference on the base test case, the old engine
 * overstated the factor by ~20-24% across every scenario (i.e. understated
 * the client's monthly pension by ~20%). It could not be calibrated into
 * accuracy — the tables had to be replaced, not tuned.
 *
 * Verified before integration: this port reproduces all 10 acceptance
 * cases from the spec to 4 decimals (e.g. base case 187.0377), and the
 * factor is linear in the survivor rate to ~1e-14 as the spec requires.
 * See scripts/check-phoenix-factor.ts.
 *
 * כל שורה כאן מקבילה לתא בגיליון. ההפניה לתא המקורי מופיעה בהערה.
 * אין לשנות שום נוסחה בלי לעדכן את ההפניה ולהריץ מחדש את בדיקות הקבלה.
 */

import tablesJson from './phoenix_actuarial_tables_2025_06.json'

type ActuarialTables = {
  _meta: { regulationsEdition: string; improvementBaseYear: number; improvementLastYear: number }
  constants: {
    maxAge: number
    guaranteeMaxAge: number
    managementFeeFromAccumulation: number
    grossInterest: { comprehensive: number; general: number }
    projectionMonths: number
    marriageProbability: number
  }
  mortality: { byAge: Record<string, (number | null)[]> }
  pensionerMortalityReduction: { byAge: Record<string, number> }
  mortalityImprovement: { male: Record<string, (number | null)[]>; female: Record<string, (number | null)[]> }
}

const tables = tablesJson as unknown as ActuarialTables

// ---------------------------------------------------------------- קבועים
const MAX_AGE = tables.constants.maxAge                          // זקנה!E5  = 119
const GUARANTEE_MAX_AGE = tables.constants.guaranteeMaxAge       // זקנה!B10 = 87
const MGMT_FEE = tables.constants.managementFeeFromAccumulation  // Tables!C4 = 0.3%
const PROJECTION_MONTHS = tables.constants.projectionMonths      // 1272 (שורות 4..1275)
const MARRIAGE_P = tables.constants.marriageProbability          // זקנה!B20 — מנוטרל ל-1
const IMPROVE_BASE_YEAR = tables._meta.improvementBaseYear       // 2022
const IMPROVE_LAST_YEAR = tables._meta.improvementLastYear       // 2121

export const PHOENIX_REGULATIONS_EDITION = tables._meta.regulationsEdition // '2025-06'

/** אינדקסי עמודות בטווח Qx (עמודה 1 = גיל), בדיוק כמו ב-VLOOKUP בגיליון */
const COL = {
  survivorMale: 2, survivorFemale: 3,            // לוח פ2
  activeMale: 4, activeFemale: 5,                // לוח פ1ב
  pensSurvivorMale: 6, pensSurvivorFemale: 7,    // לוח פ5ד
  pensionerMale: 8, pensionerFemale: 9,          // לוח פ3ד / פ3ב
} as const

export type PhoenixFundType = 'comprehensive' | 'general'

export interface PhoenixFactorInput {
  birthPensioner: Date
  birthSpouse: Date | null
  isMale: boolean
  retirementYear: number
  retirementMonth: number   // 1–12
  guaranteeMonths: number   // 0 / 60 / 120 / 180 / 240
  spouseRate: number        // 0 … 1.0
  fund: PhoenixFundType
  inflation?: number        // זקנה!B9 — בסימולטור 0
  retroMonths?: number      // 'חישוב זקנה'!C19
}

export interface PhoenixFactorResult {
  factor: number
  factorWithRetro: number
  exactAge: number
  ageInt: number
  spouseAgeInt: number
  ageDiff: number
  netInterest: number
  grossInterest: number
}

// ---------------------------------------------------------------- עזרי טבלאות
function qx(age: number, rangeCol: number): number {
  const row = tables.mortality.byAge[String(Math.floor(age))]
  if (!row) return 0
  return row[rangeCol - 2] ?? 0
}

/** Tables!Discount — VLOOKUP בהתאמה מקורבת, גילאים 55..110 (לוח פ4) */
function pensionerMortalityReduction(age: number): number {
  let a = Math.floor(age)
  if (a < 55) throw new PhoenixEngineError('AGE_BELOW_55', `גיל ${a} — טווח לוח ההפחתה מתחיל ב-55, כמו בגיליון`)
  if (a > 110) a = 110
  const t = tables.pensionerMortalityReduction.byAge
  while (!(String(a) in t) && a > 55) a--
  return t[String(a)]
}

/** INDEX(Improve_x, INT(age)-13, MIN(2121, year) - (baseYear-2))   ← זקנה!K,O */
function improvement(age: number, year: number, male: boolean): number {
  const a = Math.floor(age)
  if (a > 105) return 1
  const y = Math.min(IMPROVE_LAST_YEAR, Math.floor(year))
  const idx = Math.max(0, y - IMPROVE_BASE_YEAR)
  const tbl = male ? tables.mortalityImprovement.male : tables.mortalityImprovement.female
  const row = tbl[String(a)]
  if (!row) return 1
  return row[idx] ?? 1
}

export class PhoenixEngineError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/**
 * גיל למועד החישוב.  'גיליון עזר'!C14 + C16
 * תאריך הייחוס הוא ה-1 לחודש **העוקב** לחודש הלידה — לא בדיקה של יום בחודש:
 * יליד 15/03 ויליד 28/03 מקבלים אותו גיל בדיוק.
 * ⚠ גרסת המיכון של הפניקס משתמשת ב-1 לחודש הלידה עצמו — הפרש של חודש.
 */
export function phoenixAgeAt(birth: Date, calc: Date): number {
  let y = birth.getFullYear()
  let m = birth.getMonth() + 2 // getMonth() אפסי; +1 לחודש העוקב, +1 להסבה ל-1-based
  if (m === 13) { y += 1; m = 1 }
  return ((calc.getFullYear() - y) * 12 + ((calc.getMonth() + 1) - m)) / 12
}

// ---------------------------------------------------------------- המנוע
export function phoenixConversionFactor(inp: PhoenixFactorInput): PhoenixFactorResult {
  const inflation = inp.inflation ?? 0
  const retro = inp.retroMonths ?? 0
  const calc = new Date(inp.retirementYear, inp.retirementMonth - 1, 1)

  // Tables!B3 → B4 :  ריבית ברוטו לפי סוג הקרן, נטו אחרי דמי ניהול, מעוגל ל-4 ספרות.
  // העיגול הוא חלק מהתקנון, לא נוחות תצוגה. דמי הניהול הם בתוך שיעור ההיוון — לא ניכוי נפרד.
  const gross = inp.fund === 'comprehensive'
    ? tables.constants.grossInterest.comprehensive
    : tables.constants.grossInterest.general
  const iNet = Math.round(((1 + gross) * (1 - MGMT_FEE) - 1) * 1e4) / 1e4

  const exactAge = phoenixAgeAt(inp.birthPensioner, calc)    // 'גיליון עזר'!C16
  const ageInt = Math.floor(exactAge)                        // C20
  let spouseInt = ageInt, fracS = 0, ageDiff = 0
  let spouseRate = inp.spouseRate

  if (inp.birthSpouse && spouseRate > 0) {
    const exactSpouse = phoenixAgeAt(inp.birthSpouse, calc)  // C17
    spouseInt = Math.floor(exactSpouse)                      // C21
    fracS = exactSpouse - spouseInt                          // C25
    ageDiff = spouseInt - ageInt                             // C23
  } else {
    spouseRate = 0
  }

  const n = inp.guaranteeMonths
  const calcYear = calc.getFullYear()

  // ---- טבלאות שנתיות, שורה לכל גיל שלם (זקנה! עמודות I..R) ----
  const ann = new Map<number, { j: number; k: number }>()
  for (let k = 0; k < 107; k++) {
    const ia = ageInt + k, yr = calcYear + k
    const red = pensionerMortalityReduction(ia)
    // זקנה!J : qx של הפנסיונר, אחרי הפחתת לוח פ4
    const j = ia >= MAX_AGE ? 0
      : qx(ia, inp.isMale ? COL.pensionerMale : COL.pensionerFemale) * (1 - red)
    ann.set(ia, { j, k: improvement(ia, yr, inp.isMale) })   // זקנה!K
  }

  // חמישה לוחות תמותה, נבחרים לפי גיל ומגדר: סף 55 לנשים, 60 לגברים,
  // ולוח האלמנות שונה מלוח בת הזוג בחיי הפנסיונר.
  const sp = new Map<number, { n: number; q: number; o: number }>()
  for (let k = 0; k < 107; k++) {
    const sa = ageInt + ageDiff + k, yr = calcYear + k
    let nq = 0, qq = 0
    if (sa < MAX_AGE) {
      if (inp.isMale) {   // בת הזוג נקבה — זקנה!N, Q
        nq = qx(sa, sa >= 55 ? COL.pensionerFemale : COL.activeFemale)
        qq = qx(sa, sa >= 55 ? COL.pensSurvivorFemale : COL.survivorFemale)
      } else {            // בן הזוג זכר
        nq = qx(sa, sa >= 60 ? COL.pensionerMale : COL.activeMale)
        qq = qx(sa, sa >= 60 ? COL.pensSurvivorMale : COL.survivorMale)
      }
    }
    sp.set(sa, { n: nq, q: qq, o: improvement(sa, yr, !inp.isMale) }) // זקנה!O
  }

  // ---- לולאה חודשית (זקנה! עמודות U..AP, שורות 4..1275) ----
  let tPx = 1, tPy = 1, tPyW = 1
  let akPrev = 0, zPrev = 0, agPrev = 0, afPrev = 0, acPrev = 0, prevVAge = 0
  let vCum = 1, total = 0

  for (let m = 1; m <= PROJECTION_MONTHS; m++) {
    const vAge = exactAge + (m - 1) / 12              // זקנה!V
    const wAge = spouseInt + fracS + (m - 1) / 12     // זקנה!W
    const ia = Math.floor(vAge), sa = Math.floor(wAge)

    const a = ann.get(ia)
    // זקנה!X : המרה לחודשי מה-qx השנתי, ואז הכפלה בשיפור התמותה (זקנה!Z).
    // הסדר קריטי — לחודשי לפני השיפור, לא אחרי.
    const x = a ? 1 - Math.pow(1 - a.j, 1 / 12) : 0
    const z = x * (a ? a.k : 1)

    const s = sp.get(sa)
    const aa = s ? 1 - Math.pow(1 - s.n, 1 / 12) : 0   // זקנה!AA
    const ad = s ? 1 - Math.pow(1 - s.q, 1 / 12) : 0   // זקנה!AD
    const o = s ? s.o : 1
    const ac = aa * o, af = ad * o                     // זקנה!AC, AF

    if (m > 1) {                                        // זקנה!AG, AH, AI
      tPx = prevVAge >= MAX_AGE ? 0 : tPx * (1 - zPrev)
      tPy = wAge >= MAX_AGE ? 0 : tPy * (1 - acPrev)
      tPyW = wAge >= MAX_AGE ? 0 : tPyW * (1 - afPrev)
    }

    // תקופת ההבטחה מוגבלת גם בגיל 87, לא רק במספר החודשים
    const inGuarantee = m <= n && vAge < GUARANTEE_MAX_AGE
    const aj = inGuarantee ? 1 : tPx                   // זקנה!AJ

    // זקנה!AK : אלמנים ותיקים ששרדו + אלמנים חדשים החודש. בחודש הראשון — 0 בכפייה.
    const ak = (wAge >= MAX_AGE || m === 1) ? 0
      : akPrev * (1 - afPrev) + zPrev * agPrev * tPy * spouseRate * MARRIAGE_P

    // זקנה!AL : בתקופת ההבטחה לא משולמת קצבת שאירים
    const al = (wAge >= MAX_AGE || m === 1 || inGuarantee) ? 0 : ak

    // annuity-immediate: ההיוון מתחיל כבר בחודש הראשון
    const an = Math.pow(1 + inflation, m / 12)         // זקנה!AN
    vCum *= Math.pow(1 + iNet, -1 / 12)                // זקנה!AO
    total += (aj + al) * an * vCum                     // זקנה!AP

    prevVAge = vAge
    zPrev = z; agPrev = tPx; afPrev = af; acPrev = ac; akPrev = ak
  }

  return {
    factor: total,
    factorWithRetro: total + retro,                     // 'חישוב זקנה'!C27 — רטרו מתווסף למקדם, לא לקצבה
    exactAge, ageInt, spouseAgeInt: spouseInt, ageDiff,
    netInterest: iNet, grossInterest: gross,
  }
}

/**
 * המקדם לינארי לחלוטין בשיעור השאירים:  factor(n, s) = A(n) + s · B(n)
 * לכן ניתן לייצר את כל שיעורי השאירים בשתי הרצות בלבד. אומת מול המנוע: סטייה < 1e-12.
 * (גם מבחן תקינות: מנוע שאינו לינארי בשיעור השאירים — יש בו באג.)
 */
export function phoenixFactorRow(base: Omit<PhoenixFactorInput, 'spouseRate'>, rates: number[]) {
  const A = phoenixConversionFactor({ ...base, spouseRate: 0 }).factor
  const B = phoenixConversionFactor({ ...base, spouseRate: 1 }).factor - A
  return rates.map(s => ({ spouseRate: s, factor: A + s * B }))
}

/** קצבה חודשית — 'חישוב זקנה'!C28 */
export function phoenixMonthlyPension(balance: number, factor: number): number {
  if (!factor) throw new PhoenixEngineError('NO_FACTOR', 'לא קיים מקדם')
  return balance / factor
}

/** תקופת ההבטחה המרבית האפשרית — 'גיליון עזר'!D11 : MIN(MAX((87 − גיל) × 12, 0), 240) */
export function phoenixMaxGuaranteeMonths(exactAge: number): number {
  return Math.min(Math.max(Math.floor((GUARANTEE_MAX_AGE - exactAge) * 12), 0), 240)
}
