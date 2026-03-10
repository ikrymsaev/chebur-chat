import { View, inject, state, router, effect, type RouterAPI } from "@helfy/helfy";
import type { ChatStore } from "../ChatStore";
import type { ChatUseCase } from "../ChatUseCase";

@View
export class LobbyPage {
  @inject<ChatStore>() private store!: ChatStore;
  @inject<ChatUseCase>() private chatUseCase!: ChatUseCase;

  @router() private router!: RouterAPI;

  @state private roomIdInput = "";
  @state private createdRoomId: string | null = null;
  @state private mode: "choose" | "create" | "join" = "choose";

  @effect
  navigateWhenConnected() {
    if (this.store.connectionState === "connected") {
      this.router.push("/chat");
    }
  }

  private handleCreateRoom() {
    const roomId = this.chatUseCase.createRoom();
    this.createdRoomId = roomId;
    this.mode = "create";
  };

  private handleJoinRoom() {
    const roomId = this.roomIdInput.trim();
    if (roomId) {
      this.chatUseCase.joinRoom(roomId);
      this.mode = "join";
    }
  };

  private handleBack() {
    this.chatUseCase.leaveRoom();
    this.createdRoomId = null;
    this.roomIdInput = "";
    this.mode = "choose";
  };

  private copyRoomId() {
    if (this.createdRoomId) {
      navigator.clipboard.writeText(this.createdRoomId);
    }
  };

  render() {
    return (
      <div class="page lobby">
        <h1>WebRTC Чат</h1>

        @if (this.mode === "choose") {
          <div class="lobby__actions">
            <button class="btn btn--primary" onclick={() => this.handleCreateRoom()}>
              Создать комнату
            </button>
            <div class="lobby__divider">или</div>
            <div class="lobby__join">
              <input
                type="text"
                @bind(this.roomIdInput)
                class="chat-input__field lobby__input"
                placeholder="Введите ID комнаты"
              />
              <button
                class="btn btn--primary"
                onclick={() => this.handleJoinRoom()}
                disabled={!this.roomIdInput.trim()}
              >
                Подключиться
              </button>
            </div>
          </div>
        }

        @if (this.mode === "create" || this.mode === "join") {
          <div class="lobby__waiting">
            @if (this.mode === "create" && this.createdRoomId) {
              <div>
                <p class="lobby__hint">Поделитесь ID комнаты со вторым участником:</p>
                <div class="lobby__room-id">
                  <code class="lobby__room-code">{this.createdRoomId}</code>
                  <button class="btn" onclick={() => this.copyRoomId()}>
                    Копировать
                  </button>
                </div>
                <p class="lobby__status">
                  {this.store.connectionState === "connecting"
                    ? "Ожидаем второго участника..."
                    : this.store.connectionState === "connected"
                    ? "Подключено! Переход в чат..."
                    : this.store.connectionState === "error"
                    ? "Ошибка подключения"
                    : "Ожидание..."}
                </p>
              </div>
            }
            @if (this.mode === "join") {
              <p class="lobby__status">
                {this.store.connectionState === "connecting"
                  ? "Подключение..."
                  : this.store.connectionState === "connected"
                  ? "Подключено! Переход в чат..."
                  : this.store.connectionState === "error"
                  ? "Ошибка подключения. Проверьте ID комнаты."
                  : "Подключение к комнате..."}
              </p>
            }
            <button class="btn" onclick={() => this.handleBack()}>
              Отмена
            </button>
          </div>
        }
      </div>
    );
  }
}
