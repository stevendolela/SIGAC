import { useEffect, useState, useMemo } from 'react'
import { useToast } from '../components/common/ToastProvider'
import AudienceForm from '../components/audiences/AudienceForm'
import AudienceDetail from '../components/audiences/AudienceDetail'
import { audienceApi } from '../api/audienceApi'
import { dossierApi } from '../api/dossierApi'
import type { AudienceListDto } from '../types/audience'
import { TypeAudience, StatutAudience, typeAudienceLabels, statutAudienceLabels } from '../types/audience'
import type { DossierDetailDto } from '../types/dossierDetail'
import { parseDateString, formatDateToISO, isSameDate, getDaysInMonthEU, getDayOfWeekEU } from '../utils/dateUtils'
import { 
  Calendar, CalendarCheck, CalendarX, CalendarClock, Plus, X, Edit2, Eye, 
  RefreshCw, Building2, ChevronLeft, ChevronRight, MapPin, Clock, FileText,
  List, LayoutGrid, AlertCircle, CheckCircle, XCircle, RotateCcw
} from 'lucide-react'

interface AudiencesPageProps {
  onViewDossier?: (dossierId: string) => void
  onManageSalles?: () => void
}

export default function AudiencesPage({ onViewDossier, onManageSalles }: AudiencesPageProps = {}) {
  const [audiences, setAudiences] = useState<AudienceListDto[]>([])
  const [dossiers, setDossiers] = useState<Map<string, DossierDetailDto>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [showForm, setShowForm] = useState<'create' | 'edit' | 'detail' | null>(null)
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | undefined>()
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

  const isAdmin = getUserRole() === 'Admin'

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
      const dossiersMap = new Map<string, DossierDetailDto>()
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
    const mapping: Record<StatutAudience, { bg: string; text: string; icon: React.ReactNode }> = {
      [0]: { bg: '#dbeafe', text: '#1e40af', icon: <CalendarClock size={12} /> }, // Planifiee
      [1]: { bg: '#dcfce7', text: '#15803d', icon: <CheckCircle size={12} /> }, // Confirmee
      [2]: { bg: '#fce7f3', text: '#9f1239', icon: <RotateCcw size={12} /> }, // Reportee
      [3]: { bg: '#fee2e2', text: '#991b1b', icon: <XCircle size={12} /> }, // Annulee
      [4]: { bg: '#d1fae5', text: '#065f46', icon: <CalendarCheck size={12} /> }  // Tenue
    }
    return mapping[statut] || mapping[0]
  }

  // Stats calculées
  const stats = useMemo(() => {
    const total = audiences.length
    const planifiees = audiences.filter(a => a.statut === StatutAudience.Planifiee).length
    const confirmees = audiences.filter(a => a.statut === StatutAudience.Confirmee).length
    const tenues = audiences.filter(a => a.statut === StatutAudience.Tenue).length
    const reportees = audiences.filter(a => a.statut === StatutAudience.Reportee).length
    const annulees = audiences.filter(a => a.statut === StatutAudience.Annulee).length
    return { total, planifiees, confirmees, tenues, reportees, annulees }
  }, [audiences])

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
    setShowForm('create')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAudienceSuccess = () => {
    setShowForm(null)
    setSelectedAudienceId(undefined)
    notify({ type: 'success', message: '✅ Événement enregistré avec succès' })
    // Recharger les audiences après création/modification
    loadAudiences()
  }

  const handleSelectAudience = (id: string) => {
    setSelectedAudienceId(id)
    setShowForm('edit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewAudience = (id: string) => {
    setViewAudienceId(id)
    setShowForm('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditFromDetail = () => {
    if (!viewAudienceId) return
    setSelectedAudienceId(viewAudienceId)
    setViewAudienceId(null)
    setShowForm('edit')
  }

  const handleCloseDetail = () => {
    setShowForm(null)
    setViewAudienceId(null)
  }

  const handleViewDossier = (dossierId: string) => {
    if (onViewDossier) {
      onViewDossier(dossierId)
    }
  }

  return (
    <div className="panel">
      {/* Header moderne */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 800, 
          color: '#1e293b', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Calendar size={32} style={{ color: '#6366f1' }} />
          Gestion des Réunions
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px', fontSize: '15px' }}>
          Planifiez et gérez vos événements et audiences
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {/* Total */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: '4px solid #6366f1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Total Événements
              </div>
            </div>
          </div>
        </div>

        {/* Planifiées */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarClock size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                {stats.planifiees}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Planifiées
              </div>
            </div>
          </div>
        </div>

        {/* Confirmées */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                {stats.confirmees}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Confirmées
              </div>
            </div>
          </div>
        </div>

        {/* Tenues */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: '4px solid #059669'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarCheck size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                {stats.tenues}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Réalisées
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire inline création/édition */}
      {(showForm === 'create' || showForm === 'edit') && (
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '28px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f3f4f6'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: showForm === 'create' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {showForm === 'create' ? <Plus size={24} color="white" /> : <Edit2 size={24} color="white" />}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937', fontWeight: '700' }}>
                {showForm === 'create' ? 'Planifier une réunion' : 'Modifier la réunion'}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                {showForm === 'create' ? 'Créer un nouvel événement au calendrier' : 'Mettre à jour les informations'}
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(null)
                setSelectedAudienceId(undefined)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Fermer"
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X size={24} />
            </button>
          </div>

          <AudienceForm
            audienceId={selectedAudienceId}
            onSuccess={handleAudienceSuccess}
            onCancel={() => {
              setShowForm(null)
              setSelectedAudienceId(undefined)
            }}
          />
        </div>
      )}

      {/* Détail inline */}
      {showForm === 'detail' && viewAudienceId && (
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '28px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f3f4f6'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Eye size={24} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937', fontWeight: '700' }}>
                Détails de l'audience
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Informations complètes
              </p>
            </div>
            <button
              onClick={handleCloseDetail}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Fermer"
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X size={24} />
            </button>
          </div>

          <AudienceDetail
            audienceId={viewAudienceId}
            onEdit={handleEditFromDetail}
            onClose={handleCloseDetail}
            canEdit={isAdmin}
            onViewDossier={handleViewDossier}
          />
        </div>
      )}

      {/* Affichage d'erreur */}
      {error && (
        <div style={{ 
          marginBottom: 20,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderRadius: 12,
          border: '1px solid #f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
          <span style={{ flex: 1, color: '#991b1b' }}>{error}</span>
          <button 
            className="btn" 
            onClick={loadAudiences}
            style={{ 
              padding: '6px 14px', 
              fontSize: 13,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      )}

      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
          <button 
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '10px 20px',
              background: viewMode === 'calendar' ? '#6366f1' : 'transparent',
              color: viewMode === 'calendar' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <LayoutGrid size={18} /> Calendrier
          </button>
          <button 
            onClick={() => setViewMode('list')}
            style={{
              padding: '10px 20px',
              background: viewMode === 'list' ? '#6366f1' : 'transparent',
              color: viewMode === 'list' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <List size={18} /> Liste
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn" 
            onClick={() => onManageSalles?.()}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Building2 size={16} /> Gestion des salles
          </button>
          <button 
            className="btn" 
            onClick={handleNewAudience}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} /> Planifier
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
            style={{ 
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button 
                onClick={navigateToToday}
                style={{
                  fontSize: 13,
                  color: '#6366f1',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  margin: '6px auto 0'
                }}
              >
                <MapPin size={14} /> Aujourd'hui
              </button>
            </div>
          </div>
          
          <button 
            className="btn"
            onClick={() => navigateMonth('next')}
            style={{ 
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {loading && (
        <div style={{
          padding: '24px',
          background: '#f8fafc',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#64748b'
        }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Chargement du calendrier...
        </div>
      )}

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
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: '#6366f1' }} />
                        {new Date(audience.dateAudience).toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Clock size={12} /> {formatTime(audience.dateAudience)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} style={{ color: '#64748b' }} />
                        {audience.dossierNumero || 'N/A'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{audience.dossierTitre || '-'}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} style={{ color: '#8b5cf6' }} />
                        {audience.lieu}
                      </div>
                    </td>
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
                        style={{ 
                          fontSize: 13, 
                          padding: '6px 14px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => handleViewAudience(audience.id)}
                      >
                        <Eye size={14} /> Détails
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {audiences.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Calendar size={40} style={{ color: '#94a3b8' }} />
              </div>
              <p style={{ margin: 0, color: '#64748b', fontSize: 16 }}>
                Aucune réunion planifiée pour le moment
              </p>
              <button 
                className="btn" 
                onClick={handleNewAudience}
                style={{ 
                  marginTop: 16,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} /> Planifier une réunion
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
