import React, { useState } from 'react';
import { UsersApi } from '../../api/usersApi';

interface Props {
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ onClose }) => {
  const api = new UsersApi();
  const [step, setStep] = useState<1|2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [method, setMethod] = useState<'email'|'sms'>('email');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const requestCode = async () => {
    setLoading(true); setError(null);
    try {
      const resp = await api.requestPasswordChange(currentPassword, newPassword, method);
      setMessage(resp.message);
      setStep(2);
    } catch (e:any) {
      setError(e.message || 'Erreur');
    } finally { setLoading(false); }
  };

  const verifyCode = async () => {
    setLoading(true); setError(null);
    try {
      await api.verifyPasswordChange(code);
      setMessage('Mot de passe modifié avec succès.');
      onClose();
    } catch (e:any) {
      setError(e.message || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: 500, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 Changer mon mot de passe</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {step === 1 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Mot de passe actuel</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e=>setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Nouveau mot de passe</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e=>setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Méthode de vérification</label>
                <select 
                  value={method} 
                  onChange={e=>setMethod(e.target.value as 'email'|'sms')}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                >
                  <option value="email">📧 Email</option>
                  <option value="sms">📱 SMS</option>
                </select>
              </div>
              {error && <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
              {message && <div style={{ padding: 12, background: '#dbeafe', color: '#1e40af', borderRadius: 8, marginBottom: 16 }}>{message}</div>}
              <button 
                className="btn" 
                onClick={requestCode} 
                disabled={loading || !currentPassword || !newPassword}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', width: '100%', border: 'none' }}
              >
                {loading ? '⏳ Envoi...' : '📤 Envoyer le code'}
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <div style={{ padding: 16, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, marginBottom: 20 }}>
                <p style={{ margin: 0, color: '#15803d', fontSize: 14 }}>
                  ✅ {message || 'Un code de vérification a été envoyé.'}
                </p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Code de vérification (6 chiffres)</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e=>setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 18, textAlign: 'center', letterSpacing: 4 }}
                />
              </div>
              {error && <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
              <button 
                className="btn" 
                onClick={verifyCode} 
                disabled={loading || code.length !== 6}
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', width: '100%', border: 'none' }}
              >
                {loading ? '⏳ Vérification...' : '✅ Valider le code'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
