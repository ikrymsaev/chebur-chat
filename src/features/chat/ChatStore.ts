import { Store, state } from "@helfy/helfy";
import type { Message, ConnectionState } from "@shared/peer/types";
import { ChatStore } from "./interfaces";

@Store<ChatStore>()
export class ChatStoreImpl implements ChatStore {
  @state messages: Message[] = [];
  @state connectionState: ConnectionState = "idle";
  @state roomId: string | null = null;
  @state localPeerId: string | null = null;
  @state remotePeerId: string | null = null;

  addMessage(msg: Message) {
    this.messages = [...this.messages, msg];
  }

  clearMessages() {
    this.messages = [];
  }

  setConnectionState(state: ConnectionState) {
    this.connectionState = state;
  }

  setRoomId(roomId: string | null) {
    this.roomId = roomId;
  }

  setLocalPeerId(id: string | null) {
    this.localPeerId = id;
  }

  setRemotePeerId(id: string | null) {
    this.remotePeerId = id;
  }

  reset() {
    this.messages = [];
    this.connectionState = "idle";
    this.roomId = null;
    this.localPeerId = null;
    this.remotePeerId = null;
  }
}
