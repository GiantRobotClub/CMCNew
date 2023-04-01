import { Ctx } from "boardgame.io";
import { couldStartTrivia } from "typescript";
import {
  Ability,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
} from "./Abilities";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard } from "./CMCCard";
import { OwnerOf, PlayerAddResource, PlayerPay } from "./LogicFunctions";
import { CMCPlayer } from "./Player";

// defaultcost checks everything in the player.resources against the card.cost.
export function DefaultCost(
  card: CMCCard,
  playertocheck: string,
  G: CMCGameState,
  ctx: Ctx,
  dry: boolean
): boolean {
  const fullplayer: CMCPlayer = G.player[playertocheck];

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

export function ManaGenerate(
  card: CMCCard,
  ability: Ability,
  trigger: TriggeringTrigger,
  owner: string,
  G: CMCGameState,
  ctx: Ctx
): CMCGameState {
  let newG = G;
  let playerid = OwnerOf(card, G);
  let player: CMCPlayer = newG.player[playerid];

  let resource = {
    mana: {},
  };
  resource[ability.metadata.color] = ability.metadata.amount;

  PlayerAddResource(playerid, resource, G);

  newG.player[ctx.currentPlayer] = player;
  return newG;
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
