import api from './api-client';

export interface UpdateUserStatusDto {
  status: number;
}

export const statusApi = {
  async updateStatus(status: number): Promise<void> {
    await api.put('/users/status', { status });
  }
};
