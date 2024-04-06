import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
//import { SERVER_PORT, GAME_PORT, CLIENT_PORT } from "./shared/Constants";
// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
  },
  plugins: [react(), svgr()],
  server: {
    port: 3000,
    proxy: {
      "/api/": {
        target: "http://localhost:8000/",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/gameserver/": {
        target: "http://localhost:8000/",
        rewrite: (path) => path.replace(/^\/gameserver/, ""),
      },
      "/games": "http://localhost:8000/games",
    },
  },
});
