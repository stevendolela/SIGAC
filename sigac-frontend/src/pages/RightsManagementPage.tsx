import { useEffect, useState } from 'react';
import { Shield, Lock, Construction, ArrowLeft, Wrench } from 'lucide-react';

export default function RightsManagementPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'Admin') {
        window.history.back();
      } else {
        setIsAdmin(true);
      }
    }
  }, []);

  // Page d'accès refusé pour non-admin
  if (!isAdmin) {
    return (
      <div className="panel">
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '16px',
          padding: '24px 32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex'
            }}>
              <Lock size={32} color="white" />
            </div>
            <div>
              <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 700 }}>
                Accès Refusé
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0', fontSize: '15px' }}>
                Accès Administrateur Requis
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Header moderne */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)'
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
            <Shield size={32} color="white" />
          </div>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 700 }}>
              Gestion des Droits d'Accès
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0', fontSize: '15px' }}>
              Configurez les permissions d'accès aux modules applicatifs
            </p>
          </div>
        </div>
      </div>

      {/* Message en cours de construction */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '2px dashed #e5e7eb'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Construction size={40} color="white" />
        </div>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 700, 
          color: '#1e293b', 
          margin: '0 0 12px 0' 
        }}>
          Fonctionnalité en cours de développement
        </h2>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#64748b', 
          margin: '0 0 24px 0',
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6
        }}>
          La gestion avancée des droits d'accès par rôle et module est actuellement en cours de construction. 
          Cette fonctionnalité sera disponible prochainement.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '16px 24px',
          background: '#fef3c7',
          borderRadius: '12px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <Wrench size={20} color="#d97706" />
          <span style={{ color: '#92400e', fontWeight: 600, fontSize: '14px' }}>
            Réservé aux Administrateurs
          </span>
        </div>

        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}
        >
          <ArrowLeft size={18} />
          Retour
        </button>
      </div>
    </div>
  );
}