export interface ChatUseCase {
  createRoom(): string;
  joinRoom(roomId: string): void;
  sendMessage(text: string): boolean;
  leaveRoom(): void;
}

export interface VideoUseCase {
  startVideoCall(): Promise<void>;
  acceptIncomingCall(): Promise<void>;
  rejectIncomingCall(): void;
  endVideoCall(): void;
  setupCallbacks(): void;
}