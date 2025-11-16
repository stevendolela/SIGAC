import type { DossierListDto } from './dossier'
import type { DocumentDto } from './document'

export interface HistoriqueDto {
  id: string
  dateAction: string
  action: string
  details?: string | null
  userId: string
}

export interface DossierDetailDto extends DossierListDto {
  description?: string | null
  documents?: DocumentDto[]
  historiques?: HistoriqueDto[]
}
