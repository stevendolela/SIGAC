import React, { useState, useEffect } from 'react'
import { Calendar, Download, Eye, User, Clock, Globe, Filter, FileText, Search, FolderOpen, Edit, Trash2, Plus } from 'lucide-react'
import { getApiBaseUrl } from '../api/api-client'
import { useWorkspaceStore } from '../store/workspaceStore'

interface HistoriqueLog {
  id: string
  entityId: string
  entityName: string
  entityType: 'Document' | 'Dossier'
  dossierId?: string
  dossierNumero?: string
  dossierTitre?: string
  userId: string
  userNomComplet: string
  dateAction: string
  action: string
  details?: string
  ipAddress: string
}

interface Filters {
  search: string
  entityType: 'all' | 'Document' | 'Dossier'
  action: 'all' | 'view' | 'download' | 'upload' | 'delete' | 'create' | 'update' | 'status_change'
  dateDebut: string
  dateFin: string
  dossierId: string
}

export default function HistoriqueDossiersPage() {
  const [logs, setLogs] = useState<HistoriqueLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dossiers, setDossiers] = useState<Array<{id: string, numero: string, titre: string}>>([])
  const [filters, setFilters] = useState<Filters>({
    search: '',
    entityType: 'all',
    action: 'all',
    dateDebut: '',
    dateFin: '',
    dossierId: ''
  })
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  
  // Récupérer le workspace sélectionné
  const { selectedWorkspaceId, showAllWorkspaces } = useWorkspaceStore()

  useEffect(() => {
    const loadData = async () => {
      const dossiersData = await loadDossiers()
      await loadLogs(dossiersData)
    }
    loadData()
  }, [selectedWorkspaceId, showAllWorkspaces])

  const loadDossiers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return []

      const apiUrl = getApiBaseUrl()
      // Charger les dossiers (filtrer par workspace si sélectionné)
      let url = `${apiUrl}/dossiers?page=1&pageSize=5000`
      if (selectedWorkspaceId && !showAllWorkspaces) {
        url += `&workspaceId=${selectedWorkspaceId}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const dossiersList = data.data || data
        const dossiersMap = dossiersList.map((d: any) => ({
          id: d.id,
          numero: d.numeroDossier,
          titre: d.titre
        }))
        setDossiers(dossiersMap)
        return dossiersMap
      }
      return []
    } catch (err) {
      console.error('Erreur chargement dossiers:', err)
      return []
    }
  }

  const loadLogs = async (dossiersData?: Array<{id: string, numero: string, titre: string}>) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Non authentifié')
        return
      }

      // Charger les audit logs UNIQUEMENT pour Documents ET Dossiers (filtrage côté serveur)
      const apiUrl = getApiBaseUrl()
      
      // Construire l'URL avec le workspaceId si sélectionné
      let url = `${apiUrl}/auditlogs?entityType=Document,Dossier&limit=10000`
      if (selectedWorkspaceId && !showAllWorkspaces) {
        url += `&workspaceId=${selectedWorkspaceId}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        } else if (response.status === 403) {
          throw new Error('Accès refusé. Cette page est réservée aux administrateurs.')
        } else if (response.status === 404) {
          throw new Error('Endpoint /api/auditlogs non trouvé.')
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Vérifier que data est un tableau
      if (!Array.isArray(data)) {
        console.error('Réponse API invalide:', data)
        throw new Error('Format de réponse invalide')
      }
      
      // Transformer les AuditLogs en format HistoriqueLog
      const transformedLogs = data
        .filter((log: any) => 
          log.entityType === 'Document' || log.entityType === 'Dossier'
        )
        .map((log: any) => {
          let parsedDetails = {}
          let parsedOldValues = {}
          try {
            parsedDetails = JSON.parse(log.newValues || '{}')
          } catch {}
          try {
            parsedOldValues = JSON.parse(log.oldValues || '{}')
          } catch {}

          const isDocument = log.entityType === 'Document'
          const isDossier = log.entityType === 'Dossier'

          let entityName = 'Entité supprimée'
          let dossierId = ''
          let dossierNumero = ''
          let dossierTitre = ''
          let actionType = log.action.toLowerCase()

          if (isDocument) {
            entityName = (parsedDetails as any).NomFichier || (parsedDetails as any).nomFichier || (parsedDetails as any).DocumentNom || 'Document'
            // Gérer les différentes casses possibles pour DossierId
            dossierId = (parsedDetails as any).DossierId || (parsedDetails as any).dossierId || ''
            
            // Trouver le dossier associé pour afficher son numéro et titre
            if (dossierId) {
              const dossiersToUse = dossiersData || dossiers
              const dossierAssocie = dossiersToUse.find(d => d.id === dossierId || d.id.toLowerCase() === dossierId.toLowerCase())
              if (dossierAssocie) {
                dossierNumero = dossierAssocie.numero
                dossierTitre = dossierAssocie.titre
              }
            }
          } else if (isDossier) {
            entityName = (parsedDetails as any).Titre || (parsedOldValues as any).Titre || 'Dossier'
            dossierNumero = (parsedDetails as any).NumeroDossier || (parsedOldValues as any).NumeroDossier || ''
            dossierTitre = (parsedDetails as any).Titre || (parsedOldValues as any).Titre || ''
            dossierId = log.entityId
          }

          // Mapper les actions - inclure VIEW pour les dossiers
          if (log.action === 'VIEW_DOCUMENT' || log.action === 'VIEW' || log.action === 'GET') actionType = 'view'
          else if (log.action === 'DOWNLOAD_DOCUMENT') actionType = 'download'
          else if (log.action === 'UPLOAD') actionType = 'upload'
          else if (log.action === 'CREATE') actionType = 'create'
          else if (log.action === 'UPDATE') actionType = 'update'
          else if (log.action === 'DELETE') actionType = 'delete'
          else if (log.action.includes('STATUS') || log.action.includes('STATUT')) actionType = 'status_change'

          return {
            id: log.id,
            entityId: log.entityId || 'N/A',
            entityName,
            entityType: log.entityType,
            dossierId,
            dossierNumero,
            dossierTitre,
            userId: log.userId || 'Système',
            userNomComplet: log.userName || 'Utilisateur inconnu',
            dateAction: log.timestamp,
            action: actionType,
            details: log.newValues,
            ipAddress: log.ipAddress || 'N/A'
          }
        })
        .sort((a, b) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime())

      setLogs(transformedLogs)
    } catch (err: any) {
      console.error('Erreur chargement logs:', err)
      setError(err.message || 'Erreur lors du chargement des logs')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    // Filtre par recherche (nom entité, utilisateur, numéro dossier)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchEntity = log.entityName.toLowerCase().includes(searchLower)
      const matchUser = log.userNomComplet.toLowerCase().includes(searchLower)
      const matchDossierNum = log.dossierNumero?.toLowerCase().includes(searchLower)
      const matchDossierTitre = log.dossierTitre?.toLowerCase().includes(searchLower)
      
      if (!matchEntity && !matchUser && !matchDossierNum && !matchDossierTitre) {
        return false
      }
    }

    // Filtre par type d'entité
    if (filters.entityType !== 'all' && log.entityType !== filters.entityType) {
      return false
    }

    // Filtre par action
    if (filters.action !== 'all' && log.action !== filters.action) {
      return false
    }

    // Filtre par dossier spécifique
    if (filters.dossierId && log.dossierId !== filters.dossierId) {
      return false
    }

    // Filtre par date début
    if (filters.dateDebut && new Date(log.dateAction) < new Date(filters.dateDebut)) {
      return false
    }

    // Filtre par date fin
    if (filters.dateFin && new Date(log.dateAction) > new Date(filters.dateFin + 'T23:59:59')) {
      return false
    }

    return true
  })

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filteredLogs.length / pageSize)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye size={16} color="#3b82f6" />
      case 'download': return <Download size={16} color="#10b981" />
      case 'upload': return <FileText size={16} color="#f59e0b" />
      case 'create': return <Plus size={16} color="#8b5cf6" />
      case 'update': return <Edit size={16} color="#0ea5e9" />
      case 'delete': return <Trash2 size={16} color="#ef4444" />
      case 'status_change': return <FolderOpen size={16} color="#06b6d4" />
      default: return <FileText size={16} />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'view': return 'Visualisation'
      case 'download': return 'Téléchargement'
      case 'upload': return 'Upload'
      case 'create': return 'Création'
      case 'update': return 'Modification'
      case 'delete': return 'Suppression'
      case 'status_change': return 'Changement statut'
      default: return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'view': return 'background: #dbeafe; color: #1e40af'
      case 'download': return 'background: #dcfce7; color: #166534'
      case 'upload': return 'background: #fef3c7; color: #92400e'
      case 'create': return 'background: #ede9fe; color: #6b21a8'
      case 'update': return 'background: #e0f2fe; color: #075985'
      case 'delete': return 'background: #fee2e2; color: #991b1b'
      case 'status_change': return 'background: #cffafe; color: #155e75'
      default: return 'background: #f3f4f6; color: #374151'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Fonction pour filtrer via KPI
  const handleKpiClick = (type: 'entityType' | 'action', value: string) => {
    if (type === 'entityType') {
      setFilters(prev => ({
        ...prev,
        entityType: prev.entityType === value ? 'all' : value as any
      }))
    } else if (type === 'action') {
      setFilters(prev => ({
        ...prev,
        action: prev.action === value ? 'all' : value as any
      }))
    }
    setPage(1) // Retour à la première page
  }

  // Calculer les dossiers uniques touchés dans les logs
  const uniqueDossiersInLogs = new Set(
    logs
      .filter(log => log.dossierId && log.dossierId !== '')
      .map(log => log.dossierId)
  )

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Entité', 'Dossier', 'Utilisateur', 'Action', 'IP']
    const rows = filteredLogs.map(log => [
      formatDate(log.dateAction),
      log.entityType,
      log.entityName,
      log.dossierNumero ? `${log.dossierNumero} - ${log.dossierTitre}` : '',
      log.userNomComplet,
      getTypeLabel(log.action),
      log.ipAddress
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `historique-dossiers-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          📊 Historique des Dossiers
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Historique complet des dossiers et documents - Actions, modifications et consultations
        </p>
      </div>

      {/* Statistiques rapides - CLIQUABLES */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total des logs */}
        <div 
          onClick={() => {
            setFilters({ search: '', entityType: 'all', action: 'all', dateDebut: '', dateFin: '', dossierId: '' })
            setPage(1)
          }}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.entityType === 'all' && filters.action === 'all' ? '2px solid #1e3a8a' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Clock size={20} color="#1e3a8a" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>TOTAL ACTIONS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a8a' }}>
            {logs.length}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Cliquez pour tout voir
          </div>
        </div>

        {/* Dossiers uniques */}
        <div 
          onClick={() => handleKpiClick('entityType', 'Dossier')}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.entityType === 'Dossier' ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FolderOpen size={20} color="#8b5cf6" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>DOSSIERS SYSTÈME</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
              {dossiers.length}
            </div>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>total</div>
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            {uniqueDossiersInLogs.size} avec activité • {logs.filter(l => l.entityType === 'Dossier').length} actions
          </div>
        </div>

        {/* Documents */}
        <div 
          onClick={() => handleKpiClick('entityType', 'Document')}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.entityType === 'Document' ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileText size={20} color="#0ea5e9" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>DOCUMENTS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0ea5e9' }}>
            {logs.filter(l => l.entityType === 'Document').length}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Cliquez pour filtrer
          </div>
        </div>

        {/* Créations */}
        <div 
          onClick={() => handleKpiClick('action', 'create')}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.action === 'create' ? '2px solid #10b981' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Plus size={20} color="#10b981" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>CRÉATIONS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {logs.filter(l => l.action === 'create').length}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Nouveaux éléments
          </div>
        </div>

        {/* Modifications */}
        <div 
          onClick={() => handleKpiClick('action', 'update')}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.action === 'update' ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Edit size={20} color="#0ea5e9" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>MODIFICATIONS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0ea5e9' }}>
            {logs.filter(l => l.action === 'update').length}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Mises à jour
          </div>
        </div>

        {/* Changements de statut */}
        <div 
          onClick={() => handleKpiClick('action', 'status_change')}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.action === 'status_change' ? '2px solid #06b6d4' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FolderOpen size={20} color="#06b6d4" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>STATUTS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#06b6d4' }}>
            {logs.filter(l => l.action === 'status_change').length}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Changements
          </div>
        </div>

        {/* Consultations */}
        <div 
          onClick={() => handleKpiClick('action', 'view')}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.action === 'view' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Eye size={20} color="#3b82f6" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>VUES</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
            {logs.filter(l => l.action === 'view').length}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Visualisations
          </div>
        </div>

        {/* Téléchargements */}
        <div 
          onClick={() => handleKpiClick('action', 'download')}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.action === 'download' ? '2px solid #10b981' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Download size={20} color="#10b981" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>DOWNLOADS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {logs.filter(l => l.action === 'download').length}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Téléchargements
          </div>
        </div>

        {/* Suppressions */}
        <div 
          onClick={() => handleKpiClick('action', 'delete')}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: filters.action === 'delete' ? '2px solid #ef4444' : '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Trash2 size={20} color="#ef4444" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SUPPRESSIONS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
            {logs.filter(l => l.action === 'delete').length}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Éléments supprimés
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Filtres</h3>
            {(filters.entityType !== 'all' || filters.action !== 'all' || filters.search || filters.dossierId || filters.dateDebut || filters.dateFin) && (
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {filteredLogs.length} résultat{filteredLogs.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {(filters.entityType !== 'all' || filters.action !== 'all' || filters.search || filters.dossierId || filters.dateDebut || filters.dateFin) && (
            <button
              onClick={() => {
                setFilters({ search: '', entityType: 'all', action: 'all', dateDebut: '', dateFin: '', dossierId: '' })
                setPage(1)
              }}
              style={{
                padding: '6px 12px',
                background: '#fee2e2',
                color: '#991b1b',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✕ Effacer tous les filtres
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Recherche */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              🔍 Recherche
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Dossier, document, utilisateur..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Filtrer par dossier */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              📁 Dossier
            </label>
            <select
              value={filters.dossierId}
              onChange={(e) => setFilters({ ...filters, dossierId: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">Tous les dossiers</option>
              {dossiers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.numero} - {d.titre.substring(0, 40)}{d.titre.length > 40 ? '...' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Type d'entité */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              📋 Type
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="all">Dossiers + Documents</option>
              <option value="Dossier">Dossiers uniquement</option>
              <option value="Document">Documents uniquement</option>
            </select>
          </div>

          {/* Type d'action */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              ⚡ Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="all">Toutes les actions</option>
              <option value="create">Créations</option>
              <option value="update">Modifications</option>
              <option value="status_change">Changements de statut</option>
              <option value="view">Consultations</option>
              <option value="download">Téléchargements</option>
              <option value="upload">Uploads</option>
              <option value="delete">Suppressions</option>
            </select>
          </div>

          {/* Date début */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              📅 Date début
            </label>
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Date fin */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              📅 Date fin
            </label>
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => setFilters({ search: '', entityType: 'all', action: 'all', dateDebut: '', dateFin: '', dossierId: '' })}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            🔄 Réinitialiser
          </button>
          <button
            onClick={exportToCSV}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            📥 Exporter CSV ({filteredLogs.length} entrées)
          </button>
        </div>
      </div>

      {/* Tableau des logs */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ marginBottom: '16px' }}>Chargement...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>
            ⚠️ {error}
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            📭 Aucun log trouvé avec ces filtres
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} />
                        DATE & HEURE
                      </div>
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} />
                        TYPE
                      </div>
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderOpen size={16} />
                        ENTITÉ
                      </div>
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderOpen size={16} />
                        DOSSIER
                      </div>
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} />
                        UTILISATEUR
                      </div>
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                      ACTION
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={16} />
                        IP
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => {
                    const isHovered = hoveredRowId === log.id
                    return (
                      <tr 
                        key={log.id}
                        onMouseEnter={() => setHoveredRowId(log.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          background: isHovered ? '#f0f9ff' : (index % 2 === 0 ? 'white' : '#f9fafb'),
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                        <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '2px' }}>
                          {formatDate(log.dateAction).split(',')[0]}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {formatDate(log.dateAction).split(',')[1]}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: log.entityType === 'Dossier' ? '#ede9fe' : '#dbeafe',
                          color: log.entityType === 'Dossier' ? '#6b21a8' : '#1e40af',
                          border: log.entityType === 'Dossier' ? '1px solid #c4b5fd' : '1px solid #93c5fd'
                        }}>
                          {log.entityType === 'Dossier' ? <FolderOpen size={14} /> : <FileText size={14} />}
                          {log.entityType}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151', maxWidth: '250px' }}>
                        <div style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontWeight: '600',
                          color: '#1e3a8a',
                          marginBottom: '4px'
                        }}>
                          {log.entityName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
                          {log.entityId.substring(0, 8)}...
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#374151', maxWidth: '200px' }}>
                        {log.dossierNumero ? (
                          <div>
                            <div style={{ 
                              fontWeight: '700', 
                              color: '#1e3a8a',
                              marginBottom: '4px',
                              fontSize: '13px'
                            }}>
                              📁 {log.dossierNumero}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6b7280',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {log.dossierTitre}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            {log.userNomComplet.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e3a8a' }}>
                              {log.userNomComplet}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          ...Object.fromEntries(getTypeBadgeColor(log.action).split(';').map(s => s.trim().split(':')).map(([k, v]) => [k.trim(), v.trim()]))
                        }}>
                          {getTypeIcon(log.action)}
                          {getTypeLabel(log.action)}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '4px 8px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          width: 'fit-content'
                        }}>
                          <Globe size={14} />
                          {log.ipAddress}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ 
                padding: '20px', 
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 16px',
                    background: page === 1 ? '#f3f4f6' : 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: page === 1 ? '#9ca3af' : '#374151'
                  }}
                >
                  ← Précédent
                </button>
                
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                  Page {page} sur {totalPages} ({filteredLogs.length} résultats)
                </span>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 16px',
                    background: page === totalPages ? '#f3f4f6' : 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: page === totalPages ? '#9ca3af' : '#374151'
                  }}
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
