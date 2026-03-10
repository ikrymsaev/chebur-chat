import { effect, inject, View } from "@helfy/helfy";
import type { ChatStore } from "../ChatStore";

@View
export class MessageList {
  @inject<ChatStore>() private store!: ChatStore;

  private formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  @effect logMessages() {
    console.log("messages", this.store.messages)
  }

  render() {
    return (
      <div class="chat-messages">
        @for (msg of this.store.messages; track msg.id) {
          <div
            class={msg.isLocal ? "message message--local" : "message message--remote"}
          >
            <span class="message__text">{msg.text}</span>
            <span class="message__meta">{this.formatTime(msg.timestamp)}</span>
          </div>
        }
      </div>
    );
  }
}
