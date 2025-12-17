import axios from 'axios';
import {
  WorkspaceDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceMemberDto,
  AddWorkspaceMemberDto,
  UpdateMemberRoleDto,
  WorkspaceRole,
} from '../types/workspace';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * API Client pour la gestion des Workspaces
 */
class WorkspaceApi {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Créer un nouveau workspace
   */
  async createWorkspace(dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const response = await axios.post<WorkspaceDto>(
      `${API_URL}/workspaces`,
      dto,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  /**
   * Alias pour createWorkspace
   */
  async create(dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    return this.createWorkspace(dto);
  }

  /**
   * Récupérer tous les workspaces de l'utilisateur connecté
   */
  async getUserWorkspaces(): Promise<WorkspaceDto[]> {
    const response = await axios.get<WorkspaceDto[]>(
      `${API_URL}/workspaces`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  /**
   * Récupérer un workspace par ID
   */
  async getWorkspaceById(id: string): Promise<WorkspaceDto> {
    const response = await axios.get<WorkspaceDto>(
      `${API_URL}/workspaces/${id}`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  /**
   * Récupérer un workspace par slug
   */
  async getWorkspaceBySlug(slug: string): Promise<WorkspaceDto> {
    const response = await axios.get<WorkspaceDto>(
      `${API_URL}/workspaces/slug/${slug}`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  /**
   * Mettre à jour un workspace
   */
  async updateWorkspace(id: string, dto: UpdateWorkspaceDto): Promise<WorkspaceDto> {
    const response = await axios.put<WorkspaceDto>(
      `${API_URL}/workspaces/${id}`,
      dto,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  /**
   * Alias pour updateWorkspace (pour compatibilité avec la page Settings)
   */
  async update(id: string, dto: UpdateWorkspaceDto): Promise<WorkspaceDto> {
    return this.updateWorkspace(id, dto);
  }

  /**
   * Supprimer un workspace (soft delete)
   */
  async deleteWorkspace(id: string): Promise<void> {
    await axios.delete(
      `${API_URL}/workspaces/${id}`,
      { headers: this.getAuthHeader() }
    );
  }

  /**
   * Alias pour deleteWorkspace
   */
  async delete(id: string): Promise<void> {
    return this.deleteWorkspace(id);
  }

  /**
   * Récupérer tous les membres d'un workspace
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    const response = await axios.get<WorkspaceMemberDto[]>(
      `${API_URL}/workspaces/${workspaceId}/members`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  /**
   * Alias pour getWorkspaceMembers
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    return this.getWorkspaceMembers(workspaceId);
  }

  /**
   * Ajouter un membre au workspace
   */
  async addMember(workspaceId: string, dto: AddWorkspaceMemberDto): Promise<void> {
    await axios.post(
      `${API_URL}/workspaces/${workspaceId}/members`,
      dto,
      { headers: this.getAuthHeader() }
    );
  }

  /**
   * Mettre à jour le rôle d'un membre
   */
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    dto: UpdateMemberRoleDto
  ): Promise<void> {
    await axios.put(
      `${API_URL}/workspaces/${workspaceId}/members/${memberId}/role`,
      dto,
      { headers: this.getAuthHeader() }
    );
  }

  /**
   * Mettre à jour le rôle d'un membre (version simplifiée)
   */
  async updateMemberRoleSimple(
    workspaceId: string,
    memberId: string,
    role: number
  ): Promise<void> {
    await this.updateMemberRole(workspaceId, memberId, { role });
  }

  /**
   * Retirer un membre du workspace
   */
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await axios.delete(
      `${API_URL}/workspaces/${workspaceId}/members/${memberId}`,
      { headers: this.getAuthHeader() }
    );
  }

  /**
   * Vérifier si l'utilisateur a une permission
   */
  async checkPermission(
    workspaceId: string,
    role: WorkspaceRole
  ): Promise<boolean> {
    const response = await axios.get<{ hasPermission: boolean }>(
      `${API_URL}/workspaces/${workspaceId}/permissions/${role}`,
      { headers: this.getAuthHeader() }
    );
    return response.data.hasPermission;
  }

  /**
   * Récupérer le rôle de l'utilisateur dans un workspace
   */
  async getMyRole(workspaceId: string): Promise<WorkspaceRole | null> {
    try {
      const response = await axios.get<{ role: WorkspaceRole }>(
        `${API_URL}/workspaces/${workspaceId}/my-role`,
        { headers: this.getAuthHeader() }
      );
      return response.data.role;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

// Export singleton instance
export const workspaceApi = new WorkspaceApi();
export default workspaceApi;
