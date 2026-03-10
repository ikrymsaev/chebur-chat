export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  isLocal: boolean;
}

export interface ChatPayload {
  text: string;
  senderId: string;
  timestamp: number;
}
