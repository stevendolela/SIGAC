import api from './api-client'
import type { CreateJugeProfileDto, JugeProfileDto } from '../types/juge'

export const JugeApi = {
  getAll: async (): Promise<JugeProfileDto[]> => {
    const { data } = await api.get('/JugeProfiles')
    return data
  },
  getMine: async (): Promise<JugeProfileDto | null> => {
    const { data } = await api.get('/JugeProfiles/me')
    return data
  },
  create: async (dto: CreateJugeProfileDto): Promise<JugeProfileDto> => {
    const { data } = await api.post('/JugeProfiles', dto)
    return data
  },
  update: async (id: string, dto: CreateJugeProfileDto): Promise<JugeProfileDto> => {
    const { data } = await api.put(`/JugeProfiles/${id}`, dto)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/JugeProfiles/${id}`)
  }
}
