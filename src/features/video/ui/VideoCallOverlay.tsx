import { View } from "@helfy/helfy";

interface Props {
  fromPeerId: string;
  onAccept: () => void;
  onReject: () => void;
}

@View
export class VideoCallOverlay {
  constructor(private readonly props: Props) {}

  render() {
    return (
      <div class="video-overlay">
        <div class="video-overlay__content">
          <p class="video-overlay__title">Входящий видеозвонок</p>
          <p class="video-overlay__peer">От: {this.props.fromPeerId}</p>
          <div class="video-overlay__actions">
            <button class="btn btn--primary" onclick={() => this.props.onAccept()}>
              Принять
            </button>
            <button class="btn" onclick={() => this.props.onReject()}>
              Отклонить
            </button>
          </div>
        </div>
      </div>
    );
  }
}
