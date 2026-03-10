import type { RouteConfig } from "@helfy/helfy";
import { HomePage } from "./HomePage";
import { CounterPage } from "./CounterPage";
import { AboutPage } from "./AboutPage";
import { LobbyPage } from "@features/chat/ui/LobbyPage";
import { ChatPage } from "@pages/ChatPage";

export const routes: RouteConfig[] = [
  { path: "/", component: LobbyPage },
  { path: "/chat", component: ChatPage },
  { path: "/welcome", component: HomePage },
  { path: "/counter", component: CounterPage },
  { path: "/about", component: AboutPage },
];
