import { useEffect, useState } from 'react'
import { useToast } from '../components/common/ToastProvider'
import AudienceForm from '../components/audiences/AudienceForm'
import AudienceDetail from '../components/audiences/AudienceDetail'
import Modal from '../components/common/Modal'
import { audienceApi } from '../api/audienceApi'
import { dossierApi } from '../api/dossierApi'
import type { AudienceListDto } from '../types/audience'
import { TypeAudience, StatutAudience, typeAudienceLabels, statutAudienceLabels } from '../types/audience'
import type { DossierListDto } from '../types/dossier'
import { parseDateString, formatDateToISO, isSameDate, getDaysInMonthEU, getDayOfWeekEU } from '../utils/dateUtils'

interface AudiencesPageProps {
  onViewDossier?: (dossierId: string) => void
  onManageSalles?: () => void
}

export default function AudiencesPage({ onViewDossier, onManageSalles }: AudiencesPageProps = {}) {
  const [audiences, setAudiences] = useState<AudienceListDto[]>([])
  const [dossiers, setDossiers] = useState<Map<string, DossierListDto>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [showAudienceModal, setShowAudienceModal] = useState(false)
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | undefined>()
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [viewAudienceId, setViewAudienceId] = useState<string | null>(null)
  const { notify } = useToast()

  // Récupérer le rôle de l'utilisateur depuis localStorage
  const getUserRole = (): string | null => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    try {
      const user = JSON.parse(userStr)
      return user.role || null
    } catch (e) {
      console.error('Failed to parse user from localStorage', e)
      return null
    }
  }

  const isAdmin = getUserRole() === 'Administrateur'

  // Charger les audiences depuis l'API
  useEffect(() => {
    loadAudiences()
  }, [])

  const loadAudiences = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Charger les audiences
      const audiencesData = await audienceApi.list()
      
      // Extraire les IDs de dossiers uniques
      const dossierIds = [...new Set(audiencesData.map(a => a.dossierId))]
      
      // Charger les informations des dossiers
      const dossiersMap = new Map<string, DossierListDto>()
      await Promise.all(
        dossierIds.map(async (dossierId) => {
          try {
            const dossier = await dossierApi.getById(dossierId)
            dossiersMap.set(dossierId, dossier)
          } catch (err) {
            console.warn(`Failed to load dossier ${dossierId}`, err)
          }
        })
      )
      
      setDossiers(dossiersMap)
      setAudiences(audiencesData)
    } catch (err: any) {
      console.error('Failed to load audiences:', err)
      setError(err.message || 'Erreur lors du chargement des audiences')
      notify({ type: 'error', message: '❌ Erreur lors du chargement des audiences' })
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    return getDaysInMonthEU(date)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateToToday = () => {
    setCurrentDate(new Date())
  }

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
    // Utiliser la fonction utilitaire pour éviter le décalage timezone
    const targetDateStr = formatDateToISO(date)
    return audiences.filter(a => {
      const audienceDateStr = a.dateAudience.split('T')[0]
      return audienceDateStr === targetDateStr
    })
  }

  // Helper pour extraire l'heure d'une date ISO
  const formatTime = (isoDate: string) => {
    try {
      const date = new Date(isoDate)
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // Mapping des statuts avec les couleurs
  const getStatutInfo = (statut: StatutAudience) => {
    const mapping: Record<StatutAudience, { bg: string; text: string; icon: string }> = {
      [0]: { bg: '#dbeafe', text: '#1e40af', icon: '📅' }, // Planifiee
      [1]: { bg: '#dcfce7', text: '#15803d', icon: '✅' }, // Confirmee
      [2]: { bg: '#fce7f3', text: '#9f1239', icon: '🔄' }, // Reportee
      [3]: { bg: '#fee2e2', text: '#991b1b', icon: '❌' }, // Annulee
      [4]: { bg: '#d1fae5', text: '#065f46', icon: '✓' }  // Tenue
    }
    return mapping[statut] || mapping[0]
  }

  // Mapping des types avec les couleurs
  const getTypeInfo = (type: TypeAudience) => {
    const mapping: Record<TypeAudience, { bg: string; text: string }> = {
      [0]: { bg: '#e0e7ff', text: '#3730a3' }, // Preliminaire
      [1]: { bg: '#ddd6fe', text: '#5b21b6' }, // Plaidoirie
      [2]: { bg: '#fef3c7', text: '#92400e' }, // Delibere
      [3]: { bg: '#fce7f3', text: '#be185d' }, // Prononce
      [4]: { bg: '#e0f2fe', text: '#075985' }, // Instruction
      [5]: { bg: '#ccfbf1', text: '#115e59' }  // MiseEnEtat
    }
    return mapping[type] || mapping[0]
  }

  const monthDays = getDaysInMonth(currentDate)
  const weekDays = getCurrentWeek()
  const todayStr = formatDateToISO(new Date())
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const dayNamesShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] // Calendrier européen

  const handleNewAudience = () => {
    setSelectedAudienceId(undefined)
    setShowAudienceModal(true)
  }

  const handleAudienceSuccess = () => {
    setShowAudienceModal(false)
    setSelectedAudienceId(undefined)
    notify({ type: 'success', message: '✅ Audience enregistrée avec succès' })
    // Recharger les audiences après création/modification
    loadAudiences()
  }

  const handleSelectAudience = (id: string) => {
    setSelectedAudienceId(id)
    setShowAudienceModal(true)
  }

  const handleViewAudience = (id: string) => {
    setViewAudienceId(id)
    setShowDetailModal(true)
  }

  const handleEditFromDetail = () => {
    if (!viewAudienceId) return
    setShowDetailModal(false)
    setSelectedAudienceId(viewAudienceId)
    setViewAudienceId(null)
    setShowAudienceModal(true)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setViewAudienceId(null)
  }

  const handleViewDossier = (dossierId: string) => {
    if (onViewDossier) {
      onViewDossier(dossierId)
    }
  }

  return (
    <div className="panel">
      <div className="panel-title">📅 Gestion des Audiences</div>

      {/* Affichage d'erreur */}
      {error && (
        <div className="error" style={{ marginBottom: 20 }}>
          ❌ {error}
          <button 
            className="btn" 
            onClick={loadAudiences}
            style={{ marginLeft: 10, padding: '4px 12px', fontSize: 13 }}
          >
            🔄 Réessayer
          </button>
        </div>
      )}

      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tabs" style={{ margin: 0, flex: 1 }}>
          <button 
            className={`tab ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendrier Mensuel
          </button>
          <button 
            className={`tab ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 Liste Complète
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => onManageSalles?.()}>
            🏛️ Gestion des salles
          </button>
          <button className="btn" onClick={handleNewAudience}>
          ➕ Planifier une audience
          </button>
        </div>
      </div>

      {/* Navigation mois/année */}
      {viewMode === 'calendar' && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 20,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: 12,
          border: '1px solid rgba(102, 126, 234, 0.2)'
        }}>
          <button 
            className="btn"
            onClick={() => navigateMonth('prev')}
            style={{ fontSize: 20, padding: '8px 16px' }}
          >
            ‹
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#667eea' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button 
                onClick={navigateToToday}
                style={{
                  fontSize: 12,
                  color: '#667eea',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginTop: 4
                }}
              >
                📍 Aujourd'hui
              </button>
            </div>
          </div>
          
          <button 
            className="btn"
            onClick={() => navigateMonth('next')}
            style={{ fontSize: 20, padding: '8px 16px' }}
          >
            ›
          </button>
        </div>
      )}

      {loading && <div className="info">⏳ Chargement du calendrier...</div>}

      {!loading && viewMode === 'calendar' && (
        <>
          {/* En-têtes des jours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
            {dayNamesShort.map((day, idx) => (
              <div 
                key={idx}
                style={{
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  color: idx === 5 || idx === 6 ? '#dc2626' : '#64748b', // Samedi (5) et Dimanche (6) en rouge
                  padding: '8px 0',
                  borderBottom: '2px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille du mois complet */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {monthDays.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} style={{ minHeight: 120 }} />
              }

              const dateStr = formatDateToISO(date)
              const dayAudiences = getAudiencesForDate(date)
              const isToday = dateStr === todayStr
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const dayOfWeekEU = getDayOfWeekEU(date)
              const isWeekend = dayOfWeekEU >= 6 // 6 = samedi, 7 = dimanche
              
              return (
                <div 
                  key={idx}
                  className="card"
                  style={{
                    background: isToday 
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)'
                      : isCurrentMonth ? 'rgba(255, 255, 255, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                    borderLeft: isToday ? '4px solid #667eea' : '1px solid rgba(0, 0, 0, 0.05)',
                    minHeight: 120,
                    opacity: isCurrentMonth ? 1 : 0.6
                  }}
                >
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: 8, 
                    paddingBottom: 6, 
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                  }}>
                    <div style={{ 
                      fontSize: 18, 
                      fontWeight: isToday ? 700 : 600, 
                      color: isWeekend ? '#dc2626' : isToday ? '#667eea' : '#1e293b' 
                    }}>
                      {date.getDate()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {dayAudiences.length === 0 ? (
                      <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                        -
                      </div>
                    ) : (
                      dayAudiences.map(audience => {
                        const statusInfo = getStatutInfo(audience.statut)
                        return (
                          <div
                            key={audience.id}
                            onClick={() => handleViewAudience(audience.id)}
                            style={{
                              padding: 6,
                              background: statusInfo.bg,
                              borderRadius: 6,
                              borderLeft: `3px solid ${statusInfo.text}`,
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                          >
                            <div style={{ fontSize: 10, fontWeight: 600, color: statusInfo.text, marginBottom: 2 }}>
                              {statusInfo.icon} {formatTime(audience.dateAudience)}
                            </div>
                            <div style={{ fontSize: 9, color: '#475569', fontWeight: 500, lineHeight: 1.2 }}>
                              {audience.dossierNumero || 'N/A'}
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
        </>
      )}

      {!loading && viewMode === 'list' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Dossier</th>
                <th>Lieu</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audiences.map(audience => {
                const statusInfo = getStatutInfo(audience.statut)
                const typeInfo = getTypeInfo(audience.typeAudience)
                return (
                  <tr key={audience.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        📅 {new Date(audience.dateAudience).toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        🕐 {formatTime(audience.dateAudience)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{audience.dossierNumero || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{audience.dossierTitre || '-'}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>🏛️ {audience.lieu}</td>
                    <td>
                      <span className="badge" style={{ background: typeInfo.bg, color: typeInfo.text }}>
                        {typeAudienceLabels[audience.typeAudience]}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: statusInfo.bg, color: statusInfo.text }}>
                        {statusInfo.icon} {statutAudienceLabels[audience.statut]}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn" 
                        style={{ fontSize: 13, padding: '6px 12px' }}
                        onClick={() => handleViewAudience(audience.id)}
                      >
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
      
      {/* Modal Formulaire Audience */}
      <Modal
        isOpen={showAudienceModal}
        onClose={() => {
          setShowAudienceModal(false)
          setSelectedAudienceId(undefined)
        }}
        title={selectedAudienceId ? 'Modifier l\'audience' : 'Planifier une audience'}
        size="lg"
      >
        <AudienceForm
          audienceId={selectedAudienceId}
          onSuccess={handleAudienceSuccess}
          onCancel={() => {
            setShowAudienceModal(false)
            setSelectedAudienceId(undefined)
          }}
        />
      </Modal>

      {/* Modal Détail Audience */}
      {viewAudienceId && (
        <Modal
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
          title="Détails de l'audience"
          size="lg"
        >
          <AudienceDetail
            audienceId={viewAudienceId}
            onEdit={handleEditFromDetail}
            onClose={handleCloseDetail}
            canEdit={isAdmin}
            onViewDossier={handleViewDossier}
          />
        </Modal>
      )}
    </div>
  )
}
