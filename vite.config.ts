import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
//import { SERVER_PORT, GAME_PORT, CLIENT_PORT } from "./shared/Constants";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    port: 3000,
    proxy: {
      //   "/api": "http://localhost:" + SERVER_PORT,
      //   "/gameserver": "http://localhost:" + GAME_PORT,
    },
  },
});
