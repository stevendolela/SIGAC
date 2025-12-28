import { useEffect, useState } from 'react'
import { audienceApi } from '../../api/audienceApi'
import { dossierApi } from '../../api/dossierApi'
import type { AudienceDetailDto } from '../../types/audience'
import type { DossierListDto } from '../../types/dossier'
import { typeAudienceLabels, statutAudienceLabels, statutAudienceColors, typeAudienceColors } from '../../types/audience'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AudienceDetailProps {
  audienceId: string
  onEdit?: () => void
  onClose?: () => void
  canEdit?: boolean
  onViewDossier?: (dossierId: string) => void
}

export default function AudienceDetail({ audienceId, onEdit, onClose, canEdit = false, onViewDossier }: AudienceDetailProps) {
  const [audience, setAudience] = useState<AudienceDetailDto | null>(null)
  const [dossier, setDossier] = useState<DossierListDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAudience()
  }, [audienceId])

  const loadAudience = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await audienceApi.getById(audienceId)
      setAudience(data)
      
      // Charger les détails du dossier associé
      if (data.dossierId) {
        try {
          const dossierData = await dossierApi.getById(data.dossierId)
          setDossier(dossierData)
        } catch (err) {
          console.error('Erreur lors du chargement du dossier:', err)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 14, color: '#667eea' }}>⏳ Chargement des détails...</div>
      </div>
    )
  }

  if (error || !audience) {
    return (
      <div className="error" style={{ marginBottom: 20 }}>
        ❌ {error || 'Audience introuvable'}
      </div>
    )
  }

  // Conversion des couleurs Tailwind en couleurs hexadécimales
  const getStatutColors = (statut: number) => {
    const colors: Record<number, { bg: string; text: string }> = {
      0: { bg: '#dbeafe', text: '#1e40af' }, // Planifiée
      1: { bg: '#dcfce7', text: '#15803d' }, // Confirmée
      2: { bg: '#fef3c7', text: '#92400e' }, // Reportée
      3: { bg: '#fee2e2', text: '#991b1b' }, // Annulée
      4: { bg: '#f3f4f6', text: '#374151' }  // Tenue
    }
    return colors[statut] || colors[0]
  }

  const getTypeColors = (type: number) => {
    const colors: Record<number, { bg: string; text: string }> = {
      0: { bg: '#f3e8ff', text: '#6b21a8' }, // Préliminaire
      1: { bg: '#e0e7ff', text: '#3730a3' }, // Plaidoirie
      2: { bg: '#fed7aa', text: '#92400e' }, // Délibéré
      3: { bg: '#fce7f3', text: '#be185d' }, // Prononcé
      4: { bg: '#cffafe', text: '#155e75' }, // Instruction
      5: { bg: '#ccfbf1', text: '#115e59' }  // Mise en état
    }
    return colors[type] || colors[0]
  }

  const statutColors = getStatutColors(audience.statut)
  const typeColors = getTypeColors(audience.typeAudience)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* En-tête avec statut et type */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            Détails de l'Audience
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: statutColors.bg,
              color: statutColors.text
            }}>
              {statutAudienceLabels[audience.statut]}
            </span>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: typeColors.bg,
              color: typeColors.text
            }}>
              {typeAudienceLabels[audience.typeAudience]}
            </span>
          </div>
        </div>
        {canEdit && (
          <button
            className="btn"
            onClick={onEdit}
            style={{ fontSize: 14, padding: '10px 16px' }}
          >
            ✏️ Modifier
          </button>
        )}
      </div>

      {/* Informations principales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>Date et heure</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
            📅 {format(new Date(audience.dateAudience), 'EEEE dd MMMM yyyy', { locale: fr })}
          </div>
          <div style={{ fontSize: '14px', color: '#374151', marginTop: '6px' }}>
            🕐 {format(new Date(audience.dateAudience), 'HH:mm', { locale: fr })}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>Lieu</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
            🏛️ {audience.lieu}
          </div>
        </div>
      </div>

      {/* Dossier associé */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '2px solid #bfdbfe',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: 700, marginBottom: '12px' }}>
          📁 Dossier associé
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>
              Numéro
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e3a8a' }}>
              {dossier?.numeroDossier || audience.dossierNumero || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>
              Titre
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e40af' }}>
              {dossier?.titre || audience.dossierTitre || 'Non disponible'}
            </div>
          </div>

          {dossier && (
            <>
              {dossier.typeAffaire && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>
                      Catégorie
                    </div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {dossier.typeAffaire}
                    </div>
                  </div>
                  
                  {dossier.status && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>
                        Statut
                      </div>
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        {dossier.status}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {dossier.priorite && (
                <div>
                  <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>
                    Priorité
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {dossier.priorite}
                  </div>
                </div>
              )}

              {dossier.dateDebut && (
                <div>
                  <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>
                    Date de début
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {format(new Date(dossier.dateDebut), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => {
                if (onViewDossier) {
                  onViewDossier(audience.dossierId)
                }
                onClose?.()
              }}
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              🔍 Voir le dossier complet
            </button>
          </div>
        </div>
      </div>

      {/* Observations */}
      {audience.observations && (
        <div className="card">
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600, marginBottom: '8px' }}>📝 Observations</div>
          <div style={{ color: '#374151', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{audience.observations}</div>
        </div>
      )}

      {/* Compte-rendu */}
      {audience.compteRendu && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '2px solid #bbf7d0',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 600, marginBottom: '8px' }}>📄 Compte-rendu</div>
          <div style={{ color: '#374151', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{audience.compteRendu}</div>
        </div>
      )}

      {/* Métadonnées */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
          <div>
            <span style={{ fontWeight: 600 }}>Créé par:</span> {audience.createdByName}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Créé le:</span> {format(new Date(audience.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </div>
          {audience.updatedAt && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ fontWeight: 600 }}>Dernière modification:</span> {format(new Date(audience.updatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </div>
          )}
        </div>
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={onClose}
          className="btn"
          style={{ fontSize: 14, padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151' }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
