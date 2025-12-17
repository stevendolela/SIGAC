/**
 * Types TypeScript pour les Workspaces (GED multi-organisations)
 */

export enum WorkspaceRole {
  Owner = 0,
  Admin = 1,
  Member = 2,
  Guest = 3,
}

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  maxStorageGB: number;
  maxUsers: number;
  allowGuestAccess: boolean;
  isActive: boolean;
  ownerId: string;
  ownerName: string;
  currentMemberCount: number;
  currentProjectCount: number;
  userRole: WorkspaceRole;
  createdAt: string;
  modifiedAt?: string;
}

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
  maxStorageGB?: number;
  maxUsers?: number;
  allowGuestAccess?: boolean;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
  logoUrl?: string;
  maxStorageGB?: number;
  maxUsers?: number;
  allowGuestAccess?: boolean;
  isActive?: boolean;
}

export interface WorkspaceMemberDto {
  userId: string;
  username: string;
  email: string;
  nomComplet: string;
  role: WorkspaceRole;
  joinedAt: string;
  isActive: boolean;
  invitedById?: string;
  invitedByName?: string;
}

export interface AddWorkspaceMemberDto {
  userId: string;
  role: WorkspaceRole;
}

export interface UpdateMemberRoleDto {
  role: WorkspaceRole;
}

/**
 * Helper pour convertir WorkspaceRole en label français
 */
export const getWorkspaceRoleLabel = (role: WorkspaceRole): string => {
  switch (role) {
    case WorkspaceRole.Owner:
      return 'Propriétaire';
    case WorkspaceRole.Admin:
      return 'Administrateur';
    case WorkspaceRole.Member:
      return 'Membre';
    case WorkspaceRole.Guest:
      return 'Invité';
    default:
      return 'Inconnu';
  }
};

/**
 * Helper pour obtenir la couleur du badge de rôle
 */
export const getWorkspaceRoleColor = (role: WorkspaceRole): string => {
  switch (role) {
    case WorkspaceRole.Owner:
      return '#667eea'; // Violet (brand primary)
    case WorkspaceRole.Admin:
      return '#f59e0b'; // Orange
    case WorkspaceRole.Member:
      return '#10b981'; // Vert
    case WorkspaceRole.Guest:
      return '#6b7280'; // Gris
    default:
      return '#9ca3af';
  }
};

/**
 * Helper pour vérifier les permissions
 */
export const hasWorkspacePermission = (
  userRole: WorkspaceRole,
  minimumRole: WorkspaceRole
): boolean => {
  // Owner a tous les droits
  if (userRole === WorkspaceRole.Owner) return true;
  
  // Admin peut tout sauf si minimum requis est Owner
  if (userRole === WorkspaceRole.Admin && minimumRole !== WorkspaceRole.Owner) {
    return true;
  }
  
  // Member peut si minimum est Member ou Guest
  if (userRole === WorkspaceRole.Member && 
      (minimumRole === WorkspaceRole.Member || minimumRole === WorkspaceRole.Guest)) {
    return true;
  }
  
  // Guest peut si minimum est Guest
  if (userRole === WorkspaceRole.Guest && minimumRole === WorkspaceRole.Guest) {
    return true;
  }
  
  return false;
};
