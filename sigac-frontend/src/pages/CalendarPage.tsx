import { useEffect, useState, useMemo } from 'react'
import { useToast } from '../components/common/ToastProvider'
import { CalendarApi } from '../api/calendarApi'
import { dossierApi } from '../api/dossierApi'
import { userApi } from '../api/userApi'
import type { CalendarEventDto, CreateCalendarEventDto } from '../types/calendar'
import { EventTypeLabels, EventTypeColors } from '../types/calendar'
import type { DossierListDto } from '../types/dossier'
import type { UserDto } from '../types/user'
import { getDaysInMonthEU, isSameDate } from '../utils/dateUtils'

interface CalendarPageProps {
  onViewDossier?: (dossierId: string) => void
  onManageSalles?: () => void
}

const EVENT_TYPE_CLASSES: Record<string, string> = {
  Reunion: 'event-type-reunion',
  Audience: 'event-type-audience',
  Formation: 'event-type-formation',
  Deadline: 'event-type-deadline',
  Personnel: 'event-type-personnel'
}

export default function CalendarPage({ onViewDossier, onManageSalles }: CalendarPageProps = {}) {
  const [events, setEvents] = useState<CalendarEventDto[]>([])
  const [dossiers, setDossiers] = useState<DossierListDto[]>([])
  const [users, setUsers] = useState<UserDto[]>([])
  const [salles, setSalles] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail' | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchParticipant, setSearchParticipant] = useState('')
  const { notify } = useToast()

  const [formData, setFormData] = useState<CreateCalendarEventDto>({
    type: 'Reunion',
    titre: '',
    description: '',
    debut: new Date().toISOString(),
    fin: new Date(Date.now() + 3600000).toISOString(),
    dossierId: undefined,
    salleId: undefined,
    touteLaJournee: false,
    participants: [],
    statut: 'Planifie',
    rappelAvant: 30
  })

  const userStr = localStorage.getItem('user')
  const currentUser = useMemo(() => userStr ? JSON.parse(userStr) : null, [userStr])
  const canEdit = ['Admin', 'Manager', 'Assistant'].includes(currentUser?.role)

  useEffect(() => {
    loadData()
  }, [currentDate, viewMode])

  const loadData = async () => {
    setLoading(true)
    try {
      const startDate = getStartDate()
      const endDate = getEndDate()
      
      const [eventsData, dossiersData, usersData] = await Promise.all([
        CalendarApi.get(startDate.toISOString(), endDate.toISOString()),
        dossierApi.list({ page: 1, pageSize: 1000 }),
        userApi.list(1, 1000)
      ])
      
      setEvents(eventsData)
      setDossiers(dossiersData.data || [])
      setUsers(usersData.data || [])
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur chargement calendrier' })
    } finally {
      setLoading(false)
    }
  }

  const getStartDate = () => {
    if (viewMode === 'month') {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      date.setDate(date.getDate() - date.getDay() + 1)
      return date
    }
    if (viewMode === 'week') {
      const date = new Date(currentDate)
      date.setDate(date.getDate() - date.getDay() + 1)
      return date
    }
    const date = new Date(currentDate)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const getEndDate = () => {
    if (viewMode === 'month') {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      date.setDate(date.getDate() + (7 - date.getDay()))
      return date
    }
    if (viewMode === 'week') {
      const date = new Date(currentDate)
      date.setDate(date.getDate() - date.getDay() + 7)
      return date
    }
    const date = new Date(currentDate)
    date.setHours(23, 59, 59, 999)
    return date
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.type === 'Audience' && !formData.dossierId) {
      notify({ type: 'error', message: 'Dossier requis pour une audience' })
      return
    }

    try {
      const created = await CalendarApi.create(formData)
      notify({ type: 'success', message: 'Événement créé avec succès' })
      setEvents([...events, created])
      setModalMode(null)
      resetForm()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur création événement' })
    }
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return

    try {
      const updated = await CalendarApi.update(selectedEvent.id, formData)
      notify({ type: 'success', message: 'Événement modifié avec succès' })
      setEvents(events.map(ev => ev.id === updated.id ? updated : ev))
      setModalMode(null)
      setSelectedEvent(null)
      resetForm()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur modification' })
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return

    try {
      await CalendarApi.remove(id)
      notify({ type: 'success', message: 'Événement supprimé' })
      setEvents(events.filter(ev => ev.id !== id))
      setModalMode(null)
      setSelectedEvent(null)
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur suppression' })
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'Reunion',
      titre: '',
      description: '',
      debut: new Date().toISOString(),
      fin: new Date(Date.now() + 3600000).toISOString(),
      dossierId: undefined,
      salleId: undefined,
      touteLaJournee: false,
      participants: [],
      statut: 'Planifie',
      rappelAvant: 30
    })
    setSearchParticipant('')
  }

  const openCreateModal = () => {
    resetForm()
    setSelectedEvent(null)
    setModalMode('create')
  }

  const openEditModal = (event: CalendarEventDto) => {
    setSelectedEvent(event)
    setFormData({
      type: event.type,
      titre: event.titre,
      description: event.description || '',
      debut: event.debut,
      fin: event.fin,
      dossierId: event.dossierId,
      salleId: event.salleId,
      touteLaJournee: event.touteLaJournee,
      participants: event.participants || [],
      statut: event.statut || 'Planifie',
      rappelAvant: event.rappelAvant || 30
    })
    setModalMode('edit')
  }

  const openDetailModal = (event: CalendarEventDto) => {
    setSelectedEvent(event)
    setModalMode('detail')
  }

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
      } else {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
      }
      return newDate
    })
  }

  const formatPeriod = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
    if (viewMode === 'week') {
      const start = new Date(currentDate)
      start.setDate(start.getDate() - start.getDay() + 1)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const today = new Date()

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonthEU(currentDate)

    return (
      <div className="calendar-container">
        <div className="calendar-grid-enhanced">
          <div className="calendar-header-row-enhanced">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="calendar-header-cell-enhanced">{day}</div>
            ))}
          </div>
          <div className="calendar-body-enhanced">
            {daysInMonth.map((day, idx) => {
              if (!day) {
                return <div key={idx} className="calendar-day-enhanced other-month" />
              }
              
              const dayEvents = events.filter(ev => isSameDate(new Date(ev.debut), day))
              const isToday = isSameDate(day, today)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={idx}
                  className={`calendar-day-enhanced ${isToday ? 'is-today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                  onClick={() => {
                    setCurrentDate(day)
                    setViewMode('day')
                  }}
                >
                  <div className="day-num">{day.getDate()}</div>
                  <div className="day-events-list">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="event-chip"
                        style={{ borderColor: EventTypeColors[event.type] || '#999' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetailModal(event)
                        }}
                      >
                        <span className="event-time">
                          {new Date(event.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="event-label">{event.titre}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="more-events-chip">+{dayEvents.length - 3} autres</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      return d
    })

    return (
      <div className="calendar-container">
        <div className="calendar-grid-enhanced">
          <div className="calendar-header-row-enhanced">
            {days.map((day, i) => (
              <div key={i} className="calendar-header-cell-enhanced">
                <div>{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{day.getDate()}</div>
              </div>
            ))}
          </div>
          <div className="calendar-body-enhanced">
            {days.map((day, idx) => {
              const dayEvents = events.filter(ev => isSameDate(new Date(ev.debut), day))
              const isToday = isSameDate(day, today)

              return (
                <div key={idx} className={`calendar-day-enhanced ${isToday ? 'is-today' : ''}`} style={{ minHeight: 200 }}>
                  <div className="day-events-list">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className="event-chip"
                        style={{ borderColor: EventTypeColors[event.type] || '#999' }}
                        onClick={() => openDetailModal(event)}
                      >
                        <span className="event-time">
                          {new Date(event.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="event-label">{event.titre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = events.filter(ev => isSameDate(new Date(ev.debut), currentDate))

    return (
      <div className="calendar-container" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 20, fontWeight: 600 }}>
          {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        
        {dayEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            Aucun événement ce jour
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dayEvents.map(event => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: 16,
                  background: '#f9fafb',
                  borderRadius: 12,
                  borderLeft: `4px solid ${EventTypeColors[event.type] || '#999'}`,
                  cursor: 'pointer'
                }}
                onClick={() => openDetailModal(event)}
              >
                <div style={{ minWidth: 80 }}>
                  <div style={{ fontWeight: 700, color: '#1f2937' }}>
                    {new Date(event.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {new Date(event.fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{event.titre}</div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    background: EventTypeColors[event.type] || '#999',
                    color: 'white',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {EventTypeLabels[event.type]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Filter participants for search (requires at least 2 characters)
  const filteredUsers = users.filter(user => {
    if (searchParticipant.length < 2) return false
    const searchLower = searchParticipant.toLowerCase()
    return (
      (user.nomComplet || '').toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      (user.username && user.username.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="calendar-page">
      {/* Header */}
      <div className="calendar-page-header">
        <div className="calendar-page-title">
          <h1>📅 Calendrier</h1>
          <span className="today-badge">
            {today.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>+</span>
            Nouvel événement
          </button>
        )}
      </div>

      {/* Navigation Bar */}
      <div className="calendar-nav-bar">
        <div className="calendar-nav-buttons">
          <button className="nav-btn" onClick={() => navigate('prev')}>
            ◀ Précédent
          </button>
          <button className="nav-btn today-btn" onClick={() => setCurrentDate(new Date())}>
            Aujourd'hui
          </button>
          <button className="nav-btn" onClick={() => navigate('next')}>
            Suivant ▶
          </button>
        </div>

        <div className="calendar-current-period">{formatPeriod()}</div>

        <div className="calendar-view-toggle">
          <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>
            Mois
          </button>
          <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>
            Semaine
          </button>
          <button className={viewMode === 'day' ? 'active' : ''} onClick={() => setViewMode('day')}>
            Jour
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="calendar-container" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
          <div style={{ color: '#6b7280' }}>Chargement du calendrier...</div>
        </div>
      ) : viewMode === 'month' ? (
        renderMonthView()
      ) : viewMode === 'week' ? (
        renderWeekView()
      ) : (
        renderDayView()
      )}

      {/* Create/Edit Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="calendar-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="calendar-modal" onClick={e => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2>
                {modalMode === 'create' ? '✨ Nouvel événement' : '✏️ Modifier l\'événement'}
              </h2>
              <button className="calendar-modal-close" onClick={() => setModalMode(null)}>×</button>
            </div>

            <form onSubmit={modalMode === 'create' ? handleCreateEvent : handleUpdateEvent}>
              <div className="calendar-modal-body">
                {/* General Info */}
                <div className="form-section">
                  <div className="form-section-title"><span>📋</span> Informations générales</div>
                  <div className="form-grid cols-2">
                    <div>
                      <label>Type d'événement *</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        required
                      >
                        <option value="Reunion">🤝 Réunion</option>
                        <option value="Audience">⚖️ Audience</option>
                        <option value="Formation">🎓 Formation</option>
                        <option value="Deadline">⏰ Deadline</option>
                        <option value="Personnel">📅 Personnel</option>
                      </select>
                    </div>
                    <div>
                      <label>Statut *</label>
                      <select
                        value={formData.statut}
                        onChange={e => setFormData({ ...formData, statut: e.target.value })}
                        required
                      >
                        <option value="Planifie">📅 Planifié</option>
                        <option value="EnCours">▶️ En cours</option>
                        <option value="Termine">✅ Terminé</option>
                        <option value="Reporte">⏸️ Reporté</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label>Titre *</label>
                      <input
                        type="text"
                        value={formData.titre}
                        onChange={e => setFormData({ ...formData, titre: e.target.value })}
                        placeholder="Titre de l'événement"
                        required
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label>Description</label>
                      <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Détails de l'événement..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="form-section">
                  <div className="form-section-title"><span>🕒</span> Date et heure</div>
                  <div className="form-grid cols-2">
                    <div>
                      <label>Début *</label>
                      <input
                        type="datetime-local"
                        value={formData.debut.substring(0, 16)}
                        onChange={e => setFormData({ ...formData, debut: new Date(e.target.value).toISOString() })}
                        required
                      />
                    </div>
                    <div>
                      <label>Fin *</label>
                      <input
                        type="datetime-local"
                        value={formData.fin.substring(0, 16)}
                        onChange={e => setFormData({ ...formData, fin: new Date(e.target.value).toISOString() })}
                        required
                      />
                    </div>
                    <div>
                      <label>Rappel</label>
                      <select
                        value={formData.rappelAvant}
                        onChange={e => setFormData({ ...formData, rappelAvant: parseInt(e.target.value) })}
                      >
                        <option value="0">Aucun</option>
                        <option value="15">15 min avant</option>
                        <option value="30">30 min avant</option>
                        <option value="60">1h avant</option>
                        <option value="1440">1 jour avant</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.touteLaJournee}
                          onChange={e => setFormData({ ...formData, touteLaJournee: e.target.checked })}
                        />
                        Toute la journée
                      </label>
                    </div>
                  </div>
                </div>

                {/* Association */}
                <div className="form-section">
                  <div className="form-section-title"><span>📁</span> Association</div>
                  <div className="form-grid cols-2">
                    <div>
                      <label>Dossier {formData.type === 'Audience' ? '*' : '(optionnel)'}</label>
                      <select
                        value={formData.dossierId || ''}
                        onChange={e => setFormData({ ...formData, dossierId: e.target.value || undefined })}
                        required={formData.type === 'Audience'}
                      >
                        <option value="">-- Choisir --</option>
                        {dossiers.map(d => (
                          <option key={d.id} value={d.id}>{d.numeroDossier} - {d.titre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Salle (optionnel)</label>
                      <select
                        value={formData.salleId || ''}
                        onChange={e => setFormData({ ...formData, salleId: e.target.value || undefined })}
                      >
                        <option value="">-- Choisir --</option>
                        {salles.map(s => (
                          <option key={s.id} value={s.id}>🏢 {s.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="form-section">
                  <div className="form-section-title">
                    <span>👥</span> Participants ({formData.participants?.length || 0} sélectionné{(formData.participants?.length || 0) > 1 ? 's' : ''})
                  </div>
                  
                  <input
                    type="text"
                    placeholder="🔍 Tapez au moins 2 caractères pour rechercher..."
                    value={searchParticipant}
                    onChange={e => setSearchParticipant(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />

                  {formData.participants && formData.participants.length > 0 && (
                    <div className="participants-grid" style={{ marginBottom: 12 }}>
                      {formData.participants.map(userId => {
                        const user = users.find(u => u.id === userId)
                        if (!user) return null
                        return (
                          <div key={userId} className="participant-chip" style={{ background: '#eff6ff', borderColor: '#3b82f6' }}>
                            <div className="participant-avatar">
                              {user.nomComplet?.charAt(0) || '?'}
                            </div>
                            <div className="participant-info">
                              <div className="name">{user.nomComplet}</div>
                              <div className="role">{user.role}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, participants: formData.participants?.filter(p => p !== userId) })}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18 }}
                            >
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {searchParticipant.length < 2 ? (
                    <div style={{ 
                      padding: 24, 
                      textAlign: 'center', 
                      color: '#6b7280', 
                      background: '#f9fafb',
                      borderRadius: 12,
                      border: '1px dashed #d1d5db'
                    }}>
                      <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>🔍</span>
                      Tapez au moins 2 caractères pour rechercher des participants
                    </div>
                  ) : filteredUsers.filter(u => !formData.participants?.includes(u.id)).length === 0 ? (
                    <div style={{ 
                      padding: 24, 
                      textAlign: 'center', 
                      color: '#6b7280', 
                      background: '#f9fafb',
                      borderRadius: 12,
                      border: '1px dashed #d1d5db'
                    }}>
                      Aucun participant trouvé pour "{searchParticipant}"
                    </div>
                  ) : (
                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                      <div className="participants-grid">
                        {filteredUsers.filter(u => !formData.participants?.includes(u.id)).map(user => (
                          <div
                            key={user.id}
                            className="participant-chip"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setFormData({ ...formData, participants: [...(formData.participants || []), user.id] })}
                          >
                            <div className="participant-avatar">{user.nomComplet?.charAt(0) || '?'}</div>
                            <div className="participant-info">
                              <div className="name">{user.nomComplet}</div>
                              <div className="role">{user.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="calendar-modal-footer">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {modalMode === 'create' ? '✨ Créer' : '💾 Enregistrer'}
                </button>
                {modalMode === 'edit' && selectedEvent && (
                  <button type="button" className="btn btn-danger" onClick={() => handleDeleteEvent(selectedEvent.id)}>
                    🗑️ Supprimer
                  </button>
                )}
                <button type="button" className="btn" onClick={() => setModalMode(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modalMode === 'detail' && selectedEvent && (
        <div className="calendar-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="calendar-modal event-detail-card" onClick={e => e.stopPropagation()}>
            <div className={`event-detail-header ${EVENT_TYPE_CLASSES[selectedEvent.type] || 'event-type-reunion'}`}>
              <h2>{selectedEvent.titre}</h2>
              <span className="event-type-badge">
                {EventTypeLabels[selectedEvent.type]}
              </span>
            </div>

            <div className="event-detail-body">
              <div className="event-detail-row">
                <div className="event-detail-icon">🕒</div>
                <div className="event-detail-content">
                  <label>Date et heure</label>
                  <p>
                    {new Date(selectedEvent.debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    <br />
                    {new Date(selectedEvent.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {new Date(selectedEvent.fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="event-detail-row">
                  <div className="event-detail-icon">📝</div>
                  <div className="event-detail-content">
                    <label>Description</label>
                    <p>{selectedEvent.description}</p>
                  </div>
                </div>
              )}

              {selectedEvent.dossierId && (
                <div className="event-detail-row">
                  <div className="event-detail-icon">📁</div>
                  <div className="event-detail-content">
                    <label>Dossier associé</label>
                    <p>
                      {dossiers.find(d => d.id === selectedEvent.dossierId)?.numeroDossier || 'N/A'}
                      {' - '}
                      {dossiers.find(d => d.id === selectedEvent.dossierId)?.titre || ''}
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="event-detail-row">
                  <div className="event-detail-icon">👥</div>
                  <div className="event-detail-content">
                    <label>Participants ({selectedEvent.participants.length})</label>
                    <div className="participants-grid">
                      {selectedEvent.participants.map(participantId => {
                        const user = users.find(u => u.id === participantId)
                        if (!user) return null
                        return (
                          <div key={user.id} className="participant-chip">
                            <div className="participant-avatar">{user.nomComplet?.charAt(0) || '?'}</div>
                            <div className="participant-info">
                              <div className="name">{user.nomComplet}</div>
                              <div className="role">{user.role}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="calendar-modal-footer">
              {canEdit && (
                <button className="btn btn-primary" onClick={() => openEditModal(selectedEvent)} style={{ flex: 1 }}>
                  ✏️ Modifier
                </button>
              )}
              <button className="btn" onClick={() => setModalMode(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
