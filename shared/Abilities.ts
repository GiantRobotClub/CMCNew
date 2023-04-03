import { Ctx } from "boardgame.io";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard } from "./CMCCard";
import * as CardFunctions from "./CardFunctions";

enum TriggerType {
  ACTIVATED = 0,
  ACTIVATED_TARGETED,
  AUTOMATIC_STAGE,
  AUTOMATIC_RESPONSE,
  AUTOMATIC_POSTCOMBAT,
  AUTOMATIC_PRECOMBAT,
}

enum TriggerNames {
  START_TURN = "start_turn",
  END_STAGE = "end_stage",
  END_TURN = "end_turn",
}
interface Ability {
  triggerType: TriggerType;
  targetCode?: string;
  triggerCode?: string;
  activateCode?: string;
  costCode?: string;
  metadata: any;
}

enum TriggerPlayerType {
  EITHER = 0,
  ACTIVE = 1,
  INACTIVE = 2,
}
interface TriggeringTrigger {
  name: string;
  triggeringcard?: CMCCard;
  triggeringPlayer?: string;
  turn?: number;
  stage?: string;
}

function Ability_Trigger(
  trigger_data: TriggeringTrigger,
  G: CMCGameState,
  ctx: Ctx
) {
  let newG = G;
  //console.log("Ability trigger check " + JSON.stringify(trigger_data));
  for (const slotplayer in G.slots) {
    for (const subplayer in G.slots[slotplayer]) {
      for (const subrow of G.slots[slotplayer][subplayer]) {
        const card: CMCCard = subrow;
        newG = handleTrigger(card, trigger_data, slotplayer, ctx, G);
      }
    }
  }
  return newG;
}

function handleTrigger(
  card: CMCCard,
  trigger_data: TriggeringTrigger,
  owner: string,
  ctx: Ctx,
  G: CMCGameState
) {
  let newG = G;
  for (const ability of card.abilities) {
    if (ability.triggerCode) {
      const triggerFunc: Function = CardFunctions[ability.triggerCode];
      //console.log(CardFunctions);
      if (triggerFunc(card, ability, trigger_data, owner, G, ctx)) {
        if (ability.activateCode) {
          const abilityFunc: Function = CardFunctions[ability.activateCode];
          newG = abilityFunc(card, ability, trigger_data, owner, G, ctx);
          //console.log(newG);
        }
      }
    }
  }

  return newG;
}

function TriggerAuto(name: string, ctx: Ctx, G: CMCGameState): void {
  if (ctx.activePlayers !== null) {
    Ability_Trigger(
      {
        name: name,
        stage: ctx.activePlayers[ctx.currentPlayer],
        triggeringPlayer: ctx.currentPlayer,
      },
      G,
      ctx
    );
  }
}
export {
  Ability,
  Ability_Trigger,
  TriggeringTrigger,
  TriggerType,
  TriggerPlayerType,
  TriggerNames,
  TriggerAuto,
};
