import { useEffect, useMemo, useRef, useState } from 'react'
import { JugeApi } from '../api/jugeApi'
import { userApi } from '../api/userApi'
import type { JugeProfileDto, CreateJugeProfileDto } from '../types/juge'
import type { UserDto } from '../types/user'
import { useToast } from '../components/common/ToastProvider'
import { SkeletonTableRows } from '../components/common/LoadingSkeleton'
import { formatDateToISO } from '../utils/dateUtils'

export default function JugeProfilesPage() {
  const [items, setItems] = useState<JugeProfileDto[]>([])
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Record<string, string>>({})
  const [jugesList, setJugesList] = useState<UserDto[]>([])
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<JugeProfileDto | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const { notify } = useToast()
  const focusRef = useRef<HTMLDivElement | null>(null)
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [grade, setGrade] = useState('')
  const [specialisations, setSpecialisations] = useState('')
  const [biographie, setBiographie] = useState('')
  const [dateNomination, setDateNomination] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')

  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Manager'

  async function load() {
    setLoading(true)
    try {
      const [profiles, juges] = await Promise.all([
        JugeApi.getAll(),
        userApi.listJuges()
      ])
      setItems(profiles)
      setJugesList(juges)
      const map: Record<string, string> = {}
      juges.forEach((u: UserDto) => {
        map[u.id] = u.nomComplet || u.username
      })
      setUsers(map)
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur chargement profils' })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!selectedUserId) {
      notify({ type: 'error', message: 'Veuillez sélectionner un responsable' })
      return
    }
    if (!grade.trim()) {
      notify({ type: 'error', message: 'Le grade est requis' })
      return
    }

    setCreating(true)
    try {
      const dto: CreateJugeProfileDto = {
        userId: selectedUserId,
        grade: grade.trim(),
        specialisations: specialisations.trim() || undefined,
        biographie: biographie.trim() || undefined,
        dateNomination: dateNomination ? new Date(dateNomination).toISOString() : undefined,
        telephone: telephone.trim() || undefined,
        adresse: adresse.trim() || undefined
      }
      
      await JugeApi.create(dto)
      notify({ type: 'success', message: '✅ Profil créé avec succès' })
      resetForm()
      setShowCreateModal(false)
      load()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur création profil' })
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate() {
    if (!selectedProfile) return
    
    if (!grade.trim()) {
      notify({ type: 'error', message: 'Le grade est requis' })
      return
    }

    setUpdating(true)
    try {
      const dto: CreateJugeProfileDto = {
        userId: selectedProfile.userId,
        grade: grade.trim(),
        specialisations: specialisations.trim() || undefined,
        biographie: biographie.trim() || undefined,
        dateNomination: dateNomination ? new Date(dateNomination).toISOString() : undefined,
        telephone: telephone.trim() || undefined,
        adresse: adresse.trim() || undefined
      }
      
      await JugeApi.update(selectedProfile.id, dto)
      notify({ type: 'success', message: '✅ Profil mis à jour avec succès' })
      resetForm()
      setShowEditModal(false)
      setSelectedProfile(null)
      load()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur mise à jour profil' })
    } finally {
      setUpdating(false)
    }
  }

  function openEditModal(profile: JugeProfileDto) {
    setSelectedProfile(profile)
    setSelectedUserId(profile.userId)
    setGrade(profile.grade || '')
    setSpecialisations(profile.specialisations || '')
    setBiographie(profile.biographie || '')
    setDateNomination(profile.dateNomination ? formatDateToISO(new Date(profile.dateNomination)) : '')
    setTelephone(profile.telephone || '')
    setAdresse(profile.adresse || '')
    setShowEditModal(true)
  }

  function resetForm() {
    setSelectedUserId('')
    setGrade('')
    setSpecialisations('')
    setBiographie('')
    setDateNomination('')
    setTelephone('')
    setAdresse('')
  }

  useEffect(() => { load() }, [])
  useEffect(() => { focusRef.current?.focus() }, [loading])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const sorted = [...items].sort((a, b) => {
      const an = (users[a.userId] || '').toLowerCase()
      const bn = (users[b.userId] || '').toLowerCase()
      return an.localeCompare(bn)
    })
    if (!term) return sorted
    return sorted.filter(p => (users[p.userId] || '').toLowerCase().includes(term) || (p.specialisations || '').toLowerCase().includes(term))
  }, [items, search, users])

  // Juges sans profil
  const jugesSansProfile = useMemo(() => {
    const profileUserIds = new Set(items.map(p => p.userId))
    return jugesList.filter(j => !profileUserIds.has(j.id))
  }, [items, jugesList])

  return (
    <div className="panel" ref={focusRef} tabIndex={-1} aria-labelledby="juges-heading">
      <div className="panel-title" id="juges-heading">� Profils des Responsables</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="focus-outline"
          placeholder="🔍 Rechercher responsable ou spécialisation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Rechercher responsable"
          style={{ maxWidth: 340, flex: 1 }}
        />
        
        {/* Toggle vue */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '8px 16px',
              background: viewMode === 'table' ? '#3b82f6' : 'transparent',
              color: viewMode === 'table' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            📋 Tableau
          </button>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: '8px 16px',
              background: viewMode === 'cards' ? '#3b82f6' : 'transparent',
              color: viewMode === 'cards' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            🎴 Cartes
          </button>
        </div>
        
        <button
          className="btn"
          disabled={loading}
          onClick={() => load()}
          style={{ minWidth: 140 }}
          aria-label="Recharger la liste des membres"
        >🔄 Rafraîchir</button>
        {search && (
          <button className="btn btn-secondary" onClick={() => setSearch('')} aria-label="Effacer recherche">❌ Effacer</button>
        )}
        {isAdmin && jugesSansProfile.length > 0 && (
          <button 
            className="btn" 
            onClick={() => setShowCreateModal(true)}
            style={{ background: '#10b981', marginLeft: 'auto' }}
          >
            ➕ Créer un profil
          </button>
        )}
      </div>

      {/* Alerte si des membres n'ont pas de profil */}
      {!loading && jugesSansProfile.length > 0 && (
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          background: '#fef3c7', 
          borderRadius: 8, 
          border: '1px solid #fbbf24',
          fontSize: 14
        }}>
          <strong>⚠️ {jugesSansProfile.length} membre(s) sans profil :</strong>{' '}
          {jugesSansProfile.map(j => j.nomComplet || j.username).join(', ')}
          {isAdmin && (
            <button 
              className="btn" 
              onClick={() => setShowCreateModal(true)}
              style={{ marginLeft: 12, padding: '4px 12px', fontSize: 13 }}
            >
              ➕ Créer
            </button>
          )}
        </div>
      )}

      {/* Vue Cartes */}
      {viewMode === 'cards' && !loading && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: 20,
          marginBottom: 20
        }}>
          {filtered.length === 0 && items.length === 0 && (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: 40,
              background: '#f8fafc',
              borderRadius: 12
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ color: '#64748b', fontSize: 16, marginBottom: 8 }}>
                Aucun profil professionnel n'a encore été créé.
              </div>
              {isAdmin && jugesSansProfile.length > 0 && (
                <button 
                  className="btn" 
                  onClick={() => setShowCreateModal(true)}
                  style={{ background: '#10b981', marginTop: 12 }}
                >
                  ➕ Créer le premier profil
                </button>
              )}
            </div>
          )}
          
          {filtered.length === 0 && items.length > 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ margin: 0, color: '#64748b' }}>
                Aucun responsable ne correspond à la recherche "{search}".
              </p>
            </div>
          )}

          {filtered.map(p => (
            <div 
              key={p.id}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: 20,
                border: '2px solid #e2e8f0',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              {/* En-tête */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '2px solid #e2e8f0'
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  flexShrink: 0
                }}>
                  👨‍⚖️
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: 18, 
                    fontWeight: 700,
                    color: '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {users[p.userId] || p.userId}
                  </h3>
                  <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                    {p.grade}
                  </div>
                </div>
              </div>

              {/* Informations */}
              <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                {p.specialisations && (
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                      ⚖️ Spécialisations
                    </div>
                    <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.5 }}>
                      {p.specialisations}
                    </div>
                  </div>
                )}
                
                {p.telephone && (
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                      📞 Téléphone
                    </div>
                    <div style={{ fontSize: 14, color: '#1e293b' }}>
                      {p.telephone}
                    </div>
                  </div>
                )}

                {p.adresse && (
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                      🏠 Adresse
                    </div>
                    <div style={{ fontSize: 14, color: '#1e293b' }}>
                      {p.adresse}
                    </div>
                  </div>
                )}

                {p.dateNomination && (
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                      📅 Date de nomination
                    </div>
                    <div style={{ fontSize: 14, color: '#1e293b' }}>
                      {new Date(p.dateNomination).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {p.biographie && (
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                      📖 Biographie
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      color: '#1e293b', 
                      lineHeight: 1.6,
                      maxHeight: 100,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {p.biographie}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isAdmin && (
                <div style={{ paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <button
                    className="btn"
                    onClick={() => openEditModal(p)}
                    style={{ 
                      width: '100%',
                      background: '#3b82f6',
                      justifyContent: 'center'
                    }}
                  >
                    ✏️ Modifier le profil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vue Tableau */}
      {viewMode === 'table' && (
        <div className="table-wrapper" role="region" aria-live="polite" aria-busy={loading}>
          <table className="table" aria-describedby="juges-caption">
          <caption id="juges-caption" style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: '#64748b' }}>
            Liste des responsables avec tri alphabétique et recherche locale.
          </caption>
          <thead>
            <tr>
              <th style={{ minWidth: 180 }}>RESPONSABLE</th>
              <th style={{ minWidth: 140 }}>GRADE</th>
              <th style={{ minWidth: 200 }}>SPÉCIALISATIONS</th>
              <th style={{ minWidth: 130 }}>TÉLÉPHONE</th>
              <th style={{ minWidth: 140 }}>DATE NOMINATION</th>
              {isAdmin && <th style={{ width: 120, textAlign: 'center' }}>ACTIONS</th>}
            </tr>
          </thead>
          {loading && <SkeletonTableRows rows={5} cols={isAdmin ? 6 : 5} />}
          {!loading && (
            <tbody>
              {filtered.map(p => {
                const userName = users[p.userId] || 'Utilisateur inconnu'
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0
                        }}>
                          👤
                        </div>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{userName}</span>
                      </div>
                    </td>
                    <td style={{ color: '#475569' }}>{p.grade}</td>
                    <td style={{ color: '#64748b', fontSize: 14 }}>{p.specialisations || '-'}</td>
                    <td style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 13 }}>{p.telephone || '-'}</td>
                    <td style={{ color: '#64748b' }}>{p.dateNomination ? new Date(p.dateNomination).toLocaleDateString('fr-FR') : '-'}</td>
                    {isAdmin && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn"
                          onClick={() => openEditModal(p)}
                          style={{ 
                            padding: '6px 14px', 
                            fontSize: 13, 
                            background: '#3b82f6'
                          }}
                          title="Modifier le profil"
                        >
                          ✏️ Éditer
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {filtered.length === 0 && items.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <div style={{ color: '#64748b', fontSize: 16, marginBottom: 8 }}>
                      Aucun profil professionnel n'a encore été créé.
                    </div>
                    {isAdmin && jugesSansProfile.length > 0 && (
                      <button 
                        className="btn" 
                        onClick={() => setShowCreateModal(true)}
                        style={{ background: '#10b981', marginTop: 12 }}
                      >
                        ➕ Créer le premier profil
                      </button>
                    )}
                  </td>
                </tr>
              )}
              {filtered.length === 0 && items.length > 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                    🔍 Aucun responsable ne correspond à la recherche "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false)
              resetForm()
            }
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: 20, color: '#1e293b' }}>
              ➕ Créer un Profil Professionnel
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Sélection du responsable */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Responsable <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  className="focus-outline"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', fontSize: 15 }}
                >
                  <option value="">-- Sélectionner un responsable --</option>
                  {jugesSansProfile.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.nomComplet || j.username} ({j.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Grade / Fonction <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className="focus-outline"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="Ex: Juge Conseiller, Manager, Directeur..."
                  required
                  style={{ fontSize: 15 }}
                />
              </div>

              {/* Spécialisations */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Spécialisations / Domaines d'expertise
                </label>
                <input
                  className="focus-outline"
                  value={specialisations}
                  onChange={e => setSpecialisations(e.target.value)}
                  placeholder="Ex: Droit constitutionnel, Gestion de projets, Finance..."
                  style={{ fontSize: 15 }}
                />
              </div>

              {/* Date de nomination */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Date de nomination
                </label>
                <input
                  type="date"
                  className="focus-outline"
                  value={dateNomination}
                  onChange={e => setDateNomination(e.target.value)}
                  style={{ fontSize: 15 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Téléphone */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    className="focus-outline"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    placeholder="+243 XXX XXX XXX"
                    style={{ fontSize: 15 }}
                  />
                </div>

                {/* Adresse */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Adresse
                  </label>
                  <input
                    className="focus-outline"
                    value={adresse}
                    onChange={e => setAdresse(e.target.value)}
                    placeholder="Kinshasa, Gombe"
                    style={{ fontSize: 15 }}
                  />
                </div>
              </div>

              {/* Biographie */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Biographie
                </label>
                <textarea
                  className="focus-outline"
                  value={biographie}
                  onChange={e => setBiographie(e.target.value)}
                  placeholder="Parcours professionnel et académique..."
                  rows={4}
                  style={{ resize: 'vertical', fontSize: 15 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                disabled={creating}
              >
                ❌ Annuler
              </button>
              <button
                className="btn"
                onClick={handleCreate}
                disabled={creating}
                style={{ background: '#10b981' }}
              >
                {creating ? '⏳ Création...' : '💾 Créer le profil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedProfile && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false)
              setSelectedProfile(null)
              resetForm()
            }
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: 20, color: '#1e293b' }}>
              ✏️ Modifier le Profil de {users[selectedProfile.userId] || 'Utilisateur inconnu'}
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Responsable (non modifiable) */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#64748b' }}>
                  Responsable
                </label>
                <div style={{ 
                  padding: '10px 12px', 
                  background: '#f8fafc', 
                  borderRadius: 6, 
                  border: '2px solid #e2e8f0',
                  fontSize: 15,
                  fontWeight: 500
                }}>
                  {users[selectedProfile.userId] || 'Utilisateur inconnu'}
                </div>
              </div>

              {/* Grade */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Grade / Fonction <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className="focus-outline"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="Ex: Juge Conseiller, Manager, Directeur..."
                  required
                  style={{ fontSize: 15 }}
                />
              </div>

              {/* Spécialisations */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Spécialisations / Domaines d'expertise
                </label>
                <input
                  className="focus-outline"
                  value={specialisations}
                  onChange={e => setSpecialisations(e.target.value)}
                  placeholder="Ex: Droit constitutionnel, Gestion de projets, Finance..."
                  style={{ fontSize: 15 }}
                />
              </div>

              {/* Date de nomination */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Date de nomination
                </label>
                <input
                  type="date"
                  className="focus-outline"
                  value={dateNomination}
                  onChange={e => setDateNomination(e.target.value)}
                  style={{ fontSize: 15 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Téléphone */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    className="focus-outline"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    placeholder="+243 XXX XXX XXX"
                    style={{ fontSize: 15 }}
                  />
                </div>

                {/* Adresse */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Adresse
                  </label>
                  <input
                    className="focus-outline"
                    value={adresse}
                    onChange={e => setAdresse(e.target.value)}
                    placeholder="Kinshasa, Gombe"
                    style={{ fontSize: 15 }}
                  />
                </div>
              </div>

              {/* Biographie */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                  Biographie
                </label>
                <textarea
                  className="focus-outline"
                  value={biographie}
                  onChange={e => setBiographie(e.target.value)}
                  placeholder="Parcours professionnel et académique..."
                  rows={6}
                  style={{ resize: 'vertical', fontSize: 15 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedProfile(null)
                  resetForm()
                }}
                disabled={updating}
              >
                ❌ Annuler
              </button>
              <button
                className="btn"
                onClick={handleUpdate}
                disabled={updating}
                style={{ background: '#3b82f6' }}
              >
                {updating ? '⏳ Mise à jour...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
