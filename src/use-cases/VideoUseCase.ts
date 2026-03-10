import { UseCase, logger, type ILogger } from "@helfy/helfy";
import type { MediaConnection } from "peerjs";
import type { PeerService } from "@services/index";
import type { ChatStore, VideoStore } from "@storage/index";
import type { VideoUseCase } from "./interfaces";

@UseCase<VideoUseCase>()
export class VideoUseCaseImpl implements VideoUseCase {
  @logger() private log!: ILogger;

  private pendingIncomingCall: MediaConnection | null = null;

  constructor(
    private readonly videoStore: VideoStore,
    private readonly chatStore: ChatStore,
    private readonly peerService: PeerService
  ) {}

  setupCallbacks(): void {
    this.peerService.setVideoCallbacks({
      onIncomingCall: (call, fromPeerId) => {
        this.log.info("onIncomingCall", { fromPeerId });
        this.pendingIncomingCall = call;
        this.videoStore.setIncomingCallFrom(fromPeerId);
        this.videoStore.setVideoCallState("incoming");
        call.on("close", () => {
          if (this.videoStore.videoCallState === "incoming") {
            this.pendingIncomingCall = null;
            this.videoStore.reset();
          }
        });
      },
      onRemoteStream: (stream) => {
        this.log.info("onRemoteStream");
        this.videoStore.setRemoteStream(stream);
        this.videoStore.setVideoCallState("active");
      },
      onVideoCallEnded: () => {
        this.log.info("onVideoCallEnded");
        this.pendingIncomingCall = null;
        this.videoStore.reset();
      },
    });
  }

  private async getUserMediaWithFallback(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      this.log.info("Video unavailable, falling back to audio only");
      return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    }
  }

  async startVideoCall(): Promise<void> {
    const remotePeerId = this.chatStore.remotePeerId;
    if (!remotePeerId) {
      this.log.warn("startVideoCall: no remote peer");
      return;
    }
    this.videoStore.setVideoCallState("requesting");
    try {
      const stream = await this.getUserMediaWithFallback();
      this.videoStore.setLocalStream(stream);
      const call = this.peerService.callVideo(remotePeerId, stream);
      if (!call) {
        this.videoStore.reset();
        return;
      }
      this.videoStore.setVideoCallState("active");
    } catch (err) {
      this.log.error("getUserMedia failed", { error: err });
      this.videoStore.setVideoError(this.getUserMediaErrorMessage(err));
      this.videoStore.setVideoCallState("error");
    }
  }

  private getUserMediaErrorMessage(err: unknown): string {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : String(err);
    if (name === "NotReadableError" || message.includes("Device in use")) {
      return "Камера или микрофон заняты. Закройте другие вкладки и приложения, использующие камеру. При тесте на одном устройстве — только один участник может использовать камеру.";
    }
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Нет доступа к камере или микрофону. Разрешите доступ в настройках браузера.";
    }
    if (name === "NotFoundError") {
      return "Камера или микрофон не найдены.";
    }
    return "Не удалось получить доступ к камере. Попробуйте ещё раз.";
  }

  async acceptIncomingCall(): Promise<void> {
    const call = this.pendingIncomingCall;
    if (!call) {
      this.log.warn("acceptIncomingCall: no pending call");
      return;
    }
    try {
      const stream = await this.getUserMediaWithFallback();
      this.videoStore.setLocalStream(stream);
      this.videoStore.setIncomingCallFrom(null);
      this.peerService.answerVideo(call, stream);
      this.pendingIncomingCall = null;
      this.videoStore.setVideoCallState("active");
    } catch (err) {
      this.log.error("acceptIncomingCall: getUserMedia failed", { error: err });
      call.close();
      this.pendingIncomingCall = null;
      this.videoStore.setVideoError(this.getUserMediaErrorMessage(err));
      this.videoStore.setIncomingCallFrom(null);
      this.videoStore.setVideoCallState("error");
    }
  }

  rejectIncomingCall(): void {
    if (this.pendingIncomingCall) {
      this.pendingIncomingCall.close();
      this.pendingIncomingCall = null;
    }
    this.videoStore.reset();
  }

  endVideoCall(): void {
    this.peerService.endVideoCall();
    this.videoStore.reset();
  }
}
