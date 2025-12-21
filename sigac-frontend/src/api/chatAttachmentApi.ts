import api from './api';

/**
 * API client pour gérer les pièces jointes et notes vocales dans le chat
 */
class ChatAttachmentApi {
  private baseUrl = '/chat';

  /**
   * Upload une pièce jointe dans une conversation
   */
  async uploadAttachment(
    conversationId: string, 
    file: File, 
    isVoiceNote: boolean = false, 
    durationSeconds?: number
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isVoiceNote', isVoiceNote.toString());
    if (durationSeconds) {
      formData.append('durationSeconds', durationSeconds.toString());
    }

    const response = await api.post(
      `${this.baseUrl}/conversations/${conversationId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data?.data || response.data;
  }

  /**
   * Upload une pièce jointe dans un groupe
   */
  async uploadGroupAttachment(
    chatGroupId: string, 
    file: File, 
    isVoiceNote: boolean = false, 
    durationSeconds?: number
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isVoiceNote', isVoiceNote.toString());
    if (durationSeconds) {
      formData.append('durationSeconds', durationSeconds.toString());
    }

    const response = await api.post(
      `${this.baseUrl}/groups/${chatGroupId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data?.data || response.data;
  }

  /**
   * Télécharge une pièce jointe
   */
  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const response = await api.get(
      `${this.baseUrl}/attachments/${attachmentId}/download`,
      {
        responseType: 'blob',
      }
    );

    return response.data;
  }

  /**
   * Supprime une pièce jointe
   */
  async deleteAttachment(attachmentId: string) {
    const response = await api.delete(
      `${this.baseUrl}/attachments/${attachmentId}`
    );

    return response.data;
  }

  /**
   * Obtient l'URL de téléchargement d'une pièce jointe
   */
  getDownloadUrl(attachmentId: string): string {
    return `${api.defaults.baseURL}${this.baseUrl}/attachments/${attachmentId}/download`;
  }
}

export const chatAttachmentApi = new ChatAttachmentApi();
