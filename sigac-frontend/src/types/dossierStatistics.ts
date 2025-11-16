export interface DossierStatisticsDto {
  totalDossiers: number
  nouveauxDossiers: number
  enInstruction: number
  enDelibere: number
  juges: number
  classes: number
  parType: { [type: string]: number }
  parPriorite: { [priority: string]: number }
}
