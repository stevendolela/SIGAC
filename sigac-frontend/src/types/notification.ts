export interface NotificationDto {
  id: string
  userId?: string
  titre: string
  message: string
  lien?: string
  estLue: boolean
  creeLe: string
  lueLe?: string
}

export interface CreateNotificationDto {
  userId?: string
  titre: string
  message: string
  lien?: string
}
