import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./styles.css";
import { App } from "./interfaces/web/App";
import { createComposition } from "./composition";

const { api, notifier, seed } = createComposition();
await seed();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App api={api} notifier={notifier} />
  </StrictMode>,
);
