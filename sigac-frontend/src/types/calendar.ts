export interface CalendarEventDto {
  id: string
  type: string
  titre: string
  description?: string
  debut: string
  fin: string
  dossierId?: string
  salleId?: string
  touteLaJournee: boolean
}

export interface CreateCalendarEventDto {
  type: string
  titre: string
  description?: string
  debut: string
  fin: string
  dossierId?: string
  salleId?: string
  touteLaJournee: boolean
}
