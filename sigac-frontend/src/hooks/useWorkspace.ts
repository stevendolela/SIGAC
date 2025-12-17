import { useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { WorkspaceDto, WorkspaceRole } from '../types/workspace';

/**
 * Hook personnalisé pour gérer les workspaces
 */
export function useWorkspace() {
  const {
    workspaces,
    currentWorkspace,
    loading,
    error,
    setCurrentWorkspace,
    setCurrentWorkspaceById,
    fetchUserWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    clearError,
    getUserRole,
    hasPermission,
  } = useWorkspaceStore();

  // Charger les workspaces au montage
  useEffect(() => {
    if (workspaces.length === 0 && !loading) {
      fetchUserWorkspaces().catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // État
    workspaces,
    currentWorkspace,
    loading,
    error,

    // Actions
    setWorkspace: setCurrentWorkspace,
    setWorkspaceById: setCurrentWorkspaceById,
    refreshWorkspaces: fetchUserWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    clearError,

    // Helpers
    getUserRole: (workspaceId?: string) => getUserRole(workspaceId),
    hasPermission: (minimumRole: WorkspaceRole, workspaceId?: string) =>
      hasPermission(minimumRole, workspaceId),
    
    // Computed
    isOwner: currentWorkspace?.userRole === WorkspaceRole.Owner,
    isAdmin: 
      currentWorkspace?.userRole === WorkspaceRole.Owner ||
      currentWorkspace?.userRole === WorkspaceRole.Admin,
    canManageMembers:
      currentWorkspace?.userRole === WorkspaceRole.Owner ||
      currentWorkspace?.userRole === WorkspaceRole.Admin,
    canEdit:
      currentWorkspace?.userRole === WorkspaceRole.Owner ||
      currentWorkspace?.userRole === WorkspaceRole.Admin,
  };
}

/**
 * Hook pour charger et sélectionner un workspace spécifique
 */
export function useWorkspaceById(workspaceId: string | undefined) {
  const { setWorkspaceById, currentWorkspace, loading, error } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceId && currentWorkspace?.id !== workspaceId) {
      setWorkspaceById(workspaceId).catch(console.error);
    }
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    workspace: currentWorkspace,
    loading,
    error,
  };
}
