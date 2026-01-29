import api from './api-client'

export interface ModuleDto {
  key: string
  label: string
  description: string
  icon: string
}

export interface RolePermissionSummary {
  hasAccess: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canExport: boolean
}

export interface PermissionsMatrixDto {
  modules: ModuleDto[]
  roles: string[]
  matrix: Record<string, Record<string, RolePermissionSummary>>
}

export interface RoleModulePermissionDto {
  id: string
  userRole: string
  moduleKey: string
  moduleLabel: string
  description: string
  hasAccess: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canExport: boolean
  workspaceId?: string
  createdAt: string
  modifiedAt?: string
}

export interface UpdateRoleModulePermissionDto {
  hasAccess: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canExport: boolean
}

export class RolePermissionsApi {
  async getPermissionsMatrix(workspaceId?: string): Promise<PermissionsMatrixDto> {
    const params = workspaceId ? { workspaceId } : {}
    const response = await api.get(`/role-permissions/matrix`, { params })
    return response.data as PermissionsMatrixDto
  }

  async getByRole(role: string, workspaceId?: string): Promise<RoleModulePermissionDto[]> {
    const params = workspaceId ? { workspaceId } : {}
    const response = await api.get(`/role-permissions/roles/${role}`, { params })
    return response.data as RoleModulePermissionDto[]
  }

  async getPermission(
    role: string,
    moduleKey: string,
    workspaceId?: string
  ): Promise<RoleModulePermissionDto | null> {
    try {
      const params = workspaceId ? { workspaceId } : {}
      const response = await api.get(`/role-permissions/roles/${role}/modules/${moduleKey}`, { params })
      return response.data as RoleModulePermissionDto
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  async checkAccess(role: string, moduleKey: string, workspaceId?: string): Promise<boolean> {
    const params: any = { role, moduleKey }
    if (workspaceId) params.workspaceId = workspaceId
    const response = await api.get(`/role-permissions/check-access`, { params })
    return response.data as boolean
  }

  async updatePermission(
    role: string,
    moduleKey: string,
    dto: UpdateRoleModulePermissionDto,
    workspaceId?: string
  ): Promise<RoleModulePermissionDto> {
    const params = workspaceId ? { workspaceId } : {}
    const response = await api.put(`/role-permissions/roles/${role}/modules/${moduleKey}`, dto, { params })
    return response.data as RoleModulePermissionDto
  }

  async updateBatch(
    updates: Array<{ role: string; moduleKey: string; permission: UpdateRoleModulePermissionDto }>,
    workspaceId?: string
  ): Promise<RoleModulePermissionDto[]> {
    const params = workspaceId ? { workspaceId } : {}
    const response = await api.put(`/role-permissions/batch`, { updates }, { params })
    return response.data as RoleModulePermissionDto[]
  }

  async initializeDefaults(workspaceId?: string): Promise<void> {
    const params = workspaceId ? { workspaceId } : {}
    await api.post(`/role-permissions/initialize-defaults`, {}, { params })
  }

  async exportMatrix(workspaceId?: string): Promise<string> {
    const params = workspaceId ? { workspaceId } : {}
    const response = await api.get(`/role-permissions/export`, { params })
    return response.data.json as string
  }

  async importMatrix(json: string, workspaceId?: string): Promise<void> {
    const params = workspaceId ? { workspaceId } : {}
    await api.post(`/role-permissions/import`, { json }, { params })
  }
}

export const rolePermissionsApi = new RolePermissionsApi()
