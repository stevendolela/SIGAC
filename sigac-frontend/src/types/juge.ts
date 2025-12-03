export interface JugeProfileDto {
  id: string
  userId: string
  grade: string
  specialisations?: string
  biographie?: string
  dateNomination?: string
  telephone?: string
  adresse?: string
}

export interface CreateJugeProfileDto {
  userId: string
  grade: string
  specialisations?: string
  biographie?: string
  dateNomination?: string
  telephone?: string
  adresse?: string
}
