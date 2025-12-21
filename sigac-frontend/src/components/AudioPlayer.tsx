import React, { useState, useRef, useEffect } from 'react';
import { ChatAttachmentDto } from '../types/chat';

interface AudioPlayerProps {
  attachment: ChatAttachmentDto;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://sigac-api.onrender.com';

/**
 * Composant de lecture audio pour notes vocales - Style WhatsApp
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({ attachment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.durationSeconds || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Construire l'URL complète avec token si nécessaire
  const audioUrl = attachment.downloadUrl.startsWith('http') 
    ? attachment.downloadUrl 
    : `${API_URL}${attachment.downloadUrl}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleError = (e: Event) => {
      console.error('Erreur audio:', e);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('canplay', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('canplay', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Erreur lecture:', err);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <style>{`
        .whatsapp-audio-player {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #dcf8c6;
          border-radius: 7.5px;
          max-width: 280px;
          min-width: 220px;
        }
        
        .whatsapp-play-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 50%;
          border: none;
          background: #25D366;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          padding: 0;
          transition: background 0.2s;
        }
        
        .whatsapp-play-btn:hover {
          background: #128C7E;
        }
        
        .whatsapp-play-btn:active {
          transform: scale(0.95);
        }
        
        .whatsapp-waveform {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .whatsapp-progress-container {
          position: relative;
          height: 2px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 1px;
        }
        
        .whatsapp-progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #128C7E;
          border-radius: 1px;
          transition: width 0.1s linear;
        }
        
        .whatsapp-progress-input {
          position: absolute;
          top: -5px;
          left: 0;
          width: 100%;
          height: 12px;
          opacity: 0;
          cursor: pointer;
        }
        
        .whatsapp-time {
          font-size: 11px;
          color: rgba(0, 0, 0, 0.45);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
        }
        
        .whatsapp-waves {
          display: flex;
          align-items: center;
          gap: 1px;
          height: 16px;
        }
        
        .whatsapp-wave-bar {
          width: 2px;
          background: #128C7E;
          border-radius: 1px;
          transition: height 0.15s ease;
        }
        
        @keyframes wave-bounce {
          0%, 100% { height: 30%; }
          50% { height: 100%; }
        }
      `}</style>
      
      <div className="whatsapp-audio-player">
        {/* Bouton Play/Pause */}
        <button
          className="whatsapp-play-btn"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Waveform et progression */}
        <div className="whatsapp-waveform">
          {/* Barres de wave simplifiées */}
          <div className="whatsapp-waves">
            {[...Array(30)].map((_, i) => {
              const height = 20 + Math.sin(i * 0.5) * 20; // Variation de hauteur
              return (
                <div
                  key={i}
                  className="whatsapp-wave-bar"
                  style={{
                    height: `${height}%`,
                    opacity: isPlaying && i <= (progress / 100) * 30 ? 1 : 0.3,
                    animation: isPlaying ? `wave-bounce ${0.6 + (i % 3) * 0.2}s ease-in-out infinite ${i * 0.05}s` : 'none',
                  }}
                />
              );
            })}
          </div>
          
          {/* Barre de progression interactive */}
          <div className="whatsapp-progress-container">
            <div 
              className="whatsapp-progress-bar" 
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              className="whatsapp-progress-input"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
            />
          </div>
          
          {/* Temps */}
          <div className="whatsapp-time">
            {formatTime(isPlaying ? currentTime : duration)}
          </div>
        </div>
      </div>

      {/* Audio element (hidden) */}
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
      />
    </>
  );
};
