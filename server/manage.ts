import Router from "@koa/router";
import type { PlayerID, Server, Server as ServerTypes } from "boardgame.io";
import { authenticator } from "@otplib/preset-default";
import {
  CreateDeck,
  CreatePlayer,
  DeleteDeck,
  GetDeckList,
  GetFullDeck,
  GetMats,
  GetOwnedCards,
  GetPlayer,
  GetPlayerIdFromName,
  GiveMats,
  LoadJsonDeck,
  NewEmptyDeck,
} from "./db";
import {
  DbCraftingMat,
  DbCraftingMats,
  DbDeckCard,
  DbFullDeck,
  DbOwnedCard,
  DbPlayer,
} from "./DbTypes";
import { nanoid } from "nanoid";
import bodyParser from "koa-bodyparser";
import crafting from "../shared/data/crafting.json";
export const Manage = new Router<any, Server.AppCtx>();
Manage.get("/mats/get/:playerid", (ctx, next) => {
  const mats: DbCraftingMats | undefined = GetMats(ctx.params.playerid);
  if (mats) {
    ctx.body = { mats: mats };
  } else {
    ctx.boy = { mats: {} };
  }
  return true;
});

Manage.post("/mats/give", bodyParser(), (ctx, next) => {
  let victoryinfo = ctx.request.body as {
    id: PlayerID;
    victory: { type: string; victory: boolean };
  };
  // figure out rewards
  const letterrewardsall: string[] = [];
  Object.entries(crafting.rewardrates).forEach((entry) => {
    const [reward, amount] = entry;
    for (let i = 0; i < amount; i++) {
      letterrewardsall.push(reward);
    }
  });

  const letterrewards: string[] = [];

  const cardrewards: string[] = [];
  const winamount = victoryinfo.victory.victory ? 3 : 1;
  for (let i = 0; i < winamount; i++) {
    letterrewards.push(
      letterrewardsall[~~(Math.random() * letterrewardsall.length)]
    );
  }

  // if the type is defined
  if (victoryinfo.victory.type) {
    cardrewards.push(victoryinfo.victory.type);
  }
  const newmats: DbCraftingMats = {
    playerid: victoryinfo.id,
    mats: [],
  };

  letterrewards.forEach((letter) => {
    let found: boolean = false;
    for (const mat of newmats.mats) {
      if (mat.letter == letter) {
        mat.amount = mat.amount + 1;
        found = true;
        continue;
      }
    }
    if (!found) {
      const newmat: DbCraftingMat = {
        playerid: victoryinfo.id,
        letter: letter,
        amount: 1,
      };
    }
  });

  //give the player their rewards
  GiveMats(newmats);
  // return what those rewards are.
  ctx.body = { letterrewards: letterrewards, cardrewards: cardrewards };
  return true;
});

//replace the module
Manage.post("/decks/save/:deckid", bodyParser(), (ctx, next) => {
  const deckid = ctx.params.deckid;
  let deck = ctx.request.body as { deck: DbFullDeck };

  DeleteDeck(deckid);
  CreateDeck(deck.deck);
  ctx.body = { success: true };
  return true;
});
Manage.use(bodyParser());
Manage.get("/test", (ctx, next) => {
  const playerid = nanoid();
  const deckid = nanoid();
  const secret = authenticator.generateSecret();

  let starterdeck = LoadJsonDeck("debug");

  if (starterdeck === undefined) {
    console.log("couldnt load deck");
    next();
    return;
  }
  starterdeck.deck.deckid = deckid;
  starterdeck.deck.ownerid = playerid;
  const startowned: DbOwnedCard[] = [];
  starterdeck.cards.map((value: DbDeckCard, index: number) => {
    const newcard: DbOwnedCard = {
      cardid: value.cardid,
      amount: value.amount,
      playerid: "NONE",
    };
    startowned.push(newcard);
  });

  const success = CreatePlayer(
    {
      playerid: playerid,
      username: "testymastexr",
      visualname: "",
      authenticationcode: secret,
      selecteddeck: deckid,
    },
    startowned,
    starterdeck
  );
  if (success === undefined) {
    console.log("couldnt create player");
    return;
  }

  const testblob = {
    player: GetPlayer(playerid),
    deck: GetFullDeck(deckid),
    owned: GetOwnedCards(playerid),
    keyuri: authenticator.keyuri(success.playerid, "CMC", secret),
  };

  ctx.response.body = JSON.stringify(testblob);
});

Manage.get("/decks/list/:playerid", (ctx, next) => {
  const playerid = ctx.params.playerid;
  ctx.body = { playerid: playerid, decks: GetDeckList(playerid) };
});
Manage.get("/decks/get/:deckid", (ctx, next) => {
  const deckid = ctx.params.deckid;
  ctx.body = { deckid: deckid, decks: GetFullDeck(deckid) };
});
Manage.get("/decks/create/:playerid", (ctx, next) => {
  const newdeckid = nanoid();
  const newemptydeck = NewEmptyDeck(ctx.params.playerid, newdeckid);
  CreateDeck(newemptydeck);
  ctx.body = { deckid: newdeckid, deck: newemptydeck };
});
Manage.get("/player/getbyname/:name", (ctx, next) => {
  const playerid = GetPlayerIdFromName(ctx.params.name);
  ctx.body = {
    name: ctx.params.name,
    playerid: playerid,
  };
});

Manage.get("/player/getbyid/:id", (ctx, next) => {
  const player = GetPlayer(ctx.params.id);
  ctx.body = { player: player };
});

Manage.get("/player/getowned/:id", (ctx, next) => {
  const owned = GetOwnedCards(ctx.params.id);
  ctx.body = { owned: owned };
});

Manage.get("/player/getsession", (ctx, next) => {
  if (ctx.session === null) {
    ctx.body = { playerid: "" };
    return;
  }
  const player = ctx.session.player || undefined;
  if (player !== undefined) {
    ctx.body = { playerid: ctx.session.player.playerid };
  } else ctx.body = { playerid: "" };
});
//is it safe? I dunno
Manage.get("/player/login/:name/:authcode", (ctx, next) => {
  const playerid = GetPlayerIdFromName(ctx.params.name);
  if (playerid == "") throw "Player not found";
  const player = GetPlayer(playerid);
  if (player === undefined) throw "Player not found from ID";
  const success = authenticator.check(
    ctx.params.authcode,
    player.authenticationcode
  );
  if (!success) {
    throw (
      "Invalid authenticator code " +
      ctx.params.authcode +
      " for secret " +
      player.authenticationcode
    );
  }
  if (ctx.session === null) {
    ctx.body = { success: false };
    return;
  }
  ctx.session.player = player;
  ctx.body = {
    success: success,
    player: player,
  };
});

Manage.get("/player/create/:name/:deck", (ctx, next) => {
  const playerid = nanoid();
  const deckid = nanoid();
  const secret = authenticator.generateSecret();
  const dbPlayer: DbPlayer = {
    playerid: playerid,
    username: ctx.params.name,
    visualname: ctx.params.name,
    authenticationcode: secret,
    selecteddeck: deckid,
  };

  let starterdeck = LoadJsonDeck(ctx.params.deck);

  if (starterdeck === undefined) {
    throw "couldnt load deck";
  }
  starterdeck.deck.deckid = deckid;
  starterdeck.deck.ownerid = playerid;
  const startowned: DbOwnedCard[] = [];
  starterdeck.cards.map((value: DbDeckCard, index: number) => {
    const newcard: DbOwnedCard = {
      cardid: value.cardid,
      amount: value.amount,
      playerid: "NONE",
    };
    startowned.push(newcard);
  });

  const player = CreatePlayer(dbPlayer, startowned, starterdeck);
  if (player === undefined) throw "Player was undefined";

  ctx.body = {
    player: player,
    keyuri: authenticator.keyuri(player.username, "CMC", secret),
  };
});
