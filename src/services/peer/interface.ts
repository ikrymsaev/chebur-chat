import { ChatPayload, ConnectionState } from "@interfaces/chat";
import { MediaConnection } from "peerjs";


export interface PeerService {
    createRoom(): string;
    joinRoom(roomId: string): void;
    send(payload: ChatPayload): boolean;
    disconnect(): void;
    setCallbacks(cb: PeerServiceCallbacks | null): void;
    setVideoCallbacks(cb: PeerServiceVideoCallbacks | null): void;
    callVideo(remotePeerId: string, localStream: MediaStream): MediaConnection | null;
    answerVideo(call: MediaConnection, localStream: MediaStream): void;
    endVideoCall(): void;
}

export interface PeerServiceCallbacks {
    onConnected: (localPeerId: string, remotePeerId: string) => void;
    onDisconnected: () => void;
    onMessage: (payload: ChatPayload) => void;
    onStateChange: (state: ConnectionState) => void;
}
  
export interface PeerServiceVideoCallbacks {
    onIncomingCall: (call: MediaConnection, fromPeerId: string) => void;
    onRemoteStream: (stream: MediaStream) => void;
    onVideoCallEnded: () => void;
}