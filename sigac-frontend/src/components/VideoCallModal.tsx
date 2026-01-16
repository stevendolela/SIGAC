import React, { useState, useEffect, useRef } from 'react';
import { videoCallApi } from '../api/videoCallApi';
import { VideoCallDto } from '../types/videoCall';
import '../styles/video-call.css';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  conversationId?: string;
  isIncoming?: boolean;
  incomingCallId?: string;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  conversationId,
  isIncoming = false,
  incomingCallId
}) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'active' | 'ended'>('connecting');
  const [currentCall, setCurrentCall] = useState<VideoCallDto | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Configuration ICE servers (STUN/TURN)
  const iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
      // Ajouter des serveurs TURN pour production
    ]
  };

  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Timer pour durée d'appel
  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      console.log('🎥 Requesting camera and microphone access...');
      console.log('🌐 Protocol:', window.location.protocol);
      console.log('🔒 Is secure context:', window.isSecureContext);
      
      // Vérifier si l'API est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }

      // Lister les périphériques disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('📱 Périphériques disponibles:', devices);
      const hasVideo = devices.some(d => d.kind === 'videoinput');
      const hasAudio = devices.some(d => d.kind === 'audioinput');
      console.log(`📹 Caméra: ${hasVideo ? 'Oui' : 'Non'}, 🎤 Micro: ${hasAudio ? 'Oui' : 'Non'}`);

      // Demander accès - version simplifiée d'abord
      console.log('⏳ Demande de permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: hasVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: hasAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      console.log('✅ Media stream obtained successfully:', stream);
      console.log('📊 Video tracks:', stream.getVideoTracks().length);
      console.log('📊 Audio tracks:', stream.getAudioTracks().length);
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📺 Local video element set');
      }

      if (isIncoming && incomingCallId) {
        console.log('📞 Appel entrant, passage en mode ringing');
        setCallStatus('ringing');
      } else {
        console.log('📞 Appel sortant, initiation...');
        await initiateOutgoingCall();
      }
    } catch (error: any) {
      console.error('❌ Erreur d\'accès aux médias:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      let errorMessage = `❌ Impossible d'accéder à la caméra ou au microphone.\n\nErreur: ${error.name}`;
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += '\n\n🔒 Permissions refusées!\n\nSolutions:\n1. Cliquez sur l\'icône 🔒 ou ⓘ à gauche de l\'URL\n2. Autorisez "Caméra" et "Microphone"\n3. Rechargez la page (F5)\n\nSi le problème persiste:\n- Vérifiez les paramètres système (Confidentialité)\n- Essayez un autre navigateur (Chrome recommandé)';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += '\n\n📹 Aucune caméra ou microphone détecté.\n\nVérifiez que:\n- Votre caméra est bien connectée\n- Les pilotes sont installés\n- Le périphérique n\'est pas désactivé';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += '\n\n⚠️ Caméra déjà utilisée!\n\nFermez ces applications:\n- Zoom, Teams, Skype\n- Autres onglets utilisant la caméra\n- Applications photo/vidéo';
      } else if (error.name === 'NotSupportedError' || error.message.includes('getUserMedia')) {
        errorMessage += '\n\n🌐 Navigateur non supporté!\n\nSolutions:\n- Utilisez HTTPS (pas HTTP)\n- Utilisez Chrome, Firefox ou Edge récent\n- Vérifiez que vous n\'êtes pas en navigation privée';
      } else if (error.name === 'TypeError') {
        errorMessage += '\n\n⚠️ Configuration non supportée.\n\nEssayez de:\n- Autoriser au moins l\'audio OU la vidéo\n- Vérifier les paramètres du navigateur';
      }
      
      alert(errorMessage);
      onClose();
    }
  };

  const initiateOutgoingCall = async () => {
    try {
      setCallStatus('ringing');

      console.log('📞 Création de l\'appel côté serveur...', { receiverId, conversationId });
      
      // Créer l'appel côté serveur
      const call = await videoCallApi.initiateCall({
        receiverId,
        conversationId
      });

      console.log('✅ Appel créé:', call);
      setCurrentCall(call);

      // Créer la connexion WebRTC
      console.log('🔗 Création de la connexion WebRTC...');
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Ajouter les tracks locaux
      localStreamRef.current?.getTracks().forEach(track => {
        console.log('➕ Ajout track:', track.kind);
        pc.addTrack(track, localStreamRef.current!);
      });

      // Créer l'offre
      console.log('📝 Création de l\'offre SDP...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('✅ Offre créée:', offer.type);

      // Envoyer l'offre au serveur
      console.log('📤 Envoi de l\'offre au serveur...');
      await videoCallApi.saveSignalingData({
        callId: call.id,
        type: 'offer',
        data: JSON.stringify(offer)
      });
      console.log('✅ Offre envoyée');

      // Polling pour récupérer la réponse (à améliorer avec WebSocket)
      pollForAnswer(call.id);
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initiation de l\'appel:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        response: error.response,
        status: error.status
      });
      
      let errorMessage = 'Erreur lors de l\'initiation de l\'appel';
      if (error.message) {
        errorMessage += `\n\nDétails: ${error.message}`;
      }
      if (error.response?.data?.message) {
        errorMessage += `\n\nServeur: ${error.response.data.message}`;
      }
      
      alert(errorMessage);
      handleEndCall();
    }
  };

  const handleAnswerCall = async () => {
    if (!incomingCallId) return;

    try {
      // Accepter l'appel côté serveur
      const call = await videoCallApi.answerCall(incomingCallId);
      setCurrentCall(call);
      setCallStatus('active');

      // Créer la connexion WebRTC
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Ajouter les tracks locaux
      localStreamRef.current?.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // Récupérer l'offre
      const signalingData = await videoCallApi.getSignalingData(incomingCallId);
      if (signalingData) {
        const offer = JSON.parse(signalingData);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Créer la réponse
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Envoyer la réponse au serveur
        await videoCallApi.saveSignalingData({
          callId: incomingCallId,
          type: 'answer',
          data: JSON.stringify(answer)
        });
      }
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'appel:', error);
      alert('Erreur lors de la réponse à l\'appel');
      handleEndCall();
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCallId) return;

    try {
      await videoCallApi.rejectCall(incomingCallId);
      cleanup();
      onClose();
    } catch (error) {
      console.error('Erreur lors du rejet de l\'appel:', error);
    }
  };

  const handleEndCall = async () => {
    if (currentCall) {
      try {
        if (callStatus === 'ringing' && !isIncoming) {
          await videoCallApi.cancelCall(currentCall.id);
        } else if (callStatus === 'active') {
          await videoCallApi.endCall(currentCall.id);
        }
      } catch (error) {
        console.error('Erreur lors de la fin de l\'appel:', error);
      }
    }

    cleanup();
    onClose();
  };

  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = async (event) => {
      if (event.candidate && currentCall) {
        // Envoyer le ICE candidate au serveur
        await videoCallApi.saveSignalingData({
          callId: currentCall.id,
          type: 'ice-candidate',
          data: JSON.stringify(event.candidate)
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        if (callStatus !== 'active') {
          setCallStatus('active');
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleEndCall();
      }
    };

    return pc;
  };

  const pollForAnswer = async (callId: string) => {
    // Polling simple - à remplacer par WebSocket en production
    const maxAttempts = 30; // 30 secondes
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        alert('Appel non répondu');
        handleEndCall();
        return;
      }

      try {
        const call = await videoCallApi.getCallById(callId);
        if (call.status === 'Active') {
          clearInterval(interval);
          setCallStatus('active');
          
          // Récupérer la réponse
          const signalingData = await videoCallApi.getSignalingData(callId);
          if (signalingData && peerConnectionRef.current) {
            const answer = JSON.parse(signalingData);
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        } else if (call.status === 'Rejected' || call.status === 'Cancelled') {
          clearInterval(interval);
          alert('Appel rejeté');
          handleEndCall();
        }
      } catch (error) {
        console.error('Erreur lors du polling:', error);
      }
    }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const cleanup = () => {
    // Arrêter les tracks locaux
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;

    // Fermer la connexion peer
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    // Arrêter le timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setCallStatus('ended');
    setElapsedTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="video-call-overlay">
      <div className="video-call-modal">
        <div className="video-call-header">
          <h3>{receiverName}</h3>
          <div className="call-status">
            {callStatus === 'connecting' && 'Connexion...'}
            {callStatus === 'ringing' && (isIncoming ? 'Appel entrant...' : 'Sonnerie...')}
            {callStatus === 'active' && formatTime(elapsedTime)}
          </div>
        </div>

        <div className="video-container">
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
          />
          <video
            ref={localVideoRef}
            className="local-video"
            autoPlay
            muted
            playsInline
          />
        </div>

        <div className="video-call-controls">
          {callStatus === 'ringing' && isIncoming ? (
            <>
              <button className="control-btn accept-btn" onClick={handleAnswerCall}>
                <span>📞</span>
                <span>Accepter</span>
              </button>
              <button className="control-btn reject-btn" onClick={handleRejectCall}>
                <span>❌</span>
                <span>Rejeter</span>
              </button>
            </>
          ) : callStatus !== 'connecting' ? (
            <>
              <button
                className={`control-btn ${isMuted ? 'active' : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'Activer le micro' : 'Couper le micro'}
              >
                <span>{isMuted ? '🔇' : '🎤'}</span>
              </button>
              <button
                className={`control-btn ${isVideoOff ? 'active' : ''}`}
                onClick={toggleVideo}
                title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
              >
                <span>{isVideoOff ? '📷' : '📹'}</span>
              </button>
              <button className="control-btn end-call-btn" onClick={handleEndCall}>
                <span>📞</span>
                <span>Terminer</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
