import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/dashboardApi'
import type { DashboardStatisticsDto, PeriodFilter, TimelineDataDto, UserActivityDto } from '../types/dashboard'
import { PERIOD_LABELS } from '../types/dashboard'
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
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(30) // Default: 30 days

  // Déterminer le rôle et workspace
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      setIsAdmin(user?.role === 'Admin')
      setIsManager(user?.role === 'Manager')
      setWorkspaceId(user?.workspaceId || null)
    } catch {
      setIsAdmin(false)
      setIsManager(false)
    }
  }, [])

  // Charger les statistiques
  const loadStats = async (mounted: { current: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const statsData = await dashboardApi.getStatistics(periodFilter, workspaceId || undefined)
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

  // Effect pour charger les stats au changement du filtre
  useEffect(() => {
    const mounted = { current: true }
    loadStats(mounted)

    return () => {
      mounted.current = false
    }
  }, [refreshKey, periodFilter])

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
              className="btn"
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
            >
              🔄 {loading ? 'Chargement...' : 'Actualiser'}
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

            {/* Répartition par Statut + Connexions Utilisateurs (côte à côte) */}
            <div className="chart-section-double">
              <div className="chart-wrapper">
                <div className="chart-title">📊 Répartition par Statut</div>
                <div className="status-breakdown">
                  {[
                    { key: 'Nouveau', value: stats.nouveauxDossiers },
                    { key: 'En Cours', value: stats.enCours },
                    { key: 'En Validation', value: stats.enValidation },
                    { key: 'Validé', value: stats.valides },
                    { key: 'Terminé', value: stats.termines }
                  ].map(({ key, value }) => {
                    const total = stats.totalDossiers || 1
                    const percentage = Math.round((value / total) * 100)
                    return (
                      <div key={key} className="status-item">
                        <div className="status-label">
                          <span className="status-icon">{statusIcons[key] || '📋'}</span>
                          <span className="status-name">{key}</span>
                          <span className="status-count">({value})</span>
                        </div>
                        <div className="status-bar-container">
                          <div
                            className="status-bar"
                            style={{
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${statusColors[key] || '#94a3b8'}, ${statusColors[key] || '#94a3b8'}dd)`
                            }}
                          >
                            {percentage > 5 && <span>{percentage}%</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Connexions Utilisateurs (visible uniquement pour Admin/Manager) */}
              {(isAdmin || isManager) && (
                <div className="chart-wrapper">
                  <div className="chart-title">🔗 Dernières Connexions GED</div>
                  {stats.userConnections && stats.userConnections.length > 0 ? (
                    <div className="connections-breakdown">
                    {stats.userConnections.slice(0, 8).map((user) => {
                      const days = user.joursDepuisDerniereConnexion
                      let connectionStatus = 'recent'
                      let statusColor = '#10b981'
                      let statusLabel = 'Actif aujourd\'hui'

                      if (days === null || days > 30) {
                        connectionStatus = 'inactive'
                        statusColor = '#6b7280'
                        statusLabel = 'Inactif'
                      } else if (days > 7) {
                        connectionStatus = 'warning'
                        statusColor = '#f59e0b'
                        statusLabel = `Il y a ${days}j`
                      } else if (days > 0) {
                        statusLabel = `Il y a ${days}j`
                      }

                      return (
                        <div key={user.userId} className="connection-item">
                          <div className="connection-label">
                            <span className="connection-indicator" style={{ background: statusColor }} />
                            <span className="connection-name">{user.nomUtilisateur}</span>
                          </div>
                          <div className="connection-bar-container">
                            <div
                              className={`connection-bar connection-${connectionStatus}`}
                              style={{
                                width: days === null || days > 30 ? '5%' : `${Math.max(100 - (days * 3), 10)}%`,
                                background: statusColor
                              }}
                            >
                              {days !== null && days <= 7 && <span className="connection-days">{statusLabel}</span>}
                            </div>
                          </div>
                          <div className="connection-date">{statusLabel}</div>
                        </div>
                      )
                    })}
                    {stats.userConnections.length > 8 && (
                      <div className="connection-more">
                        +{stats.userConnections.length - 8} autres utilisateurs
                      </div>
                    )}
                  </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                      <p>Aucune donnée de connexion disponible</p>
                      {!stats.userConnections ? (
                        <p style={{ fontSize: '12px' }}>Les données de connexions ne sont pas disponibles</p>
                      ) : (
                        <p style={{ fontSize: '12px' }}>Pas d'utilisateurs à afficher</p>
                      )}
                    </div>
                  )}
                </div>
              )}
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

            {/* Timeline */}
            {stats.dossiersCreesParMois && stats.dossiersCreesParMois.length > 0 && (
              <div className="chart-section">
                <div className="chart-title">📈 Évolution des Créations (6 derniers mois)</div>
                <div className="timeline-chart">
                  {stats.dossiersCreesParMois.map((data) => (
                    <div key={data.mois} className="timeline-bar-wrapper">
                      <div className="timeline-label">{data.mois}</div>
                      <div className="timeline-bar-container">
                        <div
                          className="timeline-bar"
                          style={{
                            height: `${Math.max(data.valeur * 5, 20)}px`,
                            background: '#3b82f6'
                          }}
                        />
                        <div className="timeline-value">{data.valeur}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
