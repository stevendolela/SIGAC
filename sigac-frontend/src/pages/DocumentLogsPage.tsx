import React, { useState, useEffect } from 'react'
import { Calendar, Download, Eye, User, Clock, Globe, Filter, FileText, Search } from 'lucide-react'

interface DocumentLog {
  id: string
  documentId: string
  documentNom: string
  userId: string
  userNomComplet: string
  dateVisualisation: string
  typeVisualisation: string
  ipAddress: string
}

interface Filters {
  search: string
  typeVisualisation: 'all' | 'view' | 'download'
  dateDebut: string
  dateFin: string
}

export default function DocumentLogsPage() {
  const [logs, setLogs] = useState<DocumentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    typeVisualisation: 'all',
    dateDebut: '',
    dateFin: ''
  })
  const [page, setPage] = useState(1)
  const pageSize = 50

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Non authentifié')
        return
      }

      // Pour l'instant, on récupère tous les logs via l'endpoint AuditLog
      const response = await fetch('http://localhost:5210/api/auditlogs?entityType=Document&limit=500', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const data = await response.json()
      
      // Transformer les AuditLogs en format DocumentLog
      const transformedLogs = data
        .filter((log: any) => 
          log.action === 'VIEW_DOCUMENT' || 
          log.action === 'DOWNLOAD_DOCUMENT' ||
          log.action === 'UPLOAD' ||
          log.action === 'DELETE'
        )
        .map((log: any) => {
          let parsedDetails = {}
          try {
            parsedDetails = JSON.parse(log.newValues || '{}')
          } catch {}

          return {
            id: log.id,
            documentId: log.entityId || 'N/A',
            documentNom: (parsedDetails as any).DocumentNom || (parsedDetails as any).NomFichier || 'Document supprimé',
            userId: log.userId || 'Système',
            userNomComplet: 'Chargement...', // À enrichir avec appel API Users si besoin
            dateVisualisation: log.timestamp,
            typeVisualisation: log.action === 'VIEW_DOCUMENT' ? 'view' : 
                              log.action === 'DOWNLOAD_DOCUMENT' ? 'download' :
                              log.action === 'UPLOAD' ? 'upload' : 'delete',
            ipAddress: log.ipAddress || 'N/A'
          }
        })

      setLogs(transformedLogs)
    } catch (err: any) {
      console.error('Erreur chargement logs:', err)
      setError(err.message || 'Erreur lors du chargement des logs')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    // Filtre par recherche (nom document ou utilisateur)
    if (filters.search && !log.documentNom.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.userNomComplet.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    // Filtre par type
    if (filters.typeVisualisation !== 'all' && log.typeVisualisation !== filters.typeVisualisation) {
      return false
    }

    // Filtre par date début
    if (filters.dateDebut && new Date(log.dateVisualisation) < new Date(filters.dateDebut)) {
      return false
    }

    // Filtre par date fin
    if (filters.dateFin && new Date(log.dateVisualisation) > new Date(filters.dateFin + 'T23:59:59')) {
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
      case 'delete': return <FileText size={16} color="#ef4444" />
      default: return <FileText size={16} />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'view': return 'Visualisation'
      case 'download': return 'Téléchargement'
      case 'upload': return 'Upload'
      case 'delete': return 'Suppression'
      default: return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'view': return 'background: #dbeafe; color: #1e40af'
      case 'download': return 'background: #dcfce7; color: #166534'
      case 'upload': return 'background: #fef3c7; color: #92400e'
      case 'delete': return 'background: #fee2e2; color: #991b1b'
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

  const exportToCSV = () => {
    const headers = ['Date', 'Document', 'Utilisateur', 'Action', 'IP']
    const rows = filteredLogs.map(log => [
      formatDate(log.dateVisualisation),
      log.documentNom,
      log.userNomComplet,
      getTypeLabel(log.typeVisualisation),
      log.ipAddress
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `logs-documents-${new Date().toISOString().split('T')[0]}.csv`
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
          📊 Historique des Documents
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Consultation complète de tous les accès aux documents (réservé aux administrateurs)
        </p>
      </div>

      {/* Statistiques rapides */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Eye size={20} color="#3b82f6" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>VISUALISATIONS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a8a' }}>
            {logs.filter(l => l.typeVisualisation === 'view').length}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Download size={20} color="#10b981" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>TÉLÉCHARGEMENTS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {logs.filter(l => l.typeVisualisation === 'download').length}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileText size={20} color="#f59e0b" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>UPLOADS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
            {logs.filter(l => l.typeVisualisation === 'upload').length}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileText size={20} color="#ef4444" />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SUPPRESSIONS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
            {logs.filter(l => l.typeVisualisation === 'delete').length}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={20} color="#3b82f6" />
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Filtres</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Recherche */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Recherche
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Document ou utilisateur..."
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

          {/* Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Type d'action
            </label>
            <select
              value={filters.typeVisualisation}
              onChange={(e) => setFilters({ ...filters, typeVisualisation: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="all">Toutes les actions</option>
              <option value="view">Visualisations</option>
              <option value="download">Téléchargements</option>
              <option value="upload">Uploads</option>
              <option value="delete">Suppressions</option>
            </select>
          </div>

          {/* Date début */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Date début
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
              Date fin
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
            onClick={() => setFilters({ search: '', typeVisualisation: 'all', dateDebut: '', dateFin: '' })}
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
            Réinitialiser
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
                        DOCUMENT
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
                        ADRESSE IP
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr 
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        background: index % 2 === 0 ? 'white' : '#f9fafb',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                        {formatDate(log.dateVisualisation)}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151', maxWidth: '300px' }}>
                        <div style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontWeight: '500'
                        }}>
                          {log.documentNom}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          ID: {log.documentId.substring(0, 8)}...
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                        {log.userNomComplet}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          ...Object.fromEntries(getTypeBadgeColor(log.typeVisualisation).split(';').map(s => s.trim().split(':')).map(([k, v]) => [k.trim(), v.trim()]))
                        }}>
                          {getTypeIcon(log.typeVisualisation)}
                          {getTypeLabel(log.typeVisualisation)}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
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
