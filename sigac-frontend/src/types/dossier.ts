export interface DossierListDto {
  id: string
  numeroDossier: string
  titre: string
  type: string; // affichage (peut être dérivé de typeAffaireNom)
  typeAffaireId?: string | null;
  typeAffaireNom?: string | null;
  typeAffaire?: string | null // Alias pour compatibilité
  demandeur?: string
  status?: string | null
  priorite?: string | null
  dateDepot?: string | null // ISO - Date de dépôt du dossier
  dateDebut?: string | null // Alias pour compatibilité
  rapporteur?: any | null
  rapporteurId?: string | null
  nombreDocuments?: number
}
