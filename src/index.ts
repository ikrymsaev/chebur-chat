import { createApp } from "@helfy/helfy";
import { App } from "./App";
import { routes } from "./pages/_routes";
import "./styles.css";

createApp({ root: document.getElementById("root")! })
  .router({ routes })
  .mount(App);
