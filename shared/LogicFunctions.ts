import { Ctx } from "boardgame.io";
import { CMCGameState } from "./CardmasterGame";
import {
  CMCCard,
  CMCEntityCard,
  CMCLocationCard,
  CMCMonsterCard,
  CMCPersonaCard,
  CreateBasicCard,
} from "./CMCCard";
import { ClickType, CardType, Stages, PlayerIDs } from "./Constants";

import * as CardFunctions from "./CardFunctions";
import { CMCPlayer } from "./Player";
import { rule } from "postcss";

import { current } from "immer";
import {
  Random,
  RandomAPI,
} from "boardgame.io/dist/types/src/plugins/random/random";
import { GetActivePlayer, GetActiveStage } from "./Util";
import { CanActivateAbility } from "./Abilities";

// adds a card from deck to hand
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

// adds resource (eg mana)
function PlayerAddResource(playerid: string, resource: any, G: CMCGameState) {
  let player: CMCPlayer = G.playerData[playerid];
  for (const check in resource) {
    for (const sub in resource[check]) {
      G.playerData[playerid].resources[check][sub] += resource[check][sub];
    }
  }
}

// reduces resource.
function PlayerPay(playerid: string, cost: any, G: CMCGameState) {
  const fullplayer: CMCPlayer = G.playerData[playerid];

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

interface DamageResult {
  card: CMCCard;
  damage: number;
  overage: number; // damage - health, except in certain circumstances
}

// check if any card needs updating, eg: is destroyed
function CardScan(G: CMCGameState, random: RandomAPI): void {
  for (const slotplayer in G.slots) {
    for (const subplayer in G.slots[slotplayer]) {
      for (const [index, card] of G.slots[slotplayer][subplayer].entries()) {
        if (card.type == CardType.EMPTY) {
          continue;
        }
        const entity = card as CMCEntityCard;

        // is it dead
        if (entity.destroyed) {
          // add monster to graveyard
          AddToGraveyard(entity, G);
          //new slot
          G.slots[slotplayer][subplayer][index] = CreateBasicCard(
            GenerateRandomGuid(random)
          );
        }
      }
    }
  }
}

function AddToGraveyard(card: CMCCard, G: CMCGameState) {
  const owner = OwnerOf(card, G);
  console.log(owner);
  G.playerData[owner].graveyard.push(card);
}
// generate a new guid
function GenerateRandomGuid(random: RandomAPI) {
  let guid: string = "[";
  for (let num = 0; num <= 100; num++) {
    guid += random.D20() + " ";
  }
  guid += "]";
  return guid;
}

// deal damage. source is used for triggers of various kinds.
function DealDamage(
  damagee: CMCMonsterCard | CMCPersonaCard,
  source: CMCCard,
  amount: number,
  G: CMCGameState
): DamageResult {
  if ("life" in damagee) {
    const damageResult: DamageResult = {
      card: damagee,
      damage: 0,
      overage: 0,
    };
    damageResult.damage = amount;
    damageResult.overage = amount - damagee.life;
    for (const slotplayer in G.slots) {
      for (const subplayer in G.slots[slotplayer]) {
        for (const [index, card] of G.slots[slotplayer][subplayer].entries()) {
          if (card.guid == damagee.guid) {
            G.slots[slotplayer][subplayer][index].life -= amount;
            if (G.slots[slotplayer][subplayer][index].life <= 0) {
              G.slots[slotplayer][subplayer][index].destroyed = true;
            }
          }
        }
      }
    }

    return damageResult;
  } else {
    const damageResult: DamageResult = {
      card: damagee,
      damage: 0,
      overage: 0,
    };
    damageResult.damage = amount;
    G.playerData[damagee.playerID].resources.intrinsic.health -= amount;
    return damageResult;
  }
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

  if (card.type == CardType.LOCATION) {
    console.log("setting location");
    if (G.location.owner != "") {
      AddToGraveyard(G.location, G);
    }
    G.location = {
      ...card,

      owner: playerID,
    };

    return true;
  } else {
    for (const slotplayer in G.slots) {
      for (const subplayer in G.slots[slotplayer]) {
        for (const [index, subrow] of G.slots[slotplayer][
          subplayer
        ].entries()) {
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
    console.log("Couldnt place card");
    return false;
  }

  if (!RemoveFromHand(card, playerID, G)) {
    console.log("Couldnt remove card");
    return false;
  }

  return G;
}

// determine ownerof card
function OwnerOf(card: CMCCard, G: CMCGameState) {
  for (const slotplayer in G.slots) {
    for (const subplayer in G.slots[slotplayer]) {
      for (const subrow of G.slots[slotplayer][subplayer]) {
        const slot: CMCCard = subrow;
        if (slot.guid === card.guid) {
          return slotplayer;
        }
      }
    }
  }
  for (const slotplayer in G.players) {
    const hand: CMCCard[] = G.players[slotplayer].hand;
    let found: boolean = false;
    hand.forEach((handcard, _idx) => {
      if (card.guid == handcard.guid) {
        found = true;
        return;
      }
    });
    if (found) {
      return slotplayer;
    }
  }
  // check persona and graveyard
  for (const playnumber in PlayerIDs) {
    const player: CMCPlayer = G.playerData[playnumber];
    if (player.persona.guid == card.guid) {
      return playnumber;
    }
    let found = false;
    player.graveyard.forEach((gcard, index) => {
      if (gcard.guid == card.guid) {
        found = true;
      }
    });
    if (found) {
      return playnumber;
    }
  }
  // check who played location
  if (card.type == CardType.LOCATION) {
    console.dir(card);

    const actualLocation = G.location;
    console.dir(actualLocation);
    if (card.guid == actualLocation.guid && actualLocation.owner != "") {
      return actualLocation.owner;
    }
  }
  return "-1";
}

// function run on all cards to determine clickability and legal moves
function CanClickCard(
  card: CMCCard,
  playerId: string,
  clickType: ClickType,
  ctx: Ctx,
  G: CMCGameState
): boolean {
  // is there an active ability?  If so, check targeting
  if (G.activeAbility) {
    if (!G.activeCard) {
      return false;
    }

    if (GetActiveStage(ctx) != Stages.pickAbilityTarget) {
      return false;
    }
    if (!CanActivateAbility(G.activeCard, G.activeAbility, G, ctx, card)) {
      return false;
    }

    return true;
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
    clickType == ClickType.EFFECT ||
    clickType == ClickType.PERSONA ||
    clickType == ClickType.GRAVEYARD
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
    } else if (stage == Stages.combat) {
      // picking attackers
      if (card.type != CardType.MONSTER) {
        return false; // can only pick monsters
      }
      if (OwnerOf(card, G) != activePlayer) {
        // the owner of the active card is different than the monster owner
        return false;
      }
      const monster = card as CMCMonsterCard;
      if (monster.dizzy) {
        // cant attack when dizzy
        return false;
      }
      // is the monster already attacking?
      if (!G.combat) {
        return false;
      }
      for (const combatant of G.combat.targets) {
        if (combatant.attacker.guid == monster.guid) {
          return false;
        }
      }
      //todo: is the monster capaable of attacking?

      return true;
    } else if (stage == Stages.defense) {
      // picking attacking monster
      if (card.type != CardType.MONSTER) {
        return false; // can only pick monsters
      }
      if (OwnerOf(card, G) == activePlayer) {
        // you cant attack yourself
        return false;
      }
      const monster = card as CMCMonsterCard;

      if (!G.combat) {
        return false;
      }
      //todo: is the monster capaable of defending?

      // is the monster attacking?
      for (const combatant of G.combat.targets) {
        if (combatant.attacker.guid == monster.guid) {
          console.log("Monster is locked");
          if (combatant.locked) {
            // monster is locked on it's current target
            return false;
          }
        }
      }
      return true;
    } else if (stage == Stages.pickCombatTarget) {
      // picking defending monster
      if (card.type != CardType.MONSTER && card.type != CardType.PERSONA) {
        return false; // can only pick monsters or  players
      }
      if (OwnerOf(card, G) == activePlayer) {
        // you cant attack yourself
        return false;
      }
      const monster = card as CMCMonsterCard | CMCPersonaCard;

      if (!G.combat) {
        return false;
      }
      //todo: is the monster capable of defending?

      // is the monster already defending?
      for (const combatant of G.combat.targets) {
        if (combatant.defender && combatant.defender.guid == monster.guid) {
          return false;
        }
      }
      return true;
    } else if (stage == Stages.pickCombatDefense) {
      // picking defending monster
      if (card.type != CardType.MONSTER) {
        return false; // can only pick monsters
      }
      if (OwnerOf(card, G) != activePlayer) {
        // you cant defend with oponent's monsters
        return false;
      }
      const monster = card as CMCMonsterCard;

      if (!G.combat) {
        return false;
      }
      //todo: is the monster capable of defending?

      // is the monster already defending?
      for (const combatant of G.combat.targets) {
        if (combatant.defender && combatant.defender.guid == monster.guid) {
          return false;
        }
      }
      return true;
    } else if (stage == Stages.sacrifice) {
      if (clickType == ClickType.PERSONA || clickType == ClickType.GRAVEYARD) {
        return false;
      }
      if (card.type == CardType.EMPTY) {
        return false;
      }
      if (OwnerOf(card, G) != playerId) {
        return false;
      }

      return true;
    }
  } else if ((clickType = ClickType.LOCATION)) {
    return false;
  }

  return false;
}

// reset the selected cards and stages
function resetActive(G: CMCGameState) {
  G.activeAbility = undefined;
  G.activeCard = undefined;
}
// reset combat at end of turn
function resetCombat(G: CMCGameState) {
  G.combat = undefined;
  G.resolution = undefined;
}

// update player data with secret info such as deck size
function CheckState(G: CMCGameState) {
  for (const playerid in PlayerIDs) {
    // check player health
    const player: CMCPlayer = G.playerData[playerid];
    if (player.resources.intrinsic.health <= 0) {
      G.loser = playerid;
    }
    // set player deck values for visual reasons
    player.currentDeck = G.secret.decks[playerid].length;
    player.currentGrave = G.playerData[playerid].graveyard.length;
    player.currentHand = G.players[playerid].hand.length;
  }
}
function IsMonster(card: CMCCard): card is CMCMonsterCard {
  return (card as CMCMonsterCard).life !== undefined;
}
function IsPersona(card: CMCCard): card is CMCPersonaCard {
  return (card as CMCPersonaCard).playerID !== undefined;
}
function Sacrifice(
  card: CMCCard,
  G: CMCGameState,
  ctx: Ctx,
  random: RandomAPI
) {
  if (GetActivePlayer(ctx) != OwnerOf(card, G)) {
    return false;
  }
  if (![CardType.EFFECT, CardType.MONSTER].includes(card.type)) {
    return false;
  }
  PlayerAddResource(OwnerOf(card, G), card.sac, G);

  for (const slotplayer in G.slots) {
    for (const subplayer in G.slots[slotplayer]) {
      for (const [index, slotcard] of G.slots[slotplayer][
        subplayer
      ].entries()) {
        if (slotcard.guid == card.guid) {
          G.slots[slotplayer][subplayer][index].destroyed = true;
        }
      }
    }
  }
  CardScan(G, random);
  return true;
}
export {
  OwnerOf,
  CanClickCard,
  PlayEntity,
  PlayerPay,
  PlaceCard,
  RemoveFromHand,
  PlayerAddResource,
  DrawCard,
  DealDamage,
  DamageResult,
  CardScan,
  GenerateRandomGuid,
  resetActive,
  resetCombat,
  CheckState,
  Sacrifice,
  AddToGraveyard,
  IsMonster,
  IsPersona,
};
