import { useEffect, useState } from 'react'
import './DocumentViewer.css'

interface Props {
  documentId: string
  fileName: string
  mimeType: string
  onClose: () => void
  fetchDocument: (id: string) => Promise<Blob>
}

export default function DocumentViewer({ documentId, fileName, mimeType, onClose, fetchDocument }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const blob = await fetchDocument(documentId)
        if (cancelled) return
        
        // Créer un Object URL pour le blob (meilleure performance que data URL)
        const url = URL.createObjectURL(blob)
        if (!cancelled) {
          setDataUrl(url)
          setLoading(false)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Impossible de charger le document')
          setLoading(false)
        }
      }
    }
    
    load()
    return () => { 
      cancelled = true
      // Nettoyer l'URL quand le composant se démonte
      if (dataUrl) URL.revokeObjectURL(dataUrl)
    }
  }, [documentId, fetchDocument])

  const isImage = mimeType?.startsWith('image/')

  // Ouvrir dans un nouvel onglet (contourne les restrictions CSP)
  function openInNewTab() {
    if (dataUrl) {
      window.open(dataUrl, '_blank')
    }
  }

  // Télécharger le fichier
  function downloadFile() {
    if (dataUrl) {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = fileName
      a.click()
    }
  }

  return (
    <div className="doc-viewer-overlay" onClick={onClose}>
      <div className="doc-viewer-modal" onClick={e => e.stopPropagation()}>
        <div className="doc-viewer-header">
          <span className="doc-viewer-title" title={fileName}>
            📄 {fileName}
          </span>
          <div className="doc-viewer-actions">
            {dataUrl && (
              <>
                <button className="doc-viewer-btn" onClick={openInNewTab} title="Ouvrir">
                  🔗
                </button>
                <button className="doc-viewer-btn" onClick={downloadFile} title="Télécharger">
                  ⬇️
                </button>
              </>
            )}
            <button className="doc-viewer-close" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="doc-viewer-content">
          {loading && (
            <div className="doc-viewer-loading">
              <div className="doc-viewer-spinner" />
              <span>Chargement...</span>
            </div>
          )}
          
          {error && (
            <div className="doc-viewer-error">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}
          
          {!loading && !error && dataUrl && (
            <>
              {isImage ? (
                <img src={dataUrl} alt={fileName} className="doc-viewer-image" />
              ) : (
                <div className="doc-viewer-unsupported">
                  <span>📄</span>
                  <p style={{ fontWeight: 600, fontSize: 18, margin: '12px 0' }}>{fileName}</p>
                  <p style={{ color: '#6b7280', marginBottom: 20 }}>
                    Cliquez pour ouvrir ou télécharger
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={openInNewTab} className="doc-viewer-download">
                      🔗 Ouvrir
                    </button>
                    <button onClick={downloadFile} className="doc-viewer-download" style={{ background: '#10b981' }}>
                      ⬇️ Télécharger
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
