import { View } from "@helfy/helfy";

interface Props {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

@View
export class VideoCallButton {
  constructor(private readonly props: Props) {}

  render() {
    return (
      <button
        class="btn btn--video"
        onclick={() => this.props.onClick()}
        disabled={this.props.disabled || this.props.isLoading}
        title="Начать видеозвонок"
      >
        {this.props.isLoading ? "Вызов..." : "Видеозвонок"}
      </button>
    );
  }
}
