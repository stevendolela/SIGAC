export interface DossierListDto {
  id: string
  numeroDossier: string
  titre: string
  typeAffaire?: string | null
  status?: string | null
  priorite?: string | null
  dateDebut?: string | null // ISO
  rapporteurId?: string | null
}
