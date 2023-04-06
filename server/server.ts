import { Server, Origins } from "boardgame.io/server";
import { CardmasterConflict } from "../shared/CardmasterGame";
import { getDeck } from "./getdeck";

const server = Server({
  games: [CardmasterConflict],
  origins: [
    Origins.LOCALHOST_IN_DEVELOPMENT,
    Origins.LOCALHOST,
    "http://localhost:8000",
  ],
});

server.run(8000, () => console.log("server running"));

server.router.get("/gameserver/deck/:id", getDeck);
server.router.get("/api/foo/:id", getDeck);
