import { useEffect, useState } from 'react'
import { dossierApi } from '../api/dossierApi'
import { documentApi } from '../api/documentApi'
import type { DossierDetailDto } from '../types/dossierDetail'
import type { DocumentDto } from '../types/document'
import { useToast } from '../components/common/ToastProvider'

interface Props {
  dossierId: string
}

export default function DossierDetailPage({ dossierId }: Props) {
  const [detail, setDetail] = useState<DossierDetailDto | null>(null)
  const [docs, setDocs] = useState<DocumentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rapporteurId, setRapporteurId] = useState('')
  const [nouveauStatut, setNouveauStatut] = useState('')
  const [commentaire, setCommentaire] = useState('')
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
    } catch (e) {
      setError('Téléchargement impossible')
      notify({ type: 'error', message: 'Téléchargement impossible' })
    }
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
      if (!nouveauStatut) { setError('Veuillez choisir un statut'); return }
      await dossierApi.changerStatut(dossierId, nouveauStatut, commentaire)
      setCommentaire('')
      // Optionnel: recharger le détail pour refléter le nouveau statut
      const d = await dossierApi.getById(dossierId)
      setDetail(d)
      notify({ type: 'success', message: 'Statut modifié' })
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Changement de statut impossible')
      notify({ type: 'error', message: e?.response?.data?.message || e?.message || 'Changement de statut impossible' })
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
            <div className="panel-title">Documents</div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>MIME</th>
                    <th>Taille</th>
                    <th>Version</th>
                    <th></th>
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
                        <button className="btn" onClick={() => download(doc)}>Télécharger</button>{' '}
                        <button className="btn" onClick={() => remove(doc)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                <option value="Nouveau">Nouveau</option>
                <option value="EnInstruction">EnInstruction</option>
                <option value="EnDelibere">EnDelibere</option>
                <option value="Juge">Juge</option>
                <option value="Classe">Classe</option>
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
