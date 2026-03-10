import { UseCase, logger, type ILogger } from "@helfy/helfy";
import { nanoid } from "nanoid";
import type { PeerService } from "@shared/peer/PeerService";
import type { Message } from "@shared/peer/types";
import { ChatStore, ChatUseCase } from "./interfaces";


@UseCase<ChatUseCase>()
export class ChatUseCaseImpl implements ChatUseCase {
  @logger() private log!: ILogger;

  constructor(
    private readonly store: ChatStore,
    private readonly peerService: PeerService
  ) {}

  createRoom(): string {
    this.store.reset();
    const roomId = this.peerService.createRoom();
    this.store.setRoomId(roomId);
    this.store.setConnectionState("connecting");

    this.peerService.setCallbacks({
      onConnected: (localId, remoteId) => {
        this.store.setLocalPeerId(localId);
        this.store.setRemotePeerId(remoteId);
        this.store.setConnectionState("connected");
      },
      onDisconnected: () => {
        this.store.setConnectionState("disconnected");
      },
      onMessage: (payload) => {
        const msg: Message = {
          id: nanoid(),
          text: payload.text,
          senderId: payload.senderId,
          timestamp: payload.timestamp,
          isLocal: false,
        };
        this.store.addMessage(msg);
      },
      onStateChange: (state) => {
        this.store.setConnectionState(state);
      },
    });

    return roomId;
  }

  joinRoom(roomId: string): void {
    this.store.reset();
    this.store.setRoomId(roomId);
    this.store.setConnectionState("connecting");

    this.peerService.setCallbacks({
      onConnected: (localId, remoteId) => {
        this.store.setLocalPeerId(localId);
        this.store.setRemotePeerId(remoteId);
        this.store.setConnectionState("connected");
      },
      onDisconnected: () => {
        this.store.setConnectionState("disconnected");
      },
      onMessage: (payload) => {
        const msg: Message = {
          id: nanoid(),
          text: payload.text,
          senderId: payload.senderId,
          timestamp: payload.timestamp,
          isLocal: false,
        };
        this.store.addMessage(msg);
      },
      onStateChange: (state) => {
        this.store.setConnectionState(state);
      },
    });

    this.peerService.joinRoom(roomId);
  }

  sendMessage(text: string): boolean {
    const senderId = this.store.localPeerId;
    this.log.info("sendMessage", { text, senderId });
    if (!senderId) {
      this.log.warn("sendMessage: no senderId, aborting");
      return false;
    }

    const payload = {
      text,
      senderId,
      timestamp: Date.now(),
    };

    const sent = this.peerService.send(payload);
    this.log.info("sendMessage result", { sent });
    if (sent) {
      const msg: Message = {
        id: nanoid(),
        text: payload.text,
        senderId: payload.senderId,
        timestamp: payload.timestamp,
        isLocal: true,
      };
      this.store.addMessage(msg);
    }
    return sent;
  }

  leaveRoom(): void {
    this.peerService.disconnect();
    this.store.reset();
  }
}
