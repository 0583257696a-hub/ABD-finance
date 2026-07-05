export type PasswordPolicyResult = {
  minLength: boolean
  upperEnglish: boolean
  lowerEnglish: boolean
  score: number
  label: string
  valid: boolean
}

export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const value = String(password || '')
  const minLength = value.length >= 8
  const upperEnglish = /[A-Z]/.test(value)
  const lowerEnglish = /[a-z]/.test(value)
  const extraLength = value.length >= 12
  const hasNumber = /\d/.test(value)
  const hasSymbol = /[^A-Za-z0-9]/.test(value)
  const score = [minLength, upperEnglish, lowerEnglish, extraLength, hasNumber, hasSymbol].filter(Boolean).length
  const valid = minLength && upperEnglish && lowerEnglish

  return {
    minLength,
    upperEnglish,
    lowerEnglish,
    score,
    valid,
    label: score >= 5 ? 'חזקה' : score >= 3 ? 'בינונית' : 'חלשה',
  }
}
