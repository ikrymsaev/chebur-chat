import { View, inject, router, type RouterAPI } from "@helfy/helfy";
import type { ChatStore } from "../ChatStore";
import type { ChatUseCase } from "../ChatUseCase";
import { ConnectionStatus } from "./ConnectionStatus";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

@View
export class ChatPage {
  @inject<ChatStore>() private store!: ChatStore;
  @inject<ChatUseCase>() private chatUseCase!: ChatUseCase;
  @router() private router!: RouterAPI;

  onMount() {
    if (this.store.connectionState === "idle" && !this.store.roomId) {
      this.router.push("/");
    }
  }

  private handleSendMessage(text: string) {
    this.chatUseCase.sendMessage(text);
  };

  private handleLeave() {
    this.chatUseCase.leaveRoom();
    this.router.push("/");
  };

  render() {
    const isConnected = this.store.connectionState === "connected";
    return (
      <div class="chat">
        <div class="chat__header">
          <ConnectionStatus state={this.store.connectionState} />
          <span class="chat__room">Комната: {this.store.roomId ?? "—"}</span>
          <button class="btn" onclick={() => this.handleLeave()}>
            Отключиться
          </button>
        </div>
        <MessageList />
        <MessageInput
          onSubmit={(text) => this.handleSendMessage(text)}
          disabled={!isConnected}
        />
      </div>
    );
  }
}
