import React, { useState, useRef, useEffect } from 'react';
import { ChatAttachmentDto } from '../types/chat';

interface AudioPlayerProps {
  attachment: ChatAttachmentDto;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://sigac-api.onrender.com';

/**
 * Composant de lecture audio pour notes vocales - Design moderne et sexy
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({ attachment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.durationSeconds || 0);
  const [isHovering, setIsHovering] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Construire l'URL complète
  const audioUrl = attachment.downloadUrl.startsWith('http') 
    ? attachment.downloadUrl 
    : `${API_URL}${attachment.downloadUrl}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Erreur lecture audio:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Animation de wave pour l'état de lecture
  const WaveAnimation = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '20px' }}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            background: 'linear-gradient(to top, #25D366, #20ba5a)',
            borderRadius: '2px',
            animation: isPlaying ? `wave 0.8s ease-in-out infinite ${i * 0.1}s` : 'none',
            height: isPlaying ? '100%' : '30%',
            transition: 'height 0.2s ease',
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes wave {
          0%, 100% { height: 30%; }
          50% { height: 100%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .audio-player-container {
          position: relative;
          overflow: hidden;
        }
        .audio-player-container::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(37, 211, 102, 0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .audio-player-container:hover::before {
          opacity: 1;
        }
        .play-button {
          position: relative;
          overflow: hidden;
        }
        .play-button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          transform: translate(-50%, -50%);
          transition: width 0.3s ease, height 0.3s ease;
        }
        .play-button:active::after {
          width: 100%;
          height: 100%;
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #25D366;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(37, 211, 102, 0.4);
          transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 3px 10px rgba(37, 211, 102, 0.6);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #25D366;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(37, 211, 102, 0.4);
          transition: all 0.2s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 3px 10px rgba(37, 211, 102, 0.6);
        }
      `}</style>
      
      <div
        className="audio-player-container"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '20px',
          maxWidth: '320px',
          minWidth: '260px',
          boxShadow: isHovering 
            ? '0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(37, 211, 102, 0.1)'
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovering ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        {/* Bouton Play/Pause avec effet */}
        <button
          className="play-button"
          onClick={togglePlayPause}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #25D366 0%, #20ba5a 100%)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
          }}
        >
          {isPlaying ? '⏸' : '▶️'}
        </button>

        {/* Wave animation et barre de progression */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Wave animation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <WaveAnimation />
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '600',
              color: '#25D366',
              letterSpacing: '0.3px',
            }}>
              {formatTime(currentTime)}
            </span>
          </div>
          
          {/* Barre de progression stylée */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              outline: 'none',
              background: `linear-gradient(to right, #25D366 0%, #25D366 ${progress}%, #d1d5db ${progress}%, #d1d5db 100%)`,
              appearance: 'none',
              cursor: 'pointer',
            }}
          />
          
          {/* Durée totale */}
          <div style={{ 
            fontSize: '11px', 
            color: '#6b7280',
            textAlign: 'right',
            fontWeight: '500',
          }}>
            {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" />
    </>
  );
};
