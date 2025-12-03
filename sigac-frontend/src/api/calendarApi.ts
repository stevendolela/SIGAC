import api from './api-client'
import type { CalendarEventDto, CreateCalendarEventDto } from '../types/calendar'

export const CalendarApi = {
  get: async (start: string, end: string): Promise<CalendarEventDto[]> => {
    const { data } = await api.get(`/Calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
    return data
  },
  create: async (dto: CreateCalendarEventDto): Promise<CalendarEventDto> => {
    const { data } = await api.post('/Calendar', dto)
    return data
  },
  update: async (id: string, dto: CreateCalendarEventDto): Promise<CalendarEventDto> => {
    const { data } = await api.put(`/Calendar/${id}`, dto)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/Calendar/${id}`)
  }
}
