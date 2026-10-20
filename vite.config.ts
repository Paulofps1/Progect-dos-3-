import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
// Modo "demo" (npm run build:demo): troca o banco de verdade por um falso no navegador
// e gera arquivos com caminhos relativos, para abrir de qualquer endereço.
export default defineConfig(({ mode }) => ({
  base: mode === "demo" ? "./" : "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: [
      ...(mode === "demo"
        ? [{ find: "@/integrations/supabase/client", replacement: path.resolve(__dirname, "./src/integrations/supabase/demoClient.ts") }]
        : []),
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
}));
