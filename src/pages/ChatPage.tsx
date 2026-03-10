import { View, inject, router, type RouterAPI } from "@helfy/helfy";
import type { ChatStore, VideoStore } from "@storage/index";
import type { VideoUseCase, ChatUseCase } from "@use-cases/index";
import { ConnectionStatus } from "@features/chat/ui/ConnectionStatus";
import { MessageList } from "@features/chat/ui/MessageList";
import { MessageInput } from "@features/chat/ui/MessageInput";
import { VideoCallButton } from "@features/video/ui/VideoCallButton";
import { VideoCallOverlay } from "@features/video/ui/VideoCallOverlay";
import { VideoCallView } from "@features/video/ui/VideoCallView";

@View
export class ChatPage {
  @router() private router!: RouterAPI;

  @inject<ChatStore>() private store!: ChatStore;
  @inject<ChatUseCase>() private chatUseCase!: ChatUseCase;
  @inject<VideoStore>() private videoStore!: VideoStore;
  @inject<VideoUseCase>() private videoUseCase!: VideoUseCase;

  onMount() {
    if (this.store.connectionState === "idle" && !this.store.roomId) {
      this.router.push("/");
    }
    this.videoUseCase.setupCallbacks();
  }

  private handleSendMessage(text: string) {
    this.chatUseCase.sendMessage(text);
  };

  private handleLeave() {
    this.chatUseCase.leaveRoom();
    this.router.push("/");
  };

  render() {
    return (
      <div class="chat">
        <div class="chat__header">
          <ConnectionStatus state={this.store.connectionState} />
          <span class="chat__room">Комната: {this.store.roomId ?? "—"}</span>
          <VideoCallButton
            disabled={this.store.connectionState !== "connected"}
            isLoading={this.videoStore.videoCallState === "requesting"}
            onClick={() => this.videoUseCase.startVideoCall()}
          />
          <button class="btn" onclick={() => this.handleLeave()}>
            Отключиться
          </button>
        </div>

        @if (this.videoStore.videoCallState === "incoming" && this.videoStore.incomingCallFrom) {
          <VideoCallOverlay
            fromPeerId={this.videoStore.incomingCallFrom}
            onAccept={() => this.videoUseCase.acceptIncomingCall()}
            onReject={() => this.videoUseCase.rejectIncomingCall()}
          />
        }

        @if (this.videoStore.videoCallState === "active") {
          <VideoCallView
            localStream={this.videoStore.localStream}
            remoteStream={this.videoStore.remoteStream}
            onEnd={() => this.videoUseCase.endVideoCall()}
          />
        }

        @if (this.videoStore.videoError) {
          <div class="video-error">
            <p class="video-error__text">{this.videoStore.videoError}</p>
            <button class="btn" onclick={() => this.videoStore.clearVideoError()}>
              Закрыть
            </button>
          </div>
        }

        @if (this.videoStore.videoCallState !== "active") {
          <>
            <MessageList />
            <MessageInput
              onSubmit={(text) => this.handleSendMessage(text)}
              disabled={this.store.connectionState !== "connected"}
            />
          </>
        }
      </div>
    );
  }
}
