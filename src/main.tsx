import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Na demonstração publicada, caixas de confirmação do navegador não aparecem
// (respondem "não" sozinhas); lá, apagar vai direto.
if (import.meta.env.MODE === "demo") window.confirm = () => true;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);