import "../polyfills";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("app-root");
if (root) createRoot(root).render(<App />);
