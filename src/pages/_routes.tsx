import type { RouteConfig } from "@helfy/helfy";
import { HomePage } from "./HomePage";
import { CounterPage } from "./CounterPage";
import { AboutPage } from "./AboutPage";

export const routes: RouteConfig[] = [
  { path: "/", component: HomePage },
  { path: "/counter", component: CounterPage },
  { path: "/about", component: AboutPage },
];
