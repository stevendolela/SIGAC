export interface SalleListDto {
  id: string
  nom: string
  description?: string | null
  capacite: number
  estActive: boolean
  createdAt: string
}

export interface SalleDetailDto {
  id: string
  nom: string
  description?: string | null
  capacite: number
  estActive: boolean
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt?: string | null
}

export interface CreateSalleDto {
  nom: string
  description?: string
  capacite: number
}

export interface UpdateSalleDto {
  nom?: string
  description?: string
  capacite?: number
  estActive?: boolean
}
