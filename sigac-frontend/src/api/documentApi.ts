import api from './api-client'
import type { DocumentDto } from '../types/document'

export const documentApi = {
  async listByDossier(dossierId: string) {
    const resp = await api.get<DocumentDto[]>(`/Documents/dossier/${dossierId}`)
    return resp.data
  },
  async download(id: string) {
    const resp = await api.get(`/Documents/download/${id}`, { responseType: 'blob' })
    return resp.data as Blob
  },
  async remove(id: string) {
    const resp = await api.delete(`/Documents/${id}`)
    return resp.status === 204
  }
}
