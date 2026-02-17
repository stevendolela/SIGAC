import { useEffect, useState, useMemo } from 'react'
import { useToast } from '../components/common/ToastProvider'
import { CalendarApi } from '../api/calendarApi'
import { dossierApi } from '../api/dossierApi'
import { userApi } from '../api/userApi'
import type { CalendarEventDto, CreateCalendarEventDto } from '../types/calendar'
import { EventTypeLabels, EventTypeColors } from '../types/calendar'
import type { DossierListDto } from '../types/dossier'
import type { UserDto } from '../types/user'
import { getDaysInMonthEU, isSameDate, formatDateToISO } from '../utils/dateUtils'

interface CalendarPageProps {
  onViewDossier?: (dossierId: string) => void
  onManageSalles?: () => void
}

export default function CalendarPage({ onViewDossier, onManageSalles }: CalendarPageProps = {}) {
  const [events, setEvents] = useState<CalendarEventDto[]>([])
  const [dossiers, setDossiers] = useState<DossierListDto[]>([])
  const [users, setUsers] = useState<UserDto[]>([])
  const [salles, setSalles] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [showForm, setShowForm] = useState<'create' | 'edit' | 'detail' | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchParticipant, setSearchParticipant] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatut, setFilterStatut] = useState<string>('')
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
      date.setDate(date.getDate() - date.getDay() + 1) // Lundi de la première semaine
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
      notify({ type: 'success', message: '✅ Événement créé' })
      setEvents([...events, created])
      setShowForm(null)
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
      notify({ type: 'success', message: '✅ Événement modifié' })
      setEvents(events.map(ev => ev.id === updated.id ? updated : ev))
      setShowForm(null)
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
      notify({ type: 'success', message: '✅ Événement supprimé' })
      setEvents(events.filter(ev => ev.id !== id))
      setShowForm(null)
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
      participants: []
    })
  }

  const openCreateForm = () => {
    resetForm()
    setSelectedEvent(null)
    setShowForm('create')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEditForm = (event: CalendarEventDto) => {
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
      participants: event.participants || []
    })
    setShowForm('edit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openDetailView = (event: CalendarEventDto) => {
    setSelectedEvent(event)
    setShowForm('detail')
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
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

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonthEU(currentDate)
    const today = new Date()

    return (
      <div className="calendar-grid">
        <div className="calendar-header-row">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="calendar-header-cell">{day}</div>
          ))}
        </div>
        <div className="calendar-body">
          {daysInMonth.map((day, idx) => {
            if (!day) {
              // Jour vide (avant le début du mois)
              return <div key={idx} className="calendar-day-cell calendar-day-empty" />
            }
            
            const dayEvents = events.filter(ev => isSameDate(new Date(ev.debut), day))
            const isToday = isSameDate(day, today)
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${isToday ? 'is-today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                onClick={() => {
                  setCurrentDate(day)
                  setViewMode('day')
                }}
              >
                <div className="day-number">{day.getDate()}</div>
                <div className="day-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="event-badge"
                      style={{ borderLeft: `3px solid ${EventTypeColors[event.type] || '#999'}` }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openDetailView(event)
                      }}
                    >
                      <span className="event-time">{new Date(event.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="event-title">{event.titre}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="more-events">+{dayEvents.length - 3} autres</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📅 Calendrier de Travail</span>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateForm}>
            ➕ Nouvel événement
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => navigateMonth('prev')}>◀ Précédent</button>
        <button className="btn" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</button>
        <button className="btn" onClick={() => navigateMonth('next')}>Suivant ▶</button>
        
        <div style={{ flex: 1 }} />
        
        <select value={viewMode} onChange={e => setViewMode(e.target.value as any)} className="form-select">
          <option value="month">Mois</option>
          <option value="week">Semaine</option>
          <option value="day">Jour</option>
        </select>

        <h3 style={{ margin: 0, minWidth: 180 }}>
          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h3>
      </div>

      {/* Formulaire de création/édition */}
      {showForm === 'create' && (
        <form onSubmit={handleCreateEvent} className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 24 }}>➕ Nouvel événement</h3>
          
          {/* Section: Informations générales */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>📋 Informations générales</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 150px', gap: 16, alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>Type d'événement *</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="Reunion">🤝 Réunions</option>
                  <option value="Audience">⚖️ Audiences</option>
                  <option value="Formation">🎓 Formations</option>
                  <option value="Deadline">⏰ Deadlines</option>
                  <option value="Personnel">📅 Personnel</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>Titre *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={e => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Ex: Réunion d'équipe, Consultation, Audience publique..."
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>Statut *</label>
                <select 
                  value={formData.statut} 
                  onChange={e => setFormData({ ...formData, statut: e.target.value })}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="Planifie">📅 Planifié</option>
                  <option value="EnCours">▶️ En cours</option>
                  <option value="Termine">✅ Terminé</option>
                  <option value="Reporte">⏸️ Reporté</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de l'événement..."
                  rows={3}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Section: Date et heure */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>🕒 Date et heure</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>Date et heure de début *</label>
                <input
                  type="datetime-local"
                  value={formData.debut.substring(0, 16)}
                  onChange={e => setFormData({ ...formData, debut: new Date(e.target.value).toISOString() })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>Date et heure de fin *</label>
                <input
                  type="datetime-local"
                  value={formData.fin.substring(0, 16)}
                  onChange={e => setFormData({ ...formData, fin: new Date(e.target.value).toISOString() })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ paddingBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={formData.touteLaJournee}
                    onChange={e => setFormData({ ...formData, touteLaJournee: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Toute la journée</span>
                </label>
              </div>
            </div>

            {/* Rappel automatique */}
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>🔔 Rappel automatique</label>
              <select 
                value={formData.rappelAvant} 
                onChange={e => setFormData({ ...formData, rappelAvant: parseInt(e.target.value) })}
                style={{ width: '200px' }}
              >
                <option value="0">Aucun rappel</option>
                <option value="15">15 minutes avant</option>
                <option value="30">30 minutes avant</option>
                <option value="60">1 heure avant</option>
                <option value="120">2 heures avant</option>
                <option value="1440">1 jour avant</option>
              </select>
            </div>
          </div>

          {/* Section: Association */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>📁 Association</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Dossier */}
              {formData.type === 'Audience' ? (
                <div>
                  <label style={{ display: 'block', marginBottom: 6 }}>Dossier * (requis pour audience)</label>
                  <select
                    value={formData.dossierId || ''}
                    onChange={e => setFormData({ ...formData, dossierId: e.target.value || undefined })}
                    required
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Sélectionner un dossier --</option>
                    {dossiers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.numeroDossier} - {d.titre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: 6 }}>Dossier associé (optionnel)</label>
                  <select
                    value={formData.dossierId || ''}
                    onChange={e => setFormData({ ...formData, dossierId: e.target.value || undefined })}
                    style={{ width: '100%' }}
                  >
                    <option value="">Aucun</option>
                    {dossiers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.numeroDossier} - {d.titre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Salle de réunion */}
              <div>
                <label style={{ display: 'block', marginBottom: 6 }}>Salle de réunion (optionnel)</label>
                <select
                  value={formData.salleId || ''}
                  onChange={e => setFormData({ ...formData, salleId: e.target.value || undefined })}
                  style={{ width: '100%' }}
                >
                  <option value="">Aucune salle</option>
                  {salles.map(s => (
                    <option key={s.id} value={s.id}>
                      🏢 {s.nom} - {s.capacite} pers.
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Participants */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
              👥 Participants (internes)
              {formData.participants && formData.participants.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 13, color: '#6b7280', fontWeight: 400 }}>
                  ({formData.participants.length} sélectionné{formData.participants.length > 1 ? 's' : ''})
                </span>
              )}
            </h4>

            {/* Zone de recherche */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                placeholder="🔍 Rechercher un participant par nom, prénom ou rôle..."
                value={searchParticipant}
                onChange={e => setSearchParticipant(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Participants sélectionnés (badges) */}
            {formData.participants && formData.participants.length > 0 && (
              <div style={{ 
                marginBottom: 12,
                padding: 12,
                backgroundColor: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: 8
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1e40af', marginBottom: 8 }}>
                  ✓ Participants sélectionnés :
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {formData.participants.map(userId => {
                    const user = users.find(u => u.id === userId);
                    if (!user) return null;
                    return (
                      <span
                        key={userId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: 16,
                          fontSize: 13,
                          fontWeight: 500
                        }}
                      >
                        {user.nomComplet}
                        <button
                          type="button"
                          onClick={() => {
                            const newParticipants = formData.participants?.filter(p => p !== userId) || [];
                            setFormData({ ...formData, participants: newParticipants });
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: 16,
                            lineHeight: 1,
                            padding: 0,
                            marginLeft: 2
                          }}
                          title="Retirer"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Liste filtrée des participants */}
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: 8, 
              padding: 16, 
              maxHeight: 240, 
              overflowY: 'auto',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {users
                  .filter(user => {
                    if (!searchParticipant) return true;
                    const searchLower = searchParticipant.toLowerCase();
                    return (
                      (user.nomComplet || '').toLowerCase().includes(searchLower) ||
                      user.role.toLowerCase().includes(searchLower) ||
                      (user.username && user.username.toLowerCase().includes(searchLower))
                    );
                  })
                  .map(user => (
                    <label 
                      key={user.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 10,
                        padding: 10,
                        backgroundColor: 'white',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      className="participant-label"
                    >
                      <input
                        type="checkbox"
                        checked={formData.participants?.includes(user.id) || false}
                        onChange={e => {
                          const newParticipants = e.target.checked
                            ? [...(formData.participants || []), user.id]
                            : (formData.participants || []).filter(p => p !== user.id)
                          setFormData({ ...formData, participants: newParticipants })
                        }}
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.nomComplet}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{user.role}</div>
                      </div>
                    </label>
                  ))}
              </div>
              {users.filter(user => {
                if (!searchParticipant) return true;
                const searchLower = searchParticipant.toLowerCase();
                return (
                  (user.nomComplet || '').toLowerCase().includes(searchLower) ||
                  user.role.toLowerCase().includes(searchLower) ||
                  (user.username && user.username.toLowerCase().includes(searchLower))
                );
              }).length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280', fontSize: 14 }}>
                  Aucun participant trouvé pour "{searchParticipant}"
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
            <button type="submit" className="btn btn-primary" style={{ minWidth: 120 }}>
              💾 Créer
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(null)} style={{ minWidth: 120 }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Formulaire d'édition */}
      {showForm === 'edit' && selectedEvent && (
        <form onSubmit={handleUpdateEvent} className="card" style={{ marginBottom: 16 }}>
          <h3>✏️ Modifier événement</h3>
          {/* Same form fields as create */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
            {/* Copy same fields from create form */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Titre *</label>
              <input
                type="text"
                value={formData.titre}
                onChange={e => setFormData({ ...formData, titre: e.target.value })}
                required
              />
            </div>
            {/* Add other fields... */}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary">💾 Enregistrer</button>
            <button type="button" className="btn btn-danger" onClick={() => handleDeleteEvent(selectedEvent.id)}>🗑️ Supprimer</button>
            <button type="button" className="btn" onClick={() => setShowForm(null)}>Annuler</button>
          </div>
        </form>
      )}

      {/* Vue détaillée */}
      {showForm === 'detail' && selectedEvent && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ marginBottom: 8 }}>{selectedEvent.titre}</h3>
              <span className="badge" style={{ background: EventTypeColors[selectedEvent.type] }}>
                {EventTypeLabels[selectedEvent.type]}
              </span>
            </div>
            {canEdit && (
              <button className="btn" onClick={() => openEditForm(selectedEvent)}>✏️ Modifier</button>
            )}
          </div>
          
          <div style={{ marginTop: 16 }}>
            <p><strong>🕒 Début :</strong> {new Date(selectedEvent.debut).toLocaleString('fr-FR')}</p>
            <p><strong>🕒 Fin :</strong> {new Date(selectedEvent.fin).toLocaleString('fr-FR')}</p>
            {selectedEvent.description && <p><strong>📝 Description :</strong> {selectedEvent.description}</p>}
            {selectedEvent.dossierId && (
              <p>
                <strong>📁 Dossier :</strong>{' '}
                {dossiers.find(d => d.id === selectedEvent.dossierId)?.numeroDossier || selectedEvent.dossierId}
              </p>
            )}
            {selectedEvent.participants && selectedEvent.participants.length > 0 && (
              <div>
                <strong>👥 Participants ({selectedEvent.participants.length}) :</strong>
                <ul>
                  {selectedEvent.participants.map(participantId => {
                    const user = users.find(u => u.id === participantId)
                    return user ? <li key={user.id}>{user.nomComplet} ({user.role})</li> : null
                  })}
                </ul>
              </div>
            )}
          </div>

          <button className="btn" onClick={() => setShowForm(null)} style={{ marginTop: 16 }}>Fermer</button>
        </div>
      )}

      {/* Calendrier */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Chargement...</div>
      ) : viewMode === 'month' ? (
        renderMonthView()
      ) : (
        <div className="card">Vue {viewMode} (à implémenter)</div>
      )}
    </div>
  )
}
