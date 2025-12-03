import type { DossierListDto } from './dossier'
import type { DocumentDto } from './document'
import type { UserDto } from './user'

export interface HistoriqueDto {
  id: string
  dateAction: string
  action: string
  details?: string | null
  userId: string
}

export interface DossierDetailDto extends DossierListDto {
  type?: string // Type d'affaire
  demandeur: string
  defendeur?: string | null
  dateDepot?: string // Date de dépôt (ISO)
  dateAudience?: string | null
  dateDecision?: string | null
  resume?: string | null
  observations?: string | null
  description?: string | null
  rapporteur?: UserDto | null
  documents?: DocumentDto[]
  historiques?: HistoriqueDto[]
  createdAt?: string
  modifiedAt?: string | null
}
