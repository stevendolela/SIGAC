import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkspaceDto, WorkspaceRole } from '../types/workspace';
import { workspaceApi } from '../api/workspaceApi';

interface WorkspaceState {
  // État
  workspaces: WorkspaceDto[];
  currentWorkspace: WorkspaceDto | null;
  showAllWorkspaces: boolean; // Flag pour indiquer si l'utilisateur a choisi "Tous les espaces"
  loading: boolean;
  error: string | null;

  // Actions
  setCurrentWorkspace: (workspace: WorkspaceDto | null) => void;
  setCurrentWorkspaceById: (workspaceId: string) => Promise<void>;
  fetchUserWorkspaces: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (data: {
    name: string;
    slug: string;
    description?: string;
  }) => Promise<WorkspaceDto>;
  updateWorkspace: (
    workspaceId: string,
    data: Partial<WorkspaceDto>
  ) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // Helpers
  getUserRole: (workspaceId?: string) => WorkspaceRole | null;
  hasPermission: (minimumRole: WorkspaceRole, workspaceId?: string) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // État initial
      workspaces: [],
      currentWorkspace: null,
      showAllWorkspaces: false,
      loading: false,
      error: null,

      // Actions
      setCurrentWorkspace: (workspace) => {
        set({ 
          currentWorkspace: workspace, 
          showAllWorkspaces: workspace === null, // Si null, l'utilisateur a choisi "Tous les espaces"
          error: null 
        });
      },

      setCurrentWorkspaceById: async (workspaceId: string) => {
        const { workspaces } = get();
        
        // Chercher d'abord dans le cache
        const cached = workspaces.find((w) => w.id === workspaceId);
        if (cached) {
          set({ currentWorkspace: cached, error: null });
          return;
        }

        // Sinon fetch depuis l'API
        try {
          set({ loading: true, error: null });
          const workspace = await workspaceApi.getWorkspaceById(workspaceId);
          set({
            currentWorkspace: workspace,
            workspaces: [...workspaces, workspace],
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erreur lors du chargement du workspace',
            loading: false,
          });
          throw error;
        }
      },

      fetchUserWorkspaces: async () => {
        try {
          set({ loading: true, error: null });
          const workspaces = await workspaceApi.getUserWorkspaces();
          
          // Conserver le choix de l'utilisateur
          const { currentWorkspace, showAllWorkspaces } = get();
          
          // Si l'utilisateur a choisi "Tous les espaces", garder null
          // Sinon, garder le workspace courant ou sélectionner le premier
          let newCurrentWorkspace: WorkspaceDto | null = null;
          if (showAllWorkspaces) {
            newCurrentWorkspace = null;
          } else if (currentWorkspace) {
            // Vérifier que le workspace existe encore
            newCurrentWorkspace = workspaces.find(w => w.id === currentWorkspace.id) || workspaces[0] || null;
          } else {
            newCurrentWorkspace = workspaces[0] || null;
          }
          
          set({
            workspaces,
            loading: false,
            currentWorkspace: newCurrentWorkspace,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erreur lors du chargement des workspaces',
            loading: false,
          });
          throw error;
        }
      },

      refreshWorkspaces: async () => {
        try {
          set({ loading: true, error: null });
          const workspaces = await workspaceApi.getUserWorkspaces();
          const { currentWorkspace, showAllWorkspaces } = get();
          
          // Si l'utilisateur a choisi "Tous les espaces", garder null
          let updatedCurrent: WorkspaceDto | null = null;
          if (!showAllWorkspaces && currentWorkspace) {
            updatedCurrent = workspaces.find((w: WorkspaceDto) => w.id === currentWorkspace.id) || workspaces[0] || null;
          } else if (!showAllWorkspaces) {
            updatedCurrent = workspaces[0] || null;
          }
          // Si showAllWorkspaces est true, garder null
          
          set({
            workspaces,
            currentWorkspace: updatedCurrent,
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erreur lors du rafraîchissement',
            loading: false,
          });
        }
      },

      createWorkspace: async (data) => {
        try {
          set({ loading: true, error: null });
          const newWorkspace = await workspaceApi.createWorkspace(data);
          
          set((state) => ({
            workspaces: [...state.workspaces, newWorkspace],
            currentWorkspace: newWorkspace, // Auto-sélectionner le nouveau workspace
            loading: false,
          }));
          
          return newWorkspace;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erreur lors de la création du workspace',
            loading: false,
          });
          throw error;
        }
      },

      updateWorkspace: async (workspaceId, data) => {
        try {
          set({ loading: true, error: null });
          const updated = await workspaceApi.updateWorkspace(workspaceId, data);
          
          set((state) => ({
            workspaces: state.workspaces.map((w) =>
              w.id === workspaceId ? updated : w
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? updated
                : state.currentWorkspace,
            loading: false,
          }));
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erreur lors de la mise à jour',
            loading: false,
          });
          throw error;
        }
      },

      deleteWorkspace: async (workspaceId) => {
        try {
          set({ loading: true, error: null });
          await workspaceApi.deleteWorkspace(workspaceId);
          
          set((state) => {
            const remaining = state.workspaces.filter((w) => w.id !== workspaceId);
            return {
              workspaces: remaining,
              currentWorkspace:
                state.currentWorkspace?.id === workspaceId
                  ? remaining[0] || null
                  : state.currentWorkspace,
              loading: false,
            };
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erreur lors de la suppression',
            loading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      reset: () =>
        set({
          workspaces: [],
          currentWorkspace: null,
          loading: false,
          error: null,
        }),

      // Helpers
      getUserRole: (workspaceId) => {
        const { currentWorkspace, workspaces } = get();
        const workspace = workspaceId
          ? workspaces.find((w) => w.id === workspaceId)
          : currentWorkspace;
        return workspace?.userRole ?? null;
      },

      hasPermission: (minimumRole, workspaceId) => {
        const userRole = get().getUserRole(workspaceId);
        if (userRole === null) return false;

        // Owner a tous les droits
        if (userRole === WorkspaceRole.Owner) return true;

        // Admin peut tout sauf si minimum requis est Owner
        if (userRole === WorkspaceRole.Admin && minimumRole !== WorkspaceRole.Owner) {
          return true;
        }

        // Member peut si minimum est Member ou Guest
        if (
          userRole === WorkspaceRole.Member &&
          (minimumRole === WorkspaceRole.Member || minimumRole === WorkspaceRole.Guest)
        ) {
          return true;
        }

        // Guest peut si minimum est Guest
        if (userRole === WorkspaceRole.Guest && minimumRole === WorkspaceRole.Guest) {
          return true;
        }

        return false;
      },
    }),
    {
      name: 'workspace-storage', // Clé localStorage
      partialize: (state) => ({
        // Persister currentWorkspace et showAllWorkspaces
        currentWorkspace: state.currentWorkspace,
        showAllWorkspaces: state.showAllWorkspaces,
      }),
    }
  )
);
