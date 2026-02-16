import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/dashboardApi'
import type { DashboardStatisticsDto, PeriodFilter, TimelineDataDto, UserActivityDto } from '../types/dashboard'
import { PERIOD_LABELS } from '../types/dashboard'
import type { WorkspaceDto } from '../types/workspace'
import workspaceApi from '../api/workspaceApi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts'
import './Dashboard.css'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatisticsDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isManager, setIsManager] = useState<boolean>(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null) // Pour le sélecteur Admin
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([])
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(30) // Default: 30 days

  // Déterminer le rôle et workspace
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      setIsAdmin(user?.role === 'Admin')
      setIsManager(user?.role === 'Manager')
      // Utiliser defaultWorkspaceId pour les connexions des utilisateurs
      setWorkspaceId(user?.defaultWorkspaceId || null)
      setSelectedWorkspace(user?.defaultWorkspaceId || null)
    } catch {
      setIsAdmin(false)
      setIsManager(false)
    }
  }, [])

  // Charger les workspaces pour les Admin
  useEffect(() => {
    if (isAdmin) {
      workspaceApi.getUserWorkspaces()
        .then((workspaces) => {
          setWorkspaces(workspaces || [])
        })
        .catch(err => console.error('Erreur chargement workspaces:', err))
    }
  }, [isAdmin])

  // Charger les statistiques
  const loadStats = async (mounted: { current: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      // Pour Admin, utiliser selectedWorkspace; pour les autres, utiliser workspaceId
      const wsId = isAdmin ? selectedWorkspace : workspaceId
      const statsData = await dashboardApi.getStatistics(periodFilter, wsId || undefined)
      if (!mounted.current) return
      setStats(statsData)
      setLastRefresh(new Date())
    } catch (e: any) {
      if (mounted.current) {
        setError(e?.message || 'Erreur lors du chargement des statistiques')
      }
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  // Effect pour charger les stats au changement du filtre ou workspace
  useEffect(() => {
    const mounted = { current: true }
    loadStats(mounted)

    return () => {
      mounted.current = false
    }
  }, [refreshKey, periodFilter, selectedWorkspace, isAdmin, workspaceId])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return ((bytes / Math.pow(k, i)) * 100 | 0) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const statusColors: Record<string, string> = {
    'Nouveau': '#3b82f6',
    'EnCours': '#f59e0b',
    'En Cours': '#f59e0b',
    'EnValidation': '#6366f1',
    'En Validation': '#6366f1',
    'Validé': '#10b981',
    'Valide': '#10b981',
    'Terminé': '#6b7280',
    'Termine': '#6b7280'
  }

  const statusIcons: Record<string, string> = {
    'Nouveau': '🆕',
    'EnCours': '📝',
    'En Cours': '📝',
    'EnValidation': '💭',
    'En Validation': '💭',
    'Validé': '✅',
    'Valide': '✅',
    'Terminé': '📦',
    'Termine': '📦'
  }

  return (
    <div className="dashboard-container">
      <div className="panel">
        {/* Header avec filtres */}
        <div className="dashboard-header">
          <div className="dashboard-title">
            📊 Tableau de Bord - {isAdmin ? 'Vue d\'Ensemble Globale' : 'Ma Vue Personnelle'}
          </div>
          <div className="dashboard-actions">
            {/* Sélecteur de Workspace pour Admin */}
            {isAdmin && workspaces.length > 0 && (
              <div className="workspace-selector">
                <label htmlFor="workspace-select">Workspace:</label>
                <select
                  id="workspace-select"
                  value={selectedWorkspace || ''}
                  onChange={(e) => setSelectedWorkspace(e.target.value || null)}
                  className="filter-select"
                >
                  <option value="">📍 Tous les workspaces</option>
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="period-filters">
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(Number(e.target.value) as PeriodFilter)}
                className="filter-select"
              >
                <option value={7}>Derniers 7 jours</option>
                <option value={30}>Dernier mois</option>
                <option value={90}>Dernier trimestre</option>
                <option value={365}>Dernière année</option>
                <option value={0}>Tous les temps</option>
              </select>
            </div>
            <span className="last-update">
              Maj: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              className={`refresh-icon-btn ${loading ? 'loading' : ''}`}
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
              title="Actualiser les données"
              aria-label="Actualiser les données"
            >
              🔄
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="dashboard-loading">⏳ Chargement des statistiques...</div>
        ) : stats ? (
          <>
            {/* KPI Cards - Row 1 */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ '--accent-color': '#3b82f6' } as React.CSSProperties}>
                <div className="kpi-label">Total Dossiers</div>
                <div className="kpi-value">{stats.totalDossiers}</div>
                <div className="kpi-description">📁 Tous les dossiers</div>
              </div>

              <div className="kpi-card" style={{ '--accent-color': '#10b981' } as React.CSSProperties}>
                <div className="kpi-label">Validés</div>
                <div className="kpi-value">{stats.valides}</div>
                <div className="kpi-description">✅ Dossiers validés</div>
              </div>

              <div className="kpi-card" style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}>
                <div className="kpi-label">En Cours</div>
                <div className="kpi-value">{stats.enCours + stats.enValidation}</div>
                <div className="kpi-description">📝 En traitement</div>
              </div>

              {/* KPI "En Retard" caché - statut non implémenté pour maintenant */}
              {/* Voir documentation/DASHBOARD_KPIs_FUTURE.md pour les KPIs à développer */}

              {isAdmin && (
                <div className="kpi-card" style={{ '--accent-color': '#6366f1' } as React.CSSProperties}>
                  <div className="kpi-label">Utilisateurs Actifs</div>
                  <div className="kpi-value">{stats.utilisateursActifs}</div>
                  <div className="kpi-description">👥 Connectés</div>
                </div>
              )}
            </div>

            {/* Performance Indicators - Row 2 */}
            <div className="chart-section">
              <div className="chart-title">🎯 Indicateurs de Performance</div>
              <div className="performance-grid">
                <div className="performance-card">
                  <div className="performance-label">Taux Traitement</div>
                  <div className="performance-value">{Math.round(stats.tauxTraitementMoyen)}%</div>
                  <div className="performance-bar">
                    <div
                      className="performance-bar-fill"
                      style={{
                        width: `${Math.min(stats.tauxTraitementMoyen, 100)}%`,
                        background: stats.tauxTraitementMoyen > 70 ? '#10b981' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>

                <div className="performance-card">
                  <div className="performance-label">Temps Traitement Moyen</div>
                  <div className="performance-value">{Math.round(stats.tempsTraitementMoyenJours)}</div>
                  <div className="performance-description">jours</div>
                </div>

                <div className="performance-card">
                  <div className="performance-label">Documents Upload (mois)</div>
                  <div className="performance-value">{stats.documentsUploadCeMois}</div>
                  <div className="performance-description">{stats.totalDocuments} total</div>
                </div>

                <div className="performance-card">
                  <div className="performance-label">Stockage Utilisé</div>
                  <div className="performance-value">{Math.round(stats.storagePercentage)}%</div>
                  <div className="performance-bar">
                    <div
                      className="performance-bar-fill"
                      style={{
                        width: `${Math.min(stats.storagePercentage, 100)}%`,
                        background: stats.storagePercentage > 80 ? '#ef4444' : '#3b82f6'
                      }}
                    />
                  </div>
                  <div className="performance-description">
                    {formatBytes(stats.storageUtilizedBytes)} / {formatBytes(stats.storageQuotaBytes)}
                  </div>
                </div>
              </div>
            </div>

            {/* Répartition par Statut des Dossiers */}
            <div className="chart-section">
              <div className="chart-wrapper">
                <div className="chart-title">📊 Répartition par Statut des Dossiers</div>
                {stats && (
                  <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { status: 'Nouveau', value: stats.nouveauxDossiers, percentage: Math.round((stats.nouveauxDossiers / (stats.totalDossiers || 1)) * 100) },
                          { status: 'En Cours', value: stats.enCours, percentage: Math.round((stats.enCours / (stats.totalDossiers || 1)) * 100) },
                          { status: 'En Validation', value: stats.enValidation, percentage: Math.round((stats.enValidation / (stats.totalDossiers || 1)) * 100) },
                          { status: 'Validé', value: stats.valides, percentage: Math.round((stats.valides / (stats.totalDossiers || 1)) * 100) },
                          { status: 'Terminé', value: stats.termines, percentage: Math.round((stats.termines / (stats.totalDossiers || 1)) * 100) }
                        ]}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" style={{ fontSize: '13px' }} />
                        <YAxis 
                          dataKey="status" 
                          type="category" 
                          stroke="#6b7280"
                          style={{ fontSize: '14px', fontWeight: '500' }}
                          width={95}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            padding: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                          }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                          formatter={(value) => [`${value} dossiers`, 'Count']}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#a78bfa" />
                          <Cell fill="#10b981" />
                          <Cell fill="#6b7280" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Top Utilisateurs */}
            {isAdmin && stats.topUtilisateurs && stats.topUtilisateurs.length > 0 && (
              <div className="chart-section">
                <div className="chart-title">👥 Utilisateurs les Plus Actifs</div>
                <div className="users-table">
                  <div className="table-header">
                    <div className="col-name">Utilisateur</div>
                    <div className="col-dossiers">Dossiers</div>
                    <div className="col-docs">Documents</div>
                    <div className="col-date">Dernière Activité</div>
                  </div>
                  {stats.topUtilisateurs.map((user) => (
                    <div key={user.userId} className="table-row">
                      <div className="col-name">{user.nomUtilisateur}</div>
                      <div className="col-dossiers">{user.nombreDossiersTraites}</div>
                      <div className="col-docs">{user.nombreDocumentsUpload}</div>
                      <div className="col-date">{formatDate(user.derniereActivite)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Répartition par Type d'Affaire */}
            {stats.parType && Object.keys(stats.parType).length > 0 && (
              <div className="chart-section">
                <div className="chart-title">📋 Répartition par Type d'Affaire</div>
                <div className="distribution-grid">
                  {Object.entries(stats.parType).map(([type, count]) => (
                    <div key={type} className="distribution-card">
                      <div className="distribution-type">{type}</div>
                      <div className="distribution-count">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline - Line Chart */}
            {stats.dossiersCreesParMois && stats.dossiersCreesParMois.length > 0 && (
              <div className="chart-section">
                <div className="chart-title">📈 Évolution des Créations (6 derniers mois)</div>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stats.dossiersCreesParMois}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="mois" 
                        stroke="#6b7280"
                        style={{ fontSize: '14px' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '14px' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px'
                        }}
                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="valeur"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 6 }}
                        activeDot={{ r: 8 }}
                        name="Dossiers créés"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
