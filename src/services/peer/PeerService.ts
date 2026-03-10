import { DataConnection, MediaConnection, Peer } from "peerjs";
import { Service, logger, type ILogger } from "@helfy/helfy";
import type { ChatPayload, ConnectionState } from "../../interfaces/chat";
import { nanoid } from "nanoid";
import type { PeerService, PeerServiceCallbacks, PeerServiceVideoCallbacks } from "./interface";


const PEER_OPTIONS = {
  host: "localhost",
  port: 9000,
  path: "/",
  secure: false,
  debug: 0,
} as const;

@Service<PeerService>()
export class PeerServiceImpl implements PeerService {
  @logger() private log!: ILogger;

  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private mediaConnection: MediaConnection | null = null;
  private callbacks: PeerServiceCallbacks | null = null;
  private videoCallbacks: PeerServiceVideoCallbacks | null = null;

  setCallbacks(cb: PeerServiceCallbacks | null) {
    this.callbacks = cb;
  }

  setVideoCallbacks(cb: PeerServiceVideoCallbacks | null) {
    this.videoCallbacks = cb;
  }

  private emitState(state: ConnectionState) {
    this.callbacks?.onStateChange(state);
  }

  createRoom(): string {
    const roomId = nanoid(8);
    this.log.info("Creating room", { roomId });

    this.emitState("connecting");
    this.peer = new Peer(roomId, PEER_OPTIONS);

    this.peer.on("open", (id) => {
      this.log.info("Peer open", { id });
    });

    this.peer.on("connection", (conn: DataConnection) => {
      this.log.info("Incoming connection", { from: conn.peer });
      this.connection = conn;
      this.setupConnection(conn, roomId, conn.peer);
    });

    this.setupPeerCallHandler();

    this.peer.on("error", (err) => {
      this.log.error("Peer error", { error: err });
      this.emitState("error");
    });

    this.peer.on("disconnected", () => {
      this.log.warn("Peer disconnected from signaling");
    });

    this.peer.on("close", () => {
      this.log.info("Peer closed");
      this.peer = null;
      this.connection = null;
      this.emitState("disconnected");
      this.callbacks?.onDisconnected();
    });

    return roomId;
  }

  joinRoom(roomId: string): void {
    this.log.info("Joining room", { roomId });

    this.emitState("connecting");
    this.peer = new Peer(PEER_OPTIONS);

    this.peer.on("open", (localId) => {
      this.log.info("Peer open, connecting to host", { localId, roomId });
      const conn = this.peer!.connect(roomId);
      this.connection = conn;
      this.setupConnection(conn, localId, roomId);
    });

    this.setupPeerCallHandler();

    this.peer.on("error", (err) => {
      this.log.error("Peer error", { error: err });
      this.emitState("error");
    });

    this.peer.on("close", () => {
      this.log.info("Peer closed");
      this.peer = null;
      this.connection = null;
      this.emitState("disconnected");
      this.callbacks?.onDisconnected();
    });
  }

  private setupConnection(
    conn: DataConnection,
    localPeerId: string,
    remotePeerId: string
  ) {
    conn.on("open", () => {
      this.log.info("DataConnection open");
      this.emitState("connected");
      this.callbacks?.onConnected(localPeerId, remotePeerId);
    });

    conn.on("data", (data: unknown) => {
      this.log.info("DataConnection data received", { raw: data, type: typeof data });
      try {
        const payload = data as ChatPayload;
        if (payload?.text && payload?.senderId && payload?.timestamp) {
          this.callbacks?.onMessage(payload);
        } else {
          this.log.warn("Data received but invalid payload", { payload });
        }
      } catch (e) {
        this.log.warn("Failed to parse message", { error: e });
      }
    });

    conn.on("close", () => {
      this.log.info("DataConnection closed");
      this.connection = null;
      this.emitState("disconnected");
      this.callbacks?.onDisconnected();
    });

    conn.on("error", (err) => {
      this.log.error("Connection error", { error: err });
      this.emitState("error");
    });
  }

  send(payload: ChatPayload): boolean {
    this.log.info("send", { text: payload.text, hasConnection: !!this.connection, connectionOpen: this.connection?.open });
    if (!this.connection?.open) {
      this.log.warn("Cannot send: connection not open");
      return false;
    }
    this.connection.send(payload);
    this.log.info("send OK", { text: payload.text });
    return true;
  }

  disconnect(): void {
    this.endVideoCall();
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.mediaConnection = null;
    this.callbacks = null;
    this.videoCallbacks = null;
    this.emitState("idle");
  }

  private setupPeerCallHandler(): void {
    if (!this.peer) return;
    this.peer.on("call", (call: MediaConnection) => {
      this.log.info("Incoming video call", { from: call.peer });
      this.videoCallbacks?.onIncomingCall(call, call.peer);
    });
  }

  callVideo(remotePeerId: string, localStream: MediaStream): MediaConnection | null {
    if (!this.peer) {
      this.log.warn("callVideo: no peer");
      return null;
    }
    this.log.info("Starting video call", { remotePeerId });
    const call = this.peer.call(remotePeerId, localStream);
    if (!call) {
      this.log.warn("callVideo: peer.call returned null");
      return null;
    }
    this.mediaConnection = call;
    this.setupMediaConnection(call);
    return call;
  }

  answerVideo(call: MediaConnection, localStream: MediaStream): void {
    this.log.info("Answering video call");
    this.mediaConnection = call;
    this.setupMediaConnection(call);
    call.answer(localStream);
  }

  private setupMediaConnection(call: MediaConnection): void {
    call.on("stream", (stream: MediaStream) => {
      this.log.info("Remote stream received");
      this.videoCallbacks?.onRemoteStream(stream);
    });
    call.on("close", () => {
      this.log.info("Media connection closed");
      this.mediaConnection = null;
      this.videoCallbacks?.onVideoCallEnded();
    });
    call.on("error", (err) => {
      this.log.error("Media connection error", { error: err });
      this.mediaConnection = null;
      this.videoCallbacks?.onVideoCallEnded();
    });
  }

  endVideoCall(): void {
    if (this.mediaConnection) {
      this.mediaConnection.close();
      this.mediaConnection = null;
    }
  }
}
