import React, { useState, useRef, useEffect } from 'react';
import { ChatAttachmentDto } from '../types/chat';

interface AudioPlayerProps {
  attachment: ChatAttachmentDto;
}

/**
 * Composant de lecture audio pour notes vocales (style WhatsApp/Messenger)
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({ attachment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.durationSeconds || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      audio.play();
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: '#f0f2f5',
        borderRadius: '12px',
        maxWidth: '300px',
        minWidth: '250px',
      }}
    >
      {/* Bouton Play/Pause */}
      <button
        onClick={togglePlayPause}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: 'none',
          background: '#25D366',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#20ba5a')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#25D366')}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      {/* Barre de progression */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            outline: 'none',
            background: `linear-gradient(to right, #25D366 0%, #25D366 ${progress}%, #ddd ${progress}%, #ddd 100%)`,
            appearance: 'none',
            cursor: 'pointer',
          }}
        />
        
        {/* Temps */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#667781',
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Icône microphone */}
      <div
        style={{
          fontSize: '20px',
          color: '#667781',
          flexShrink: 0,
        }}
      >
        🎤
      </div>

      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={attachment.downloadUrl} preload="metadata" />
    </div>
  );
};
