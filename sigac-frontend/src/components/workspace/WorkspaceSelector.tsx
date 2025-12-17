import React, { useState } from 'react';
import { Building2, ChevronDown, Plus, Settings, Users } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { getWorkspaceRoleLabel, getWorkspaceRoleColor } from '../../types/workspace';
import './WorkspaceSelector.css';

interface WorkspaceSelectorProps {
  onCreateClick?: () => void;
  onSettingsClick?: () => void;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  onCreateClick,
  onSettingsClick,
}) => {
  const {
    workspaces,
    currentWorkspace,
    loading,
    setWorkspace,
    isOwner,
    isAdmin,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setWorkspace(workspace);
      setIsOpen(false);
    }
  };

  const handleCreateClick = () => {
    setIsOpen(false);
    onCreateClick?.();
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    onSettingsClick?.();
  };

  if (loading && workspaces.length === 0) {
    return (
      <div className="workspace-selector-loading">
        <div className="workspace-selector-skeleton"></div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="workspace-selector-empty">
        <Building2 size={20} />
        <span>Aucun workspace</span>
        {onCreateClick && (
          <button onClick={onCreateClick} className="workspace-selector-create-btn">
            <Plus size={16} />
            Créer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="workspace-selector">
      <button
        className="workspace-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="workspace-selector-current">
          {currentWorkspace.logoUrl ? (
            <img
              src={currentWorkspace.logoUrl}
              alt={currentWorkspace.name}
              className="workspace-logo"
            />
          ) : (
            <div className="workspace-logo-placeholder">
              <Building2 size={20} />
            </div>
          )}
          <div className="workspace-info">
            <span className="workspace-name">{currentWorkspace.name}</span>
            <span
              className="workspace-role"
              style={{ color: getWorkspaceRoleColor(currentWorkspace.userRole) }}
            >
              {getWorkspaceRoleLabel(currentWorkspace.userRole)}
            </span>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`workspace-selector-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="workspace-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="workspace-selector-dropdown">
            <div className="workspace-selector-header">
              <span className="workspace-selector-title">Mes Workspaces</span>
              <span className="workspace-selector-count">{workspaces.length}</span>
            </div>

            <div className="workspace-selector-list">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className={`workspace-selector-item ${
                    workspace.id === currentWorkspace.id ? 'active' : ''
                  }`}
                  onClick={() => handleWorkspaceChange(workspace.id)}
                >
                  <div className="workspace-item-main">
                    {workspace.logoUrl ? (
                      <img
                        src={workspace.logoUrl}
                        alt={workspace.name}
                        className="workspace-item-logo"
                      />
                    ) : (
                      <div className="workspace-item-logo-placeholder">
                        <Building2 size={18} />
                      </div>
                    )}
                    <div className="workspace-item-info">
                      <span className="workspace-item-name">{workspace.name}</span>
                      <div className="workspace-item-meta">
                        <span
                          className="workspace-item-role"
                          style={{ color: getWorkspaceRoleColor(workspace.userRole) }}
                        >
                          {getWorkspaceRoleLabel(workspace.userRole)}
                        </span>
                        <span className="workspace-item-separator">•</span>
                        <span className="workspace-item-stats">
                          <Users size={12} />
                          {workspace.currentMemberCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  {workspace.id === currentWorkspace.id && (
                    <div className="workspace-item-check">✓</div>
                  )}
                </button>
              ))}
            </div>

            <div className="workspace-selector-actions">
              {onCreateClick && (
                <button className="workspace-selector-action" onClick={handleCreateClick}>
                  <Plus size={16} />
                  <span>Créer un workspace</span>
                </button>
              )}
              {(isOwner || isAdmin) && onSettingsClick && (
                <button className="workspace-selector-action" onClick={handleSettingsClick}>
                  <Settings size={16} />
                  <span>Paramètres du workspace</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceSelector;
