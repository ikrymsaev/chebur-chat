

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

export interface ChatUseCase {
  createRoom(): string;
  joinRoom(roomId: string): void;
  sendMessage(text: string): boolean;
  leaveRoom(): void;
}