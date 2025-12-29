import { useEffect, useState } from 'react'
import { NotificationApi } from '../../api/notificationApi'
import type { NotificationDto } from '../../types/notification'

export default function NotificationsBell({ onOpenLink }: { onOpenLink?: (href: string) => void }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationDto[]>([])
  const [unread, setUnread] = useState(0)

  async function load() {
    try {
      const data = await NotificationApi.mine(20)
      setItems(data)
      setUnread(data.filter(n => !n.estLue).length)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load()
    // Refresh notifications toutes les 1 heure
    const id = setInterval(load, 3600000)
    return () => clearInterval(id)
  }, [])

  async function markRead(id: string) {
    await NotificationApi.markRead(id)
    await load()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn" onClick={() => setOpen(v => !v)} style={{ position: 'relative', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: 999, fontSize: 10, padding: '2px 6px' }}>{unread}</span>
        )}
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 40, width: 380, zIndex: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Notifications</div>
          {items.length === 0 && <div style={{ color: '#64748b' }}>Aucune notification</div>}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 360, overflow: 'auto' }}>
            {items.map(n => (
              <li key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{n.titre}</div>
                    <div style={{ fontSize: 13, color: '#475569' }}>{n.message}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(n.creeLe).toLocaleString('fr-FR')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {n.lien && (
                      <button className="btn" style={{ fontSize: 12 }} onClick={() => { onOpenLink?.(n.lien!); setOpen(false); }}>
                        Ouvrir
                      </button>
                    )}
                    {!n.estLue && (
                      <button className="btn" style={{ fontSize: 12 }} onClick={() => markRead(n.id)}>Marquer lu</button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
