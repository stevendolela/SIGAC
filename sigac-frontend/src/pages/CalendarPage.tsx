import { useEffect, useMemo, useState } from 'react'
import { CalendarApi } from '../api/calendarApi'
import type { CalendarEventDto, CreateCalendarEventDto } from '../types/calendar'
import { useToast } from '../components/common/ToastProvider'
import { formatDateToISO } from '../utils/dateUtils'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventDto[]>([])
  const [loading, setLoading] = useState(false)
  // Utiliser la date locale sans décalage timezone
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 7)
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 30)
  const [rangeStart, setRangeStart] = useState(startDate.toISOString())
  const [rangeEnd, setRangeEnd] = useState(endDate.toISOString())
  const [form, setForm] = useState<CreateCalendarEventDto>({ type: 'General', titre: '', debut: today.toISOString(), fin: today.toISOString(), touteLaJournee: false })
  const { notify } = useToast()

  const userStr = localStorage.getItem('user')
  const user = useMemo(() => userStr ? JSON.parse(userStr) : null, [userStr])
  const canEdit = ['Admin', 'Manager', 'Assistant'].includes(user?.role)

  async function load() {
    setLoading(true)
    try {
      const data = await CalendarApi.get(rangeStart, rangeEnd)
      setEvents(data)
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur chargement calendrier' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [rangeStart, rangeEnd])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const created = await CalendarApi.create(form)
      notify({ type: 'success', message: 'Événement créé' })
      setEvents([created, ...events])
      const todayISO = new Date().toISOString()
      setForm({ type: 'General', titre: '', debut: todayISO, fin: todayISO, touteLaJournee: false })
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur création' })
    }
  }

  return (
    <div className="panel">
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>🗓️ Calendrier</span>
        {!canEdit && <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Lecture seule</span>}
      </div>

      <div className="card" style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>Du <input type="datetime-local" value={rangeStart.substring(0,16)} onChange={e => setRangeStart(new Date(e.target.value).toISOString())} /></label>
        <label>Au <input type="datetime-local" value={rangeEnd.substring(0,16)} onChange={e => setRangeEnd(new Date(e.target.value).toISOString())} /></label>
        <button className="btn" onClick={load}>🔄 Actualiser</button>
      </div>

      {canEdit && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
            <input placeholder="Titre" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="General">Général</option>
              <option value="Audience">Audience</option>
              <option value="Formation">Formation</option>
            </select>
            <label>Début <input type="datetime-local" value={form.debut.substring(0,16)} onChange={e => setForm({ ...form, debut: new Date(e.target.value).toISOString() })} /></label>
            <label>Fin <input type="datetime-local" value={form.fin.substring(0,16)} onChange={e => setForm({ ...form, fin: new Date(e.target.value).toISOString() })} /></label>
            <label><input type="checkbox" checked={form.touteLaJournee} onChange={e => setForm({ ...form, touteLaJournee: e.target.checked })} /> Toute la journée</label>
          </div>
          <button className="btn" style={{ marginTop: 8 }}>➕ Ajouter</button>
        </form>
      )}

      {loading && <div>Chargement…</div>}
      {!loading && (
        <div className="card">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {events.map(ev => (
              <li key={ev.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ev.titre} <span className="badge" style={{ marginLeft: 8 }}>{ev.type}</span></div>
                    <div style={{ fontSize: 13, color: '#475569' }}>{new Date(ev.debut).toLocaleString('fr-FR')} → {new Date(ev.fin).toLocaleString('fr-FR')}</div>
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
