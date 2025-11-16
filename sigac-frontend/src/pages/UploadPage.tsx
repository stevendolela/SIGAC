import React, { useEffect, useState } from 'react'
import api from '../api/api-client'
import type { AxiosProgressEvent, AxiosResponse } from 'axios'
import type { DossierListDto } from '../types/dossier'
import type { PaginatedResult } from '../types/pagination'
import type { DocumentDto } from '../types/document'
import { useToast } from '../components/common/ToastProvider'

interface Props {
  selectedDossierId?: string
}

export default function UploadPage({ selectedDossierId }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dossiers, setDossiers] = useState<Array<DossierListDto>>([])
  const [selectedDossier, setSelectedDossier] = useState<string>(selectedDossierId || '')
  const [lastUploaded, setLastUploaded] = useState<DocumentDto | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [isDragOver, setIsDragOver] = useState(false)

  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
  const { notify } = useToast()

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        // Retrieve first page of dossiers (adjust pageSize if needed)
        const resp = await api.get<PaginatedResult<DossierListDto>>('/Dossiers?page=1&pageSize=100')
        const payload = resp.data
        const list = payload?.data ?? []
        if (mounted) setDossiers(list)
      } catch (err) {
        console.error('Impossible de récupérer les dossiers', err)
      }
    }
    fetch()
    return () => { mounted = false }
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      if (!allowedTypes.includes(droppedFile.type)) {
        notify({ type: 'error', message: 'Type de fichier non autorisé (PDF/JPG/PNG uniquement)' })
        return
      }
      if (droppedFile.size > MAX_FILE_SIZE) {
        notify({ type: 'error', message: 'Fichier trop volumineux (max 50MB)' })
        return
      }
      setFile(droppedFile)
      notify({ type: 'success', message: `Fichier "${droppedFile.name}" sélectionné` })
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setMessage('Veuillez sélectionner un fichier')
    if (!selectedDossier) return setMessage('Veuillez choisir un dossier')
    if (file.size > MAX_FILE_SIZE) return setMessage('Fichier trop volumineux (max 50MB)')
    if (!allowedTypes.includes(file.type)) return setMessage('Type de fichier non autorisé (PDF/JPG/PNG)')
    setLoading(true)
    setMessage(null)
    setProgress(0)

    try {
      const form = new FormData()
      form.append('file', file, file.name)
      form.append('typeDocument', 'Requête')

      const resp: AxiosResponse<DocumentDto> = await api.post<DocumentDto, AxiosResponse<DocumentDto>>(`/Documents/upload/${selectedDossier}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt: AxiosProgressEvent) => {
          const total = evt.total ?? 0
          if (!total) return
          const loaded = evt.loaded ?? 0
          const pct = Math.round((loaded * 100) / total)
          setProgress(pct)
        }
      })
      setLastUploaded(resp.data as DocumentDto)
      setMessage(`Upload réussi: ${resp.data.nomFichier ?? 'OK'}`)
      notify({ type: 'success', message: `Upload réussi: ${resp.data.nomFichier ?? 'OK'}` })
      setFile(null)
      setProgress(0)
    } catch (err: any) {
      console.error(err)
      setMessage(err?.response?.data?.message ?? 'Erreur lors de l\'upload')
      notify({ type: 'error', message: err?.response?.data?.message ?? "Erreur lors de l'upload" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel">
      <div className="panel-title">📤 Upload de Document</div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <label>📁 Dossier cible</label>
          <select value={selectedDossier} onChange={(e) => setSelectedDossier(e.target.value)} required>
            <option value="">-- Sélectionner un dossier --</option>
            {dossiers.map((d: any) => (
              <option key={d.id} value={d.id}>{d.numeroDossier} - {d.titre ?? d.titreDossier ?? d.nom ?? d.id}</option>
            ))}
          </select>
        </div>

        <div
          className="form-group"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: isDragOver ? '3px dashed #667eea' : '2px dashed #cbd5e1',
            borderRadius: 12,
            padding: '40px 20px',
            textAlign: 'center',
            background: isDragOver ? 'rgba(102, 126, 234, 0.05)' : 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📎</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#1e293b' }}>
            {file ? `✅ ${file.name}` : 'Glissez-déposez votre fichier ici'}
          </div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
            ou cliquez pour sélectionner
          </div>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] ?? null
              setFile(selectedFile)
              if (selectedFile) notify({ type: 'success', message: `Fichier "${selectedFile.name}" sélectionné` })
            }}
            style={{ display: 'block', margin: '0 auto', maxWidth: 300 }}
          />
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
            PDF, PNG, JPEG • Max 50 MB
          </div>
        </div>

        {message && (
          <div className={message.includes('réussi') ? 'info' : 'error'} style={{ padding: 12, borderRadius: 8 }}>
            {message}
          </div>
        )}

        {loading && (
          <div>
            <div style={{
              height: 12,
              background: 'rgba(203, 213, 225, 0.3)',
              borderRadius: 8,
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease',
                borderRadius: 8
              }} />
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center', fontWeight: 500 }}>
              {progress}% • Envoi en cours...
            </div>
          </div>
        )}

        <button type="submit" className="btn" disabled={loading || !file || !selectedDossier}>
          {loading ? '⏳ Envoi en cours...' : '📤 Envoyer le document'}
        </button>
      </form>

      {lastUploaded && (
        <div className="card" style={{ marginTop: 24, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>
            ✅ Document uploadé avec succès
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontWeight: 500, color: '#64748b', minWidth: 100 }}>Fichier:</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>{lastUploaded.nomFichier}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontWeight: 500, color: '#64748b', minWidth: 100 }}>Type MIME:</span>
              <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>{lastUploaded.mimeType}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontWeight: 500, color: '#64748b', minWidth: 100 }}>Taille:</span>
              <span>{typeof lastUploaded.tailleFichier === 'number' ? `${(lastUploaded.tailleFichier / 1024).toFixed(1)} Ko` : '-'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontWeight: 500, color: '#64748b', minWidth: 100 }}>Version:</span>
              <span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>v{lastUploaded.numeroVersion}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 500, color: '#64748b', minWidth: 100 }}>Hash SHA256:</span>
              <code style={{ fontSize: 11, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, wordBreak: 'break-all', flex: 1 }}>
                {lastUploaded.hashSHA256}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
