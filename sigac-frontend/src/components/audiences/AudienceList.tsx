import { useState, useEffect } from 'react'
import { audienceApi } from '../../api/audienceApi'
import type { AudienceListDto } from '../../types/audience'
import { TypeAudience, StatutAudience, typeAudienceLabels, statutAudienceLabels, statutAudienceColors, typeAudienceColors } from '../../types/audience'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AudienceListProps {
  dossierId?: string
  onSelectAudience?: (id: string) => void
  onRefresh?: () => void
}

export default function AudienceList({ dossierId, onSelectAudience, onRefresh }: AudienceListProps) {
  const [audiences, setAudiences] = useState<AudienceListDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAudiences()
  }, [dossierId])

  const loadAudiences = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = dossierId 
        ? await audienceApi.getByDossier(dossierId)
        : await audienceApi.list()
      setAudiences(data)
      onRefresh?.()
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des audiences')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
      return
    }

    try {
      await audienceApi.delete(id)
      loadAudiences()
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px',
        color: '#64748b'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #f3f4f6',
          borderTopColor: '#5b21b6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        background: '#fef2f2', 
        border: '1px solid #fecaca', 
        color: '#991b1b',
        padding: '16px',
        borderRadius: 8,
        marginBottom: 16
      }}>
        <strong>❌ Erreur:</strong> {error}
      </div>
    )
  }

  if (audiences.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 60, 
        color: '#94a3b8',
        background: '#f8fafc',
        borderRadius: 12,
        border: '2px dashed #cbd5e1'
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📅</div>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Aucune réunion planifiée</p>
      </div>
    )
  }

  return (
    <div style={{ 
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {audiences.map((audience, index) => (
        <div 
          key={audience.id} 
          style={{
            padding: '20px 24px',
            borderBottom: index < audiences.length - 1 ? '1px solid #f1f5f9' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'background 0.15s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          {/* En-tête de la carte */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  📅 {format(new Date(audience.dateAudience), 'dd MMMM yyyy', { locale: fr })}
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#64748b',
                  padding: '4px 10px',
                  background: '#f1f5f9',
                  borderRadius: 6
                }}>
                  🕐 {format(new Date(audience.dateAudience), 'HH:mm', { locale: fr })}
                </div>
              </div>
              
              <div style={{ 
                fontSize: 14, 
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                📍 <strong>{audience.lieu}</strong>
              </div>
            </div>

            {/* Badges statut et type */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                ...getTypeStyle(audience.typeAudience as TypeAudience)
              }}>
                {typeAudienceLabels[audience.typeAudience as TypeAudience]}
              </span>
              <span style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                ...getStatutStyle(audience.statut as StatutAudience)
              }}>
                {statutAudienceLabels[audience.statut as StatutAudience]}
              </span>
            </div>
          </div>

          {/* Observations si présentes */}
          {audience.observations && (
            <div style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: 8,
              fontSize: 13,
              color: '#475569',
              lineHeight: 1.5,
              borderLeft: '3px solid #cbd5e1'
            }}>
              💬 {audience.observations}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectAudience?.(audience.id)
              }}
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(102, 126, 234, 0.3)'
              }}
            >
              📋 Détails
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(audience.id)
              }}
              style={{
                padding: '8px 20px',
                background: '#fee2e2',
                color: '#991b1b',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fecaca'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fee2e2'
              }}
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Fonctions helper pour les styles
function getTypeStyle(type: TypeAudience) {
  const styles: Record<TypeAudience, any> = {
    [TypeAudience.Preliminaire]: { background: '#dbeafe', color: '#1e40af' },
    [TypeAudience.Plaidoirie]: { background: '#fef3c7', color: '#92400e' },
    [TypeAudience.Delibere]: { background: '#e0e7ff', color: '#3730a3' },
    [TypeAudience.Prononce]: { background: '#fee2e2', color: '#991b1b' },
    [TypeAudience.Instruction]: { background: '#d1fae5', color: '#065f46' },
    [TypeAudience.MiseEnEtat]: { background: '#fce7f3', color: '#9d174d' }
  }
  return styles[type] || { background: '#f3f4f6', color: '#6b7280' }
}

function getStatutStyle(statut: StatutAudience) {
  const styles: Record<StatutAudience, any> = {
    [StatutAudience.Planifiee]: { background: '#dbeafe', color: '#1e40af' },
    [StatutAudience.Confirmee]: { background: '#fef3c7', color: '#92400e' },
    [StatutAudience.Tenue]: { background: '#d1fae5', color: '#065f46' },
    [StatutAudience.Reportee]: { background: '#fed7aa', color: '#9a3412' },
    [StatutAudience.Annulee]: { background: '#f3f4f6', color: '#374151' }
  }
  return styles[statut] || { background: '#f3f4f6', color: '#6b7280' }
}
