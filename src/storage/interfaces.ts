import type { ConnectionState, Message, VideoCallState } from "@interfaces/chat";


export interface ChatStore {
  messages: Message[];
  connectionState: ConnectionState;
  roomId: string | null;
  localPeerId: string | null;
  remotePeerId: string | null;

  addMessage(msg: Message): void;
  clearMessages(): void;
  setConnectionState(state: ConnectionState): void;
  setRoomId(roomId: string | null): void;
  setLocalPeerId(id: string | null): void;
  setRemotePeerId(id: string | null): void;
  reset(): void;
}

export interface VideoStore {
  videoCallState: VideoCallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCallFrom: string | null;
  videoError: string | null;

  setVideoCallState(state: VideoCallState): void;
  setLocalStream(stream: MediaStream | null): void;
  setRemoteStream(stream: MediaStream | null): void;
  setIncomingCallFrom(peerId: string | null): void;
  setVideoError(msg: string | null): void;
  clearVideoError(): void;
  reset(): void;
}
