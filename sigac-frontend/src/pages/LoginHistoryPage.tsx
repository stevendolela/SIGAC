import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import './LoginHistoryPage.css';

interface LoginHistory {
  id: string;
  timestamp: string;
  userName: string;
  nomComplet: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  isSuccessful: boolean;
}

export default function LoginHistoryPage() {
  const { token, user } = useAuthStore();
  const [history, setHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    loadLoginHistory();
  }, [limit]);

  const loadLoginHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5210'}/api/LoginHistory/my-history?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        toast.error('Erreur lors de la récupération de l\'historique');
      }
    } catch (error) {
      console.error('Error loading login history:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getIpLocation = async (ip: string) => {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      if (response.ok) {
        const data = await response.json();
        return `${data.city}, ${data.country_name}`;
      }
      return 'Localisation indisponible';
    } catch {
      return 'Localisation indisponible';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié!');
  };

  return (
    <div className="login-history-container">
      <div className="login-history-header">
        <h1>📱 Historique de Connexion</h1>
        <p>Consultez vos dernières connexions et vérifiez les accès à votre compte</p>
      </div>

      <div className="login-history-controls">
        <select 
          value={limit} 
          onChange={(e) => setLimit(Number(e.target.value))}
          className="limit-selector"
        >
          <option value={10}>Les 10 dernières</option>
          <option value={25}>Les 25 dernières</option>
          <option value={50}>Les 50 dernières</option>
          <option value={100}>Les 100 dernières</option>
        </select>
        <button 
          onClick={loadLoginHistory}
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? '⏳ Chargement...' : '🔄 Rafraîchir'}
        </button>
      </div>

      {loading ? (
        <div className="login-history-loading">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="login-history-empty">
          <p>Aucune connexion enregistrée</p>
        </div>
      ) : (
        <div className="login-history-table-wrapper">
          <table className="login-history-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Adresse IP</th>
                <th>Device</th>
                <th>Navigateur</th>
                <th>Système d'exploitation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <tr className="login-history-row">
                    <td>
                      <div className="timestamp-cell">
                        <span className="time-icon">🕐</span>
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ip-cell">
                        <span className="ip-address">{entry.ipAddress}</span>
                        <button 
                          className="copy-btn" 
                          onClick={() => copyToClipboard(entry.ipAddress)}
                          title="Copier l'adresse IP"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="device-badge">{entry.device}</span>
                    </td>
                    <td>
                      <span className="browser-info">{entry.browser}</span>
                    </td>
                    <td>
                      <span className="os-info">{entry.os}</span>
                    </td>
                    <td>
                      <button 
                        className="details-btn"
                        onClick={() => setShowDetails(showDetails === entry.id ? null : entry.id)}
                      >
                        {showDetails === entry.id ? '▼' : '▶'} Détails
                      </button>
                    </td>
                  </tr>
                  {showDetails === entry.id && (
                    <tr className="login-history-details-row">
                      <td colSpan={6}>
                        <div className="details-panel">
                          <div className="detail-item">
                            <label>User-Agent Complet:</label>
                            <div className="user-agent-box">
                              <code>{entry.userAgent}</code>
                              <button 
                                className="copy-btn-small"
                                onClick={() => copyToClipboard(entry.userAgent)}
                              >
                                📋 Copier
                              </button>
                            </div>
                          </div>
                          <div className="detail-item">
                            <label>Statut:</label>
                            <span className="status-badge success">
                              {entry.isSuccessful ? '✅ Connexion réussie' : '❌ Échec de connexion'}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="login-history-info">
        <div className="info-card">
          <h3>🔒 Sécurité</h3>
          <p>Si vous voyez une connexion inhabituelle, changez immédiatement votre mot de passe.</p>
        </div>
        <div className="info-card">
          <h3>💡 Conseil</h3>
          <p>Consultez régulièrement cet historique pour détecter les accès non autorisés à votre compte.</p>
        </div>
      </div>
    </div>
  );
}
