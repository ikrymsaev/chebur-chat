import { Service } from "@helfy/helfy";
import type { Message } from "@interfaces/chat";
import type { IChatStorage, RoomRecord } from "./interfaces";

const DB_NAME = "chebur-chat-db";
const DB_VERSION = 1;

interface MessageRecord extends Message {
  roomId: string;
}

@Service<IChatStorage>()
export class IndexedDBChatStorage implements IChatStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof indexedDB === "undefined") {
      return;
    }
    if (this.db) {
      return;
    }
    this.db = await this.openDB();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("rooms")) {
          const roomsStore = db.createObjectStore("rooms", { keyPath: "roomId" });
          roomsStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("messages")) {
          const messagesStore = db.createObjectStore("messages", { keyPath: "id" });
          messagesStore.createIndex("roomId", "roomId", { unique: false });
          messagesStore.createIndex("by_room_time", ["roomId", "timestamp"], {
            unique: false,
          });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase | null> {
    if (!this.db && typeof indexedDB !== "undefined") {
      await this.init();
    }
    return this.db;
  }

  async loadMessages(roomId: string): Promise<Message[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction("messages", "readonly");
      const index = tx.objectStore("messages").index("roomId");
      const req = index.getAll(IDBKeyRange.only(roomId));
      req.onsuccess = () => {
        const messages = req.result as MessageRecord[];
        messages.sort((a, b) => a.timestamp - b.timestamp);
        resolve(
          messages.map(({ roomId: _, ...msg }) => msg as Message)
        );
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveMessage(roomId: string, message: Message): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(["rooms", "messages"], "readwrite");
      const roomsStore = tx.objectStore("rooms");
      const messagesStore = tx.objectStore("messages");

      const messageRecord: MessageRecord = { ...message, roomId };
      messagesStore.put(messageRecord);

      const getRoom = roomsStore.get(roomId);
      getRoom.onsuccess = () => {
        const existing = getRoom.result as RoomRecord | undefined;
        roomsStore.put({
          roomId,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getChatList(): Promise<RoomRecord[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction("rooms", "readonly");
      const req = tx.objectStore("rooms").getAll();
      req.onsuccess = () => {
        const rooms = (req.result as RoomRecord[]).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
        resolve(rooms);
      };
      req.onerror = () => reject(req.error);
    });
  }
}
