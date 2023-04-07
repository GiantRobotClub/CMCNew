import Router from "@koa/router";
import type { Server, Server as ServerTypes } from "boardgame.io";
import { authenticator } from "@otplib/preset-default";
import {
  CreatePlayer,
  DbDeckCard,
  DbOwnedCard,
  DbPlayer,
  GetDeckList,
  GetFullDeck,
  GetOwnedCards,
  GetPlayer,
  GetPlayerIdFromName,
  LoadJsonDeck,
} from "./db";
import { nanoid } from "nanoid";
export const Manage = new Router<any, Server.AppCtx>();

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

Manage.get("/player/create/:name/:deck", (ctx, next) => {
  const playerid = nanoid();
  const deckid = nanoid();
  const dbPlayer: DbPlayer = {
    playerid: playerid,
    username: ctx.params.name,
    visualname: ctx.params.name,
    authenticationcode: nanoid(), // gotta figure this out
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
  ctx.body = { player: player };
});
