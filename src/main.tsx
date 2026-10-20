import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { startInstallListener } from "./lib/desafio/install";

// Na demonstração publicada, caixas de confirmação do navegador não aparecem
// (respondem "não" sozinhas); lá, apagar vai direto.
if (import.meta.env.MODE === "demo") window.confirm = () => true;

// botão "Instalar app" e service worker (app na tela de início, como nativo)
startInstallListener();

// Se o navegador tinha guardado uma versão antiga e um arquivo novo não carrega
// (acontece logo depois de publicar), recarrega a página uma vez.
window.addEventListener("vite:preloadError", () => {
  if (!sessionStorage.getItem("recarregou")) {
    sessionStorage.setItem("recarregou", "1");
    location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);