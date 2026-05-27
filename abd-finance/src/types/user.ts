export type UserRole = 'admin' | 'advisor'

export type User = {
  id: string
  email?: string
  username?: string
  name?: string | null
  role?: UserRole
  isActive?: boolean
  forceChange?: boolean
}
