/**
 * Types pour le dashboard et les statistiques
 * Mirror des DTOs C# backend
 */

export interface DashboardStatisticsDto {
  // KPIs Génériques
  totalDossiers: number
  nouveauxDossiers: number
  enCours: number
  enValidation: number
  valides: number
  termines: number
  archives: number

  // Distributions
  parType: Record<string, number>
  parPriorite: Record<string, number>
  parRapporteur: Record<string, number>

  // Timeline
  dossiersCreesParMois: TimelineDataDto[]
  dossiersCompletesParMois: TimelineDataDto[]

  // Performance
  tauxTraitementMoyen: number
  tempsTraitementMoyenJours: number
  dossiersEnRetard: number
  tachesEnAttente: number

  // Documents & Storage
  totalDocuments: number
  documentsUploadCeMois: number
  storageUtilizedBytes: number
  storageQuotaBytes: number
  storagePercentage: number

  // Activité
  utilisateursActifs: number
  topUtilisateurs: UserActivityDto[]
  userConnections: UserConnectionDto[]
  lastUpdated: string
}

export interface TimelineDataDto {
  mois: string // Format: "2025-12", "2026-01"
  valeur: number
  date: string
}

export interface UserActivityDto {
  userId: string
  nomUtilisateur: string
  nombreDossiersTraites: number
  nombreDocumentsUpload: number
  derniereActivite: string
}

export interface UserConnectionDto {
  userId: string
  nomUtilisateur: string
  derniereConnexion: string | null
  joursDepuisDerniereConnexion: number
}

export interface StorageStatisticsDto {
  totalUtilizedBytes: number
  quotaBytes: number
  totalDocuments: number
  documentsThisMonth: number
  bytesByDocumentType: Record<string, number>
  percentageUsed: number
}

// Enums pour filtres
export enum PeriodFilter {
  LAST_7_DAYS = 7,
  LAST_30_DAYS = 30,
  LAST_90_DAYS = 90,
  LAST_YEAR = 365,
  ALL_TIME = 0
}

export const PERIOD_LABELS: Record<PeriodFilter, string> = {
  [PeriodFilter.LAST_7_DAYS]: 'Derniers 7 jours',
  [PeriodFilter.LAST_30_DAYS]: 'Dernier mois',
  [PeriodFilter.LAST_90_DAYS]: 'Dernier trimestre',
  [PeriodFilter.LAST_YEAR]: 'Dernière année',
  [PeriodFilter.ALL_TIME]: 'Tous les temps'
}
