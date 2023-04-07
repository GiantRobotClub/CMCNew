/// <reference types="koa__router" />
import { Server, Origins } from "boardgame.io/server";
import { Server as ServerTypes } from "boardgame.io/src/types";
import { CardmasterConflict } from "../shared/CardmasterGame";
import { getDeck } from "./getdeck";
import { Context } from "koa";
import { Manage } from "./manage";
import { Middleware } from "@koa/router";

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
server.app.keys = ["this is the key for see em see"];
server.app.use(session(SESSION_CONFIG, server.app));
// @ts-ignore // there's something wierd with the typings but this is the only way it works
server.router.use("/manage", Manage.routes(), Manage.allowedMethods());

server.router.use(
  "/games/:name/create",

  async (ctx: Context, next) => {
    let chunk;

    // Using while loop and calling
    // read method
    while (null !== (chunk = ctx.req.read())) {
      // get rid of the existing things
    }

    // Decide number of players etc. based on some other API.
    const deck1 = getDeck("a");
    const deck2 = getDeck("b");

    const bodyJson = {
      numPlayers: 2,
      setupData: {
        decks: {
          "0": deck1,
          "1": deck2,
        },
      },
    };
    const toUnshift = JSON.stringify(bodyJson);
    ctx.req.unshift(toUnshift);

    ctx.req.headers["content-length"] = toUnshift.length.toString();

    next();
  }
);

server.run(8000, () => console.log("server running!!"));
