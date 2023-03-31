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
import { CMCPlayer } from "./Player";

// defaultcost checks everything in the player.resources against the card.cost.
export function DefaultCost(
  card: CMCCard,
  owner: string,
  G: CMCGameState,
  ctx: Ctx,
  dry: boolean
): boolean {
  const player: CMCPlayer = G.player[owner];
  for (const check in card.cost) {
    for (const sub in card.cost[check]) {
      if (player[check][sub] < card.cost[check][sub]) {
        return false;
      }
    }
  }

  // if we are actually calling to check
  if (!dry) {
    for (const check in card.cost) {
      for (const sub in card.cost[check]) {
        G.player[owner][check][sub] =
          G.player[owner][check][sub] - card.cost[check][sub];
      }
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
  let player: CMCPlayer = newG.player[ctx.currentPlayer];
  player.resources.mana[ability.metadata.color] =
    player.resources.mana[ability.metadata.color] + ability.metadata.amount;
  newG.player[ctx.currentPlayer] = player;
  console.log(newG);
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
  console.log("Checking " + JSON.stringify(trigger));
  if (!ctx.activePlayers) {
    console.log("No active players");
    return false;
  }
  let playerToCheck = owner;
  if (trigger.triggeringPlayer != owner) {
    console.log(owner + " isnt " + trigger.triggeringPlayer);
    return false;
  }
  if (ctx.activePlayers[playerToCheck] != ability.metadata.triggerstage) {
    console.log(
      ctx.activePlayers[playerToCheck] +
        " isnt " +
        ability.metadata.triggerstage
    );
    return false;
  }
  if (trigger.name != ability.metadata.triggername) {
    console.log(trigger.name + " isnt " + ability.metadata.triggername);
    return false;
  }
  console.log("Ability is go");
  return true;
}
