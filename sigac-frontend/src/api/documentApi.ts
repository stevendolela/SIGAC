import api from './api-client'
import type { DocumentDto } from '../types/document'

export interface DocumentVisualisationLogDto {
  id: string
  documentId: string
  documentNom: string
  userId: string
  userNomComplet: string
  dateVisualisation: string
  typeVisualisation: string
  ipAddress?: string
}

export const documentApi = {
  async listByDossier(dossierId: string) {
    const resp = await api.get<DocumentDto[]>(`/Documents/dossier/${dossierId}`)
    return resp.data
  },
  async upload(dossierId: string, file: File, typeDocument: string = 'Document') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('typeDocument', typeDocument)
    const resp = await api.post<DocumentDto>(`/Documents/upload/${dossierId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return resp.data
  },
  async download(id: string) {
    const resp = await api.get(`/Documents/download/${id}`, { responseType: 'blob' })
    return resp.data as Blob
  },
  async view(id: string) {
    const resp = await api.get(`/Documents/view/${id}`, { responseType: 'blob' })
    return resp.data as Blob
  },
  async getVisualisations(documentId: string) {
    const resp = await api.get<DocumentVisualisationLogDto[]>(`/Documents/${documentId}/visualisations`)
    return resp.data
  },
  async getDossierVisualisations(dossierId: string) {
    const resp = await api.get<DocumentVisualisationLogDto[]>(`/Documents/dossier/${dossierId}/visualisations`)
    return resp.data
  },
  async remove(id: string) {
    const resp = await api.delete(`/Documents/${id}`)
    return resp.status === 204
  },
  async assignToDossier(id: string, dossierId: string) {
    const resp = await api.put<DocumentDto>(`/Documents/${id}/assign`, {
      dossierId
    })
    return resp.data
  }
}
