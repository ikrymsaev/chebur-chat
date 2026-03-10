# План добавления видеозвонка в Chebur-Chat

## 1. Текущее состояние

### Архитектура
- **PeerJS** — P2P через signaling server (localhost:9000)
- **DataConnection** — только текст чат (`ChatPayload`)
- **PeerService** — создаёт/подключается к комнатам, отправляет сообщения
- **Стек**: Helfy, TypeScript, Rspack

### Существующие компоненты
| Компонент | Роль |
|-----------|------|
| `PeerService` | Работа с PeerJS: `createRoom`, `joinRoom`, `send`, `disconnect` |
| `ChatStore` | Состояние: messages, connectionState, roomId, peerIds |
| `ChatUseCase` | createRoom, joinRoom, sendMessage, leaveRoom |
| `LobbyPage` | Создание/вход в комнату |
| `ChatPage` | Текстовый чат (MessageList, MessageInput) |

---

## 2. Целевая функциональность

- **Видеозвонок** в рамках уже установленного P2P-соединения
- Возможность **включить** или **выключить** видео во время сессии
- Отображение **локального** и **удалённого** видео
- Работа **одновременно** с текстовым чатом (чат остаётся доступен)
- Кнопка "Видеозвонок" появляется только когда соединение `connected`

---

## 3. Технический подход

### 3.1 MediaConnection (PeerJS)

PeerJS предоставляет `MediaConnection` в дополнение к `DataConnection`:

```
peer.call(remotePeerId, localStream)  → исходящий звонок
peer.on('call', (call) => call.answer(localStream))  → входящий звонок
call.on('stream', (stream) => ...)  → получение удалённого потока
```

- **DataConnection** — для текста (как сейчас)
- **MediaConnection** — для аудио/видео

### 3.2 getUserMedia

- `navigator.mediaDevices.getUserMedia({ video: true, audio: true })` — получение локального потока
- Требуется HTTPS или localhost (у нас dev на localhost)
- Разрешения пользователя (камера, микрофон)

### 3.3 Схема состояний видеозвонка

```
[нет звонка] → [звонок идёт] → [активный видеозвонок] → [завершён]
     ↑              |                    |
     |              v                    v
     +--------------+--------------------+
```

Возможные состояния: `idle` | `requesting` | `incoming` | `active` | `ended`

---

## 4. План реализации (по этапам)

### Этап 1: Расширение PeerService

**Цель:** добавить поддержку MediaConnection, не ломая текущий чат.

**Задачи:**
1. Добавить в `PeerService` методы:
   - `callVideo(remotePeerId: string): Promise<MediaConnection | null>`
   - `answerVideo(call: MediaConnection, localStream: MediaStream): void`
   - `endVideoCall(): void`
2. Добавить обработку входящих звонков: `peer.on('call', ...)`
3. Хранить ссылку на `MediaConnection` и `MediaStream`
4. Добавить callbacks: `onIncomingCall`, `onRemoteStream`, `onVideoCallEnded`
5. Экспортировать доступ к `Peer` (или `peer`) для `getUserMedia` — либо выполнять `getUserMedia` внутри PeerService/UseCase

**Файлы:** `src/shared/peer/PeerService.ts`, `src/shared/peer/types.ts`

---

### Этап 2: VideoStore и VideoUseCase

**Цель:** вынести логику видеозвонка в отдельный слой (Store + UseCase).

**VideoStore:**
- `videoCallState: 'idle' | 'requesting' | 'incoming' | 'active' | 'ended'`
- `localStream: MediaStream | null`
- `remoteStream: MediaStream | null`
- `incomingCallFrom: string | null` (для экрана "Входящий звонок")

**VideoUseCase:**
- `startVideoCall()` — запрашивает медиа, вызывает `peerService.callVideo()`
- `answerIncomingCall(accept: boolean)` — принять/отклонить
- `endVideoCall()` — закрыть соединение, остановить потоки
- Подписка на callbacks PeerService

**Файлы:** `src/features/video/VideoStore.ts`, `src/features/video/VideoUseCase.ts`

---

### Этап 3: UI видеозвонка

**Цель:** кнопки и область для видео.

**Компоненты:**
1. **VideoCallButton** — кнопка "Видеозвонок" в `ChatPage` (доступна при `connectionState === 'connected'`)
2. **VideoCallOverlay** (или модальное окно) — при `incoming`:
   - "Входящий видеозвонок от {peerId}"
   - Кнопки "Принять" / "Отклонить"
3. **VideoCallView** — при `active`:
   - Локальное видео (маленький превью)
   - Удалённое видео (большая область)
   - Кнопка "Завершить звонок"
   - Опционально: mute микрофона, вкл/выкл камеры
4. Интеграция в **ChatPage** — условный рендер `VideoCallView` / overlay

**Файлы:**
- `src/features/video/ui/VideoCallButton.tsx`
- `src/features/video/ui/VideoCallOverlay.tsx` (входящий звонок)
- `src/features/video/ui/VideoCallView.tsx` (активный звонок)
- Изменения в `ChatPage.tsx`

---

### Этап 4: Интеграция и отладка

**Задачи:**
1. Регистрация `VideoStore`, `VideoUseCase` в DI (Helfy)
2. Связка: ChatPage → VideoUseCase, VideoStore
3. Очистка при `disconnect` (leave room) — остановка видео, сброс состояния
4. Стили для видео-области (превью, full-width для remote)
5. Тестирование: два окна/вкладки, создание комнаты, подключение, видеозвонок

---

## 5. Структура файлов (итоговая)

```
src/
├── shared/peer/
│   ├── PeerService.ts       # + MediaConnection, callbacks
│   └── types.ts             # + VideoCallState, callback types
├── features/
│   ├── chat/                # без изменений (кроме ChatPage)
│   │   ├── ChatStore.ts
│   │   ├── ChatUseCase.ts
│   │   └── ui/
│   │       ├── ChatPage.tsx  # + VideoCallButton, VideoCallView
│   │       └── ...
│   └── video/
│       ├── VideoStore.ts
│       ├── VideoUseCase.ts
│       └── ui/
│           ├── VideoCallButton.tsx
│           ├── VideoCallOverlay.tsx
│           └── VideoCallView.tsx
```

---

## 6. Зависимости и ограничения

| Аспект | Решение |
|--------|---------|
| getUserMedia | Нативный Web API, без доп. библиотек |
| PeerJS | Уже используется, MediaConnection входит в peerjs |
| Сигналинг | Тот же Peer server — не меняется |
| Два участника | Текущая модель 1:1 (host + guest) — видеозвонок 1:1 |
| HTTPS | Для production нужен HTTPS (getUserMedia на HTTP ограничен) |

---

## 7. Риски и митигация

| Риск | Митигация |
|------|-----------|
| Отказ в доступе к камере/микрофону | Обработка ошибок `getUserMedia`, показ сообщения пользователю |
| NAT/firewall (не соединяется WebRTC) | Peer server на localhost — для локальной разработки ОК; для production — TURN-сервер при необходимости |
| Утечка MediaStream | Всегда вызывать `stream.getTracks().forEach(t => t.stop())` при завершении |

---

## 8. Порядок работ (чеклист)

- [x] Этап 1: Расширить PeerService (MediaConnection, callbacks)
- [x] Этап 2: VideoStore, VideoUseCase
- [x] Этап 3: UI (VideoCallButton, VideoCallOverlay, VideoCallView)
- [x] Этап 4: Интеграция в ChatPage, стили

---

## 9. Ссылки

- [PeerJS MediaConnection API](https://peerjs.com/client/api/media-connection)
- [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: Build a phone with PeerJS](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Build_a_phone_with_peerjs)
