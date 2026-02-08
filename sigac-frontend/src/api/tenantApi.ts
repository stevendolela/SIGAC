/**
 * API Client pour le service Tenant (Phase 2)
 * Endpoints REST: GET /api/tenants, POST /api/tenants, PUT /api/tenants/{id}, DELETE /api/tenants/{id}
 */

import apiClient from "./api-client";
import {
  TenantDto,
  TenantListDto,
  CreateTenantDto,
  UpdateTenantDto,
  TenantSubscriptionDto,
  CreateTenantSubscriptionDto,
  TenantPaginationResult,
  TenantStatsDto,
} from "../types/tenant";

const BASE_URL = "/tenants";

export class TenantApi {
  /**
   * Récupère la liste paginée des tenants
   * GET /api/tenants?page={page}&pageSize={pageSize}
   */
  static async getTenantsPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<TenantPaginationResult> {
    const response = await apiClient.get<TenantPaginationResult>(BASE_URL, {
      params: { page, pageSize },
    });
    return response.data;
  }

  /**
   * Récupère les détails d'un tenant par ID
   * GET /api/tenants/{id}
   */
  static async getTenantById(id: string): Promise<TenantDto> {
    const response = await apiClient.get<TenantDto>(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Récupère un tenant par son slug
   * GET /api/tenants/slug/{slug}
   */
  static async getTenantBySlug(slug: string): Promise<TenantDto> {
    const response = await apiClient.get<TenantDto>(`${BASE_URL}/slug/${slug}`);
    return response.data;
  }

  /**
   * Récupère les statistiques d'un tenant
   * GET /api/tenants/{id}/stats
   */
  static async getTenantStats(id: string): Promise<TenantStatsDto> {
    const response = await apiClient.get<TenantStatsDto>(
      `${BASE_URL}/${id}/stats`
    );
    return response.data;
  }

  /**
   * Récupère l'abonnement actif d'un tenant
   * GET /api/tenants/{id}/subscriptions/active
   */
  static async getActiveSubscription(
    id: string
  ): Promise<TenantSubscriptionDto | null> {
    try {
      const response = await apiClient.get<TenantSubscriptionDto>(
        `${BASE_URL}/${id}/subscriptions/active`
      );
      return response.data;
    } catch (error) {
      // 404 = pas d'abonnement actif
      return null;
    }
  }

  /**
   * Crée un nouveau tenant (Admin only)
   * POST /api/tenants
   */
  static async createTenant(dto: CreateTenantDto): Promise<TenantDto> {
    const response = await apiClient.post<TenantDto>(BASE_URL, dto);
    return response.data;
  }

  /**
   * Met à jour un tenant (Admin only)
   * PUT /api/tenants/{id}
   */
  static async updateTenant(id: string, dto: UpdateTenantDto): Promise<TenantDto> {
    const response = await apiClient.put<TenantDto>(`${BASE_URL}/${id}`, dto);
    return response.data;
  }

  /**
   * Supprime un tenant (soft delete) (Admin only)
   * DELETE /api/tenants/{id}
   */
  static async deleteTenant(id: string, deletedBy: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`, {
      data: { deletedBy },
    });
  }

  /**
   * Ajoute un abonnement au tenant (Admin only)
   * POST /api/tenants/{id}/subscriptions
   */
  static async addSubscription(
    tenantId: string,
    dto: CreateTenantSubscriptionDto
  ): Promise<TenantSubscriptionDto> {
    const response = await apiClient.post<TenantSubscriptionDto>(
      `${BASE_URL}/${tenantId}/subscriptions`,
      dto
    );
    return response.data;
  }
}
