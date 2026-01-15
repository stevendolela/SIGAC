export interface VideoCallDto {
  id: string;
  initiatorId: string;
  initiatorName: string;
  receiverId: string;
  receiverName: string;
  conversationId?: string;
  groupId?: string;
  status: 'Initiating' | 'Active' | 'Ended' | 'Rejected' | 'Missed' | 'Cancelled';
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface InitiateVideoCallDto {
  receiverId: string;
  conversationId?: string;
  groupId?: string;
}

export interface VideoCallSignalingDto {
  callId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: string;
}

export interface UpdateVideoCallStatusDto {
  callId: string;
  status: 'active' | 'ended' | 'rejected' | 'cancelled';
}
