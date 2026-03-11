import { UseCase, logger, type ILogger } from "@helfy/helfy";
import { nanoid } from "nanoid";
import type { PeerService } from "@services/index";
import type { Message, ConnectionState } from "@interfaces/chat";
import type { ChatStore, VideoStore } from "@storage/index";
import type { IChatStorage } from "@persistence/index";
import type { ChatUseCase } from "./interfaces";


@UseCase<ChatUseCase>()
export class ChatUseCaseImpl implements ChatUseCase {
  @logger() private log!: ILogger;

  constructor(
    private readonly store: ChatStore,
    private readonly peerService: PeerService,
    private readonly videoStore: VideoStore,
    private readonly chatStorage: IChatStorage
  ) {}

  createRoom(): string {
    this.store.reset();
    const roomId = this.peerService.createRoom();
    this.store.setRoomId(roomId);
    this.store.setConnectionState("connecting");

    this.chatStorage.loadMessages(roomId).then((msgs) => {
      if (this.store.roomId === roomId) {
        this.store.setMessages(msgs);
      }
    });

    this.peerService.setCallbacks({
      onConnected: (localId, remoteId) => {
        this.store.setConnectionError(null);
        this.store.setLocalPeerId(localId);
        this.store.setRemotePeerId(remoteId);
        this.store.setConnectionState("connected");
      },
      onDisconnected: () => {
        this.store.setConnectionState("disconnected");
      },
      onError: (msg) => this.store.setConnectionError(msg),
      onMessage: (payload) => {
        const msg: Message = {
          id: nanoid(),
          text: payload.text,
          senderId: payload.senderId,
          timestamp: payload.timestamp,
          isLocal: false,
        };
        this.store.addMessage(msg);
        if (this.store.roomId) {
          this.chatStorage.saveMessage(this.store.roomId, msg);
        }
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

    this.chatStorage.loadMessages(roomId).then((msgs) => {
      if (this.store.roomId === roomId) {
        this.store.setMessages(msgs);
      }
    });

    this.peerService.setCallbacks({
      onConnected: (localId, remoteId) => {
        this.store.setConnectionError(null);
        this.store.setLocalPeerId(localId);
        this.store.setRemotePeerId(remoteId);
        this.store.setConnectionState("connected");
      },
      onDisconnected: () => {
        this.store.setConnectionState("disconnected");
      },
      onError: (msg) => this.store.setConnectionError(msg),
      onMessage: (payload) => {
        const msg: Message = {
          id: nanoid(),
          text: payload.text,
          senderId: payload.senderId,
          timestamp: payload.timestamp,
          isLocal: false,
        };
        this.store.addMessage(msg);
        if (this.store.roomId) {
          this.chatStorage.saveMessage(this.store.roomId, msg);
        }
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
      if (this.store.roomId) {
        this.chatStorage.saveMessage(this.store.roomId, msg);
      }
    }
    return sent;
  }

  async openHistory(roomId: string): Promise<void> {
    this.store.reset();
    this.reclaimRetryCount = 0;
    this.store.setRoomId(roomId);
    this.store.setConnectionState("connecting");
    const msgs = await this.chatStorage.loadMessages(roomId);
    if (this.store.roomId === roomId) {
      this.store.setMessages(msgs);
    }
    this.connectOrReclaim(roomId);
  }

  private reclaimRetryCount = 0;
  private static readonly MAX_RECLAIM_RETRIES = 3;

  private getSharedCallbacks(roomId: string) {
    return {
      onConnected: (localId: string, remoteId: string) => {
        this.reclaimRetryCount = 0;
        this.store.setConnectionError(null);
        this.store.setLocalPeerId(localId);
        this.store.setRemotePeerId(remoteId);
        this.store.setConnectionState("connected");
      },
      onDisconnected: () => {
        this.store.setConnectionState("disconnected");
      },
      onError: (msg: string) => this.store.setConnectionError(msg),
      onPeerUnavailable: () => {
        this.reclaimRetryCount = 0;
        this.peerService.disconnect();
        this.peerService.setCallbacks(this.getSharedCallbacks(roomId));
        this.peerService.reclaimRoom(roomId);
      },
      onReclaimIdTaken: () => {
        this.peerService.disconnect();
        this.reclaimRetryCount++;
        if (this.reclaimRetryCount >= ChatUseCaseImpl.MAX_RECLAIM_RETRIES) {
          this.store.setConnectionError(
            "Не удалось возобновить комнату. ID занят. Попробуйте через минуту."
          );
          this.store.setConnectionState("error");
          this.reclaimRetryCount = 0;
          return;
        }
        const delay = this.reclaimRetryCount * 2000;
        setTimeout(() => {
          if (this.store.roomId === roomId) {
            this.peerService.setCallbacks(this.getSharedCallbacks(roomId));
            this.peerService.joinRoom(roomId);
          }
        }, delay);
      },
      onMessage: (payload: { text: string; senderId: string; timestamp: number }) => {
        const msg: Message = {
          id: nanoid(),
          text: payload.text,
          senderId: payload.senderId,
          timestamp: payload.timestamp,
          isLocal: false,
        };
        this.store.addMessage(msg);
        if (this.store.roomId) {
          this.chatStorage.saveMessage(this.store.roomId, msg);
        }
      },
      onStateChange: (state: ConnectionState) => {
        this.store.setConnectionState(state);
      },
    };
  }

  private connectOrReclaim(roomId: string): void {
    this.peerService.setCallbacks(this.getSharedCallbacks(roomId));
    this.peerService.joinRoom(roomId);
  }

  async getChatList() {
    return this.chatStorage.getChatList();
  }

  leaveRoom(): void {
    this.peerService.disconnect();
    this.videoStore.reset();
    this.store.reset();
  }
}
