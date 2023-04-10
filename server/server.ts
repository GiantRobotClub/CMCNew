/// <reference types="koa__router" />
import { Server, Origins } from "boardgame.io/server";
import { CardmasterConflict } from "../shared/CardmasterGame";

import { Manage } from "./manage";

import session from "koa-session";
const games = [CardmasterConflict];
const server = Server({
  games: games,
  origins: [
    Origins.LOCALHOST_IN_DEVELOPMENT,
    Origins.LOCALHOST,
    "http://localhost:8000",
  ],
});

const SESSION_CONFIG = {
  key: "cmc-session",
  rolling: true,
  renew: true,
};
server.app.keys = ["cmcr"];
server.app.on("error", (err, ctx) => {
  console.error(err);
});
// @ts-ignore
server.app.use(session(SESSION_CONFIG, server.app));
// @ts-ignore // there's something wierd with the typings but this is the only way it works
server.router.use("/manage", Manage.routes(), Manage.allowedMethods());

server.run(8000, () => console.log("server running!!"));
