export interface SmtpConfigurationDto {
  id: string;
  host: string;
  port: number;
  username?: string;
  from: string;
  fromName?: string;
  enableSsl: boolean;
  isEnabled: boolean;
  modifiedAt: string;
  modifiedBy: string;
  lastTestedAt?: string;
  lastTestSuccess?: boolean;
  lastTestError?: string;
  hasPassword: boolean;
}

export interface UpdateSmtpConfigurationDto {
  host: string;
  port: number;
  username?: string;
  password?: string;  // Si null/vide, le mot de passe existant n'est pas modifié
  from: string;
  fromName?: string;
  enableSsl: boolean;
  isEnabled: boolean;
}

export interface TestSmtpConnectionDto {
  host: string;
  port: number;
  username?: string;
  password?: string;
  enableSsl: boolean;
  from?: string;
  fromName?: string;
  testEmailTo?: string;
}

export interface SmtpTestResultDto {
  success: boolean;
  message: string;
  testedAt: string;
  errorDetails?: string;
}

export class SystemConfigApi {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5210/api';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  async getSmtpConfig(): Promise<SmtpConfigurationDto | null> {
    const res = await fetch(`${this.baseUrl}/system/smtp-config`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Échec de la récupération de la configuration SMTP');
    
    return res.json();
  }

  async updateSmtpConfig(dto: UpdateSmtpConfigurationDto): Promise<SmtpConfigurationDto> {
    const res = await fetch(`${this.baseUrl}/system/smtp-config`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    
    if (!res.ok) throw new Error('Échec de la mise à jour de la configuration SMTP');
    
    return res.json();
  }

  async testSmtpConnection(dto: TestSmtpConnectionDto): Promise<SmtpTestResultDto> {
    const res = await fetch(`${this.baseUrl}/system/smtp-config/test`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    
    if (!res.ok) throw new Error('Échec du test de connexion SMTP');
    
    return res.json();
  }
}
