import { Context } from "koa";

export function loadDeck(ctx: Context, next) {
  // get deck with that id, if you have the right user id info but for now there's not anything like that

  ctx.body = JSON.stringify(getDeck(ctx.params.id));
}

export function getDeck(id: string) {
  const deck = {
    persona: "debugpersona",
    cards: [
      { id: "debugslime", amount: 10 },

      { id: "debugspell", amount: 10 },

      { id: "debugloc", amount: 10 },

      { id: "debuggen", amount: 10 },
    ],
  };
  return deck;
}
