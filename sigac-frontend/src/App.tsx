import React, { useState } from 'react'
import Logo from './components/common/Logo'
import UploadPage from './pages/UploadPage'
import LoginPage from './pages/LoginPage'
import AuthHeader from './components/AuthHeader'
import DossierList from './components/dossiers/DossierList'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import DossierDetailPage from './pages/DossierDetailPage'
import AudiencesPage from './pages/AudiencesPage'
import RechercheAvanceePage from './pages/RechercheAvanceePage'
import CreateDossierPage from './pages/CreateDossierPage'

export default function App() {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const [view, setView] = useState<'dashboard' | 'dossiers' | 'upload' | 'users' | 'audiences' | 'recherche' | 'create-dossier'>('dashboard')
  const [selectedDossierId, setSelectedDossierId] = useState<string | undefined>(undefined)

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.reload()
  }

  return (
    <div className="app">
      {token && (
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={48} style={{ cursor: 'pointer' }} onClick={() => setView('dashboard')} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>SIGAC</div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }}>
                Système de Gestion des Affaires Constitutionnelles
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user && (
              <div className="user-info">
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                  {user.prenom} {user.nom}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  <span className="badge" style={{ background: '#ddd6fe', color: '#5b21b6', fontSize: 11 }}>
                    {user.role}
                  </span>
                </div>
              </div>
            )}
            <button 
              className="btn"
              onClick={handleLogout}
              style={{ 
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                fontSize: 14
              }}
            >
              🚪 Déconnexion
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
            <button className={`tab ${view === 'upload' ? 'active' : ''}`} onClick={() => setView('upload')}>
              📤 Upload
            </button>
            <button className={`tab ${view === 'users' ? 'active' : ''}`} onClick={() => setView('users')}>
              👥 Utilisateurs
            </button>
          </div>
          <div className="env-info">🔌 API: {(import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000/api'}</div>
          {view === 'dashboard' && <DashboardPage />}
          {view === 'dossiers' && (
            <>
              <DossierList onSelect={(d) => { setSelectedDossierId(d.id) }} />
              {selectedDossierId && <DossierDetailPage dossierId={selectedDossierId} />}
            </>
          )}
          {view === 'create-dossier' && <CreateDossierPage onSuccess={() => setView('dossiers')} />}
          {view === 'recherche' && <RechercheAvanceePage />}
          {view === 'audiences' && <AudiencesPage />}
          {view === 'upload' && (
            <UploadPage selectedDossierId={selectedDossierId} />
          )}
          {view === 'users' && (
            <UsersPage />
          )}
        </>
      )}
    </div>
  )
}
