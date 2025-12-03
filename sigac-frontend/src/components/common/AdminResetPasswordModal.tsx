import React, { useState } from 'react';
import { UsersApi } from '../../api/usersApi';

interface Props {
  userId: string;
  onClose: () => void;
}

export const AdminResetPasswordModal: React.FC<Props> = ({ userId, onClose }) => {
  const api = new UsersApi();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [message, setMessage] = useState<string|null>(null);

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      await api.adminResetPassword(userId, newPassword);
      setMessage('Mot de passe réinitialisé');
      onClose();
    } catch (e:any) {
      setError(e.message || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Réinitialiser le mot de passe</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label>Nouveau mot de passe</label>
          <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          {error && <div className="error">{error}</div>}
          {message && <div className="info">{message}</div>}
          <button className="primary" onClick={submit} disabled={loading}>Réinitialiser</button>
        </div>
      </div>
    </div>
  );
};
