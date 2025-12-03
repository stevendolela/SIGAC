import React, { useEffect, useState } from 'react';
import { SystemConfigApi, SmtpConfigurationDto, UpdateSmtpConfigurationDto, SmtpTestResultDto } from '../api/systemConfigApi';

// Page minimaliste et propre pour rétablir le build, avec les fonctionnalités essentielles
const SystemConfigPage: React.FC = () => {
  const api = new SystemConfigApi();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SmtpConfigurationDto | null>(null);
  const [testResult, setTestResult] = useState<SmtpTestResultDto | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [from, setFrom] = useState('');
  const [fromName, setFromName] = useState('');
  const [enableSsl, setEnableSsl] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getSmtpConfig()
      .then((data) => {
        if (data) {
          setConfig(data);
          setHost(data.host);
          setPort(data.port);
          setUsername(data.username || '');
          setFrom(data.from);
          setFromName(data.fromName || '');
          setEnableSsl(!!data.enableSsl);
          setIsEnabled(!!data.isEnabled);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const dto: UpdateSmtpConfigurationDto = {
        host,
        port,
        username: username || undefined,
        password: password || undefined,
        from,
        fromName: fromName || undefined,
        enableSsl,
        isEnabled,
      };
      const updated = await api.updateSmtpConfig(dto);
      setConfig(updated);
      setMessage({ type: 'success', text: 'Configuration SMTP enregistrée.' });
      setPassword('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testSmtpConnection({
        host,
        port,
        username: username || undefined,
        password: password || undefined,
        enableSsl,
        from: from || undefined,
        fromName: fromName || undefined,
        testEmailTo: testEmailTo || undefined,
      });
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'Échec du test',
        errorDetails: e?.message,
        testedAt: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: 24,
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Configuration SMTP</h1>

        {message && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              background: message.type === 'success' ? '#ecfdf5' : '#fee2e2',
              border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            }}
          >
            <strong>{message.text}</strong>
          </div>
        )}

        {/* Aide Gmail */}
        <div style={{ background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#1e40af' }}>💡 Configuration Gmail</div>
          <div style={{ fontSize: 13, color: '#1e40af' }}>
            <p style={{ margin: '4px 0' }}>• <strong>Serveur SMTP :</strong> smtp.gmail.com</p>
            <p style={{ margin: '4px 0' }}>• <strong>Port :</strong> 587 (recommandé avec StartTLS)</p>
            <p style={{ margin: '4px 0' }}>• <strong>SSL/TLS :</strong> Activé</p>
            <p style={{ margin: '4px 0' }}>• <strong>Mot de passe :</strong> Utilisez un <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', textDecoration: 'underline' }}>mot de passe d'application</a> (pas votre mot de passe Gmail)</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label>Serveur SMTP *</label>
              <input type="text" value={host} onChange={(e) => setHost(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Port *</label>
              <input type="number" value={port} onChange={(e) => setPort(parseInt(e.target.value) || 587)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Nom d'utilisateur</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Mot de passe {config?.hasPassword ? <span style={{ color: '#10b981' }}>✓ configuré</span> : null}
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Email expéditeur *</label>
              <input type="email" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Nom d'affichage</label>
              <input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={enableSsl} onChange={(e) => setEnableSsl(e.target.checked)} />
                <span>Activer SSL/TLS</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
                <span>Configuration activée</span>
              </label>
            </div>
            <button onClick={handleSave} disabled={saving || !host || !from}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label>Email de test (optionnel)</label>
              <input type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} style={{ width: '100%' }} />
            </div>
            <button onClick={handleTest} disabled={testing || !host} style={{ marginBottom: 12 }}>
              {testing ? 'Test en cours...' : 'Tester la connexion'}
            </button>

            {testResult && (
              <div style={{ padding: 12, borderRadius: 8, background: testResult.success ? '#ecfdf5' : '#fee2e2', border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}` }}>
                <strong>{testResult.success ? '✅ Succès' : '❌ Échec'}</strong>
                <div style={{ marginTop: 8 }}>{testResult.message}</div>
                {testResult.errorDetails && (
                  <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}>{testResult.errorDetails}</div>
                )}
                <div style={{ marginTop: 8, fontSize: 12 }}>Testé le {new Date(testResult.testedAt).toLocaleString('fr-FR')}</div>
              </div>
            )}

            {!testResult && config?.lastTestedAt && (
              <div style={{ padding: 12, borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                <div>Dernier test: {new Date(config.lastTestedAt).toLocaleString('fr-FR')}</div>
                <div>
                  Résultat: {config.lastTestSuccess ? '✅ Succès' : '❌ Échec'}
                  {config.lastTestError ? ` - ${config.lastTestError}` : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPage;
