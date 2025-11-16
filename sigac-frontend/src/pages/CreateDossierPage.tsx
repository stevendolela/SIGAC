import { useState } from 'react'
import api from '../api/api-client'
import { useToast } from '../components/common/ToastProvider'

export default function CreateDossierPage({ onSuccess }: { onSuccess?: () => void }) {
  const { notify } = useToast()
  const [loading, setLoading] = useState(false)

  // Champs du formulaire
  const [titre, setTitre] = useState('')
  const [typeAffaire, setTypeAffaire] = useState('') // enum TypeAffaire (1..5)
  const [priorite, setPriorite] = useState('2') // PrioriteDossier (1:Basse,2:Normale,3:Haute,4:Urgente)
  const [demandeur, setDemandeur] = useState('')
  const [defendeur, setDefendeur] = useState('')
  const [resume, setResume] = useState('')
  // Champs non supportés par le DTO backend retirés pour éviter 400: observations/dateDepot/dateAudience

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!titre.trim() || titre.trim().length < 10) {
      notify({ type: 'error', message: "⚠️ Le titre est obligatoire (min. 10 caractères)" })
      return
    }
    
    if (!typeAffaire) {
      notify({ type: 'error', message: '⚠️ Le type d\'affaire est obligatoire' })
      return
    }

    if (!demandeur.trim() || demandeur.trim().length < 3) {
      notify({ type: 'error', message: '⚠️ Le demandeur est obligatoire (min. 3 caractères)' })
      return
    }

    setLoading(true)

    try {
      const payload = {
  // PascalCase pour correspondre exactement au DTO backend
  Titre: titre.trim(),
  Type: Number(typeAffaire),
  Priorite: Number(priorite),
  Demandeur: demandeur.trim(),
  Defendeur: defendeur.trim() || null,
  Resume: resume.trim() || null
      }

      const response = await api.post('/Dossiers', payload)
      
      notify({ type: 'success', message: `✅ Dossier créé avec succès: ${response.data.numeroDossier}` })
      
      // Réinitialiser le formulaire
      setTitre('')
      setTypeAffaire('')
  setPriorite('2')
      setDemandeur('')
      setDefendeur('')
      setResume('')
      

      if (onSuccess) onSuccess()
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message
      const modelErrors: string[] | undefined = error?.response?.data?.errors
      notify({ 
        type: 'error', 
        message: serverMsg || (modelErrors?.length ? modelErrors.join('\n') : 'Erreur lors de la création du dossier') 
      })
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setTitre('')
    setTypeAffaire('')
    setPriorite('2')
    setDemandeur('')
    setDefendeur('')
    setResume('')
    
  }

  return (
    <div className="panel">
      <div className="panel-title">📝 Créer un Nouveau Dossier</div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
          
          {/* Informations Principales */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span> Informations Principales
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Titre du Dossier *</label>
                <input
                  type="text"
                  placeholder="Ex: Contestation électorale - Province du Nord-Kivu"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type d'Affaire *</label>
                <select value={typeAffaire} onChange={(e) => setTypeAffaire(e.target.value)} required>
                  <option value="">-- Sélectionner --</option>
                  <option value="1">Contentieux électoral</option>
                  <option value="2">Contrôle de constitutionnalité</option>
                  <option value="3">Conflit de compétence</option>
                  <option value="4">Interprétation de la Constitution</option>
                  <option value="5">Exception d'inconstitutionnalité</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priorité</label>
                <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                  <option value="1">⚪ Basse</option>
                  <option value="2">⚪ Normale</option>
                  <option value="3">� Haute</option>
                  <option value="4">🔴 Urgente</option>
                </select>
              </div>
              
            </div>
          </div>

          {/* Parties */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👥</span> Parties
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Demandeur *</label>
                <input
                  type="text"
                  placeholder="Nom du demandeur"
                  value={demandeur}
                  onChange={(e) => setDemandeur(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Défendeur</label>
                <input
                  type="text"
                  placeholder="Nom du défendeur"
                  value={defendeur}
                  onChange={(e) => setDefendeur(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Détails */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📄</span> Détails de l'Affaire
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Résumé</label>
              <textarea
                placeholder="Résumé bref de l'affaire..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                rows={4}
                style={{ width: '100%', fontFamily: 'inherit' }}
              />
            </div>

            {/* Observations supprimé: non supporté par CreateDossierDto */}
          </div>

          {/* Aide */}
          <div style={{ 
            padding: 16, 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderLeft: '4px solid #3b82f6',
            borderRadius: 8,
            marginBottom: 24
          }}>
            <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 500, marginBottom: 4 }}>
              💡 Information
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Les champs marqués d'un astérisque (*) sont obligatoires. Le numéro de dossier sera généré automatiquement lors de la création.
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn" 
              onClick={handleReset}
              disabled={loading}
              style={{ 
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', 
                color: 'white', 
                border: 'none' 
              }}
            >
              🔄 Réinitialiser
            </button>
            <button 
              type="submit" 
              className="btn" 
              disabled={loading}
              style={{ minWidth: 160 }}
            >
              {loading ? '⏳ Création en cours...' : '✅ Créer le Dossier'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
