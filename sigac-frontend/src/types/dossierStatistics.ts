export interface DossierStatisticsDto {
  total: number
  parStatut: { [status: string]: number }
  parType: { [type: string]: number }
  parPriorite: { [priority: string]: number }
}
