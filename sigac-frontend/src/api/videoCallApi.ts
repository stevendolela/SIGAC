import api from './api-client';
import { VideoCallDto, InitiateVideoCallDto, VideoCallSignalingDto } from '../types/videoCall';

class VideoCallApi {
  private baseUrl = '/videocall';

  /**
   * Initier un appel vidéo
   */
  async initiateCall(dto: InitiateVideoCallDto): Promise<VideoCallDto> {
    const response = await api.post(`${this.baseUrl}/initiate`, dto);
    return response.data;
  }

  /**
   * Répondre à un appel vidéo (accepter)
   */
  async answerCall(callId: string): Promise<VideoCallDto> {
    const response = await api.post(`${this.baseUrl}/${callId}/answer`);
    return response.data;
  }

  /**
   * Rejeter un appel vidéo
   */
  async rejectCall(callId: string): Promise<VideoCallDto> {
    const response = await api.post(`${this.baseUrl}/${callId}/reject`);
    return response.data;
  }

  /**
   * Terminer un appel vidéo en cours
   */
  async endCall(callId: string): Promise<VideoCallDto> {
    const response = await api.post(`${this.baseUrl}/${callId}/end`);
    return response.data;
  }

  /**
   * Annuler un appel vidéo (avant réponse)
   */
  async cancelCall(callId: string): Promise<VideoCallDto> {
    const response = await api.post(`${this.baseUrl}/${callId}/cancel`);
    return response.data;
  }

  /**
   * Obtenir les détails d'un appel
   */
  async getCallById(callId: string): Promise<VideoCallDto> {
    const response = await api.get(`${this.baseUrl}/${callId}`);
    return response.data;
  }

  /**
   * Obtenir l'historique des appels
   */
  async getCallHistory(page: number = 1, pageSize: number = 20): Promise<VideoCallDto[]> {
    const response = await api.get(`${this.baseUrl}/history?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  /**
   * Enregistrer des données de signalisation WebRTC
   */
  async saveSignalingData(dto: VideoCallSignalingDto): Promise<void> {
    await api.post(`${this.baseUrl}/signaling`, dto);
  }

  /**
   * Récupérer les données de signalisation pour un appel
   */
  async getSignalingData(callId: string): Promise<string | null> {
    const response = await api.get(`${this.baseUrl}/${callId}/signaling`);
    return response.data.data;
  }

  /**
   * Récupérer les appels entrants en attente
   */
  async getPendingCalls(): Promise<VideoCallDto[]> {
    const response = await api.get(`${this.baseUrl}/pending`);
    return response.data;
  }
}

export const videoCallApi = new VideoCallApi();

