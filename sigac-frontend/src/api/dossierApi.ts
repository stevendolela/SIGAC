import api from './api-client'
import type { PaginatedResult } from '../types/pagination'
import type { DossierListDto } from '../types/dossier'
import type { DossierDetailDto } from '../types/dossierDetail'
import type { DossierStatisticsDto } from '../types/dossierStatistics'

export const dossierApi = {
  async list(params: {
    page?: number
    pageSize?: number
    search?: string
    type?: string
    status?: string
    priorite?: string
    dateDebutMin?: string
    dateDebutMax?: string
    rapporteurId?: string
  } = {}) {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params.search) qs.set('search', params.search)
    if (params.type) qs.set('type', params.type)
    if (params.status) qs.set('status', params.status)
    if (params.priorite) qs.set('priorite', params.priorite)
    if (params.dateDebutMin) qs.set('dateDebutMin', params.dateDebutMin)
    if (params.dateDebutMax) qs.set('dateDebutMax', params.dateDebutMax)
    if (params.rapporteurId) qs.set('rapporteurId', params.rapporteurId)
    const resp = await api.get<PaginatedResult<DossierListDto>>(`/Dossiers?${qs.toString()}`)
    return resp.data
  },
  async getById(id: string) {
    const resp = await api.get<DossierDetailDto>(`/Dossiers/${id}`)
    return resp.data
  },
  async statistiques() {
    const resp = await api.get<DossierStatisticsDto>('/Dossiers/statistiques')
    return resp.data
  },
  async attribuerRapporteur(dossierId: string, rapporteurId: string) {
    const resp = await api.post(`/Dossiers/${dossierId}/attribuer-rapporteur`, { rapporteurId })
    return resp.data
  },
  async changerStatut(dossierId: string, nouveauStatutNumber: number, commentaire?: string) {
    const resp = await api.post(`/Dossiers/${dossierId}/changer-statut`, { 
      nouveauStatut: nouveauStatutNumber, 
      commentaire: commentaire && commentaire.trim() ? commentaire.trim() : null
    })
    return resp.data
  }
}
