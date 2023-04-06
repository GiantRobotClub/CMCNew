import { Server, Origins } from "boardgame.io/server";
import { CardmasterConflict } from "../shared/CardmasterGame";
import { getDeck } from "./getdeck";
import koaBody from "koa-body";
import { Context } from "koa";
import inflate from "inflation";
import { request } from "http";
import { deflate } from "zlib";

const games = [CardmasterConflict];
const server = Server({
  games: games,
  origins: [
    Origins.LOCALHOST_IN_DEVELOPMENT,
    Origins.LOCALHOST,
    "http://localhost:8000",
  ],
});

server.router.get("/deck/:id", getDeck);
server.router.get("/deck/", getDeck);

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

//replace the module

server.run(8000, () => console.log("server running!!"));
