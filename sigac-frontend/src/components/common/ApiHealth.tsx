import React, { useEffect, useMemo, useState } from 'react'
import api, { getApiBaseUrl } from '../../api/api-client'

type Status = 'ok' | 'down' | 'checking'

export default function ApiHealth({ intervalMs = 30000 }: { intervalMs?: number }) {
  const [status, setStatus] = useState<Status>('checking')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const baseUrl = useMemo(() => getApiBaseUrl(), [])

  async function check() {
    try {
      setStatus('checking')
      const start = performance.now()
      // Our axios instance has baseURL including /api, so 
      // calling '/Health' hits `${baseURL}/Health`
      const res = await api.get('/Health', { validateStatus: () => true })
      const end = performance.now()
      setLatencyMs(Math.round(end - start))
      if (res.status >= 200 && res.status < 400) {
        setStatus('ok')
      } else {
        setStatus('down')
      }
    } catch {
      setStatus('down')
      setLatencyMs(null)
    }
  }

  useEffect(() => {
    check()
    const id = setInterval(check, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  const color = status === 'ok' ? '#22c55e' : status === 'checking' ? '#f59e0b' : '#ef4444'
  const label = status === 'ok' ? 'OK' : status === 'checking' ? 'Test…' : 'Hors ligne'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        title={`API ${label}${latencyMs != null ? ` • ~${latencyMs}ms` : ''}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
      >
        <span
          aria-label={`API ${label}`}
          style={{ width: 10, height: 10, borderRadius: 9999, background: color, display: 'inline-block' }}
        />
        <span style={{ color: '#475569' }}>{label}</span>
      </span>
      <button
        onClick={check}
        className="btn"
        style={{ padding: '2px 8px', fontSize: 11, lineHeight: 1.2, border: '1px solid #e2e8f0', background: 'white', color: '#334155' }}
        title={`Tester ${baseUrl}`}
      >
        ↻
      </button>
    </div>
  )
}
