import React from 'react';
import { VideoCallIcon, CloseIcon, CheckIcon } from './icons/ChatIcons';

interface IncomingCallNotificationProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
  isVisible: boolean;
}

export const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  callerName,
  onAccept,
  onReject,
  isVisible
}) => {
  // Note: La sonnerie est gérée par VideoCallModal
  // Ce composant est juste un overlay visuel

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '320px',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(99, 102, 241, 0.3)',
        padding: '20px',
        zIndex: 10000,
        animation: 'slideInUp 0.4s ease-out, pulse 2s ease-in-out infinite',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Animation CSS */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 60px rgba(99, 102, 241, 0.5);
          }
        }
        @keyframes ring {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>

      {/* Header avec icône animée */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '14px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'ring 0.5s ease-in-out infinite',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)'
        }}>
          <VideoCallIcon size={26} color="#fff" />
        </div>
        <div>
          <div style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '12px',
            fontWeight: '500',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            📞 Appel entrant
          </div>
          <div style={{ 
            color: '#fff', 
            fontSize: '18px', 
            fontWeight: '700',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            {callerName}
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        marginTop: '8px'
      }}>
        {/* Bouton Refuser */}
        <button
          onClick={onReject}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
          }}
        >
          <CloseIcon size={18} color="#fff" />
          Refuser
        </button>

        {/* Bouton Accepter */}
        <button
          onClick={onAccept}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
          }}
        >
          <CheckIcon size={18} color="#fff" />
          Répondre
        </button>
      </div>
    </div>
  );
};
