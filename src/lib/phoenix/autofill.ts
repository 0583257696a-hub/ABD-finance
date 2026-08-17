import type { Client } from '@/types/client'

/**
 * Derives the Phoenix pension-calculator inputs from the client file already
 * loaded in the workspace — מסלקה import (name, id, birth date, gender,
 * marital status), the needs assessment (spouse details, retirement goal)
 * and the pre-meeting questionnaire (marital status, spouse birth date,
 * planned retirement age). Pure: no storage, no React. The page decides
 * when to apply the patch (see `signature`).
 */

export type PhoenixAutofillPatch = Partial<{
  memberBirth: string
  memberGender: 'male' | 'female'
  maritalStatus: 'single' | 'married'
  spouseBirth: string
  retirementYear: string
  retirementMonth: string
}>

export type PhoenixAutofill = {
  patch: PhoenixAutofillPatch
  /** Human-readable list of what was filled and from where — shown in the UI. */
  filled: Array<{ field: string; source: string }>
  /** Identity of the client data the patch was built from; changes when a different client (or new data) is loaded. */
  signature: string
  profile: { name: string; idNumber: string; birthDate: string }
  /** Which retirement age was used and why (explicit goal vs statutory). */
  retirementBasis: 'goal' | 'statutory' | null
}

type Needs = Record<string, string | undefined>

const MARRIED_VALUES = ['נשוי', 'נשואה', 'נשוי/אה', 'ידוע בציבור', 'ידועה בציבור', 'ידוע/ה בציבור', 'married', 'partnered']
const SINGLE_VALUES = ['רווק', 'רווקה', 'רווק/ה', 'גרוש', 'גרושה', 'גרוש/ה', 'אלמן', 'אלמנה', 'אלמן/ה', 'single', 'divorced', 'widowed']

/** מסלקה MIN code / free text → engine gender. */
export function normalizeGender(value: unknown): 'male' | 'female' | null {
  const text = String(value ?? '').trim().toLowerCase()
  if (!text) return null
  if (text === '1' || text === 'male' || text === 'm' || text.startsWith('זכר') || text.startsWith('גבר')) return 'male'
  if (text === '2' || text === 'female' || text === 'f' || text.startsWith('נקבה') || text.startsWith('אישה') || text.startsWith('אשה')) return 'female'
  return null
}

/** מסלקה MATZAV-MISHPACHTI code / free text → married|single. */
export function normalizeMaritalStatus(value: unknown): 'married' | 'single' | null {
  const text = String(value ?? '').trim().toLowerCase()
  if (!text) return null
  if (text === '2' || text === '5') return 'married'
  if (text === '1' || text === '3' || text === '4') return 'single'
  if (MARRIED_VALUES.some(item => text.startsWith(item.toLowerCase()))) return 'married'
  if (SINGLE_VALUES.some(item => text.startsWith(item.toLowerCase()))) return 'single'
  return null
}

/** Accepts yyyy-mm-dd, dd/mm/yyyy, dd.mm.yyyy, yyyymmdd → yyyy-mm-dd (or ''). */
export function normalizeIsoDate(value: unknown): string {
  const text = String(value ?? '').trim()
  if (!text) return ''
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  match = text.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  return ''
}

/**
 * Statutory retirement age in Israel: men 67; women per the 2022 amendment
 * schedule (62 for those born through 04/1960, rising in steps to 65 for
 * those born from 1970). Returned as whole months.
 */
export function statutoryRetirementAgeMonths(gender: 'male' | 'female', birth: Date): number {
  if (gender === 'male') return 67 * 12
  const y = birth.getFullYear()
  const m = birth.getMonth() + 1
  if (y < 1960 || (y === 1960 && m <= 4)) return 62 * 12
  if (y === 1960) return 62 * 12 + 4
  if (y === 1961) return 62 * 12 + 8
  if (y === 1962) return 63 * 12
  if (y === 1963) return 63 * 12 + 3
  if (y === 1964) return 63 * 12 + 6
  if (y === 1965) return 63 * 12 + 9
  if (y === 1966) return 64 * 12
  if (y === 1967) return 64 * 12 + 3
  if (y === 1968) return 64 * 12 + 6
  if (y === 1969) return 64 * 12 + 9
  return 65 * 12
}

function parseIso(iso: string): Date | null {
  if (!iso) return null
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function buildPhoenixAutofill(input: { client: Client | null | undefined; needs: Needs | null | undefined; now?: Date }): PhoenixAutofill {
  const client = input.client || {}
  const needs = input.needs || {}
  const now = input.now || new Date()
  const patch: PhoenixAutofillPatch = {}
  const filled: PhoenixAutofill['filled'] = []

  const name = client.fullName || [client.firstName, client.lastName].filter(Boolean).join(' ') || needs.clientFullName || ''
  const idNumber = client.idNumber || needs.clientIdNumber || ''

  // Birth date: מסלקה/client file first, then needs assessment / questionnaire.
  const birthIso = normalizeIsoDate(client.birthDate) || normalizeIsoDate(needs.clientBirthDate)
  const birthSource = normalizeIsoDate(client.birthDate) ? 'תיק לקוח / מסלקה' : 'בירור צרכים / שאלון'
  if (birthIso) { patch.memberBirth = birthIso; filled.push({ field: 'תאריך לידה', source: birthSource }) }

  const gender = normalizeGender(client.gender) || normalizeGender(needs.clientGender) || normalizeGender(needs.gender)
  if (gender) { patch.memberGender = gender; filled.push({ field: 'מין', source: normalizeGender(client.gender) ? 'מסלקה' : 'שאלון' }) }

  // Marital status: explicit value wins; otherwise a filled-in spouse implies married.
  const spouseBirthIso = normalizeIsoDate(needs.spouseBirthDate)
  const spousePresent = Boolean(spouseBirthIso || String(needs.spouseFullName || '').trim() || String(needs.spouseIdNumber || '').trim())
  const marital = normalizeMaritalStatus(client.maritalStatus) || normalizeMaritalStatus(needs.maritalStatus) || (spousePresent ? 'married' : null)
  if (marital) {
    patch.maritalStatus = marital
    filled.push({ field: 'מצב משפחתי', source: normalizeMaritalStatus(client.maritalStatus) ? 'מסלקה' : normalizeMaritalStatus(needs.maritalStatus) ? 'שאלון' : 'בירור צרכים (בן/בת זוג הוזן)' })
  }
  if (spouseBirthIso && marital !== 'single') { patch.spouseBirth = spouseBirthIso; filled.push({ field: 'תאריך לידה בן/בת זוג', source: 'בירור צרכים / שאלון' }) }

  // Retirement date: questionnaire goal age → else statutory age; never in the past.
  let retirementBasis: PhoenixAutofill['retirementBasis'] = null
  const birth = parseIso(birthIso)
  if (birth) {
    const goalAge = Number(String(needs.retirementAgeGoal ?? needs.retirementAge ?? '').replace(/[^\d.]/g, ''))
    const genderForAge = gender || 'male'
    const months = goalAge >= 40 && goalAge <= 90 ? Math.round(goalAge * 12) : statutoryRetirementAgeMonths(genderForAge, birth)
    retirementBasis = goalAge >= 40 && goalAge <= 90 ? 'goal' : 'statutory'
    let target = new Date(birth.getFullYear(), birth.getMonth() + months, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    if (target < nextMonth) target = nextMonth
    patch.retirementYear = String(target.getFullYear())
    patch.retirementMonth = String(target.getMonth() + 1)
    filled.push({ field: 'מועד פרישה', source: retirementBasis === 'goal' ? `גיל פרישה מתוכנן ${goalAge} (שאלון)` : `גיל פרישה סטטוטורי (${genderForAge === 'male' ? '67' : 'לפי שנת לידה'})` })
  }

  const signature = [idNumber, birthIso, gender || '', marital || '', spouseBirthIso, needs.retirementAgeGoal || '', name].join('|')
  return { patch, filled, signature, profile: { name, idNumber, birthDate: birthIso }, retirementBasis }
}
