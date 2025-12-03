export interface FormationDto {
  id: string
  titre: string
  description?: string
  organisateur?: string
  dateDebut: string
  dateFin: string
  lieu?: string
  estEnLigne: boolean
}

export interface CreateFormationDto {
  titre: string
  description?: string
  organisateur?: string
  dateDebut: string
  dateFin: string
  lieu?: string
  estEnLigne: boolean
}

export interface FormationParticipationDto {
  id: string
  formationId: string
  userId: string
  estCompletee: boolean
  dateCompletion?: string
  certificatUrl?: string
}
