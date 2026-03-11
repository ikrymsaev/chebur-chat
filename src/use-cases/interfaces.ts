import type { RoomRecord } from "@persistence/index";

export interface ChatUseCase {
  createRoom(): string;
  joinRoom(roomId: string): void;
  openHistory(roomId: string): Promise<void>;
  getChatList(): Promise<RoomRecord[]>;
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