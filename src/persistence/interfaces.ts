import type { Message } from "@interfaces/chat";

export interface RoomRecord {
  roomId: string;
  createdAt: number;
  updatedAt: number;
}

export interface IChatStorage {
  init(): Promise<void>;
  loadMessages(roomId: string): Promise<Message[]>;
  saveMessage(roomId: string, message: Message): Promise<void>;
  getChatList(): Promise<RoomRecord[]>;
}
