import { useEffect, useState } from 'react'
import { useToast } from '../components/common/ToastProvider'

interface Audience {
  id: string
  dossierId: string
  numeroDossier: string
  titreDossier: string
  dateAudience: string
  heureDebut: string
  heureFin: string
  salle: string
  typeAudience: 'Publique' | 'Huis Clos' | 'Délibéré'
  statut: 'Planifiée' | 'En Cours' | 'Terminée' | 'Annulée' | 'Reportée'
  jugesPresents?: string[]
  observations?: string
}

export default function AudiencesPage() {
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const { notify } = useToast()

  // Données de démonstration
  useEffect(() => {
    setLoading(true)
    // Simuler le chargement d'audiences
    setTimeout(() => {
      const mockAudiences: Audience[] = [
        {
          id: '1',
          dossierId: 'dossier-1',
          numeroDossier: 'CC/2025/001',
          titreDossier: 'Contestation électorale - Province du Nord-Kivu',
          dateAudience: '2025-11-18',
          heureDebut: '09:00',
          heureFin: '12:00',
          salle: 'Grande Salle d\'Audience',
          typeAudience: 'Publique',
          statut: 'Planifiée',
          jugesPresents: ['Juge Mbala', 'Juge Tshisekedi', 'Président Benoit']
        },
        {
          id: '2',
          dossierId: 'dossier-2',
          numeroDossier: 'CC/2025/002',
          titreDossier: 'Recours constitutionnel - Loi organique',
          dateAudience: '2025-11-20',
          heureDebut: '14:00',
          heureFin: '17:00',
          salle: 'Salle de Délibéré',
          typeAudience: 'Huis Clos',
          statut: 'Planifiée',
          jugesPresents: ['Juge Kabongo', 'Président Benoit']
        },
        {
          id: '3',
          dossierId: 'dossier-3',
          numeroDossier: 'CC/2025/003',
          titreDossier: 'Conflit de compétence - Assemblée Nationale',
          dateAudience: '2025-11-16',
          heureDebut: '10:00',
          heureFin: '11:30',
          salle: 'Grande Salle d\'Audience',
          typeAudience: 'Publique',
          statut: 'Terminée',
          observations: 'Audience tenue avec succès. Délibéré prévu.'
        }
      ]
      setAudiences(mockAudiences)
      setLoading(false)
    }, 500)
  }, [])

  const getCurrentWeek = () => {
    const today = new Date()
    const week = []
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1))
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      week.push(date)
    }
    return week
  }

  const getAudiencesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return audiences.filter(a => a.dateAudience === dateStr)
  }

  const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
    'Planifiée': { bg: '#dbeafe', text: '#1e40af', icon: '📅' },
    'En Cours': { bg: '#fef3c7', text: '#92400e', icon: '⏳' },
    'Terminée': { bg: '#dcfce7', text: '#15803d', icon: '✅' },
    'Annulée': { bg: '#fee2e2', text: '#991b1b', icon: '❌' },
    'Reportée': { bg: '#fce7f3', text: '#9f1239', icon: '🔄' }
  }

  const typeColors: Record<string, { bg: string; text: string }> = {
    'Publique': { bg: '#e0e7ff', text: '#3730a3' },
    'Huis Clos': { bg: '#fef3c7', text: '#92400e' },
    'Délibéré': { bg: '#ddd6fe', text: '#5b21b6' }
  }

  const weekDays = getCurrentWeek()
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="panel">
      <div className="panel-title">📅 Gestion des Audiences</div>

      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tabs" style={{ margin: 0, flex: 1 }}>
          <button 
            className={`tab ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendrier Hebdomadaire
          </button>
          <button 
            className={`tab ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 Liste Complète
          </button>
        </div>
        <button className="btn" onClick={() => notify({ type: 'info', message: '🔔 Nouvelle audience (à implémenter)' })}>
          ➕ Planifier une audience
        </button>
      </div>

      {loading && <div className="info">⏳ Chargement du calendrier...</div>}

      {!loading && viewMode === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
          {weekDays.map((date, idx) => {
            const dateStr = date.toISOString().split('T')[0]
            const dayAudiences = getAudiencesForDate(date)
            const isToday = dateStr === todayStr
            const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
            
            return (
              <div 
                key={idx}
                className="card"
                style={{
                  background: isToday 
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.5)',
                  borderLeft: isToday ? '4px solid #667eea' : '1px solid rgba(0, 0, 0, 0.05)',
                  minHeight: 200
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{dayNames[date.getDay()]}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: isToday ? '#667eea' : '#1e293b' }}>
                    {date.getDate()}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {date.toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayAudiences.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                      Aucune audience
                    </div>
                  ) : (
                    dayAudiences.map(audience => {
                      const statusInfo = statusColors[audience.statut]
                      return (
                        <div
                          key={audience.id}
                          style={{
                            padding: 8,
                            background: statusInfo.bg,
                            borderRadius: 8,
                            borderLeft: `3px solid ${statusInfo.text}`,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                        >
                          <div style={{ fontSize: 11, fontWeight: 600, color: statusInfo.text, marginBottom: 4 }}>
                            {statusInfo.icon} {audience.heureDebut}
                          </div>
                          <div style={{ fontSize: 10, color: '#475569', fontWeight: 500, lineHeight: 1.3 }}>
                            {audience.numeroDossier}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && viewMode === 'list' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Dossier</th>
                <th>Salle</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Juges</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audiences.map(audience => {
                const statusInfo = statusColors[audience.statut]
                const typeInfo = typeColors[audience.typeAudience]
                return (
                  <tr key={audience.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        📅 {new Date(audience.dateAudience).toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        🕐 {audience.heureDebut} - {audience.heureFin}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{audience.numeroDossier}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{audience.titreDossier}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>🏛️ {audience.salle}</td>
                    <td>
                      <span className="badge" style={{ background: typeInfo.bg, color: typeInfo.text }}>
                        {audience.typeAudience}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: statusInfo.bg, color: statusInfo.text }}>
                        {statusInfo.icon} {audience.statut}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        {audience.jugesPresents?.map((juge, idx) => (
                          <div key={idx} style={{ color: '#475569' }}>👨‍⚖️ {juge}</div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button className="btn" style={{ fontSize: 13, padding: '6px 12px' }}>
                        📝 Détails
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {audiences.length === 0 && (
            <div className="info" style={{ textAlign: 'center', padding: 40 }}>
              📅 Aucune audience planifiée pour le moment
            </div>
          )}
        </div>
      )}
    </div>
  )
}
