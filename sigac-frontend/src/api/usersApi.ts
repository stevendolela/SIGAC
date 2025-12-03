export class UsersApi {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5210/api';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  async adminResetPassword(userId: string, newPassword: string) {
    const res = await fetch(`${this.baseUrl}/users/admin/${userId}/reset-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    });
    if (!res.ok) throw new Error('Échec de la réinitialisation du mot de passe');
    return true;
  }

  async requestPasswordChange(currentPassword: string, newPassword: string, method: 'email'|'sms') {
    const res = await fetch(`${this.baseUrl}/users/password-change/request`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword, method })
    });
    if (!res.ok) throw new Error('Échec de la demande de changement de mot de passe');
    return res.json() as Promise<{ message: string; method: string; expiresAt: string }>;
  }

  async verifyPasswordChange(code: string) {
    const res = await fetch(`${this.baseUrl}/users/password-change/verify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code })
    });
    if (!res.ok) throw new Error('Échec de la vérification du code');
    return true;
  }
}
