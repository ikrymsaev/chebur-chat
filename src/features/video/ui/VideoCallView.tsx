import { View, ref, effect } from "@helfy/helfy";

interface Props {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEnd: () => void;
}

@View
export class VideoCallView {
  constructor(private readonly props: Props) {}

  @ref private localVideo!: HTMLVideoElement;
  @ref private remoteVideo!: HTMLVideoElement;

  @effect
  syncVideoSrc() {
    const { localStream, remoteStream } = this.props;
    if (this.localVideo && localStream) {
      this.localVideo.srcObject = localStream;
    }
    if (this.remoteVideo && remoteStream) {
      this.remoteVideo.srcObject = remoteStream;
    }
  }

  render() {
    return (
      <div class="video-call">
        <div class="video-call__main">
          <video
            @ref(this.remoteVideo)
            class="video-call__remote"
            autoplay
            playsinline
            muted={false}
          />
          @if (!this.props.remoteStream) {
            <div class="video-call__placeholder">Ожидание собеседника...</div>
          }
        </div>
        <div class="video-call__preview">
          <video
            @ref(this.localVideo)
            class="video-call__local"
            autoplay
            playsinline
            muted
          />
        </div>
        <div class="video-call__controls">
          <button class="btn btn--danger" onclick={() => this.props.onEnd()}>
            Завершить звонок
          </button>
        </div>
      </div>
    );
  }
}
