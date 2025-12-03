import api from './api-client'
import type { SalleListDto, SalleDetailDto, CreateSalleDto, UpdateSalleDto } from '../types/salle'

export const salleApi = {
  async list(activeOnly: boolean = true) {
    const resp = await api.get<SalleListDto[]>(`/Salles${activeOnly ? '?activeOnly=true' : ''}`)
    return resp.data
  },

  async get(id: string) {
    const resp = await api.get<SalleDetailDto>(`/Salles/${id}`)
    return resp.data
  },

  async create(payload: CreateSalleDto) {
    const resp = await api.post<SalleDetailDto>('/Salles', payload)
    return resp.data
  },

  async update(id: string, payload: UpdateSalleDto) {
    const resp = await api.put<SalleDetailDto>(`/Salles/${id}`, payload)
    return resp.data
  },

  async remove(id: string) {
    await api.delete(`/Salles/${id}`)
  }
}
