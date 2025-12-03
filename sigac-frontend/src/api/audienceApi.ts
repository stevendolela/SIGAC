import api from './api-client'
import type { AudienceListDto, AudienceDetailDto, CreateAudienceDto, UpdateAudienceDto } from '../types/audience'

export const audienceApi = {
  async list() {
    const resp = await api.get<AudienceListDto[]>('/Audiences')
    return resp.data
  },

  async getByDossier(dossierId: string) {
    const resp = await api.get<AudienceListDto[]>(`/Audiences/dossier/${dossierId}`)
    return resp.data
  },

  async getByDateRange(dateDebut: string, dateFin: string) {
    const resp = await api.get<AudienceListDto[]>(
      `/Audiences/date-range?dateDebut=${dateDebut}&dateFin=${dateFin}`
    )
    return resp.data
  },

  async getById(id: string) {
    const resp = await api.get<AudienceDetailDto>(`/Audiences/${id}`)
    return resp.data
  },

  async create(dto: CreateAudienceDto) {
    const resp = await api.post<AudienceDetailDto>('/Audiences', dto)
    return resp.data
  },

  async update(id: string, dto: UpdateAudienceDto) {
    const resp = await api.put<AudienceDetailDto>(`/Audiences/${id}`, dto)
    return resp.data
  },

  async delete(id: string) {
    await api.delete(`/Audiences/${id}`)
  }
}
