export type Client = {
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
  /** Free text or מסלקה code (see lib/phoenix/autofill normalizeMaritalStatus). */
  maritalStatus?: string
  age?: number | null
}
