import api from './api-client'
import type { SearchResultDto } from '../types/search'

export const SearchApi = {
  dossiers: async (q: string, limit = 50): Promise<SearchResultDto[]> => {
    const { data } = await api.get(`/Search/dossiers?q=${encodeURIComponent(q)}&limit=${limit}`)
    return data
  },
  documents: async (q: string, limit = 50): Promise<SearchResultDto[]> => {
    const { data } = await api.get(`/Search/documents?q=${encodeURIComponent(q)}&limit=${limit}`)
    return data
  }
}
