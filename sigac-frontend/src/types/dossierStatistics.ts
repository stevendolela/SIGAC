export interface DossierStatisticsDto {
  totalDossiers: number
  nouveauxDossiers: number
  enCours: number
  enValidation: number
  valides: number
  termines: number
  parType: { [type: string]: number }
  parPriorite: { [priority: string]: number }
}
