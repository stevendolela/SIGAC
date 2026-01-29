  /**
   * Crée un nouveau courrier avec document joint (FormData)
   */
  createWithFile: async (formData: FormData): Promise<CourrierDetailDto> => {
    const resp = await api.post<CourrierDetailDto>('/Courrier', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return resp.data;
  },

import api from './api-client';
import type { PaginatedResult } from '../types/pagination';
import type {
  CourrierListDto,
  CourrierDetailDto,
  CreateCourrierDto,
  UpdateCourrierDto,
  ReceptionCourrierOcrDto,
  OcrResultDto,
  CreateDossierFromCourrierDto,
  CourrierStatsDto,
  TypeCourrier,
  StatutCourrier,
  UrgenceCourrier
} from '../types/courrier';

export const courrierApi = {
  /**
   * Crée un nouveau courrier avec document joint (FormData)
   */
  createWithFile: async (formData: FormData): Promise<CourrierDetailDto> => {
    const resp = await api.post<CourrierDetailDto>('/Courrier', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return resp.data;
  },
export const courrierApi = {
  /**
   * Liste les courriers avec filtres et pagination
   */
  async list(params: {
    page?: number
    pageSize?: number
    search?: string
    type?: TypeCourrier
    statut?: StatutCourrier
    urgence?: UrgenceCourrier
    dateDebut?: string
    dateFin?: string
    workspaceId?: string
    assigneAId?: string
  } = {}): Promise<PaginatedResult<CourrierListDto>> {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params.search) qs.set('search', params.search)
    if (params.type) qs.set('type', params.type)
    if (params.statut) qs.set('statut', params.statut)
    if (params.urgence) qs.set('urgence', params.urgence)
    if (params.dateDebut) qs.set('dateDebut', params.dateDebut)
    if (params.dateFin) qs.set('dateFin', params.dateFin)
    if (params.workspaceId) qs.set('workspaceId', params.workspaceId)
    if (params.assigneAId) qs.set('assigneAId', params.assigneAId)
    const resp = await api.get<PaginatedResult<CourrierListDto>>(`/Courrier?${qs.toString()}`)
    return resp.data
  },

  /**
   * Récupère le détail d'un courrier par ID
   */
  async getById(id: string): Promise<CourrierDetailDto> {
    const resp = await api.get<CourrierDetailDto>(`/Courrier/${id}`)
    return resp.data
  },

  /**
   * Crée un nouveau courrier
   */
  async create(data: CreateCourrierDto): Promise<CourrierDetailDto> {
    const resp = await api.post<CourrierDetailDto>('/Courrier', data)
    return resp.data
  },

  /**
   * Met à jour un courrier
   */
  async update(id: string, data: UpdateCourrierDto): Promise<CourrierDetailDto> {
    const resp = await api.put<CourrierDetailDto>(`/Courrier/${id}`, data)
    return resp.data
  },

  /**
   * Supprime un courrier
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/Courrier/${id}`)
  },

  /**
   * Réceptionne un courrier avec analyse OCR du document
   */
  async receptionnerAvecOcr(file: File, data: ReceptionCourrierOcrDto): Promise<CourrierDetailDto> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', data.type)
    formData.append('urgence', data.urgence)
    if (data.notes) formData.append('notes', data.notes)
    if (data.workspaceId) formData.append('workspaceId', data.workspaceId)
    if (data.assigneAId) formData.append('assigneAId', data.assigneAId)

    const resp = await api.post<CourrierDetailDto>('/Courrier/reception-ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return resp.data
  },

  /**
   * Analyse un document OCR d'un courrier existant
   */
  async analyserDocument(courrierId: string): Promise<OcrResultDto> {
    const resp = await api.post<OcrResultDto>(`/Courrier/${courrierId}/analyser`)
    return resp.data
  },

  /**
   * Télécharge le document d'un courrier
   */
  async downloadDocument(courrierId: string): Promise<Blob> {
    const resp = await api.get(`/Courrier/${courrierId}/document`, {
      responseType: 'blob'
    })
    return resp.data
  },

  /**
   * Change le statut d'un courrier
   */
  async changerStatut(
    id: string,
    nouveauStatut: StatutCourrier,
    commentaire?: string
  ): Promise<CourrierDetailDto> {
    const resp = await api.post<CourrierDetailDto>(`/Courrier/${id}/changer-statut`, {
      nouveauStatut,
      commentaire
    })
    return resp.data
  },

  /**
   * Assigne un courrier à un utilisateur
   */
  async assigner(courrierId: string, assigneAId: string): Promise<CourrierDetailDto> {
    const resp = await api.post<CourrierDetailDto>(`/Courrier/${courrierId}/assigner`, {
      assigneAId
    })
    return resp.data
  },

  /**
   * Lie un courrier à un dossier existant
   */
  async lierAuDossier(courrierId: string, dossierId: string): Promise<CourrierDetailDto> {
    const resp = await api.post<CourrierDetailDto>(`/Courrier/${courrierId}/lier-dossier`, {
      dossierId
    })
    return resp.data
  },

  /**
   * Crée un dossier à partir d'un courrier
   */
  async createDossierFromCourrier(data: CreateDossierFromCourrierDto): Promise<any> {
    const resp = await api.post(`/Courrier/${data.courrierId}/creer-dossier`, data)
    return resp.data
  },

  /**
   * Récupère les statistiques des courriers
   */
  async getStatistiques(workspaceId?: string): Promise<CourrierStatsDto> {
    const qs = workspaceId ? `?workspaceId=${workspaceId}` : ''
    const resp = await api.get<CourrierStatsDto>(`/Courrier/stats${qs}`)
    return resp.data
  }
}

export default courrierApi
