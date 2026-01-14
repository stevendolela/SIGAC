import React, { useState } from 'react'
import { 
  LayoutDashboard, 
  FolderOpen, 
  FilePlus, 
  Search, 
  Calendar, 
  CalendarDays,
  FileText,
  Users,
  UserCircle,
  Building2,
  Settings,
  Palette,
  FileType,
  DoorOpen,
  History
} from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import Logo from './Logo'
import WorkspaceAdminModal from '../workspace/WorkspaceAdminModal'
import './Sidebar.css'

type ViewType = 
  | 'dashboard' 
  | 'dossiers' 
  | 'create-dossier' 
  | 'recherche' 
  | 'audiences' 
  | 'calendrier' 
  | 'documents' 
  | 'profils' 
  | 'types-affaires' 
  | 'users' 
  | 'salles' 
  | 'system-config' 
  | 'logo-management' 
  | 'workspace-settings'
  | 'mon-profil'
  | 'document-logs'
  | 'login-history'
  | 'import-dossiers'

interface MenuItem {
  view: ViewType
  label: string
  icon: React.ComponentType<any>
  color: string
  badge?: number
  onClick?: () => void
}

interface MenuSection {
  section: string
  items: MenuItem[]
}

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  userRole?: string
  onCreateWorkspaceClick: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  userRole,
  onCreateWorkspaceClick 
}) => {
  const { currentWorkspace } = useWorkspaceStore()
  const [showWorkspaceAdmin, setShowWorkspaceAdmin] = useState(false)

  const menuItems: MenuSection[] = [
    {
      section: 'Workspace',
      items: [
        {
          view: 'workspace-settings' as ViewType,
          label: currentWorkspace?.name || 'Sélectionner un workspace',
          icon: Building2,
          color: '#8b5cf6',
          onClick: () => setShowWorkspaceAdmin(true)
        }
      ]
    },
    {
      section: 'Principal',
      items: [
        {
          view: 'dashboard' as ViewType,
          label: 'Dashboard',
          icon: LayoutDashboard,
          color: '#3b82f6'
        },
        {
          view: 'dossiers' as ViewType,
          label: 'Dossiers',
          icon: FolderOpen,
          color: '#10b981',
          badge: currentWorkspace?.currentProjectCount
        },
        {
          view: 'create-dossier' as ViewType,
          label: 'Nouveau Dossier',
          icon: FilePlus,
          color: '#f59e0b'
        },
        {
          view: 'recherche' as ViewType,
          label: 'Recherche',
          icon: Search,
          color: '#6366f1'
        }
      ]
    },
    {
      section: 'Organisation',
      items: [
        {
          view: 'audiences' as ViewType,
          label: 'Réunions',
          icon: Calendar,
          color: '#ec4899'
        },
        {
          view: 'calendrier' as ViewType,
          label: 'Calendrier',
          icon: CalendarDays,
          color: '#14b8a6'
        },
        {
          view: 'documents' as ViewType,
          label: 'Documents',
          icon: FileText,
          color: '#f97316'
        }
      ]
    },
    {
      section: 'Administration',
      items: [
        ...(userRole === 'Collaborateur' ? [{
          view: 'mon-profil' as ViewType,
          label: 'Mon Profil',
          icon: UserCircle,
          color: '#8b5cf6'
        }] : []),
        {
          view: 'login-history' as ViewType,
          label: 'Historique Connexions',
          icon: UserCircle,
          color: '#f97316'
        },
        {
          view: 'import-dossiers' as ViewType,
          label: 'Import en masse',
          icon: UserCircle,
          color: '#3b82f6'
        },
        {
          view: 'profils' as ViewType,
          label: 'Équipe',
          icon: UserCircle,
          color: '#8b5cf6'
        },
        {
          view: 'types-affaires' as ViewType,
          label: "Catégories",
          icon: FileType,
          color: '#06b6d4'
        },
        ...(userRole === 'Admin' ? [
          {
            view: 'users' as ViewType,
            label: 'Utilisateurs',
            icon: Users,
            color: '#0ea5e9'
          },
          {
            view: 'salles' as ViewType,
            label: 'Salles',
            icon: DoorOpen,
            color: '#84cc16'
          }
        ] : [])
      ]
    },
    ...(userRole === 'Admin' ? [{
      section: 'Système',
      items: [
        {
          view: 'system-config' as ViewType,
          label: 'Configuration',
          icon: Settings,
          color: '#64748b'
        },
        {
          view: 'logo-management' as ViewType,
          label: 'Logo',
          icon: Palette,
          color: '#a855f7'
        },
        {
          view: 'document-logs' as ViewType,
          label: 'Historique Dossiers',
          icon: History,
          color: '#6366f1'
        }
      ]
    }] : [])
  ]

  return (
    <aside className="sidebar">
      {/* Logo en haut du sidebar */}
      <div className="sidebar-logo-section">
        <div className="sidebar-logo-container">
          <Logo 
            size={48} 
            style={{ 
              cursor: 'pointer',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} 
            onClick={() => onViewChange('dashboard')} 
          />
        </div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-title">Taajii GED</div>
          <div className="sidebar-logo-subtitle">Gestion Électronique</div>
        </div>
      </div>

      <div className="sidebar-scroll">
        {menuItems.map((section, idx) => (
          <div key={idx} className="sidebar-section">
            {section.section && (
              <div className="sidebar-section-title">{section.section}</div>
            )}
            <div className="sidebar-menu">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.view
                
                return (
                  <button
                    key={item.view}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => item.onClick ? item.onClick() : onViewChange(item.view)}
                    style={{
                      '--item-color': item.color
                    } as React.CSSProperties}
                  >
                    <div className="sidebar-item-icon">
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="sidebar-item-label">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="sidebar-item-badge">{item.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Workspace Quick Actions */}
      <div className="sidebar-footer">
        <button 
          className="sidebar-footer-btn"
          onClick={() => setShowWorkspaceAdmin(true)}
        >
          <Building2 size={16} />
          <span>Gérer les Workspaces</span>
        </button>
      </div>

      {/* Workspace Admin Modal */}
      {showWorkspaceAdmin && (
        <WorkspaceAdminModal onClose={() => setShowWorkspaceAdmin(false)} />
      )}
    </aside>
  )
}

export default Sidebar
