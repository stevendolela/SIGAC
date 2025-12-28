import { useEffect, useState } from 'react'
import { dossierApi } from '../api/dossierApi'
import { userApi } from '../api/userApi'
import type { DossierStatisticsDto } from '../types/dossierStatistics'
import './Dashboard.css'

export default function DashboardPage() {
  const [dossierStats, setDossierStats] = useState<DossierStatisticsDto | null>(null)
  const [userStats, setUserStats] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      setIsAdmin(user?.role === 'Administrateur')
    } catch {
      setIsAdmin(false)
    }
  }, [])

  const loadStats = async (mounted: { current: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const promises: Promise<any>[] = [dossierApi.statistiques()]
      if (isAdmin) promises.push(userApi.statsAdmin())
      const results = await Promise.allSettled(promises)
      if (!mounted.current) return
      const ds = results[0]
      const us = results[1]
      if (ds?.status === 'fulfilled') setDossierStats(ds.value)
      if (isAdmin && us && us.status === 'fulfilled') setUserStats(us.value)
      if (ds?.status === 'rejected' && (!isAdmin || (us && us.status === 'rejected'))) setError('Impossible de charger les statistiques')
      setLastRefresh(new Date())
    } catch (e: any) {
      if (mounted.current) setError(e?.message || 'Erreur')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    const mounted = { current: true }
    loadStats(mounted)
    
    // Auto-refresh toutes les 2 minutes (moins de clignotement, mais garde le chat temps réel)
    const interval = setInterval(() => {
      if (mounted.current) loadStats(mounted)
    }, 120000)
    
    return () => { 
      mounted.current = false
      clearInterval(interval)
    }
  }, [refreshKey, isAdmin])

  const statusColors: Record<string, string> = {
    'Nouveau': '#3b82f6',
    'EnCours': '#f59e0b',
    'En Cours': '#f59e0b',
    'EnValidation': '#6366f1',
    'En Validation': '#6366f1',
    'Valide': '#10b981',
    'Validé': '#10b981',
    'Termine': '#6b7280',
    'Terminé': '#6b7280'
  }

  const statusIcons: Record<string, string> = {
    'Nouveau': '🆕',
    'EnCours': '📝',
    'En Cours': '📝',
    'EnValidation': '💭',
    'En Validation': '💭',
    'Valide': '✅',
    'Validé': '✅',
    'Termine': '📦',
    'Terminé': '📦'
  }

  return (
    <div className="dashboard-container">
      <div className="panel">
        <div className="dashboard-header">
          <div className="dashboard-title">📊 Tableau de Bord - Vue d'Ensemble</div>
          <div className="dashboard-actions">
            <span className="last-update">
              Dernière mise à jour: {lastRefresh.toLocaleTimeString()}
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
        ) : (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ '--accent-color': '#3b82f6' } as React.CSSProperties}>
                <div className="kpi-label">Total des Dossiers</div>
                <div className="kpi-value">
                  {dossierStats?.totalDossiers ?? 0}
                </div>
                <div className="kpi-description">📁 Tous les dossiers</div>
              </div>

              <div className="kpi-card" style={{ '--accent-color': '#10b981' } as React.CSSProperties}>
                <div className="kpi-label">Dossiers Validés</div>
                <div className="kpi-value">
                  {dossierStats?.valides ?? 0}
                </div>
                <div className="kpi-description">✅ Dossiers validés</div>
              </div>

              <div className="kpi-card" style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}>
                <div className="kpi-label">En Cours</div>
                <div className="kpi-value">
                  {dossierStats?.enCours ?? 0}
                </div>
                <div className="kpi-description">📝 En cours de traitement</div>
              </div>

              <div className="kpi-card" style={{ '--accent-color': '#6366f1' } as React.CSSProperties}>
                <div className="kpi-label">Utilisateurs Actifs</div>
                <div className="kpi-value">
                  {userStats?.activeUsers ?? '-'}
                </div>
                <div className="kpi-description">👥 Utilisateurs connectés</div>
              </div>
            </div>

            {/* Répartition par Statut */}
            <div className="chart-section">
              <div className="chart-title">
                📈 Répartition des Dossiers par Statut
              </div>
              <div>
                {dossierStats && [
                  { key: 'Nouveau', value: dossierStats.nouveauxDossiers },
                  { key: 'En Cours', value: dossierStats.enCours },
                  { key: 'En Validation', value: dossierStats.enValidation },
                  { key: 'Validé', value: dossierStats.valides },
                  { key: 'Terminé', value: dossierStats.termines }
                ].map(({ key, value }) => {
                  const total = dossierStats.totalDossiers || 1
                  const percentage = Math.round((value / total) * 100)
                  return (
                    <div key={key} className="status-item">
                      <div className="status-label">
                        <span className="status-icon">{statusIcons[key] || '📋'}</span>
                        <span className="status-name">{key}</span>
                      </div>
                      <div className="status-bar-container">
                        <div 
                          className="status-bar"
                          style={{ 
                            width: `${percentage}%`, 
                            background: `linear-gradient(90deg, ${statusColors[key] || '#94a3b8'}, ${statusColors[key] || '#94a3b8'}dd)`,
                          }}
                        >
                          {value} ({percentage}%)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Indicateurs de Performance */}
            <div className="chart-section">
              <div className="chart-title">
                🎯 Indicateurs de Performance
              </div>
              <div className="performance-grid">
                <div className="performance-card" style={{ 
                  '--bg-color': 'rgba(102, 126, 234, 0.05)',
                  '--border-color': 'rgba(102, 126, 234, 0.1)',
                  '--value-color': '#667eea'
                } as React.CSSProperties}>
                  <div className="performance-label">Taux de Traitement</div>
                  <div className="performance-value">
                    {dossierStats ? Math.round(((dossierStats.valides ?? 0) / (dossierStats.totalDossiers || 1)) * 100) : 0}%
                  </div>
                  <div className="performance-description">Dossiers validés / Total</div>
                </div>

                <div className="performance-card" style={{ 
                  '--bg-color': 'rgba(245, 158, 11, 0.05)',
                  '--border-color': 'rgba(245, 158, 11, 0.1)',
                  '--value-color': '#f59e0b'
                } as React.CSSProperties}>
                  <div className="performance-label">Dossiers en Cours</div>
                  <div className="performance-value">
                    {(dossierStats?.enCours ?? 0) + (dossierStats?.enValidation ?? 0)}
                  </div>
                  <div className="performance-description">En cours + En validation</div>
                </div>

                <div className="performance-card" style={{ 
                  '--bg-color': 'rgba(59, 130, 246, 0.05)',
                  '--border-color': 'rgba(59, 130, 246, 0.1)',
                  '--value-color': '#3b82f6'
                } as React.CSSProperties}>
                  <div className="performance-label">Nouveaux Dossiers</div>
                  <div className="performance-value">
                    {dossierStats?.nouveauxDossiers ?? 0}
                  </div>
                  <div className="performance-description">En attente d'attribution</div>
                </div>

                <div className="performance-card" style={{ 
                  '--bg-color': 'rgba(107, 114, 128, 0.05)',
                  '--border-color': 'rgba(107, 114, 128, 0.1)',
                  '--value-color': '#6b7280'
                } as React.CSSProperties}>
                  <div className="performance-label">Dossiers Terminés</div>
                  <div className="performance-value">
                    {dossierStats?.termines ?? 0}
                  </div>
                  <div className="performance-description">Clôturés</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
