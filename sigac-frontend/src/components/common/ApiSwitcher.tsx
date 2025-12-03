import { useMemo, useState } from 'react'
import Modal from './Modal'
import api, { getApiBaseUrl, setApiBaseUrl } from '../../api/api-client'
import { useToast } from './ToastProvider'

interface ApiSwitcherProps {
  isOpen: boolean
  onClose: () => void
  onChanged?: (url: string) => void
}

export default function ApiSwitcher({ isOpen, onClose, onChanged }: ApiSwitcherProps) {
  const [url, setUrl] = useState<string>(getApiBaseUrl())
  const [loading, setLoading] = useState(false)
  const { notify } = useToast()

  const presets = useMemo(() => [
    'http://localhost:5210/api',
    'http://localhost:5000/api',
    'https://localhost:5211/api'
  ], [])

  async function testAndApply() {
    const candidate = url.trim()
    if (!candidate) return
    setLoading(true)
    try {
      // Temporarily test health against the candidate URL
      const original = getApiBaseUrl()
      setApiBaseUrl(candidate)
      try {
        const resp = await api.get('/Health', { timeout: 5000 })
        if (resp.status >= 200 && resp.status < 300) {
          notify({ type: 'success', message: `✅ API définie sur ${candidate}` })
          onChanged?.(candidate)
          onClose()
          return
        }
        throw new Error(`Statut inattendu ${resp.status}`)
      } catch (e: any) {
        // rollback
        setApiBaseUrl(original)
        notify({ type: 'error', message: `❌ Test échoué: ${e?.message || 'Erreur'}` })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Changer l'URL de l'API" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">URL actuelle</label>
          <div style={{ marginTop: 6, fontSize: 13, color: '#334155' }}>{getApiBaseUrl()}</div>
        </div>

        <div>
          <label htmlFor="api-url" className="block text-sm font-medium text-gray-700">Nouvelle URL</label>
          <input
            id="api-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:5210/api"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="block text-sm font-medium text-gray-700">Préréglages rapides</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {presets.map((p) => (
              <button key={p} type="button" className="btn" onClick={() => setUrl(p)}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" type="button" onClick={onClose}>Annuler</button>
          <button className="btn" type="button" onClick={testAndApply} disabled={loading}>
            {loading ? 'Test...' : 'Tester et appliquer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
