import React, { useState, useEffect, useRef } from 'react';

interface VoiceRecorderProps {
  onSend: (audioFile: File, durationSeconds: number) => void;
  onCancel: () => void;
}

/**
 * Composant d'enregistrement de notes vocales - Style WhatsApp moderne
 */
export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Démarrer l'enregistrement automatiquement au montage
  useEffect(() => {
    startRecording();
    return () => {
      stopAllTimers();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, []);

  const stopAllTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setDuration(recordingTime);
        setIsPreviewing(true);
        
        // Arrêter le stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Démarrer le compteur
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur microphone:', error);
      alert('Impossible d\'accéder au microphone');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopAllTimers();
    setIsRecording(false);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSend = () => {
    if (!audioBlob) return;
    
    const audioFile = new File(
      [audioBlob],
      `voice-note-${Date.now()}.webm`,
      { type: 'audio/webm' }
    );
    
    onSend(audioFile, duration);
    
    // Cleanup
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync audio time with preview
  useEffect(() => {
    if (!audioRef.current || !isPreviewing) return;
    
    const audio = audioRef.current;
    
    const updateTime = () => {
      setPreviewTime(Math.floor(audio.currentTime));
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setPreviewTime(0);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isPreviewing]);

  // Générer les barres d'onde animées
  const WaveformBars = () => {
    const bars = 28;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        height: '40px',
        flex: 1
      }}>
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              background: isRecording 
                ? 'linear-gradient(to top, #10b981, #34d399)' 
                : isPlaying 
                  ? 'linear-gradient(to top, #3b82f6, #60a5fa)'
                  : '#cbd5e1',
              borderRadius: '2px',
              height: isRecording || (isPlaying && i <= (previewTime / duration) * bars)
                ? `${20 + Math.random() * 20}px`
                : '8px',
              transition: 'all 0.2s ease',
              animation: isRecording ? `wave 1.2s ease-in-out infinite ${i * 0.05}s` : 'none'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      width: '400px',
      maxWidth: 'calc(100vw - 40px)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      zIndex: 9999,
      animation: 'slideUp 0.3s ease'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes wave {
            0%, 100% { height: 8px; }
            50% { height: 32px; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }
        `}
      </style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        color: 'white'
      }}>
        {/* Icône micro WhatsApp style */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: isRecording ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          animation: isRecording ? 'pulse 1.5s infinite' : 'none'
        }}>
          🎙️
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>
            {isRecording ? 'Enregistrement...' : 'Prévisualisation'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'monospace' }}>
            {isPreviewing ? formatTime(previewTime) : formatTime(recordingTime)}
          </div>
        </div>

        {isRecording && (
          <button
            onClick={stopRecording}
            style={{
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
          >
            ⏹️ Stop
          </button>
        )}
      </div>

      {/* Waveform */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Bouton Play/Pause en preview */}
          {isPreviewing && (
            <button
              onClick={handlePlayPause}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
          )}
          
          {/* Waveform */}
          <WaveformBars />
        </div>
      </div>

      {/* Audio element caché pour le preview */}
      {isPreviewing && blobUrl && (
        <audio ref={audioRef} src={blobUrl} style={{ display: 'none' }} />
      )}

      {/* Boutons d'action - Uniquement en mode preview */}
      {isPreviewing && (
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🗑️ Supprimer
          </button>
          
          <button
            onClick={handleSend}
            style={{
              padding: '12px 24px',
              background: 'rgba(16, 185, 129, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(5, 150, 105, 0.9)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            }}
          >
            ✅ Envoyer
          </button>
        </div>
      )}

      {/* Instruction pendant l'enregistrement */}
      {isRecording && (
        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '13px',
          marginTop: '8px'
        }}>
          Cliquez sur Stop pour terminer l'enregistrement
        </div>
      )}
    </div>
  );
};
