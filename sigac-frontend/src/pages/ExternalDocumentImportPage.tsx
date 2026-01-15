import React, { useState } from 'react';
import './ExternalDocumentImportPage.css';

type ImportTab = 'ftp' | 'http';
type DossierMappingStrategy = 0 | 1 | 2 | 3;

interface FTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useSftp: boolean;
  basePath: string;
}

interface HTTPConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ImportConfig {
  sourcePath: string;
  dossierMappingStrategy: DossierMappingStrategy;
  maxFileSize?: number;
  allowedExtensions?: string[];
  filePattern?: string;
  excludePattern?: string;
  dateMin?: string;
  dateMax?: string;
}

interface ImportResult {
  importId: string;
  sourceType: string;
  message: string;
  startedAt: string;
  completedAt: string;
  documentsImported: number;
  documentsFailed: number;
  totalSize: string;
  successRate: number;
  durationSeconds: number;
  documents: any[];
  errors: any[];
}

const ExternalDocumentImportPage: React.FC = () => {
  // Get token from localStorage
  const token = localStorage.getItem('token');

  // FTP State
  const [ftpConfig, setFtpConfig] = useState<FTPConfig>({
    host: '',
    port: 21,
    username: '',
    password: '',
    useSftp: false,
    basePath: '/',
  });

  // HTTP State
  const [httpConfig, setHttpConfig] = useState<HTTPConfig>({
    baseUrl: '',
    headers: {},
    timeout: 30000,
  });

  // Import Config (shared)
  const [importConfig, setImportConfig] = useState<ImportConfig>({
    sourcePath: '/',
    dossierMappingStrategy: 0,
    maxFileSize: 52428800,
    allowedExtensions: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'jpg', 'png'],
  });

  // UI State
  const [activeTab, setActiveTab] = useState<ImportTab>('ftp');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<string>('');

  // Test FTP Connection
  const handleTestFTPConnection = async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult('');

    try {
      const response = await fetch(
        'https://sigac-api.onrender.com/api/ExternalDocumentImport/test-ftp-connection',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ftpConfig),
        }
      );

      if (response.ok) {
        setTestConnectionResult('✅ Connexion FTP réussie !');
      } else {
        const data = await response.json();
        setTestConnectionResult(`❌ Erreur: ${data.message || 'Connexion échouée'}`);
      }
    } catch (err: any) {
      setTestConnectionResult(`❌ Erreur réseau: ${err.message}`);
    } finally {
      setTestConnectionLoading(false);
    }
  };

  // Test HTTP Connection
  const handleTestHTTPConnection = async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult('');

    try {
      const response = await fetch(
        'https://sigac-api.onrender.com/api/ExternalDocumentImport/test-http-connection',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(httpConfig),
        }
      );

      if (response.ok) {
        setTestConnectionResult('✅ Connexion HTTP réussie !');
      } else {
        const data = await response.json();
        setTestConnectionResult(`❌ Erreur: ${data.message || 'Connexion échouée'}`);
      }
    } catch (err: any) {
      setTestConnectionResult(`❌ Erreur réseau: ${err.message}`);
    } finally {
      setTestConnectionLoading(false);
    }
  };

  // Start FTP Import
  const handleStartFTPImport = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        'https://sigac-api.onrender.com/api/ExternalDocumentImport/from-ftp',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ftpConfig,
            importConfig,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur lors de l\'import FTP');
      }
    } catch (err: any) {
      setError(`Erreur réseau: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Start HTTP Import
  const handleStartHTTPImport = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        'https://sigac-api.onrender.com/api/ExternalDocumentImport/from-http',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            httpConfig,
            importConfig,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur lors de l\'import HTTP');
      }
    } catch (err: any) {
      setError(`Erreur réseau: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartImport = () => {
    if (activeTab === 'ftp') {
      handleStartFTPImport();
    } else {
      handleStartHTTPImport();
    }
  };

  return (
    <div className="external-import-page">
      <div className="import-container">
        <h1>📁 Import de Documents depuis Source Externe</h1>
        <p className="subtitle">
          Importez des documents en masse depuis FTP/SFTP ou une API HTTP
        </p>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'ftp' ? 'active' : ''}`}
            onClick={() => setActiveTab('ftp')}
          >
            📊 FTP/SFTP
          </button>
          <button
            className={`tab ${activeTab === 'http' ? 'active' : ''}`}
            onClick={() => setActiveTab('http')}
          >
            🌐 HTTP/API
          </button>
        </div>

        {/* FTP Tab */}
        {activeTab === 'ftp' && (
          <div className="tab-content">
            <h2>Configuration FTP/SFTP</h2>

            <div className="form-group">
              <label>Serveur FTP</label>
              <input
                type="text"
                placeholder="ftp.example.com"
                value={ftpConfig.host}
                onChange={(e) =>
                  setFtpConfig({ ...ftpConfig, host: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Port</label>
                <input
                  type="number"
                  value={ftpConfig.port}
                  onChange={(e) =>
                    setFtpConfig({ ...ftpConfig, port: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={ftpConfig.useSftp}
                    onChange={(e) =>
                      setFtpConfig({ ...ftpConfig, useSftp: e.target.checked })
                    }
                  />
                  Utiliser SFTP
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Identifiant</label>
                <input
                  type="text"
                  value={ftpConfig.username}
                  onChange={(e) =>
                    setFtpConfig({ ...ftpConfig, username: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={ftpConfig.password}
                  onChange={(e) =>
                    setFtpConfig({ ...ftpConfig, password: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Chemin de base</label>
              <input
                type="text"
                placeholder="/"
                value={ftpConfig.basePath}
                onChange={(e) =>
                  setFtpConfig({ ...ftpConfig, basePath: e.target.value })
                }
              />
            </div>

            <button
              className="btn-secondary"
              onClick={handleTestFTPConnection}
              disabled={testConnectionLoading || !ftpConfig.host}
            >
              {testConnectionLoading ? '⏳ Test en cours...' : '🔌 Tester la connexion'}
            </button>

            {testConnectionResult && (
              <div className={`connection-result ${testConnectionResult.includes('✅') ? 'success' : 'error'}`}>
                {testConnectionResult}
              </div>
            )}
          </div>
        )}

        {/* HTTP Tab */}
        {activeTab === 'http' && (
          <div className="tab-content">
            <h2>Configuration HTTP/API</h2>

            <div className="form-group">
              <label>URL de base</label>
              <input
                type="text"
                placeholder="https://api.example.com"
                value={httpConfig.baseUrl}
                onChange={(e) =>
                  setHttpConfig({ ...httpConfig, baseUrl: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>En-têtes personnalisés (JSON)</label>
              <textarea
                placeholder='{"Authorization": "Bearer token", "Custom-Header": "value"}'
                value={JSON.stringify(httpConfig.headers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    setHttpConfig({ ...httpConfig, headers });
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                rows={5}
              />
            </div>

            <div className="form-group">
              <label>Timeout (ms)</label>
              <input
                type="number"
                value={httpConfig.timeout}
                onChange={(e) =>
                  setHttpConfig({
                    ...httpConfig,
                    timeout: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <button
              className="btn-secondary"
              onClick={handleTestHTTPConnection}
              disabled={testConnectionLoading || !httpConfig.baseUrl}
            >
              {testConnectionLoading ? '⏳ Test en cours...' : '🔌 Tester la connexion'}
            </button>

            {testConnectionResult && (
              <div className={`connection-result ${testConnectionResult.includes('✅') ? 'success' : 'error'}`}>
                {testConnectionResult}
              </div>
            )}
          </div>
        )}

        {/* Common Import Config */}
        <div className="import-config">
          <h2>⚙️ Configuration de l'Import</h2>

          <div className="form-group">
            <label>Chemin source</label>
            <input
              type="text"
              placeholder="/"
              value={importConfig.sourcePath}
              onChange={(e) =>
                setImportConfig({ ...importConfig, sourcePath: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Stratégie d'association aux dossiers</label>
            <select
              value={importConfig.dossierMappingStrategy}
              onChange={(e) =>
                setImportConfig({
                  ...importConfig,
                  dossierMappingStrategy: parseInt(e.target.value) as DossierMappingStrategy,
                })
              }
            >
              <option value={0}>0 - Dossier par défaut</option>
              <option value={1}>1 - Nom du dossier</option>
              <option value={2}>2 - Motif du nom du fichier</option>
              <option value={3}>3 - Créer nouveaux dossiers</option>
            </select>
          </div>

          <div className="form-group">
            <label>Extensions autorisées (séparées par virgule)</label>
            <input
              type="text"
              value={importConfig.allowedExtensions?.join(', ')}
              onChange={(e) =>
                setImportConfig({
                  ...importConfig,
                  allowedExtensions: e.target.value
                    .split(',')
                    .map((ext) => ext.trim())
                    .filter((ext) => ext),
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Taille maximale du fichier (bytes)</label>
            <input
              type="number"
              value={importConfig.maxFileSize}
              onChange={(e) =>
                setImportConfig({
                  ...importConfig,
                  maxFileSize: parseInt(e.target.value),
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Motif du fichier (regex optionnel)</label>
            <input
              type="text"
              placeholder=".*\.pdf"
              value={importConfig.filePattern || ''}
              onChange={(e) =>
                setImportConfig({ ...importConfig, filePattern: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Exclure motif (regex optionnel)</label>
            <input
              type="text"
              placeholder="TEMP_.*"
              value={importConfig.excludePattern || ''}
              onChange={(e) =>
                setImportConfig({
                  ...importConfig,
                  excludePattern: e.target.value,
                })
              }
            />
          </div>
        </div>

        {/* Error */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Start Button */}
        <button
          className="btn-primary"
          onClick={handleStartImport}
          disabled={loading}
        >
          {loading ? '⏳ Import en cours...' : '🚀 Démarrer l\'import'}
        </button>

        {/* Result */}
        {result && (
          <div className="result-container">
            <h2>✅ Résultat de l'Import</h2>

            <div className="result-grid">
              <div className="result-card">
                <div className="result-value">{result.documentsImported}</div>
                <div className="result-label">Documents importés</div>
              </div>

              <div className="result-card">
                <div className="result-value">{result.documentsFailed}</div>
                <div className="result-label">Documents en erreur</div>
              </div>

              <div className="result-card">
                <div className="result-value">{result.successRate.toFixed(2)}%</div>
                <div className="result-label">Taux de succès</div>
              </div>

              <div className="result-card">
                <div className="result-value">{result.totalSize}</div>
                <div className="result-label">Taille totale</div>
              </div>

              <div className="result-card">
                <div className="result-value">{result.durationSeconds.toFixed(2)}s</div>
                <div className="result-label">Durée</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="errors-section">
                <h3>Erreurs ({result.errors.length})</h3>
                <ul className="error-list">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <li key={index}>
                      <strong>{error.fileName}</strong>: {error.errorMessage}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>... et {result.errors.length - 10} autres erreurs</li>
                  )}
                </ul>
              </div>
            )}

            <div className="result-details">
              <p>
                <strong>ID d'import:</strong> {result.importId}
              </p>
              <p>
                <strong>Source:</strong> {result.sourceType}
              </p>
              <p>
                <strong>Message:</strong> {result.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalDocumentImportPage;
