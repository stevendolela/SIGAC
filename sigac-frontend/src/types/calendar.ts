export interface CalendarEventDto {
  id: string
  type: string // 'Audience' | 'Reunion' | 'Personnel' | 'Formation' | 'Deadline'
  titre: string
  description?: string
  debut: string
  fin: string
  dossierId?: string
  salleId?: string
  touteLaJournee: boolean
  participants?: string[] // User IDs
  createdBy?: string
  statut?: string // 'Planifie' | 'EnCours' | 'Termine' | 'Reporte'
  rappelAvant?: number // Minutes avant l'événement
}

export interface CreateCalendarEventDto {
  type: string // 'Audience' | 'Reunion' | 'Personnel' | 'Formation' | 'Deadline'
  titre: string
  description?: string
  debut: string
  fin: string
  dossierId?: string
  salleId?: string
  touteLaJournee: boolean
  participants?: string[] // User IDs
  statut?: string // 'Planifie' | 'EnCours' | 'Termine' | 'Reporte'
  rappelAvant?: number // Minutes avant l'événement
}

export const EventTypeLabels: Record<string, string> = {
  Audience: '⚖️ Audiences',
  Reunion: '🤝 Réunions',
  Personnel: '📅 Personnel',
  Formation: '🎓 Formations',
  Deadline: '⏰ Deadlines'
}

export const EventTypeColors: Record<string, string> = {
  Audience: '#3b82f6',
  Reunion: '#10b981',
  Personnel: '#8b5cf6',
  Formation: '#f59e0b',
  Deadline: '#ef4444'
}

export const EventStatusLabels: Record<string, string> = {
  Planifie: '📅 Planifié',
  EnCours: '▶️ En cours',
  Termine: '✅ Terminé',
  Reporte: '⏸️ Reporté'
}

export const EventStatusColors: Record<string, string> = {
  Planifie: '#3b82f6',
  EnCours: '#f59e0b',
  Termine: '#10b981',
  Reporte: '#6b7280'
}
