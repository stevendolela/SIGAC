import { useEffect, useState } from 'react'
import { dossierApi } from '../api/dossierApi'
import { documentApi, type DocumentVisualisationLogDto } from '../api/documentApi'
import type { DossierDetailDto } from '../types/dossierDetail'
import type { DocumentDto } from '../types/document'
import { useToast } from '../components/common/ToastProvider'

interface Props {
  dossierId: string
}

export default function DossierDetailPage({ dossierId }: Props) {
  const [detail, setDetail] = useState<DossierDetailDto | null>(null)
  const [docs, setDocs] = useState<DocumentDto[]>([])
  const [visualisations, setVisualisations] = useState<DocumentVisualisationLogDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rapporteurId, setRapporteurId] = useState('')
  const [nouveauStatut, setNouveauStatut] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [showVisHistory, setShowVisHistory] = useState(false)
  const { notify } = useToast()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [d, l] = await Promise.all([
          dossierApi.getById(dossierId),
          documentApi.listByDossier(dossierId)
        ])
        if (!mounted) return
        setDetail(d)
        setDocs(l)
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.message || e?.message || 'Erreur de chargement')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [dossierId])

  async function download(doc: DocumentDto) {
    try {
      const blob = await documentApi.download(doc.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nomFichier
      a.click()
      URL.revokeObjectURL(url)
      notify({ type: 'success', message: '📥 Document téléchargé' })
    } catch (e) {
      setError('Téléchargement impossible')
      notify({ type: 'error', message: 'Téléchargement impossible' })
    }
  }

  async function viewDocument(doc: DocumentDto) {
    try {
      const blob = await documentApi.view(doc.id)
      const url = URL.createObjectURL(blob)
      // Ouvrir dans un nouvel onglet
      window.open(url, '_blank')
      notify({ type: 'success', message: '👁️ Document ouvert' })
      // Recharger l'historique si affiché
      if (showVisHistory) {
        loadVisualisations()
      }
    } catch (e) {
      setError('Visualisation impossible')
      notify({ type: 'error', message: 'Visualisation impossible' })
    }
  }

  async function loadVisualisations() {
    try {
      const vis = await documentApi.getDossierVisualisations(dossierId)
      setVisualisations(vis)
    } catch (e) {
      console.error('Erreur chargement historique visualisations', e)
    }
  }

  async function toggleVisHistory() {
    if (!showVisHistory) {
      await loadVisualisations()
    }
    setShowVisHistory(!showVisHistory)
  }

  async function remove(doc: DocumentDto) {
    if (!confirm('Supprimer ce document ?')) return
    try {
      const ok = await documentApi.remove(doc.id)
      if (ok) setDocs(prev => prev.filter(d => d.id !== doc.id))
      if (ok) notify({ type: 'success', message: 'Document supprimé' })
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Suppression impossible')
      notify({ type: 'error', message: e?.response?.data?.message || e?.message || 'Suppression impossible' })
    }
  }

  async function attribuerRapporteur() {
    try {
      if (!rapporteurId) { setError('Veuillez saisir un rapporteurId'); return }
      await dossierApi.attribuerRapporteur(dossierId, rapporteurId)
      setRapporteurId('')
      notify({ type: 'success', message: 'Rapporteur attribué' })
      // Pas de refresh lourd ici; un message ou toast serait idéal
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Attribution du rapporteur impossible")
      notify({ type: 'error', message: e?.response?.data?.message || e?.message || 'Attribution du rapporteur impossible' })
    }
  }

  async function changerStatut() {
    try {
      if (!nouveauStatut) { 
        setError('Veuillez choisir un statut')
        notify({ type: 'error', message: 'Veuillez choisir un statut' })
        return 
      }
      
      // Convertir le statut en nombre (StatusDossier enum côté backend)
      const statutNumber = Number(nouveauStatut)
      
      await dossierApi.changerStatut(dossierId, statutNumber, commentaire)
      setCommentaire('')
      setNouveauStatut('')
      
      // Recharger le détail pour refléter le nouveau statut
      const d = await dossierApi.getById(dossierId)
      setDetail(d)
      notify({ type: 'success', message: `✅ Statut modifié avec succès` })
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Changement de statut impossible'
      setError(errorMsg)
      notify({ type: 'error', message: errorMsg })
    }
  }

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <div className="panel-title">Dossier</div>
      {loading && <div className="info">Chargement…</div>}
      {error && <div className="error">{error}</div>}
      {detail && (
        <div>
          <div><b>{detail.numeroDossier}</b> — {detail.titre}</div>
          <div>Statut: {detail.status ?? '-'}</div>
          <div>Type: {detail.typeAffaire ?? '-'}</div>
          <div>Priorité: {detail.priorite ?? '-'}</div>
          {detail.description && <div style={{ marginTop: 6 }}>{detail.description}</div>}

          <div className="panel" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="panel-title">Documents</div>
              <button className="btn" onClick={toggleVisHistory} style={{ fontSize: 13 }}>
                {showVisHistory ? '🔽 Masquer historique' : '📊 Voir historique visualisations'}
              </button>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>MIME</th>
                    <th>Taille</th>
                    <th>Version</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc.id}>
                      <td>{doc.nomFichier}</td>
                      <td>{doc.mimeType}</td>
                      <td>{(doc.tailleFichier / 1024).toFixed(1)} Ko</td>
                      <td>{doc.numeroVersion}</td>
                      <td>
                        <button className="btn" onClick={() => viewDocument(doc)} title="Ouvrir dans le navigateur">👁️ Voir</button>{' '}
                        <button className="btn" onClick={() => download(doc)} title="Télécharger">📥 Télécharger</button>{' '}
                        <button className="btn" onClick={() => remove(doc)} title="Supprimer">🗑️ Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {showVisHistory && (
              <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>
                  📊 Historique des Visualisations ({visualisations.length})
                </div>
                {visualisations.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 14 }}>Aucune visualisation enregistrée</div>
                ) : (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    <table className="table" style={{ fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th>Date/Heure</th>
                          <th>Utilisateur</th>
                          <th>Document</th>
                          <th>Type</th>
                          <th>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visualisations.map(v => (
                          <tr key={v.id}>
                            <td>{new Date(v.dateVisualisation).toLocaleString()}</td>
                            <td>{v.userNomComplet}</td>
                            <td>{v.documentNom}</td>
                            <td>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: 4, 
                                fontSize: 11, 
                                fontWeight: 600,
                                background: v.typeVisualisation === 'view' ? '#dbeafe' : '#fef3c7',
                                color: v.typeVisualisation === 'view' ? '#1e40af' : '#92400e'
                              }}>
                                {v.typeVisualisation === 'view' ? '👁️ Vue' : '📥 Téléchargement'}
                              </span>
                            </td>
                            <td style={{ fontSize: 11, color: '#64748b' }}>{v.ipAddress || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="panel" style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            <div className="panel-title">Actions</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                placeholder="RapporteurId (GUID)"
                value={rapporteurId}
                onChange={(e) => setRapporteurId(e.target.value)}
                style={{ padding: 6, border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 280 }}
              />
              <button className="btn" onClick={attribuerRapporteur}>Attribuer rapporteur</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={nouveauStatut}
                onChange={(e) => setNouveauStatut(e.target.value)}
                style={{ padding: 6, border: '1px solid #e5e7eb', borderRadius: 6 }}
              >
                <option value="">Nouveau statut…</option>
                <option value="1">🆕 Nouveau</option>
                <option value="2">📝 En Instruction</option>
                <option value="3">💭 En Délibéré</option>
                <option value="4">✅ Jugé</option>
                <option value="5">📦 Classé</option>
              </select>
              <input
                placeholder="Commentaire (optionnel)"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                style={{ padding: 6, border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 300 }}
              />
              <button className="btn" onClick={changerStatut}>Changer statut</button>
            </div>
          </div>

          {detail.historiques && detail.historiques.length > 0 && (
            <div className="panel" style={{ marginTop: 12 }}>
              <div className="panel-title">Historique</div>
              <ul>
                {detail.historiques.map(h => (
                  <li key={h.id}>
                    <b>{new Date(h.dateAction).toLocaleString()}</b>: {h.action} — {h.details ?? ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
