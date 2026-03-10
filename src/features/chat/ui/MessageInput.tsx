import { View, state } from "@helfy/helfy";

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

@View
export class MessageInput {
  constructor(private readonly props: Props) {}

  @state private text = "";

  private handleSubmit(e: Event) {
    e.preventDefault();
    const t = this.text.trim();
    console.log("[MessageInput] handleSubmit", { text: t, disabled: this.props.disabled });
    if (t && !this.props.disabled) {
      this.props.onSubmit(t);
      this.text = "";
    }
  };

  render() {
    return (
      <form class="chat-input" onsubmit={(e) => this.handleSubmit(e)}>
        <input
          type="text"
          class="chat-input__field"
          placeholder="Введите сообщение..."
          @bind(this.text)
          disabled={this.props.disabled}
        />
        <button
          type="submit"
          class="btn btn--primary chat-input__submit"
          disabled={this.props.disabled || !this.text.trim()}
        >
          Отправить
        </button>
      </form>
    );
  }
}
