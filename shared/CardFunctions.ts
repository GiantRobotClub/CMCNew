import { Ctx } from "boardgame.io";
import { Ability, TriggeringTrigger, TriggerPlayerType } from "./Abilities";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard } from "./CMCCard";
import { CMCPlayer } from "./Player";

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
  player.mana[ability.metadata.color] =
    player.mana[ability.metadata.color] + ability.metadata.amount;
  newG.player[ctx.currentPlayer] = player;
  console.log(newG);
  return newG;
}

export function StartStage(
  card: CMCCard,
  ability: Ability,
  trigger: TriggeringTrigger,
  owner: string,
  G: CMCGameState,
  ctx: Ctx
): boolean {
  console.log("Checking " + trigger);
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
  if (ability.metadata.triggername != "start_stage") {
    console.log(ability.metadata.triggername + " isnt start_stage");
    return false;
  }
  console.log("Ability is go");
  return true;
}
