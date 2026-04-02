export type AppRole = 'admin' | 'staff'

export interface AuthUser {
  id: number
  email: string
  role: AppRole
}
