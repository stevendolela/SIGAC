import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, Clock, User, Monitor, Globe, Shield, CheckCircle, XCircle, 
  Search, Filter, RefreshCw, Copy, ChevronDown, ChevronRight, AlertTriangle,
  Smartphone, Laptop, Info, Lock, Lightbulb, RotateCcw, X
} from 'lucide-react';
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

  // Stats calculées
  const stats = useMemo(() => {
    const total = allHistory.length;
    const successful = allHistory.filter(e => e.isSuccessful).length;
    const failed = total - successful;
    const uniqueDevices = new Set(allHistory.map(e => `${e.device}-${e.browser}-${e.os}`)).size;
    return { total, successful, failed, uniqueDevices };
  }, [allHistory]);

  return (
    <div className="login-history-container">
      {/* Header moderne */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <History size={32} color="white" />
          </div>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 700 }}>
              Historique de Connexion
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0', fontSize: '15px' }}>
              Consultez vos dernières connexions et vérifiez les accès à votre compte
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Total Connexions</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '4px 0 0 0' }}>{stats.total}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex'
            }}>
              <History size={24} color="white" />
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Réussies</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '4px 0 0 0' }}>{stats.successful}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex'
            }}>
              <CheckCircle size={24} color="white" />
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Échouées</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '4px 0 0 0' }}>{stats.failed}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex'
            }}>
              <XCircle size={24} color="white" />
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Appareils Uniques</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '4px 0 0 0' }}>{stats.uniqueDevices}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex'
            }}>
              <Laptop size={24} color="white" />
            </div>
          </div>
        </div>
      </div>

      <div className="login-history-controls" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button 
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: showAdvancedSearch ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'white',
            color: showAdvancedSearch ? 'white' : '#374151',
            border: showAdvancedSearch ? 'none' : '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          title="Afficher/Masquer la recherche avancée"
        >
          {showAdvancedSearch ? <X size={18} /> : <Search size={18} />}
          {showAdvancedSearch ? 'Masquer la recherche' : 'Recherche avancée'}
        </button>
        
        <select 
          value={limit} 
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            fontWeight: 500,
            color: '#374151'
          }}
        >
          <option value={10}>Les 10 dernières</option>
          <option value={25}>Les 25 dernières</option>
          <option value={50}>Les 50 dernières</option>
          <option value={100}>Les 100 dernières</option>
        </select>
        
        <button 
          onClick={loadLoginHistory}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Chargement...' : 'Rafraîchir'}
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

          <div className="search-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <button 
              onClick={resetFilters} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <RotateCcw size={18} />
              Réinitialiser les filtres
            </button>
            <span style={{ color: '#64748b', fontWeight: 500 }}>
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
                      <div className="timestamp-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#3b82f6" />
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          borderRadius: '8px',
                          padding: '6px',
                          display: 'flex'
                        }}>
                          <User size={16} color="white" />
                        </div>
                        <div className="user-info">
                          <span className="username">{entry.userName}</span>
                          <span className="fullname">{entry.nomComplet}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ip-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={16} color="#64748b" />
                        <span className="ip-address">{entry.ipAddress}</span>
                        <button 
                          onClick={() => copyToClipboard(entry.ipAddress)}
                          title="Copier l'adresse IP"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            color: '#64748b'
                          }}
                        >
                          <Copy size={14} />
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
                        onClick={() => setShowDetails(showDetails === entry.id ? null : entry.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: showDetails === entry.id ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
                          color: showDetails === entry.id ? 'white' : '#374151',
                          border: showDetails === entry.id ? 'none' : '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '13px'
                        }}
                      >
                        {showDetails === entry.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Détails
                      </button>
                    </td>
                  </tr>
                  {showDetails === entry.id && (
                    <tr className="login-history-details-row">
                      <td colSpan={7}>
                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '8px',
                          padding: '16px',
                          margin: '8px 0'
                        }}>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>User-Agent Complet:</label>
                            <div style={{
                              background: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px'
                            }}>
                              <code style={{ fontSize: '13px', color: '#64748b', wordBreak: 'break-all' }}>{entry.userAgent}</code>
                              <button 
                                onClick={() => copyToClipboard(entry.userAgent)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                  fontSize: '13px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Copy size={14} />
                                Copier
                              </button>
                            </div>
                          </div>
                          <div>
                            <label style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Statut:</label>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: entry.isSuccessful ? '#dcfce7' : '#fee2e2',
                              color: entry.isSuccessful ? '#16a34a' : '#dc2626',
                              borderRadius: '6px',
                              fontWeight: 500
                            }}>
                              {entry.isSuccessful ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              {entry.isSuccessful ? 'Connexion réussie' : 'Échec de connexion'}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginTop: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <div style={{
            background: '#f59e0b',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex'
          }}>
            <Lock size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '16px', fontWeight: 600 }}>Sécurité</h3>
            <p style={{ margin: 0, color: '#a16207', fontSize: '14px' }}>
              Si vous voyez une connexion inhabituelle, changez immédiatement votre mot de passe.
            </p>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <div style={{
            background: '#3b82f6',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex'
          }}>
            <Lightbulb size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '16px', fontWeight: 600 }}>Conseil</h3>
            <p style={{ margin: 0, color: '#1d4ed8', fontSize: '14px' }}>
              Consultez régulièrement cet historique pour détecter les accès non autorisés à votre compte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
