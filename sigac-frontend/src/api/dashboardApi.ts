import axios from 'axios'
import type { 
  DashboardStatisticsDto, 
  TimelineDataDto, 
  UserActivityDto,
  StorageStatisticsDto 
} from '../types/dashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5210/api'

export class DashboardApi {
  private static instance: DashboardApi

  private constructor() {}

  static getInstance(): DashboardApi {
    if (!DashboardApi.instance) {
      DashboardApi.instance = new DashboardApi()
    }
    return DashboardApi.instance
  }

  private getHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Récupère les statistiques complètes du dashboard
   */
  async getStatistics(periodeDays: number = 0, workspaceId?: string): Promise<DashboardStatisticsDto> {
    try {
      const params: Record<string, any> = { periodeDays }
      if (workspaceId) {
        params.workspaceId = workspaceId
      }
      
      const response = await axios.get<DashboardStatisticsDto>(
        `${API_URL}/dashboard/statistics`,
        {
          headers: this.getHeaders(),
          params
        }
      )
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  }

  /**
   * Récupère les statistiques pour une période spécifique
   */
  async getStatisticsForPeriod(
    dateDebut: Date,
    dateFin: Date
  ): Promise<DashboardStatisticsDto> {
    try {
      const response = await axios.get<DashboardStatisticsDto>(
        `${API_URL}/dashboard/statistics/period`,
        {
          headers: this.getHeaders(),
          params: {
            dateDebut: dateDebut.toISOString().split('T')[0],
            dateFin: dateFin.toISOString().split('T')[0]
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques pour la période:', error)
      throw error
    }
  }

  /**
   * Récupère la timeline des dossiers créés
   */
  async getCreatedTimeline(): Promise<TimelineDataDto[]> {
    try {
      const response = await axios.get<TimelineDataDto[]>(
        `${API_URL}/dashboard/timeline/created`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la timeline créée:', error)
      throw error
    }
  }

  /**
   * Récupère la timeline des dossiers complétés
   */
  async getCompletedTimeline(): Promise<TimelineDataDto[]> {
    try {
      const response = await axios.get<TimelineDataDto[]>(
        `${API_URL}/dashboard/timeline/completed`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la timeline complétée:', error)
      throw error
    }
  }

  /**
   * Récupère le top des utilisateurs actifs (Admin only)
   */
  async getTopUsers(limit: number = 5): Promise<UserActivityDto[]> {
    try {
      const response = await axios.get<UserActivityDto[]>(
        `${API_URL}/dashboard/top-users`,
        {
          headers: this.getHeaders(),
          params: { limit }
        }
      )
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du top utilisateurs:', error)
      throw error
    }
  }

  /**
   * Récupère les statistiques de stockage
   */
  async getStorageStatistics(workspaceId: string): Promise<StorageStatisticsDto> {
    try {
      const response = await axios.get<StorageStatisticsDto>(
        `${API_URL}/dashboard/storage/${workspaceId}`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de stockage:', error)
      throw error
    }
  }
}

export const dashboardApi = DashboardApi.getInstance()
