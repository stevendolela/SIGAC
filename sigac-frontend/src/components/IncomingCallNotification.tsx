import React, { useEffect, useRef } from 'react';
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
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Jouer la sonnerie quand visible
  useEffect(() => {
    if (isVisible) {
      // Créer et jouer la sonnerie
      ringtoneRef.current = new Audio();
      // Sonnerie base64 ou URL - utilisation d'un oscillateur Web Audio API
      playRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [isVisible]);

  const playRingtone = () => {
    try {
      // Utiliser Web Audio API pour générer une sonnerie
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (startTime: number) => {
        // Première note
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = 440; // La 440 Hz
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.3, startTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        osc1.start(startTime);
        osc1.stop(startTime + 0.5);

        // Deuxième note (plus haute)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 554.37; // Do# 
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, startTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.65);
        osc2.start(startTime + 0.15);
        osc2.stop(startTime + 0.65);
      };

      // Jouer la sonnerie en boucle
      let currentTime = audioContext.currentTime;
      const ringInterval = setInterval(() => {
        if (ringtoneRef.current) {
          currentTime = audioContext.currentTime;
          playTone(currentTime);
          playTone(currentTime + 0.7);
        }
      }, 2000);

      // Jouer immédiatement
      playTone(currentTime);
      playTone(currentTime + 0.7);

      // Stocker pour cleanup
      (ringtoneRef.current as any) = { audioContext, ringInterval };
    } catch (error) {
      console.error('Erreur lecture sonnerie:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      const ref = ringtoneRef.current as any;
      if (ref.ringInterval) {
        clearInterval(ref.ringInterval);
      }
      if (ref.audioContext) {
        ref.audioContext.close();
      }
      ringtoneRef.current = null;
    }
  };

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
