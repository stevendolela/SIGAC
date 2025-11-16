export type UserRole =
  | 'Administrateur'
  | 'President'
  | 'JugeConstitutionnel'
  | 'Greffier'
  | 'GreffierAdjoint'
  | 'Consultant'

export interface UserDto {
  id: string
  username: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}
