import { View, inject, state, router, effect, type RouterAPI } from "@helfy/helfy";
import type { ChatStore } from "@storage/index";
import type { ChatUseCase } from "@use-cases/index";
import type { RoomRecord } from "@persistence/index";

@View
export class LobbyPage {
  @inject<ChatStore>() private store!: ChatStore;
  @inject<ChatUseCase>() private chatUseCase!: ChatUseCase;

  @router() private router!: RouterAPI;

  @state private roomIdInput = "";
  @state private createdRoomId: string | null = null;
  @state private mode: "choose" | "create" | "join" = "choose";
  @state private pastChats: RoomRecord[] = [];

  onMount() {
    this.chatUseCase.getChatList().then((chats) => {
      this.pastChats = chats;
    });
  }

  @effect
  navigateWhenConnected() {
    if (this.store.connectionState === "connected") {
      const timer = setTimeout(() => {
        this.router.push("/chat");
      }, 1500);
      return () => clearTimeout(timer);
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

  private handleOpenChat(roomId: string) {
    this.router.push("/chat/" + roomId);
  };

  private formatChatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  render() {
    return (
      <div class="page lobby">
        <h1>WebRTC Чат</h1>

        @if (this.mode === "choose") {
          <div class="lobby__choose">
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
            @if (this.pastChats.length > 0) {
              <div class="lobby__history">
                <h2 class="lobby__history-title">История чатов</h2>
                <ul class="lobby__chat-list">
                  @for (room of this.pastChats; track room.roomId) {
                    <li class="lobby__chat-item">
                      <button
                        type="button"
                        class="lobby__chat-btn"
                        onclick={() => this.handleOpenChat(room.roomId)}
                      >
                        <code class="lobby__chat-room-id">{room.roomId}</code>
                        <span class="lobby__chat-date">{this.formatChatDate(room.updatedAt)}</span>
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }
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
                    ? (this.store.connectionError ?? "Ошибка подключения")
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
                  ? (this.store.connectionError ?? "Ошибка подключения. Проверьте ID комнаты.")
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
