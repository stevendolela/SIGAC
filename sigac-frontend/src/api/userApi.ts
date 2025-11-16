import api from './api-client'
import type { PaginatedResult } from '../types/pagination'
import type { UserDto } from '../types/user'

interface CreateUserPayload {
  Username: string
  Email: string
  Password: string
  Role: number
  NomComplet?: string | null
  Matricule?: string | null
}

export const userApi = {
  async list(page = 1, pageSize = 10, search?: string) {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (search) qs.set('search', search)
    const resp = await api.get<PaginatedResult<UserDto>>(`/Users?${qs.toString()}`)
    return resp.data
  },
  async get(id: string) {
    const resp = await api.get<UserDto>(`/Users/${id}`)
    return resp.data
  },
  async create(payload: CreateUserPayload) {
    const resp = await api.post<UserDto>('/Users', payload)
    return resp.data
  },
  async activate(id: string) {
    const resp = await api.post<UserDto>(`/Users/${id}/activate`, {})
    return resp.data
  },
  async deactivate(id: string) {
    const resp = await api.post<UserDto>(`/Users/${id}/deactivate`, {})
    return resp.data
  },
  async statsAdmin() {
    const resp = await api.get(`/Users/admin/stats`)
    return resp.data as any
  }
}
