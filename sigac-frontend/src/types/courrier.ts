// Types pour la gestion du courrier

export type TypeCourrier = 'Entrant' | 'Sortant'
export type StatutCourrier = 'Recu' | 'EnTraitement' | 'Traite' | 'Archive' | 'Rejete'
export type UrgenceCourrier = 'Normale' | 'Importante' | 'Urgente' | 'TresUrgente'

export interface CourrierListDto {
  id: string
  reference: string
  type: TypeCourrier
  objet: string
  expediteur: string
  destinataire: string
  dateCourrier: string
  dateReception: string
  statut: StatutCourrier
  urgence: UrgenceCourrier
  referenceExterne?: string
  hasDocument: boolean
  dossierReference?: string
  assigneANom?: string
  createdAt: string
}

export interface CourrierDetailDto extends CourrierListDto {
  texteOCR?: string
  confianceOCR?: number
  notes?: string
  nomFichier?: string
  mimeType?: string
  tailleFichier?: number
  dossierId?: string
  dossierTitre?: string
  workspaceId?: string
  workspaceName?: string
  assigneAId?: string
  createdBy: string
  createdByNom?: string
  modifiedAt?: string
  historiques: CourrierHistoriqueDto[]
}

export interface CourrierHistoriqueDto {
  id: string
  action: string
  details?: string
  ancienStatut?: string
  nouveauStatut?: string
  userNom: string
  dateAction: string
}

export interface CreateCourrierDto {
  type: TypeCourrier
  objet: string
  expediteur: string
  destinataire: string
  dateCourrier: string
  dateReception?: string
  urgence: UrgenceCourrier
  referenceExterne?: string
  notes?: string
  dossierId?: string
  workspaceId?: string
  assigneAId?: string
}

export interface UpdateCourrierDto {
  objet?: string
  expediteur?: string
  destinataire?: string
  dateCourrier?: string
  statut?: StatutCourrier
  urgence?: UrgenceCourrier
  referenceExterne?: string
  notes?: string
  dossierId?: string
  assigneAId?: string
}

export interface ReceptionCourrierOcrDto {
  type: TypeCourrier
  urgence: UrgenceCourrier
  notes?: string
  workspaceId?: string
  assigneAId?: string
}

export interface OcrResultDto {
  texteComplet: string
  confiance: number
  expediteurDetecte?: string
  destinataireDetecte?: string
  objetDetecte?: string
  dateDetectee?: string
  referenceDetectee?: string
}

export interface CreateDossierFromCourrierDto {
  courrierId: string
  typeAffaireId?: string
  titre?: string
  demandeur?: string
  defendeur?: string
  rapporteurId?: string
}

export interface CourrierStatsDto {
  totalCourriers: number
  courriersEntrants: number
  courriersSortants: number
  enAttente: number
  enTraitement: number
  traites: number
  urgents: number
  receptionnesAujourdHui: number
  receptionnesCetteSemaine: number
}

// Labels d'affichage
export const TYPE_COURRIER_LABELS: Record<TypeCourrier, string> = {
  Entrant: '📥 Entrant',
  Sortant: '📤 Sortant'
}

export const STATUT_COURRIER_LABELS: Record<StatutCourrier, string> = {
  Recu: '📬 Reçu',
  EnTraitement: '⚙️ En traitement',
  Traite: '✅ Traité',
  Archive: '📦 Archivé',
  Rejete: '❌ Rejeté'
}

export const URGENCE_COURRIER_LABELS: Record<UrgenceCourrier, string> = {
  Normale: '🟢 Normale',
  Importante: '🟡 Importante',
  Urgente: '🟠 Urgente',
  TresUrgente: '🔴 Très urgente'
}

export const STATUT_COURRIER_COLORS: Record<StatutCourrier, string> = {
  Recu: '#3b82f6',
  EnTraitement: '#f59e0b',
  Traite: '#10b981',
  Archive: '#6b7280',
  Rejete: '#ef4444'
}

export const URGENCE_COURRIER_COLORS: Record<UrgenceCourrier, string> = {
  Normale: '#10b981',
  Importante: '#eab308',
  Urgente: '#f97316',
  TresUrgente: '#ef4444'
}
