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
        
        const reader = new FileReader()
        reader.onloadend = () => {
          if (!cancelled) {
            setDataUrl(reader.result as string)
            setLoading(false)
          }
        }
        reader.onerror = () => {
          if (!cancelled) {
            setError('Erreur de lecture du fichier')
            setLoading(false)
          }
        }
        reader.readAsDataURL(blob)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Impossible de charger le document')
          setLoading(false)
        }
      }
    }
    
    load()
    return () => { cancelled = true }
  }, [documentId, fetchDocument])

  const isImage = mimeType?.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'

  return (
    <div className="doc-viewer-overlay" onClick={onClose}>
      <div className="doc-viewer-modal" onClick={e => e.stopPropagation()}>
        <div className="doc-viewer-header">
          <span className="doc-viewer-title" title={fileName}>
            {fileName}
          </span>
          <button className="doc-viewer-close" onClick={onClose}>×</button>
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
              {isImage && (
                <img src={dataUrl} alt={fileName} className="doc-viewer-image" />
              )}
              {isPdf && (
                <iframe src={dataUrl} title={fileName} className="doc-viewer-iframe" />
              )}
              {!isImage && !isPdf && (
                <div className="doc-viewer-unsupported">
                  <span>📄</span>
                  <p>Aperçu non disponible</p>
                  <a href={dataUrl} download={fileName} className="doc-viewer-download">
                    Télécharger
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
