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
import DocumentsPage from './pages/DocumentsPage'
import { getApiBaseUrl, setApiBaseUrl } from './api/api-client'
import ApiSwitcher from './components/common/ApiSwitcher'
import ApiHealth from './components/common/ApiHealth'
import NotificationsBell from './components/common/NotificationsBell'
import JugeProfilesPage from './pages/JugeProfilesPage'
import MonProfilPage from './pages/MonProfilPage'
import CalendarPage from './pages/CalendarPage'
import AdminUserEditPage from './pages/AdminUserEditPage'
import AccountPage from './pages/AccountPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AccountModal from './components/common/AccountModal'
import SystemConfigPage from './pages/SystemConfigPage'
import LogoManagementPage from './pages/LogoManagementPage'
import HistoriqueDossiersPage from './pages/DocumentLogsPage'
import LoginHistoryPage from './pages/LoginHistoryPage'
import ImportDossiersPage from './pages/ImportDossiersPage'
import ExternalDocumentImportPage from './pages/ExternalDocumentImportPage'
import CourrierPage from './pages/CourrierPage'
import FileExplorerPage from './pages/FileExplorerPage'
import { Routes, Route } from 'react-router-dom'
import { TypesAffairesPage } from './pages/TypesAffairesPage'
import TenantsPage from './pages/TenantsPage'
import TenantDetailPage from './pages/TenantDetailPage'
import TenantFormPage from './pages/TenantFormPage'
import { UnifiedChatPanel } from './components/UnifiedChatPanel'
import WorkspaceSelector from './components/workspace/WorkspaceSelector'
import CreateWorkspaceModal from './components/workspace/CreateWorkspaceModal'
import WorkspaceSettings from './pages/WorkspaceSettings'
import Sidebar from './components/common/Sidebar'
import { migrateUserDataInCache } from './utils/roleMigration'
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  // Migrer les données de cache au démarrage (anciens rôles → nouveaux rôles)
  useEffect(() => {
    migrateUserDataInCache()
  }, [])

  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const [view, setView] = useState<'dashboard' | 'dossiers' | 'users' | 'audiences' | 'recherche' | 'create-dossier' | 'salles' | 'profils' | 'calendrier' | 'system-config' | 'types-affaires' | 'mon-profil' | 'logo-management' | 'documents' | 'courrier' | 'workspace-settings' | 'document-logs' | 'login-history' | 'import-dossiers' | 'external-import' | 'tenants' | 'rights-management' | 'file-explorer'>('dashboard')
  const [selectedDossierId, setSelectedDossierId] = useState<string | undefined>(undefined)
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl())
  const [showApiSwitcher, setShowApiSwitcher] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  // Récupérer l'avatar depuis user (avec support Base64 et URL)
  const getAvatarUrl = () => {
    if (!user) return null;
    return user.avatarBase64 || user.avatarUrl || null;
  };
  const avatarUrl = getAvatarUrl();

  // Écouter les changements d'avatar (pour rafraîchir si user change) (pour rafraîchir si user change)
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === 'user') {
        // Le user a changé, forcer un re-render
        window.location.reload();
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
        <>
          {/* Barre d'actions utilisateur fixe (sans recherche) */}
          <div className="fixed-search-bar">
            <div className="search-bar-content">
              {/* Actions utilisateur à droite */}
              <div className="user-actions-section" style={{ marginLeft: 'auto' }}>
                <NotificationsBell onOpenLink={(href) => {
                  const m = href.match(/^\/dossiers\/(.+)$/)
                  if (m) {
                    setView('dossiers')
                    setSelectedDossierId(m[1])
                  } else {
                    setView('dashboard')
                  }
                }} />
                <ApiHealth />
                
                {user && (
                  <div ref={userMenuRef} style={{ position: 'relative' }}>
                    <button
                      className="user-button"
                      onClick={() => setShowUserMenu(v => !v)}
                    >
                      <span className="user-avatar" style={{
                        background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}>
                        {!avatarUrl && `${((user.nomComplet || user.username)?.[0] || '').toUpperCase()}${((user.nomComplet || user.username)?.[1] || '').toUpperCase()}`}
                      </span>
                      <span className="user-name">{user.nomComplet || user.username}</span>
                    </button>
                    
                    {showUserMenu && (
                      <div className="user-menu-overlay" onClick={() => setShowUserMenu(false)}>
                        <div className="user-menu-panel" style={{ position: 'absolute', right: 0, top: 50 }} onClick={(e) => e.stopPropagation()}>
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
              </div>
            </div>
          </div>
        </>
      )}
      
      {!token && <LoginPage />}
      {token && (
        <>
          {/* Sidebar à gauche */}
          <Sidebar 
            currentView={view}
            onViewChange={setView}
            userRole={user?.role}
            onCreateWorkspaceClick={() => setShowCreateWorkspaceModal(true)}
          />
          
          {/* Contenu principal avec marge à gauche pour le sidebar */}
          <div className="main-content-wrapper">
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
          {view === 'recherche' && <RechercheAvanceePage onViewDossier={handleViewDossierFromAudience} />}
          {view === 'audiences' && <AudiencesPage onViewDossier={handleViewDossierFromAudience} onManageSalles={handleManageSalles} />}
          {view === 'calendrier' && <CalendarPage onViewDossier={handleViewDossierFromAudience} onManageSalles={handleManageSalles} />}
          {view === 'documents' && <DocumentsPage />}
          {view === 'file-explorer' && <FileExplorerPage />}
          {view === 'courrier' && <CourrierPage />}
          {view === 'salles' && <SallesPage />}
          {view === 'mon-profil' && <MonProfilPage />}
          {view === 'profils' && <JugeProfilesPage />}
          {view === 'login-history' && <LoginHistoryPage />}
          {view === 'users' && (
            <UsersPage />
          )}
          {view === 'system-config' && <SystemConfigPage />}
          {view === 'logo-management' && <LogoManagementPage />}
          {view === 'document-logs' && <HistoriqueDossiersPage />}
          {view === 'types-affaires' && <TypesAffairesPage />}
          {view === 'workspace-settings' && <WorkspaceSettings />}
          {view === 'login-history' && <LoginHistoryPage />}
          {view === 'import-dossiers' && <ImportDossiersPage />}
          {view === 'external-import' && <ExternalDocumentImportPage />}
          {view === 'tenants' && <TenantsPage />}
          
          {/* Routes additionnelles (édition avancée utilisateur + Phase 3 Tenant Management) */}
          <Routes>
            <Route path="/admin/users/:id" element={<AdminUserEditPage />} />
            <Route path="/compte/mot-de-passe" element={<ChangePasswordPage />} />
            <Route path="/types-affaires" element={<TypesAffairesPage />} />
            {/* Phase 3: Tenant Management Routes */}
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/:id" element={<TenantDetailPage />} />
            <Route path="/tenants/create" element={<TenantFormPage />} />
            <Route path="/tenants/:id/edit" element={<TenantFormPage />} />
          </Routes>
          
          {/* Unified Chat Panel - affichés pour tous les utilisateurs authentifiés */}
          <UnifiedChatPanel />
          </div>
          
          {/* Modals */}
          <ApiSwitcher
            isOpen={showApiSwitcher}
            onClose={() => setShowApiSwitcher(false)}
            onChanged={(url) => { setApiUrl(url); setApiBaseUrl(url) }}
          />
          {/* Modal de gestion de compte */}
          {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} />}
          
          {/* Modal de création de workspace */}
          <CreateWorkspaceModal 
            isOpen={showCreateWorkspaceModal}
            onClose={() => setShowCreateWorkspaceModal(false)}
          />
        </>
      )}
      <Analytics />
    </div>
  )
}
