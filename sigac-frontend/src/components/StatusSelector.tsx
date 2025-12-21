import React, { useState } from 'react';
import { UserStatus } from '../types/chat';
import { statusApi } from '../api/statusApi';

interface StatusSelectorProps {
  currentStatus: UserStatus;
  onStatusChange?: (status: UserStatus) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const statuses = [
    {
      value: UserStatus.EnLigne,
      label: 'En ligne',
      color: '#10b981',
      icon: '●',
      description: 'Disponible pour discuter'
    },
    {
      value: UserStatus.Occupe,
      label: 'Occupé',
      color: '#ef4444',
      icon: '●',
      description: 'Ne pas déranger'
    },
    {
      value: UserStatus.Absent,
      label: 'Absent',
      color: '#f59e0b',
      icon: '●',
      description: 'De retour bientôt'
    }
  ];

  const currentStatusInfo = statuses.find(s => s.value === status);

  const handleStatusChange = async (newStatus: UserStatus) => {
    try {
      await statusApi.updateStatus(newStatus);
      setStatus(newStatus);
      setIsOpen(false);
      onStatusChange?.(newStatus);
      
      // Mettre à jour le user dans localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.status = newStatus;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: currentStatusInfo?.color,
          boxShadow: `0 0 8px ${currentStatusInfo?.color}`,
          animation: 'pulse 2s ease-in-out infinite'
        }}></span>
        <span>{currentStatusInfo?.label}</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            padding: '8px',
            minWidth: '220px',
            zIndex: 1000,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Changer mon statut
            </div>
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: status === s.value ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = status === s.value ? 'rgba(255, 255, 255, 0.2)' : 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: s.color,
                  boxShadow: `0 0 10px ${s.color}`,
                  flexShrink: 0
                }}></span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>{s.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                    {s.description}
                  </div>
                </div>
                {status === s.value && <span style={{ fontSize: '16px' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default StatusSelector;
