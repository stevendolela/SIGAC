import React, { useEffect, useRef, useState } from 'react'
import Logo from './components/common/Logo'
import LoginPage from './pages/LoginPage'
import AuthHeader from './components/AuthHeader'
import DossierList from './components/dossiers/DossierList'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import DossierDetailPage from './pages/DossierDetailPage'
import AudiencesPage from './pages/AudiencesPage'
import SallesPage from './pages/SallesPage'
import RechercheAvanceePage from './pages/RechercheAvanceePage'
import CreateDossierPage from './pages/CreateDossierPage'
import { getApiBaseUrl, setApiBaseUrl } from './api/api-client'
import ApiSwitcher from './components/common/ApiSwitcher'
import ApiHealth from './components/common/ApiHealth'
import NotificationsBell from './components/common/NotificationsBell'
import JugeProfilesPage from './pages/JugeProfilesPage'
import MonProfilPage from './pages/MonProfilPage'
import FormationsPage from './pages/FormationsPage'
import CalendarPage from './pages/CalendarPage'
import AdminUserEditPage from './pages/AdminUserEditPage'
import AccountPage from './pages/AccountPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AccountModal from './components/common/AccountModal'
import SystemConfigPage from './pages/SystemConfigPage'
import { Routes, Route } from 'react-router-dom'
import { TypesAffairesPage } from './pages/TypesAffairesPage'

export default function App() {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const [view, setView] = useState<'dashboard' | 'dossiers' | 'users' | 'audiences' | 'recherche' | 'create-dossier' | 'salles' | 'profils' | 'formations' | 'calendrier' | 'system-config' | 'types-affaires' | 'mon-profil'>('dashboard')
  const [selectedDossierId, setSelectedDossierId] = useState<string | undefined>(undefined)
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl())
  const [showApiSwitcher, setShowApiSwitcher] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(localStorage.getItem('userAvatar'))

  // Écouter les changements d'avatar
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === 'userAvatar') {
        setAvatarUrl(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Fermer le menu utilisateur en cliquant en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!showUserMenu) return
      const target = e.target as Node
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.reload()
  }

  function handleViewDossierFromAudience(dossierId: string) {
    setSelectedDossierId(dossierId)
    setView('dossiers')
  }
  function handleManageSalles() {
    setView('salles')
  }

  return (
    <div className="app">
      {token && (
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={48} style={{ cursor: 'pointer' }} onClick={() => setView('dashboard')} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>TAJI</div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }}>
                Système de gestion des affaires judiciaires
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user && (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                {/* Bouton utilisateur (avatar + nom court) */}
                <button
                  className="btn"
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px 12px',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'rgba(255,255,255,0.3)',
                    color: '#0f172a',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    border: avatarUrl ? '2px solid rgba(255,255,255,0.5)' : 'none'
                  }}>
                    {!avatarUrl && `${((user.nomComplet || user.username)?.[0] || '').toUpperCase()}${((user.nomComplet || user.username)?.[1] || '').toUpperCase()}`}
                  </span>
                  <span style={{ fontWeight: 600 }}>{user.nomComplet || user.username}</span>
                </button>
                {/* Menu utilisateur */}
                {showUserMenu && (
                  <div className="user-menu-overlay" onClick={() => setShowUserMenu(false)}>
                    <div className="user-menu-panel" style={{ position: 'absolute', right: 0, top: 42 }} onClick={(e) => e.stopPropagation()}>
                      <button className="user-menu-close" onClick={() => setShowUserMenu(false)} aria-label="Fermer">✕</button>
                      <div className="user-menu-top-email">{user.email || user.username}</div>
                      <div className="user-menu-avatar-ring">
                        <div className="user-menu-avatar" style={{
                          background: avatarUrl ? `url(${avatarUrl}) center/cover` : '#1f2937'
                        }}>
                          {!avatarUrl && `${((user.nomComplet || user.username)?.[0] || '').toUpperCase()}${((user.nomComplet || user.username)?.[1] || '').toUpperCase()}`}
                        </div>
                      </div>
                      <div className="user-menu-greeting">{`Bonjour ${user.nomComplet || user.username}!`}</div>
                      <button
                        className="user-menu-primary"
                        onClick={() => { setShowUserMenu(false); setShowAccountModal(true); }}
                      >
                        ⚙️ Gérer votre compte
                      </button>
                      <button 
                        className="user-menu-disconnect"
                        onClick={() => { setShowUserMenu(false); handleLogout(); }}
                      >
                        🚪 Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <NotificationsBell onOpenLink={(href) => {
              const m = href.match(/^\/dossiers\/(.+)$/)
              if (m) {
                setView('dossiers')
                setSelectedDossierId(m[1])
              } else {
                window.open(href, '_blank')
              }
            }} />
            <button
              className="btn"
              onClick={() => setShowApiSwitcher(true)}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              🔌 API
            </button>
          </div>
        </header>
      )}
      
      {!token && <LoginPage />}
      {token && (
        <>
          <div className="tabs">
            <button className={`tab ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
              📊 Dashboard
            </button>
            <button className={`tab ${view === 'dossiers' ? 'active' : ''}`} onClick={() => setView('dossiers')}>
              📁 Dossiers
            </button>
            <button className={`tab ${view === 'create-dossier' ? 'active' : ''}`} onClick={() => setView('create-dossier')}>
              ➕ Nouveau Dossier
            </button>
            <button className={`tab ${view === 'recherche' ? 'active' : ''}`} onClick={() => setView('recherche')}>
              🔍 Recherche
            </button>
            <button className={`tab ${view === 'audiences' ? 'active' : ''}`} onClick={() => setView('audiences')}>
              📅 Audiences
            </button>
            <button className={`tab ${view === 'calendrier' ? 'active' : ''}`} onClick={() => setView('calendrier')}>
              🗓️ Calendrier
            </button>
            {user?.role === 'JugeConstitutionnel' && (
              <button className={`tab ${view === 'mon-profil' ? 'active' : ''}`} onClick={() => setView('mon-profil')}>
                👤 Mon Profil
              </button>
            )}
            <button className={`tab ${view === 'profils' ? 'active' : ''}`} onClick={() => setView('profils')}>
              👤 Profils Juges
            </button>
            {user?.role === 'Administrateur' && (
              <button className={`tab ${view === 'formations' ? 'active' : ''}`} onClick={() => setView('formations')}>
                🧩 Formations
              </button>
            )}
            <button className={`tab ${view === 'types-affaires' ? 'active' : ''}`} onClick={() => setView('types-affaires')}>
              🧾 Types d'affaires
            </button>
            {user?.role === 'Administrateur' && (
              <button className={`tab ${view === 'users' ? 'active' : ''}`} onClick={() => setView('users')}>
                👥 Utilisateurs
              </button>
            )}
            {user?.role === 'Administrateur' && (
              <button className={`tab ${view === 'salles' ? 'active' : ''}`} onClick={() => setView('salles')}>
                🏛️ Salles
              </button>
            )}
            {user?.role === 'Administrateur' && (
              <button className={`tab ${view === 'system-config' ? 'active' : ''}`} onClick={() => setView('system-config')}>
                ⚙️ Config Système
              </button>
            )}
          </div>
          <div className="env-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ApiHealth intervalMs={30000} />
            <span>🔌 API: {apiUrl}</span>
          </div>
          {view === 'dashboard' && <DashboardPage />}
          {view === 'dossiers' && (
            <>
              <DossierList onSelect={(d) => { setSelectedDossierId(d.id) }} />
              {selectedDossierId && (
                <DossierDetailPage 
                  dossierId={selectedDossierId} 
                  onClose={() => setSelectedDossierId(undefined)} 
                />
              )}
            </>
          )}
          {view === 'create-dossier' && <CreateDossierPage onSuccess={() => setView('dossiers')} />}
          {view === 'recherche' && <RechercheAvanceePage />}
          {view === 'audiences' && <AudiencesPage onViewDossier={handleViewDossierFromAudience} onManageSalles={handleManageSalles} />}
          {view === 'calendrier' && <CalendarPage />}
          {view === 'salles' && <SallesPage />}
          {view === 'mon-profil' && <MonProfilPage />}
          {view === 'profils' && <JugeProfilesPage />}
          {view === 'formations' && <FormationsPage />}
          {view === 'users' && (
            <UsersPage />
          )}
          {view === 'system-config' && <SystemConfigPage />}
          {view === 'types-affaires' && <TypesAffairesPage />}
          <ApiSwitcher
            isOpen={showApiSwitcher}
            onClose={() => setShowApiSwitcher(false)}
            onChanged={(url) => { setApiUrl(url); setApiBaseUrl(url) }}
          />
          {/* Modal de gestion de compte */}
          {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} />}
          {/* Routes additionnelles (édition avancée utilisateur) */}
          <Routes>
            <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
            <Route path="/compte/mot-de-passe" element={<ChangePasswordPage />} />
            <Route path="/types-affaires" element={<TypesAffairesPage />} />
          </Routes>
        </>
      )}
    </div>
  )
}
