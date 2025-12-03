export enum TypeAudience {
  Preliminaire = 0,
  Plaidoirie = 1,
  Delibere = 2,
  Prononce = 3,
  Instruction = 4,
  MiseEnEtat = 5
}

export enum StatutAudience {
  Planifiee = 0,
  Confirmee = 1,
  Reportee = 2,
  Annulee = 3,
  Tenue = 4
}

export interface AudienceListDto {
  id: string
  dossierId: string
  dossierNumero: string
  dossierTitre: string
  dateAudience: string
  lieu: string
  typeAudience: TypeAudience
  statut: StatutAudience
  observations?: string
  createdAt: string
}

export interface AudienceDetailDto {
  id: string
  dossierId: string
  dossierNumero: string
  dossierTitre: string
  dateAudience: string
  lieu: string
  typeAudience: TypeAudience
  statut: StatutAudience
  observations?: string
  compteRendu?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt?: string
}

export interface CreateAudienceDto {
  dossierId: string
  dateAudience: string
  lieu: string
  typeAudience: TypeAudience
  observations?: string
}

export interface UpdateAudienceDto {
  dateAudience: string
  lieu: string
  typeAudience: TypeAudience
  statut: StatutAudience
  observations?: string
  compteRendu?: string
}

export const typeAudienceLabels: Record<TypeAudience, string> = {
  [TypeAudience.Preliminaire]: 'Préliminaire',
  [TypeAudience.Plaidoirie]: 'Plaidoirie',
  [TypeAudience.Delibere]: 'Délibéré',
  [TypeAudience.Prononce]: 'Prononcé',
  [TypeAudience.Instruction]: 'Instruction',
  [TypeAudience.MiseEnEtat]: 'Mise en état'
}

export const statutAudienceLabels: Record<StatutAudience, string> = {
  [StatutAudience.Planifiee]: 'Planifiée',
  [StatutAudience.Confirmee]: 'Confirmée',
  [StatutAudience.Reportee]: 'Reportée',
  [StatutAudience.Annulee]: 'Annulée',
  [StatutAudience.Tenue]: 'Tenue'
}

export const statutAudienceColors: Record<StatutAudience, string> = {
  [StatutAudience.Planifiee]: 'bg-blue-100 text-blue-800',
  [StatutAudience.Confirmee]: 'bg-green-100 text-green-800',
  [StatutAudience.Reportee]: 'bg-yellow-100 text-yellow-800',
  [StatutAudience.Annulee]: 'bg-red-100 text-red-800',
  [StatutAudience.Tenue]: 'bg-gray-100 text-gray-800'
}

export const typeAudienceColors: Record<TypeAudience, string> = {
  [TypeAudience.Preliminaire]: 'bg-purple-100 text-purple-800',
  [TypeAudience.Plaidoirie]: 'bg-indigo-100 text-indigo-800',
  [TypeAudience.Delibere]: 'bg-orange-100 text-orange-800',
  [TypeAudience.Prononce]: 'bg-pink-100 text-pink-800',
  [TypeAudience.Instruction]: 'bg-cyan-100 text-cyan-800',
  [TypeAudience.MiseEnEtat]: 'bg-teal-100 text-teal-800'
}
