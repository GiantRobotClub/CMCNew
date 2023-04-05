import { Ctx } from "boardgame.io";
import { couldStartTrivia } from "typescript";
import {
  Ability,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
} from "./Abilities";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard, CMCMonsterCard, CMCPersonaCard } from "./CMCCard";
import { CardType } from "./Constants";
import {
  DealDamage,
  IsMonster,
  IsPersona,
  OwnerOf,
  PlayerAddResource,
  PlayerPay,
} from "./LogicFunctions";
import { CMCPlayer } from "./Player";

// defaultcost checks everything in the player.resources against the card.cost.
export function DefaultCost(
  card: CMCCard,
  playertocheck: string,
  G: CMCGameState,
  ctx: Ctx,
  dry: boolean
): boolean {
  const fullplayer: CMCPlayer = G.playerData[playertocheck];

  if (!fullplayer) {
    return false;
  }
  for (const check in card.cost) {
    for (const sub in card.cost[check]) {
      if (fullplayer.resources[check][sub] < card.cost[check][sub]) {
        return false;
      }
    }
  }

  // if we are actually calling to check
  if (!dry) {
    if (!PlayerPay(playertocheck, card.cost, G)) {
      return false;
    }
  }
  return true;
}

export function IsDamagable(
  card: CMCCard,
  cardowner: string,
  target: CMCCard,
  G: CMCGameState,
  ctx: Ctx
): boolean {
  // can only damage in field
  let found: boolean = false;
  for (const slotplayer in G.slots) {
    for (const subplayer in G.slots[slotplayer]) {
      for (const [index, slotcard] of G.slots[slotplayer][
        subplayer
      ].entries()) {
        if (slotcard.guid == target.guid) {
          found = true;
        }
      }
    }
  }
  // is it a damagable type
  return found && (IsMonster(target) || IsPersona(target));
}

export function ManaGenerate(
  card: CMCCard,
  ability: Ability,
  trigger: TriggeringTrigger,
  owner: string,
  G: CMCGameState,
  ctx: Ctx,
  target?: CMCCard
): boolean {
  let playerid = OwnerOf(card, G);
  let player: CMCPlayer = G.playerData[playerid];

  let resource = {
    mana: {},
  };
  resource.mana[ability.metadata.color] = ability.metadata.amount;

  PlayerAddResource(playerid, resource, G);

  G.playerData[ctx.currentPlayer] = player;
  return true;
}

export function TriggerStage(
  card: CMCCard,
  ability: Ability,
  trigger: TriggeringTrigger,
  owner: string,
  G: CMCGameState,
  ctx: Ctx
): boolean {
  if (!ctx.activePlayers) {
    return false;
  }
  let playerToCheck = owner;
  if (trigger.triggeringPlayer != owner) {
    return false;
  }
  if (ctx.activePlayers[playerToCheck] != ability.metadata.triggerstage) {
    return false;
  }
  if (trigger.name != ability.metadata.triggername) {
    return false;
  }
  return true;
}

export function DamageTarget(
  card: CMCCard,
  ability: Ability,
  trigger: TriggeringTrigger,
  owner: string,
  G: CMCGameState,
  ctx: Ctx,
  target?: CMCCard
) {
  if (!target) return false;
  if (![CardType.PERSONA, CardType.MONSTER].includes(target.type)) {
    console.log("target is not the right kind of card");
    console.dir(target);
    return false;
  }
  if (IsMonster(target) || IsPersona(target)) {
    console.log("Card is monster or target");
    DealDamage(target, card, ability.metadata.amount, G);
  } else {
    console.dir(target);
    return false;
  }
}
