import { Context } from "koa";

export function loadDeck(ctx: Context, next) {
  // get deck with that id, if you have the right user id info but for now there's not anything like that

  ctx.body = JSON.stringify(getDeck(ctx.params.id));
}

export function getDeck(id: string) {
  const deck = {
    persona: "debugpersona",
    cards: [
      { id: "debugslime", count: 10 },

      { id: "debugspell", count: 10 },

      { id: "debugloc", count: 10 },

      { id: "debuggen", count: 10 },
    ],
  };
  return deck;
}
