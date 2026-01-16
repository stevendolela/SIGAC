import React, { useState, useEffect, useRef } from 'react';
import { videoCallApi } from '../api/videoCallApi';
import { VideoCallDto } from '../types/videoCall';
import '../styles/video-call.css';

export interface CallEndedInfo {
  duration: number; // en secondes
  status: 'completed' | 'missed' | 'rejected' | 'cancelled' | 'failed';
  isIncoming: boolean;
  receiverName: string;
}

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallEnded?: (info: CallEndedInfo) => void;
  receiverId: string;
  receiverName: string;
  conversationId?: string;
  isIncoming?: boolean;
  incomingCallId?: string;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  onCallEnded,
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
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const dialToneRef = useRef<any>(null);
  const ringtoneRef = useRef<any>(null);

  // Configuration ICE servers (STUN/TURN)
  const iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
      // Ajouter des serveurs TURN pour production
    ]
  };

  // Jouer la tonalité d'appel sortant (bip-bip classique)
  const playDialTone = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (startTime: number) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = 425; // Fréquence standard tonalité européenne
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.setValueAtTime(0.2, startTime + 0.4);
        gain.gain.setValueAtTime(0, startTime + 0.4);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      };

      // Jouer le bip toutes les 4 secondes (pattern standard)
      let currentTime = audioContext.currentTime;
      playBeep(currentTime);
      
      const dialInterval = setInterval(() => {
        if (dialToneRef.current) {
          currentTime = audioContext.currentTime;
          playBeep(currentTime);
        }
      }, 4000);

      dialToneRef.current = { audioContext, dialInterval };
    } catch (error) {
      console.error('Erreur tonalité:', error);
    }
  };

  const stopDialTone = () => {
    if (dialToneRef.current) {
      if (dialToneRef.current.dialInterval) {
        clearInterval(dialToneRef.current.dialInterval);
      }
      if (dialToneRef.current.audioContext) {
        dialToneRef.current.audioContext.close();
      }
      dialToneRef.current = null;
    }
  };

  // Sonnerie pour appel entrant
  const playRingtone = () => {
    try {
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

      // Jouer immédiatement
      let currentTime = audioContext.currentTime;
      playTone(currentTime);
      playTone(currentTime + 0.7);

      // Jouer la sonnerie en boucle
      const ringInterval = setInterval(() => {
        if (ringtoneRef.current) {
          currentTime = audioContext.currentTime;
          playTone(currentTime);
          playTone(currentTime + 0.7);
        }
      }, 2000);

      ringtoneRef.current = { audioContext, ringInterval };
    } catch (error) {
      console.error('Erreur lecture sonnerie:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      if (ringtoneRef.current.ringInterval) {
        clearInterval(ringtoneRef.current.ringInterval);
      }
      if (ringtoneRef.current.audioContext) {
        ringtoneRef.current.audioContext.close();
      }
      ringtoneRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }

    return () => {
      cleanup();
      stopDialTone();
      stopRingtone();
    };
  }, [isOpen]);

  // Gérer la tonalité/sonnerie selon le statut
  useEffect(() => {
    if (callStatus === 'ringing') {
      if (isIncoming) {
        // Appel entrant -> jouer sonnerie
        playRingtone();
      } else {
        // Appel sortant -> jouer tonalité
        playDialTone();
      }
    } else {
      // Appel actif ou terminé -> stopper tous les sons
      stopDialTone();
      stopRingtone();
    }
  }, [callStatus, isIncoming]);

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
      const pc = createPeerConnection(call.id);
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

    console.log('📞 Acceptation de l\'appel:', incomingCallId);

    try {
      // Accepter l'appel côté serveur
      const call = await videoCallApi.answerCall(incomingCallId);
      console.log('✅ Appel accepté côté serveur:', call);
      setCurrentCall(call);
      setCallStatus('active');

      // Créer la connexion WebRTC avec callId passé directement
      const pc = createPeerConnection(incomingCallId);
      peerConnectionRef.current = pc;

      // Ajouter les tracks locaux
      localStreamRef.current?.getTracks().forEach(track => {
        console.log('➕ [Receiver] Ajout track:', track.kind);
        pc.addTrack(track, localStreamRef.current!);
      });

      // Récupérer l'offre
      console.log('📥 Récupération de l\'offre SDP...');
      const signalingData = await videoCallApi.getSignalingData(incomingCallId);
      console.log('📥 SignalingData reçu:', signalingData?.substring(0, 100) + '...');
      
      if (signalingData) {
        const offer = JSON.parse(signalingData);
        console.log('📝 Offre parsée, type:', offer.type);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('✅ RemoteDescription définie');

        // Créer la réponse
        console.log('📝 Création de la réponse SDP...');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('✅ LocalDescription (answer) définie');

        // Envoyer la réponse au serveur
        console.log('📤 Envoi de la réponse au serveur...');
        await videoCallApi.saveSignalingData({
          callId: incomingCallId,
          type: 'answer',
          data: JSON.stringify(answer)
        });
        console.log('✅ Réponse envoyée');

        // Démarrer le polling des ICE candidates de l'initiateur
        console.log('🔄 Démarrage du polling ICE candidates...');
        pollForIceCandidates(incomingCallId, pc);
      } else {
        console.error('❌ Pas de signaling data (offre) trouvé!');
        throw new Error('Offre SDP non trouvée');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la réponse à l\'appel:', error);
      alert('Erreur lors de la réponse à l\'appel');
      handleEndCall();
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCallId) return;

    try {
      await videoCallApi.rejectCall(incomingCallId);
      // Notifier la fin de l'appel (rejeté)
      onCallEnded?.({
        duration: 0,
        status: 'rejected',
        isIncoming: true,
        receiverName
      });
      cleanup();
      onClose();
    } catch (error) {
      console.error('Erreur lors du rejet de l\'appel:', error);
    }
  };

  const handleEndCall = async () => {
    // Déterminer le statut de fin d'appel
    let endStatus: CallEndedInfo['status'] = 'completed';
    if (callStatus === 'ringing' && !isIncoming) {
      endStatus = 'cancelled';
    } else if (callStatus === 'connecting') {
      endStatus = 'failed';
    } else if (elapsedTime === 0) {
      endStatus = 'missed';
    }

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

    // Notifier la fin de l'appel avec les infos
    onCallEnded?.({
      duration: elapsedTime,
      status: endStatus,
      isIncoming,
      receiverName
    });

    cleanup();
    onClose();
  };

  const createPeerConnection = (callId: string): RTCPeerConnection => {
    console.log('🔗 Création PeerConnection pour callId:', callId);
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate généré:', event.candidate.candidate?.substring(0, 50) + '...');
        try {
          // Envoyer le ICE candidate au serveur avec le callId passé directement
          await videoCallApi.saveSignalingData({
            callId: callId,
            type: 'ice-candidate',
            data: JSON.stringify(event.candidate)
          });
          console.log('✅ ICE candidate envoyé au serveur');
        } catch (error) {
          console.error('❌ Erreur envoi ICE candidate:', error);
        }
      } else {
        console.log('🧊 ICE gathering terminé');
      }
    };

    pc.ontrack = (event) => {
      console.log('📺 Track distant reçu:', event.track.kind, event.streams.length, 'streams');
      console.log('📺 Event streams:', event.streams);
      console.log('📺 Track:', event.track);
      console.log('📺 remoteVideoRef.current:', remoteVideoRef.current);
      
      if (remoteVideoRef.current && event.streams[0]) {
        console.log('📺 Attribution du stream distant à la vidéo');
        remoteVideoRef.current.srcObject = event.streams[0];
        setHasRemoteStream(true);
        
        // Force play pour certains navigateurs
        remoteVideoRef.current.play().catch(err => {
          console.warn('⚠️ Auto-play bloqué:', err);
        });
        
        if (callStatus !== 'active') {
          setCallStatus('active');
        }
      } else {
        console.warn('⚠️ Pas de stream dans l\'événement ontrack ou ref manquante');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', pc.iceGatheringState);
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ Connexion WebRTC établie!');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log('❌ Connexion WebRTC perdue ou échouée');
        handleEndCall();
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    return pc;
  };

  const pollForIceCandidates = async (callId: string, pc: RTCPeerConnection) => {
    // Polling pour récupérer les ICE candidates de l'autre peer
    const maxAttempts = 60; // 60 secondes
    let attempts = 0;
    let lastCandidateCount = 0;

    console.log('🔄 Début polling ICE candidates pour callId:', callId);

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        console.log('🛑 Polling ICE candidates arrêté après 60s');
        return;
      }

      // Arrêter si connexion établie
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        clearInterval(interval);
        console.log('✅ ICE connecté, arrêt du polling');
        return;
      }

      try {
        const response = await videoCallApi.getIceCandidates(callId);
        const candidates = response || [];
        
        if (candidates.length > lastCandidateCount) {
          console.log(`📡 Nouveaux ICE candidates reçus: ${candidates.length - lastCandidateCount} (total: ${candidates.length})`);
          
          for (let i = lastCandidateCount; i < candidates.length; i++) {
            try {
              const candidateData = JSON.parse(candidates[i]);
              console.log('🧊 Ajout ICE candidate:', candidateData.candidate?.substring(0, 50) + '...');
              const candidate = new RTCIceCandidate(candidateData);
              await pc.addIceCandidate(candidate);
              console.log('✅ ICE candidate ajouté');
            } catch (parseError) {
              console.error('❌ Erreur parsing ICE candidate:', parseError);
            }
          }
          
          lastCandidateCount = candidates.length;
        }
      } catch (error) {
        console.error('❌ Erreur lors du polling des ICE candidates:', error);
      }
    }, 1000);
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
            
            // Démarrer le polling des ICE candidates du répondeur
            pollForIceCandidates(callId, peerConnectionRef.current);
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

    // Arrêter les sons
    stopDialTone();
    stopRingtone();

    setCallStatus('ended');
    setElapsedTime(0);
    setHasRemoteStream(false);
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
          {/* Placeholder quand pas de vidéo distante */}
          {!hasRemoteStream && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              zIndex: 1
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                marginBottom: '20px',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
              }}>
                {receiverName.charAt(0).toUpperCase()}
              </div>
              <div style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                {receiverName}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                {callStatus === 'connecting' && '⏳ Connexion en cours...'}
                {callStatus === 'ringing' && (isIncoming ? '📞 Appel entrant...' : '🔔 Ça sonne...')}
                {callStatus === 'active' && '📹 En attente de la vidéo...'}
              </div>
            </div>
          )}
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
            style={{ opacity: hasRemoteStream ? 1 : 0 }}
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
