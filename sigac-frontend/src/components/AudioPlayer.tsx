import React, { useState, useRef, useEffect } from 'react';
import { ChatAttachmentDto } from '../types/chat';

interface AudioPlayerProps {
  attachment: ChatAttachmentDto;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://sigac-api.onrender.com';

/**
 * Composant de lecture audio pour notes vocales - Style moderne avec couleurs du site
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({ attachment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.durationSeconds || 0);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Télécharger le fichier audio avec authentification
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const token = localStorage.getItem('token');
        const url = attachment.downloadUrl.startsWith('http') 
          ? attachment.downloadUrl 
          : `${API_URL}${attachment.downloadUrl}`;

        console.log('[AudioPlayer] Tentative téléchargement:', url);
        console.log('[AudioPlayer] Token présent:', !!token);
        console.log('[AudioPlayer] Attachment ID:', attachment.id);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('[AudioPlayer] Response status:', response.status);
        console.log('[AudioPlayer] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          console.error('Erreur téléchargement audio:', response.status);
          console.error('Response text:', await response.text());
          return;
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        console.error('Erreur fetch audio:', err);
      }
    };

    fetchAudio();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [attachment.downloadUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;

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
      console.error('Erreur lecture audio:', e);
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
  }, [blobUrl]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;

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

  if (!blobUrl) {
    return (
      <div style={{ 
        padding: '10px 12px', 
        background: '#f3f4f6', 
        borderRadius: '12px',
        fontSize: '11px',
        color: '#6b7280'
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <>
      <style>{`
        .voice-note-player {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          max-width: 280px;
          min-width: 220px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }
        
        .voice-note-player:hover {
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
        }
        
        .voice-play-btn {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          padding: 0;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        
        .voice-play-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 3px 12px rgba(59, 130, 246, 0.4);
        }
        
        .voice-play-btn:active {
          transform: scale(0.98);
        }
        
        .voice-waveform {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .voice-progress-container {
          position: relative;
          height: 3px;
          background: #e5e7eb;
          border-radius: 1.5px;
          overflow: hidden;
        }
        
        .voice-progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 1.5px;
          transition: width 0.1s linear;
        }
        
        .voice-progress-input {
          position: absolute;
          top: -6px;
          left: 0;
          width: 100%;
          height: 15px;
          opacity: 0;
          cursor: pointer;
        }
        
        .voice-time {
          font-size: 11px;
          color: #64748b;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
          font-weight: 500;
        }
        
        .voice-waves {
          display: flex;
          align-items: center;
          gap: 1.5px;
          height: 18px;
        }
        
        .voice-wave-bar {
          width: 2.5px;
          background: #3b82f6;
          border-radius: 1px;
          transition: all 0.15s ease;
        }
        
        @keyframes wave-bounce {
          0%, 100% { height: 25%; opacity: 0.4; }
          50% { height: 100%; opacity: 1; }
        }
      `}</style>
      
      <div className="voice-note-player">
        {/* Bouton Play/Pause */}
        <button
          className="voice-play-btn"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Waveform et progression */}
        <div className="voice-waveform">
          {/* Barres de wave */}
          <div className="voice-waves">
            {[...Array(28)].map((_, i) => {
              const baseHeight = 25 + Math.sin(i * 0.4) * 15;
              const isActive = i <= (progress / 100) * 28;
              return (
                <div
                  key={i}
                  className="voice-wave-bar"
                  style={{
                    height: `${baseHeight}%`,
                    opacity: isActive ? 1 : 0.35,
                    animation: isPlaying && isActive ? `wave-bounce ${0.5 + (i % 4) * 0.15}s ease-in-out infinite ${i * 0.04}s` : 'none',
                  }}
                />
              );
            })}
          </div>
          
          {/* Barre de progression interactive */}
          <div className="voice-progress-container">
            <div 
              className="voice-progress-bar" 
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              className="voice-progress-input"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
            />
          </div>
          
          {/* Temps */}
          <div className="voice-time">
            {formatTime(isPlaying ? currentTime : duration)}
          </div>
        </div>
      </div>

      {/* Audio element (hidden) */}
      <audio 
        ref={audioRef} 
        src={blobUrl} 
        preload="metadata"
      />
    </>
  );
};
