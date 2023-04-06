import { Server, Origins } from "boardgame.io/server";
import { CardmasterConflict } from "../shared/CardmasterGame";

const server = Server({
  games: [CardmasterConflict],
  origins: [
    Origins.LOCALHOST_IN_DEVELOPMENT,
    Origins.LOCALHOST,
    "http://localhost:8000",
  ],
});

server.run(8000, () => console.log("server running"));
