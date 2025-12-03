import api from './api-client'
import type { CreateNotificationDto, NotificationDto } from '../types/notification'

export const NotificationApi = {
  mine: async (top: number = 50): Promise<NotificationDto[]> => {
    const { data } = await api.get(`/Notifications/me?top=${top}`)
    return data
  },
  create: async (dto: CreateNotificationDto): Promise<NotificationDto> => {
    const { data } = await api.post('/Notifications', dto)
    return data
  },
  markRead: async (id: string): Promise<void> => {
    await api.post(`/Notifications/${id}/lu`)
  }
}
