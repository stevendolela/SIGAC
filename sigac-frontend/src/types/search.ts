export interface SearchResultDto {
  entity: 'Dossier' | 'Document'
  id: string
  titre: string
  extrait?: string
  dossierId?: string
}
