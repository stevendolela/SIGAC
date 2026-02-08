/**
 * Types TypeScript pour le service Tenant (Phase 2)
 * Mirroring des DTOs du backend SIGAC.Core/DTOs/TenantDto.cs
 */

export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string; // Base64
  planEnum: TenantPlan;
  maxUsers: number;
  maxStorageGB: number;
  maxWorkspaces: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  userCount: number;
  workspaceCount: number;
  storageUsedGB: number;
}

export interface TenantListDto {
  id: string;
  name: string;
  slug: string;
  planEnum: TenantPlan;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  workspaceCount: number;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  description?: string;
  logo?: string; // Base64
  planEnum: TenantPlan;
  maxUsers: number;
  maxStorageGB: number;
  maxWorkspaces: number;
  createdBy: string; // userId
}

export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  planEnum?: TenantPlan;
  maxUsers?: number;
  maxStorageGB?: number;
  maxWorkspaces?: number;
  isActive?: boolean;
  updatedBy: string; // userId
}

export interface TenantSubscriptionDto {
  id: string;
  tenantId: string;
  plan: TenantPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  cost: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTenantSubscriptionDto {
  plan: TenantPlan;
  startDate: string;
  cost: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  autoRenew: boolean;
  createdBy: string; // userId
}

export interface TenantUsageEventDto {
  id: string;
  tenantId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TenantStatsDto {
  userCount: number;
  workspaceCount: number;
  storageUsedGB: number;
  documentCount: number;
  dossierCount: number;
  lastActivityDate?: string;
  userPercentage: number;
  storagePercentage: number;
  workspacePercentage: number;
}

export enum TenantPlan {
  Free = 0,
  Starter = 1,
  Professional = 2,
  Enterprise = 3,
  Custom = 4,
}

export const TenantPlanLabels: Record<TenantPlan, string> = {
  [TenantPlan.Free]: "Gratuit",
  [TenantPlan.Starter]: "Démarrage",
  [TenantPlan.Professional]: "Professionnel",
  [TenantPlan.Enterprise]: "Entreprise",
  [TenantPlan.Custom]: "Personnalisé",
};

export const TenantPlanColors: Record<TenantPlan, string> = {
  [TenantPlan.Free]: "#gray",
  [TenantPlan.Starter]: "#blue",
  [TenantPlan.Professional]: "#green",
  [TenantPlan.Enterprise]: "#purple",
  [TenantPlan.Custom]: "#orange",
};

export interface TenantPaginationResult {
  data: TenantListDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
