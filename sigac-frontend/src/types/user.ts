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
  nomComplet?: string
  matricule?: string
  phoneNumber?: string
  avatarUrl?: string
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
}

export interface UpdateUserDto {
  nomComplet?: string
  email?: string
  role?: UserRole
  isActive?: boolean
  matricule?: string
}
