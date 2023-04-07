import Router from "@koa/router";
import Context from "koa";
import type { Server as ServerTypes } from "boardgame.io";
import { ManaGenerate } from "../shared/CardFunctions";
import {
  CreatePlayer,
  DbDeckCard,
  DbOwnedCard,
  GetFullDeck,
  GetOwnedCards,
  GetPlayer,
  LoadJsonDeck,
} from "./db";
import { nanoid } from "nanoid";
import { GiCavalry } from "react-icons/gi";
const Manage = new Router<any, ServerTypes.AppCtx>();

Manage.get("/test", (ctx: Context, next) => {
  const playerid = nanoid();
  const deckid = nanoid();

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
      username: "testymaster",
    },
    startowned,
    starterdeck
  );
  if (!success) {
    console.log("couldnt create player");
    return;
  }

  const testblob = {
    player: GetPlayer(playerid),
    deck: GetFullDeck(deckid),
    owned: GetOwnedCards(playerid),
  };

  ctx.response.body = JSON.stringify(testblob);
});

export default Manage;
