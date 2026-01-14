import React, { useState, useEffect } from 'react';
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
  const [allHistory, setAllHistory] = useState<LoginHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Filtres de recherche avancée
  const [searchUsername, setSearchUsername] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  const [searchDevice, setSearchDevice] = useState('');
  const [searchBrowser, setSearchBrowser] = useState('');
  const [searchOS, setSearchOS] = useState('');
  const [searchIP, setSearchIP] = useState('');
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    if (token) {
      loadLoginHistory();
    }
  }, [limit, token, isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [allHistory, searchUsername, searchDateFrom, searchDateTo, searchDevice, searchBrowser, searchOS, searchIP]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple notification using browser alert
    // A more polished version could use a notification component library
    const bgColor = type === 'success' ? '#4caf50' : '#f44336';
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 16px 24px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const loadLoginHistory = async () => {
    setLoading(true);
    try {
      let endpoint = 'LoginHistory/my-history';
      
      // Détermine l'endpoint selon le rôle
      if (isAdmin) {
        endpoint = 'LoginHistory/all';
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5210'}/${endpoint}?limit=${limit}`,
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
        setAllHistory(data);
      } else {
        showNotification('Erreur lors de la récupération de l\'historique', 'error');
      }
    } catch (error) {
      console.error('Error loading login history:', error);
      showNotification('Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allHistory];

    // Filtre par utilisateur (username ou nom complet)
    if (searchUsername.trim()) {
      const search = searchUsername.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.userName.toLowerCase().includes(search) ||
        entry.nomComplet.toLowerCase().includes(search)
      );
    }

    // Filtre par date
    if (searchDateFrom) {
      const dateFrom = new Date(searchDateFrom);
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= dateFrom);
    }
    if (searchDateTo) {
      const dateTo = new Date(searchDateTo);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= dateTo);
    }

    // Filtre par device
    if (searchDevice) {
      filtered = filtered.filter(entry => entry.device === searchDevice);
    }

    // Filtre par navigateur
    if (searchBrowser) {
      filtered = filtered.filter(entry => entry.browser === searchBrowser);
    }

    // Filtre par OS
    if (searchOS) {
      filtered = filtered.filter(entry => entry.os === searchOS);
    }

    // Filtre par IP
    if (searchIP.trim()) {
      filtered = filtered.filter(entry => entry.ipAddress.includes(searchIP.trim()));
    }

    setFilteredHistory(filtered);
  };

  const resetFilters = () => {
    setSearchUsername('');
    setSearchDateFrom('');
    setSearchDateTo('');
    setSearchDevice('');
    setSearchBrowser('');
    setSearchOS('');
    setSearchIP('');
  };

  const getUniqueValues = (key: 'device' | 'browser' | 'os') => {
    return [...new Set(allHistory.map(entry => entry[key]))].sort();
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
    showNotification('Copié!', 'success');
  };

  return (
    <div className="login-history-container">
      <div className="login-history-header">
        <h1>📱 Historique de Connexion</h1>
        <p>Consultez vos dernières connexions et vérifiez les accès à votre compte</p>
      </div>

      <div className="login-history-controls">
        <button 
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          className="search-toggle-btn"
          title="Afficher/Masquer la recherche avancée"
        >
          {showAdvancedSearch ? '🔍 Masquer la recherche' : '🔍 Recherche avancée'}
        </button>
        
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

      {showAdvancedSearch && (
        <div className="advanced-search-panel">
          <div className="search-row">
            <div className="search-field">
              <label>Utilisateur</label>
              <input
                type="text"
                placeholder="Nom ou prénom..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="search-field">
              <label>IP Address</label>
              <input
                type="text"
                placeholder="Entrer une IP..."
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="search-row">
            <div className="search-field">
              <label>Date de début</label>
              <input
                type="date"
                value={searchDateFrom}
                onChange={(e) => setSearchDateFrom(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="search-field">
              <label>Date de fin</label>
              <input
                type="date"
                value={searchDateTo}
                onChange={(e) => setSearchDateTo(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="search-row">
            <div className="search-field">
              <label>Device</label>
              <select
                value={searchDevice}
                onChange={(e) => setSearchDevice(e.target.value)}
                className="search-input"
              >
                <option value="">Tous les devices</option>
                {getUniqueValues('device').map(device => (
                  <option key={device} value={device}>{device}</option>
                ))}
              </select>
            </div>

            <div className="search-field">
              <label>Navigateur</label>
              <select
                value={searchBrowser}
                onChange={(e) => setSearchBrowser(e.target.value)}
                className="search-input"
              >
                <option value="">Tous les navigateurs</option>
                {getUniqueValues('browser').map(browser => (
                  <option key={browser} value={browser}>{browser}</option>
                ))}
              </select>
            </div>

            <div className="search-field">
              <label>OS</label>
              <select
                value={searchOS}
                onChange={(e) => setSearchOS(e.target.value)}
                className="search-input"
              >
                <option value="">Tous les OS</option>
                {getUniqueValues('os').map(os => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="search-actions">
            <button onClick={resetFilters} className="reset-btn">
              ↺ Réinitialiser les filtres
            </button>
            <span className="results-count">
              {filteredHistory.length} résultats trouvés
            </span>
          </div>
        </div>
      )}
      {loading ? (
        <div className="login-history-loading">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      ) : allHistory.length === 0 ? (
        <div className="login-history-empty">
          <p>Aucune connexion enregistrée</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="login-history-empty">
          <p>Aucune connexion ne correspond à vos critères de recherche</p>
        </div>
      ) : (
        <div className="login-history-table-wrapper">
          <table className="login-history-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Utilisateur</th>
                <th>Adresse IP</th>
                <th>Device</th>
                <th>Navigateur</th>
                <th>Système d'exploitation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <tr className="login-history-row">
                    <td>
                      <div className="timestamp-cell">
                        <span className="time-icon">🕐</span>
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-badge">👤</span>
                        <div className="user-info">
                          <span className="username">{entry.userName}</span>
                          <span className="fullname">{entry.nomComplet}</span>
                        </div>
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
