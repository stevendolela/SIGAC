import api from './api-client'
import type { CreateFormationDto, FormationDto, FormationParticipationDto } from '../types/formation'

export const FormationApi = {
  getAll: async (): Promise<FormationDto[]> => {
    const { data } = await api.get('/Formations')
    return data
  },
  create: async (dto: CreateFormationDto): Promise<FormationDto> => {
    const { data } = await api.post('/Formations', dto)
    return data
  },
  update: async (id: string, dto: CreateFormationDto): Promise<FormationDto> => {
    const { data } = await api.put(`/Formations/${id}`, dto)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/Formations/${id}`)
  },
  addParticipant: async (formationId: string, userId: string): Promise<FormationParticipationDto> => {
    const { data } = await api.post(`/Formations/${formationId}/participants`, { userId })
    return data
  },
  markCompleted: async (formationId: string, userId: string, date: string, certificatUrl?: string): Promise<FormationParticipationDto> => {
    const { data } = await api.post(`/Formations/${formationId}/participants/${userId}/complete?date=${encodeURIComponent(date)}`, certificatUrl || null)
    return data
  }
}
