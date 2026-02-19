import { useState } from 'react'
import api from '../api/api-client'
import type { DossierListDto } from '../types/dossier'
import { useToast } from '../components/common/ToastProvider'

interface RechercheAvanceePageProps {
  onViewDossier?: (dossierId: string) => void
}

export default function RechercheAvanceePage({ onViewDossier }: RechercheAvanceePageProps = {}) {
  const [results, setResults] = useState<DossierListDto[]>([])
  const [loading, setLoading] = useState(false)
  const { notify } = useToast()

  // Critères de recherche
  const [numeroDossier, setNumeroDossier] = useState('')
  const [titre, setTitre] = useState('')
  const [typeAffaire, setTypeAffaire] = useState('')
  const [status, setStatus] = useState('')
  const [priorite, setPriorite] = useState('')
  const [dateDebutMin, setDateDebutMin] = useState('')
  const [dateDebutMax, setDateDebutMax] = useState('')
  const [motsCles, setMotsCles] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('pageSize', '50')
      
      if (numeroDossier.trim()) params.set('search', numeroDossier.trim())
      if (titre.trim()) params.set('search', titre.trim())
      if (typeAffaire) params.set('type', typeAffaire)
      if (status) params.set('status', status)
      if (priorite) params.set('priorite', priorite)
      if (dateDebutMin) params.set('dateDebutMin', dateDebutMin)
      if (dateDebutMax) params.set('dateDebutMax', dateDebutMax)

      const response = await api.get(`/Dossiers?${params.toString()}`)
      setResults(response.data.data || [])
      
      if (response.data.data.length === 0) {
        notify({ type: 'info', message: '🔍 Aucun résultat trouvé' })
      } else {
        notify({ type: 'success', message: `✅ ${response.data.data.length} résultat(s) trouvé(s)` })
      }
    } catch (error: any) {
      notify({ type: 'error', message: error?.response?.data?.message || 'Erreur lors de la recherche' })
    } finally {
      setLoading(false)
    }
  }

  function resetFilters() {
    setNumeroDossier('')
    setTitre('')
    setTypeAffaire('')
    setStatus('')
    setPriorite('')
    setDateDebutMin('')
    setDateDebutMax('')
    setMotsCles('')
    setResults([])
  }

  const statusColors: Record<string, string> = {
    'Nouveau': '#3b82f6',
    'EnInstruction': '#f59e0b',
    'EnDelibere': '#6366f1',
    'Juge': '#10b981',
    'Classe': '#6b7280'
  }

  return (
    <div className="panel">
      <div className="panel-title">🔍 Recherche Avancée de Dossiers</div>

      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>
            🎯 Critères de Recherche
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label>📋 Numéro de Dossier</label>
              <input
                type="text"
                placeholder="Ex: CC/2025/001"
                value={numeroDossier}
                onChange={(e) => setNumeroDossier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>📝 Titre ou Mots-clés</label>
              <input
                type="text"
                placeholder="Rechercher dans le titre..."
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>📂 Catégorie</label>
              <select value={typeAffaire} onChange={(e) => setTypeAffaire(e.target.value)}>
                <option value="">-- Tous les types --</option>
                {/* Les valeurs doivent correspondre EXACTEMENT aux enums backend TypeAffaire */}
                <option value="ContentieuxElectoral">Contentieux Électoral</option>
                <option value="ControleConstitutionnalite">Contrôle de Constitutionnalité</option>
                <option value="ConflitCompetence">Conflit de Compétence</option>
                <option value="InterpretationConstitution">Interprétation de la Constitution</option>
                <option value="ExceptionInconstitutionnalite">Exception d'Inconstitutionnalité</option>
                {/* Autre n'existe pas dans l'enum backend: on l'affiche mais ne filtre pas */}
                <option value="">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label>📊 Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">-- Tous les statuts --</option>
                {/* Enum backend StatusDossier */}
                <option value="Nouveau">🆕 Nouveau</option>
                <option value="EnCours">📝 En cours</option>
                <option value="EnValidation">💭 En validation</option>
                <option value="Valide">✅ Validé</option>
                <option value="Termine">📦 Terminé</option>
              </select>
            </div>

            <div className="form-group">
              <label>🎯 Priorité</label>
              <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                <option value="">-- Toutes --</option>
                {/* Enum backend PrioriteDossier */}
                <option value="Basse">⚪ Basse</option>
                <option value="Normale">⚪ Normale</option>
                <option value="Haute">🟡 Haute</option>
                <option value="Urgente">🔴 Urgente</option>
              </select>
            </div>

            <div className="form-group">
              <label>📅 Date Début (Min)</label>
              <input
                type="date"
                value={dateDebutMin}
                onChange={(e) => setDateDebutMin(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>📅 Date Début (Max)</label>
              <input
                type="date"
                value={dateDebutMax}
                onChange={(e) => setDateDebutMax(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>🏷️ Mots-clés Libres</label>
              <input
                type="text"
                placeholder="Séparer par des virgules"
                value={motsCles}
                onChange={(e) => setMotsCles(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
              {loading ? '⏳ Recherche en cours...' : '🔍 Lancer la recherche'}
            </button>
            <button type="button" className="btn" onClick={resetFilters} style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', color: 'white', border: 'none' }}>
              🔄 Réinitialiser
            </button>
          </div>
        </div>
      </form>

      {/* Résultats */}
      {results.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📊 Résultats de la recherche</span>
            <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontSize: 14, padding: '6px 12px' }}>
              {results.length} dossier(s)
            </span>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Priorité</th>
                  <th>Date Début</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(dossier => (
                  <tr key={dossier.id}>
                    <td style={{ fontWeight: 600 }}>{dossier.numeroDossier}</td>
                    <td>{dossier.titre}</td>
                    <td style={{ fontSize: 13 }}>{dossier.typeAffaire || '-'}</td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          background: `${statusColors[dossier.status || 'Nouveau']}22`,
                          color: statusColors[dossier.status || 'Nouveau']
                        }}
                      >
                        {dossier.status || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge priorite-${dossier.priorite?.toLowerCase() || 'normale'}`}>
                        {dossier.priorite === 'Critique' && '🔴'}
                        {dossier.priorite === 'Haute' && '🟡'}
                        {dossier.priorite === 'Normale' && '⚪'}
                        {' '}{dossier.priorite || '-'}
                      </span>
                    </td>
                    <td>{dossier.dateDebut ? new Date(dossier.dateDebut).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>
                      <button 
                        className="btn" 
                        style={{ fontSize: 13, padding: '6px 12px' }}
                        onClick={() => onViewDossier && onViewDossier(dossier.id)}
                      >
                        👁️ Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (numeroDossier || titre || typeAffaire || status || priorite || dateDebutMin || dateDebutMax) && (
        <div className="info" style={{ textAlign: 'center', padding: 40 }}>
          🔍 Aucun dossier ne correspond aux critères de recherche
        </div>
      )}
    </div>
  )
}
