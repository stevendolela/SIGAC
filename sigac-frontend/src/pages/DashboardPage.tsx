import { useEffect, useState } from 'react'
import { dossierApi } from '../api/dossierApi'
import { userApi } from '../api/userApi'
import type { DossierStatisticsDto } from '../types/dossierStatistics'

export default function DashboardPage() {
  const [dossierStats, setDossierStats] = useState<DossierStatisticsDto | null>(null)
  const [userStats, setUserStats] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const [ds, us] = await Promise.allSettled([
          dossierApi.statistiques(),
          userApi.statsAdmin()
        ])
        if (!mounted) return
        if (ds.status === 'fulfilled') setDossierStats(ds.value)
        if (us.status === 'fulfilled') setUserStats(us.value)
        if (ds.status === 'rejected' && us.status === 'rejected') setError('Impossible de charger les statistiques')
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Erreur')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const statusColors: Record<string, string> = {
    'Nouveau': '#3b82f6',
    'EnInstruction': '#f59e0b', 
    'EnDelibere': '#6366f1',
    'Juge': '#10b981',
    'Classe': '#6b7280'
  }

  const statusIcons: Record<string, string> = {
    'Nouveau': '🆕',
    'EnInstruction': '📝',
    'EnDelibere': '💭', 
    'Juge': '✅',
    'Classe': '📦'
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-title">📊 Tableau de Bord - Vue d'Ensemble</div>
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="info">⏳ Chargement des statistiques...</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>Total des Dossiers</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {dossierStats?.total ?? 0}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>📁 Affaires constitutionnelles</div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>Dossiers Jugés</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {dossierStats?.parStatut?.['Juge'] ?? 0}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>✅ Affaires traitées</div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>En Instruction</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {dossierStats?.parStatut?.['EnInstruction'] ?? 0}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>📝 En cours de traitement</div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)', borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>Utilisateurs Actifs</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {userStats?.activeUsers ?? '-'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>👥 Personnel connecté</div>
              </div>
            </div>

            {/* Répartition par Statut */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>
                📈 Répartition des Dossiers par Statut
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {dossierStats && Object.entries(dossierStats.parStatut || {}).map(([status, count]) => {
                  const total = dossierStats.total || 1
                  const percentage = Math.round((count as number / total) * 100)
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ minWidth: 140, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{statusIcons[status] || '📋'}</span>
                        <span style={{ fontWeight: 500, color: '#475569' }}>{status}</span>
                      </div>
                      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 8, height: 32, position: 'relative', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            background: `linear-gradient(90deg, ${statusColors[status] || '#94a3b8'}, ${statusColors[status] || '#94a3b8'}dd)`,
                            transition: 'width 0.5s ease',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: 12,
                            color: 'white',
                            fontWeight: 600,
                            fontSize: 14
                          }}
                        >
                          {count as number} ({percentage}%)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Indicateurs de Performance */}
            <div className="card">
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>
                🎯 Indicateurs de Performance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={{ padding: 16, background: 'rgba(102, 126, 234, 0.05)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Taux de Traitement</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#667eea' }}>
                    {dossierStats ? Math.round(((dossierStats.parStatut?.['Juge'] ?? 0) / (dossierStats.total || 1)) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Affaires jugées / Total</div>
                </div>

                <div style={{ padding: 16, background: 'rgba(245, 158, 11, 0.05)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Dossiers en Cours</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>
                    {(dossierStats?.parStatut?.['EnInstruction'] ?? 0) + (dossierStats?.parStatut?.['EnDelibere'] ?? 0)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Instruction + Délibéré</div>
                </div>

                <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Nouveaux Dossiers</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
                    {dossierStats?.parStatut?.['Nouveau'] ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>En attente d'attribution</div>
                </div>

                <div style={{ padding: 16, background: 'rgba(107, 114, 128, 0.05)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Dossiers Classés</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#6b7280' }}>
                    {dossierStats?.parStatut?.['Classe'] ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Archivés</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
