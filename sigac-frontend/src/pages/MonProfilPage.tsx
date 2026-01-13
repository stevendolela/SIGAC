import { useEffect, useState } from 'react'
import { JugeApi } from '../api/jugeApi'
import { dossierApi } from '../api/dossierApi'
import { userApi } from '../api/userApi'
import type { JugeProfileDto } from '../types/juge'
import type { DossierListDto } from '../types/dossier'
import type { UserDto } from '../types/user'
import { useToast } from '../components/common/ToastProvider'

export default function MonProfilPage() {
  const [profile, setProfile] = useState<JugeProfileDto | null>(null)
  const [dossiers, setDossiers] = useState<DossierListDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDossiers, setLoadingDossiers] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'parametres' | 'dossiers'>('profile')
  
  // Champs éditables - Profil Professionnel
  const [grade, setGrade] = useState('')
  const [specialisations, setSpecialisations] = useState('')
  const [biographie, setBiographie] = useState('')
  const [dateNomination, setDateNomination] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  
  // Champs éditables - Paramètres Généraux
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)
  const [editingParams, setEditingParams] = useState(false)
  const [savingParams, setSavingParams] = useState(false)
  const [nomComplet, setNomComplet] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  const { notify } = useToast()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  async function loadProfile() {
    setLoading(true)
    try {
      const data = await JugeApi.getMine()
      setProfile(data)
      if (data) {
        setGrade(data.grade || '')
        setSpecialisations(data.specialisations || '')
        setBiographie(data.biographie || '')
        setDateNomination(data.dateNomination ? data.dateNomination.split('T')[0] : '')
        setTelephone(data.telephone || '')
        setAdresse(data.adresse || '')
      }
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur chargement profil' })
    } finally {
      setLoading(false)
    }
  }

  async function loadMesDossiers() {
    if (!user?.id) return
    setLoadingDossiers(true)
    try {
      // Récupérer les dossiers dont je suis le rapporteur
      const result = await dossierApi.list({ 
        page: 1, 
        pageSize: 100,
        rapporteurId: user.id 
      })
      setDossiers(result.data)
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur chargement dossiers' })
    } finally {
      setLoadingDossiers(false)
    }
  }

  async function loadCurrentUser() {
    if (!user?.id) return
    try {
      const userData = await userApi.get(user.id)
      setCurrentUser(userData)
      setNomComplet(userData.nomComplet || '')
      setEmail(userData.email || '')
      setPhoneNumber(userData.phoneNumber || '')
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur chargement paramètres' })
    }
  }

  async function handleSaveParams() {
    setSavingParams(true)
    try {
      const updated = await userApi.updateProfile({
        nomComplet: nomComplet.trim() || undefined,
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined
      })
      setCurrentUser(updated)
      // Mettre à jour localStorage
      localStorage.setItem('user', JSON.stringify(updated))
      setEditingParams(false)
      notify({ type: 'success', message: '✅ Paramètres mis à jour avec succès' })
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur mise à jour paramètres' })
    } finally {
      setSavingParams(false)
    }
  }

  function handleCancelParams() {
    if (currentUser) {
      setNomComplet(currentUser.nomComplet || '')
      setEmail(currentUser.email || '')
      setPhoneNumber(currentUser.phoneNumber || '')
    }
    setEditingParams(false)
  }

  useEffect(() => { 
    loadProfile()
    loadMesDossiers()
    loadCurrentUser()
  }, [])

  async function handleSave() {
    if (!profile) {
      notify({ type: 'error', message: 'Profil non chargé' })
      return
    }

    if (!grade.trim()) {
      notify({ type: 'error', message: 'Le grade est requis' })
      return
    }

    setSaving(true)
    try {
      const dto = {
        userId: profile.userId,
        grade: grade.trim(),
        specialisations: specialisations.trim() || undefined,
        biographie: biographie.trim() || undefined,
        dateNomination: dateNomination || undefined,
        telephone: telephone.trim() || undefined,
        adresse: adresse.trim() || undefined
      }
      
      const updated = await JugeApi.updateMine(dto)
      setProfile(updated)
      setEditing(false)
      notify({ type: 'success', message: '✅ Profil mis à jour avec succès' })
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur mise à jour profil' })
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (profile) {
      setGrade(profile.grade || '')
      setSpecialisations(profile.specialisations || '')
      setBiographie(profile.biographie || '')
      setDateNomination(profile.dateNomination ? profile.dateNomination.split('T')[0] : '')
      setTelephone(profile.telephone || '')
      setAdresse(profile.adresse || '')
    }
    setEditing(false)
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'Nouveau': return '#3b82f6'
      case 'EnInstruction': return '#f59e0b'
      case 'EnDelibere': return '#8b5cf6'
      case 'Juge': return '#10b981'
      case 'Classe': return '#6b7280'
      default: return '#64748b'
    }
  }

  function getPriorityIcon(priorite: string) {
    switch (priorite) {
      case 'Critique': return '🔴'
      case 'Haute': return '🟡'
      case 'Normale': return '🟢'
      default: return '⚪'
    }
  }

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-title">👤 Mon Profil</div>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: 12, color: '#64748b' }}>Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-title">👤 Mon Profil Professionnel</div>
      
      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'profile' ? '#3b82f6' : 'transparent',
            color: activeTab === 'profile' ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          📝 Informations Professionnelles
        </button>
        <button
          onClick={() => setActiveTab('parametres')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'parametres' ? '#3b82f6' : 'transparent',
            color: activeTab === 'parametres' ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          ⚙️ Paramètres Généraux
        </button>
        <button
          onClick={() => setActiveTab('dossiers')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'dossiers' ? '#3b82f6' : 'transparent',
            color: activeTab === 'dossiers' ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          📁 Mes Dossiers ({dossiers.length})
        </button>
      </div>

      {/* Tab: Profil */}
      {activeTab === 'profile' && (
        <>
          {/* Informations utilisateur */}
          <div style={{ marginBottom: 24, padding: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 36
              }}>
                👨‍⚖️
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                  {user?.nomComplet || user?.username}
                </h2>
                <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 14, opacity: 0.95 }}>
                  <div>📧 {user?.email || '-'}</div>
                  <div>🎯 {user?.role || '-'}</div>
                  <div>{user?.isActive ? '✅ Actif' : '❌ Inactif'}</div>
                </div>
              </div>
            </div>
          </div>

          {!profile && !loading && (
            <div style={{ padding: 20, textAlign: 'center', background: '#fef3c7', borderRadius: 8, border: '1px solid #fbbf24' }}>
              <p style={{ margin: 0, color: '#92400e', fontSize: 16 }}>
                ⚠️ Aucun profil professionnel n'a été créé pour votre compte. 
                <br />
                <strong>Veuillez contacter un administrateur.</strong>
              </p>
            </div>
          )}

          {profile && (
            <>
              <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                {!editing && (
                  <button 
                    className="btn"
                    onClick={() => setEditing(true)}
                    style={{ background: '#3b82f6' }}
                  >
                    ✏️ Modifier mon profil
                  </button>
                )}
                {editing && (
                  <>
                    <button 
                      className="btn"
                      onClick={handleSave}
                      disabled={saving}
                      style={{ background: '#10b981' }}
                    >
                      {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      ❌ Annuler
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: 'grid', gap: 20 }}>
                {/* Grade */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                    🎓 Grade <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  {editing ? (
                    <input
                      className="focus-outline"
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      placeholder="Ex: Responsable Senior"
                      required
                      style={{ fontSize: 15 }}
                    />
                  ) : (
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 15, fontWeight: 500 }}>
                      {profile.grade || '-'}
                    </div>
                  )}
                </div>

                {/* Spécialisations */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                    ⚖️ Spécialisations
                  </label>
                  {editing ? (
                    <input
                      className="focus-outline"
                      value={specialisations}
                      onChange={e => setSpecialisations(e.target.value)}
                      placeholder="Ex: Droit constitutionnel, Droits de l'homme, Contentieux électoral"
                      style={{ fontSize: 15 }}
                    />
                  ) : (
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 15 }}>
                      {profile.specialisations || '-'}
                    </div>
                  )}
                </div>

                {/* Date de nomination */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                    📅 Date de nomination
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      className="focus-outline"
                      value={dateNomination}
                      onChange={e => setDateNomination(e.target.value)}
                      style={{ fontSize: 15 }}
                    />
                  ) : (
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 15 }}>
                      {profile.dateNomination ? new Date(profile.dateNomination).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : '-'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Téléphone */}
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                      📞 Téléphone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        className="focus-outline"
                        value={telephone}
                        onChange={e => setTelephone(e.target.value)}
                        placeholder="+243 XXX XXX XXX"
                        style={{ fontSize: 15 }}
                      />
                    ) : (
                      <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 15 }}>
                        {profile.telephone || '-'}
                      </div>
                    )}
                  </div>

                  {/* Adresse */}
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                      🏠 Adresse
                    </label>
                    {editing ? (
                      <input
                        className="focus-outline"
                        value={adresse}
                        onChange={e => setAdresse(e.target.value)}
                        placeholder="Kinshasa, Gombe"
                        style={{ fontSize: 15 }}
                      />
                    ) : (
                      <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 15 }}>
                        {profile.adresse || '-'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Biographie */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                    📖 Biographie professionnelle
                  </label>
                  {editing ? (
                    <textarea
                      className="focus-outline"
                      value={biographie}
                      onChange={e => setBiographie(e.target.value)}
                      placeholder="Décrivez votre parcours professionnel, académique et vos expériences significatives..."
                      rows={6}
                      style={{ resize: 'vertical', fontSize: 15 }}
                    />
                  ) : (
                    <div style={{ 
                      padding: '12px 16px', 
                      background: '#f8fafc', 
                      borderRadius: 8, 
                      border: '2px solid #e2e8f0',
                      minHeight: 120,
                      whiteSpace: 'pre-wrap',
                      fontSize: 15,
                      lineHeight: 1.6
                    }}>
                      {profile.biographie || '-'}
                    </div>
                  )}
                </div>
              </div>

              {/* Informations du profil */}
              <div style={{ marginTop: 24, padding: 14, background: '#f1f5f9', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
                <div style={{ marginBottom: 4 }}><strong>ID du profil:</strong> <code>{profile.id}</code></div>
                <div><strong>Dernière modification:</strong> Consultez les logs d'audit pour plus de détails</div>
              </div>
            </>
          )}
        </>
      )}

      {/* Tab: Paramètres Généraux */}
      {activeTab === 'parametres' && (
        <div style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>⚙️ Paramètres Généraux</h2>

          {!editingParams && (
            <button 
              className="btn"
              onClick={() => setEditingParams(true)}
              style={{ background: '#3b82f6', marginBottom: 24 }}
            >
              ✏️ Modifier mes informations
            </button>
          )}

          {editingParams ? (
            <>
              {/* Formulaire édition */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1e293b' }}>
                  📝 Nom Complet
                </label>
                <input
                  type="text"
                  value={nomComplet}
                  onChange={(e) => setNomComplet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nom complet"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1e293b' }}>
                  📧 Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Email"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1e293b' }}>
                  📱 Numéro de Téléphone
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Téléphone"
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  className="btn"
                  onClick={handleSaveParams}
                  disabled={savingParams}
                  style={{ background: '#10b981' }}
                >
                  {savingParams ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                </button>
                <button 
                  className="btn"
                  onClick={handleCancelParams}
                  style={{ background: '#64748b' }}
                >
                  ❌ Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Affichage */}
              <div style={{ 
                padding: 16, 
                background: '#f8fafc', 
                borderRadius: 8, 
                border: '1px solid #e2e8f0',
                marginBottom: 16
              }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>NOM COMPLET</span>
                  <p style={{ margin: '8px 0 0 0', fontSize: 16, color: '#1e293b', fontWeight: 500 }}>
                    {nomComplet || '-'}
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>EMAIL</span>
                  <p style={{ margin: '8px 0 0 0', fontSize: 16, color: '#1e293b', fontWeight: 500 }}>
                    {email || '-'}
                  </p>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>TÉLÉPHONE</span>
                  <p style={{ margin: '8px 0 0 0', fontSize: 16, color: '#1e293b', fontWeight: 500 }}>
                    {phoneNumber || '-'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Mes Dossiers */}
      {activeTab === 'dossiers' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#1e293b' }}>
              📁 Dossiers dont je suis rapporteur
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
              Voici la liste complète des dossiers qui vous ont été assignés.
            </p>
          </div>

          {loadingDossiers && (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div className="spinner" />
              <p style={{ marginTop: 12, color: '#64748b' }}>Chargement de vos dossiers...</p>
            </div>
          )}

          {!loadingDossiers && dossiers.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <p style={{ margin: 0, color: '#64748b', fontSize: 16 }}>
                Aucun dossier ne vous est actuellement assigné.
              </p>
            </div>
          )}

          {!loadingDossiers && dossiers.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Dossier</th>
                    <th>Titre</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Priorité</th>
                    <th>Date Dépôt</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{d.numeroDossier}</td>
                      <td>{d.titre}</td>
                      <td>{d.typeAffaire}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: getStatusBadgeColor(d.status || 'Nouveau'),
                          color: 'white'
                        }}>
                          {d.status || 'Nouveau'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 14 }}>
                          {getPriorityIcon(d.priorite || 'Normale')} {d.priorite || 'Normale'}
                        </span>
                      </td>
                      <td>{d.dateDepot ? new Date(d.dateDepot).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 16, padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #3b82f6' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#1e40af' }}>
              💡 <strong>Astuce:</strong> Pour consulter les détails d'un dossier, rendez-vous dans l'onglet "📁 Dossiers" du menu principal.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
