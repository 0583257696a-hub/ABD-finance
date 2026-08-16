/**
 * Questionnaire (שאלון הכנה) domain model.
 *
 * A template is a named, editable list of questions owned by an advisor.
 * When a questionnaire is SENT, the template's questions are snapshotted
 * onto the form row (questions_json) — so later edits or deletion of the
 * template never corrupt forms already in clients' inboxes.
 *
 * Base-template question ids intentionally equal the workspace NeedsState
 * keys (clientFullName, spouseFullName, incomeWorkPrimary, ...) — that 1:1
 * mapping is what lets a submitted questionnaire flow directly into the
 * meeting workspace's needs-assessment + client record with no field
 * translation layer.
 */

export type QuestionType = 'text' | 'number' | 'select' | 'multiple-choice' | 'yes-no' | 'textarea'

export type QuestionnaireQuestion = {
  id: string
  section: string
  label: string
  type: QuestionType
  /** For select / multiple-choice. */
  options?: string[]
  required?: boolean
  /** Only shown when maritalStatus indicates married/partnered. */
  spouseOnly?: boolean
}

export type QuestionnaireTemplateRecord = {
  id: string
  user_email: string
  name: string
  questions_json: string
  is_default: number
  created_at: string
  updated_at: string
}

export const QUESTION_SECTIONS = ['פרטים אישיים', 'בן/בת זוג', 'הכנסות', 'הוצאות', 'נכסים', 'ביטוח וחיסכון', 'מטרות'] as const

const q = (id: string, section: string, label: string, type: QuestionType = 'text', extra: Partial<QuestionnaireQuestion> = {}): QuestionnaireQuestion =>
  ({ id, section, label, type, ...extra })

/** The seeded base questionnaire: personal details + spouse + full needs assessment. */
export function buildBaseQuestions(): QuestionnaireQuestion[] {
  return [
    // --- פרטים אישיים ---
    q('clientFullName', 'פרטים אישיים', 'שם מלא', 'text', { required: true }),
    q('clientBirthDate', 'פרטים אישיים', 'תאריך לידה'),
    q('clientPhone', 'פרטים אישיים', 'טלפון'),
    q('clientEmail', 'פרטים אישיים', 'אימייל'),
    q('maritalStatus', 'פרטים אישיים', 'מצב משפחתי', 'select', { options: ['רווק/ה', 'נשוי/אה', 'גרוש/ה', 'אלמן/ה', 'ידוע/ה בציבור'] }),
    q('employmentStatus', 'פרטים אישיים', 'סטטוס תעסוקה', 'select', { options: ['שכיר/ה', 'עצמאי/ת', 'שכיר/ה + עצמאי/ת', 'פנסיונר/ית', 'לא עובד/ת'] }),
    q('employerName', 'פרטים אישיים', 'שם מעסיק'),
    // --- בן/בת זוג (מוצג רק כשנבחר מצב משפחתי זוגי) ---
    q('spouseFullName', 'בן/בת זוג', 'שם מלא — בן/בת זוג', 'text', { spouseOnly: true }),
    q('spouseBirthDate', 'בן/בת זוג', 'תאריך לידה — בן/בת זוג', 'text', { spouseOnly: true }),
    q('spousePhone', 'בן/בת זוג', 'טלפון — בן/בת זוג', 'text', { spouseOnly: true }),
    q('spouseEmail', 'בן/בת זוג', 'אימייל — בן/בת זוג', 'text', { spouseOnly: true }),
    // --- הכנסות ---
    q('incomeWorkPrimary', 'הכנסות', 'הכנסה חודשית מעבודה', 'number'),
    q('incomeWorkSpouse', 'הכנסות', 'הכנסה חודשית מעבודה — בן/בת זוג', 'number', { spouseOnly: true }),
    q('incomeBituachPrimary', 'הכנסות', 'קצבת ביטוח לאומי', 'number'),
    q('incomeBituachSpouse', 'הכנסות', 'קצבת ביטוח לאומי — בן/בת זוג', 'number', { spouseOnly: true }),
    q('incomePensionPrimary', 'הכנסות', 'קצבת פנסיה', 'number'),
    q('incomePensionSpouse', 'הכנסות', 'קצבת פנסיה — בן/בת זוג', 'number', { spouseOnly: true }),
    q('incomeRentPrimary', 'הכנסות', 'הכנסה משכירות', 'number'),
    q('incomeOtherPrimary', 'הכנסות', 'הכנסות אחרות', 'number'),
    // --- הוצאות ---
    q('fixedExpenses', 'הוצאות', 'הוצאות קבועות חודשיות', 'number'),
    q('variableExpenses', 'הוצאות', 'הוצאות משתנות חודשיות', 'number'),
    q('fixedNotes', 'הוצאות', 'הערות על הוצאות', 'textarea'),
    // --- נכסים ---
    q('assetBank', 'נכסים', 'יתרות בבנק', 'number'),
    q('assetPortfolio', 'נכסים', 'תיק השקעות', 'number'),
    q('assetProvident', 'נכסים', 'קופות גמל', 'number'),
    q('assetStudyFunds', 'נכסים', 'קרנות השתלמות', 'number'),
    q('assetRealEstate', 'נכסים', 'נדל"ן (מעבר לדירת מגורים)', 'number'),
    q('assetOther', 'נכסים', 'נכסים אחרים', 'number'),
    // --- ביטוח וחיסכון ---
    q('hasPension', 'ביטוח וחיסכון', 'יש קרן פנסיה / ביטוח מנהלים?', 'yes-no'),
    q('hasStudyFund', 'ביטוח וחיסכון', 'יש קרן השתלמות?', 'yes-no'),
    q('hasLifeInsurance', 'ביטוח וחיסכון', 'יש ביטוח חיים?', 'yes-no'),
    q('hasHealthInsurance', 'ביטוח וחיסכון', 'יש ביטוח בריאות?', 'yes-no'),
    // --- מטרות ---
    q('retirementAgeGoal', 'מטרות', 'גיל פרישה מתוכנן', 'number'),
    q('goals', 'מטרות', 'מטרות פיננסיות עיקריות', 'textarea'),
    q('notes', 'מטרות', 'הערות נוספות', 'textarea'),
  ]
}

export const BASE_TEMPLATE_NAME = 'שאלון הכנה בסיסי'

/** Answer-length cap per question type — the dynamic allowlist's server-side bound. */
export function answerLimitFor(type: QuestionType): number {
  if (type === 'textarea') return 2000
  if (type === 'number') return 20
  return 200
}

export function parseQuestions(json: string | null | undefined): QuestionnaireQuestion[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is QuestionnaireQuestion =>
      Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.label === 'string' && typeof item.type === 'string'),
    )
  } catch {
    return []
  }
}

const SPOUSE_MARITAL_VALUES = ['נשוי/אה', 'ידוע/ה בציבור']

export function isSpouseRelevant(answers: Record<string, string>): boolean {
  return SPOUSE_MARITAL_VALUES.includes(answers.maritalStatus || '')
}
