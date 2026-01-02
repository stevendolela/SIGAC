export interface CalendarEventDto {
  id: string
  type: string // 'Audience' | 'Reunion' | 'Personnel'
  titre: string
  description?: string
  debut: string
  fin: string
  dossierId?: string
  salleId?: string
  touteLaJournee: boolean
  participants?: string[] // User IDs
  createdBy?: string
}

export interface CreateCalendarEventDto {
  type: string // 'Audience' | 'Reunion' | 'Personnel'
  titre: string
  description?: string
  debut: string
  fin: string
  dossierId?: string
  salleId?: string
  touteLaJournee: boolean
  participants?: string[] // User IDs
}

export const EventTypeLabels: Record<string, string> = {
  Audience: '⚖️ Audience',
  Reunion: '🤝 Réunion',
  Personnel: '📅 Personnel'
}

export const EventTypeColors: Record<string, string> = {
  Audience: '#3b82f6',
  Reunion: '#10b981',
  Personnel: '#8b5cf6'
}
