import { Ctx } from "boardgame.io";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard } from "./CMCCard";
import { ClickType, CardType, Stages } from "./Constants";

import * as CardFunctions from "./CardFunctions";
import { CMCPlayer } from "./Player";
import { rule } from "postcss";

function DrawCard(
  playerId: string,
  cardcount: number,
  G: CMCGameState
): boolean {
  if (G.secret.decks[playerId].length < cardcount) {
    //get milled idiot
    return false;
  }
  for (let i = 0; i < cardcount; i++) {
    const card = G.secret.decks[playerId].pop();
    G.players[playerId].hand.push(card);
  }

  return true;
}

function PlayerAddResource(playerid: string, resource: any, G: CMCGameState) {
  let player: CMCPlayer = G.player[playerid];
  console.log("Player: " + playerid);
  console.dir(resource);
  console.dir(G.player[playerid].resources);
  for (const check in resource) {
    for (const sub in resource[check]) {
      G.player[playerid].resources[check][sub] += resource[check][sub];
      console.log(G.player[playerid].resources[check][sub]);
    }
  }
}

function PlayerPay(playerid: string, cost: any, G: CMCGameState) {
  const fullplayer: CMCPlayer = G.player[playerid];

  if (!fullplayer) {
    return false;
  }
  for (const check in cost) {
    for (const sub in cost[check]) {
      if (fullplayer.resources[check][sub] < cost[check[sub]]) {
        return false;
      }
      fullplayer.resources[check][sub] =
        fullplayer.resources[check][sub] - cost[check][sub];
    }
  }
  return true;
}

// function to take a card object and apply it to an in game slot.
function PlaceCard(
  card: CMCCard,
  slot: CMCCard,
  playerID: string,
  G: CMCGameState
): boolean {
  let subplayerfound = "";
  let subrowfound = -1;
  let slotplayerfound = "";
  for (const slotplayer in G.slots) {
    for (const subplayer in G.slots[slotplayer]) {
      for (const [index, subrow] of G.slots[slotplayer][subplayer].entries()) {
        const foundCard: CMCCard = subrow;
        if (subrow.guid == slot.guid) {
          subplayerfound = subplayer;
          subrowfound = index;
          slotplayerfound = slotplayer;
        }
      }
    }
  }

  if (subrowfound == -1 || subplayerfound == "" || slotplayerfound == "") {
    return false;
  }

  G.slots[slotplayerfound][subplayerfound][subrowfound] = card;

  return true;
}

//remove card from hand, always do it after the card goes where it needs to (such as graveyard, play field)
function RemoveFromHand(
  card: CMCCard,
  playerID: string,
  G: CMCGameState
): boolean {
  let subplayerfound = "";
  let subrowfound = -1;
  let slotplayerfound = "";

  let found = false;
  let hand: CMCCard[] = G.players[playerID].hand;
  hand.forEach((crd, idx) => {
    if (crd.guid == card.guid) {
      found = true;
    }
  });

  if (!found) {
    return false;
  }
  for (const slotplayer in G.slots) {
    for (const subplayer in G.slots[slotplayer]) {
      for (const [index, subrow] of G.slots[slotplayer][subplayer].entries()) {
        const foundCard: CMCCard = subrow;
        if (subrow.guid == card.guid) {
          subplayerfound = subplayer;
          subrowfound = index;
          slotplayerfound = slotplayer;
        }
      }
    }
  }
  if (subrowfound == -1 || subplayerfound == "" || slotplayerfound == "") {
    return false;
  }
  console.log("hand:" + G.players[playerID].hand.length);
  G.players[playerID].hand = hand.filter((crd, i) => crd.guid != card.guid);
  return true;
}

// standard play entity function, player pays cost and card moves from hand to slot
function PlayEntity(
  card: CMCCard,
  slot: CMCCard,
  playerID: string,
  G: CMCGameState,
  ctx: Ctx
): CMCGameState | boolean {
  console.log(card.guid);
  let found = false;
  let hand: CMCCard[] = G.players[playerID].hand;
  hand.forEach((crd, idx) => {
    if (crd.guid == card.guid) {
      found = true;
    }
  });

  if (!found) {
    return false;
  }

  let success_pay = CardFunctions[card.costFunction](
    card,
    playerID,
    G,
    ctx,
    false
  );

  console.log(success_pay);
  if (!success_pay) return false;

  if (!PlaceCard(card, slot, playerID, G)) {
    return false;
  }

  if (!RemoveFromHand(card, playerID, G)) {
    return false;
  }

  return G;
}

function OwnerOf(card: CMCCard, G: CMCGameState) {
  for (const slotplayer in G.slots) {
    for (const subplayer in G.slots[slotplayer]) {
      for (const subrow of G.slots[slotplayer][subplayer]) {
        const slot: CMCCard = subrow;
        if (slot === card) {
          return slotplayer;
        }
      }
    }
  }
  for (const slotplayer in G.players) {
    const hand: CMCCard[] = G.players[slotplayer].hand;
    if (hand.includes(card)) {
      return slotplayer;
    }
  }
  // check graveyard

  // check persona

  // check who played location

  return "-1";
}

function ClickCard(
  card: CMCCard,
  playerId: string,
  clickType: ClickType,
  ctx: Ctx,
  G: CMCGameState
) {
  // translate to a move
  console.log("Clicked on " + card.name);
}
function CanClickCard(
  card: CMCCard,
  playerId: string,
  clickType: ClickType,
  ctx: Ctx,
  G: CMCGameState
): boolean {
  // is there an active ability?  If so, check targeting
  if (G.activeAbility) {
    // picking against slot

    // picking against player

    // picking against entity

    // picking against hand

    return false;
  }
  let cardOwner = OwnerOf(card, G);
  let currentPlayer = ctx.currentPlayer;

  // are you the active player
  if (!ctx.activePlayers) {
    return false;
  }
  let activePlayer = "0";
  if ("0" in ctx.activePlayers) {
    activePlayer = "0";
  } else if ("1" in ctx.activePlayers) {
    activePlayer = "1";
  }

  if (activePlayer != playerId) {
    // only the active player can act
    return false;
  }

  let stage = ctx.activePlayers[activePlayer];
  if (clickType == ClickType.HAND) {
    // are we in play phase or combat phase and is it that player's turn
    if (activePlayer === currentPlayer) {
      if (!["play", "combat"].includes(stage)) {
        return false;
      }
    } else {
      // Are we in the resolve, respond, combat defense
      if (!["resolve", "respond", "defense"].includes(stage)) {
        return false;
      }
    }

    // if it's not a spell, you can only play it in play

    if (card.type != CardType.SPELL && stage != "play") {
      return false;
    }

    // so! can you play it??

    if (!CardFunctions[card.costFunction](card, cardOwner, G, ctx, true)) {
      return false;
    }
    return true;
  } else if (
    clickType == ClickType.MONSTER ||
    ClickType.EFFECT ||
    ClickType.PERSONA ||
    ClickType.GRAVEYARD
  ) {
    // case one: you are playing an entity card from your hand and are selecting the slot.
    if (stage == Stages.pickSlot) {
      if (card.type != CardType.EMPTY) {
        return false; // can only pick slots
      }
      if (!G.activeCard) {
        return false; // you aren't playing a card
      }
      if (![CardType.EFFECT, CardType.MONSTER].includes(G.activeCard.type)) {
        return false; // only effects and monsters go into slots
      }

      if (OwnerOf(G.activeCard, G) != cardOwner) {
        // the owner of the active card is different than the slot owner
        return false;
      }
      if (activePlayer != currentPlayer) {
        // you arent the active player
        return false;
      }
      if (activePlayer != cardOwner) {
        // you aren't the owner
        return false;
      }

      if (
        !CardFunctions[G.activeCard.costFunction](card, cardOwner, G, ctx, true)
      ) {
        // cant afford this card?
        return false;
      }
      if (
        (G.activeCard.type == CardType.EFFECT &&
          clickType != ClickType.EFFECT) ||
        (G.activeCard.type == CardType.MONSTER &&
          clickType != ClickType.MONSTER)
      ) {
        // slot is not hte same kind of card
        return false;
      }

      return true;
    }
  } else if ((clickType = ClickType.LOCATION)) {
    return false;
  }

  return false;
}

export {
  OwnerOf,
  CanClickCard,
  ClickCard,
  PlayEntity,
  PlayerPay,
  PlaceCard,
  RemoveFromHand,
  PlayerAddResource,
  DrawCard,
};
