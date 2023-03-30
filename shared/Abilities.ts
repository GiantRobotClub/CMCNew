import { Ctx } from "boardgame.io";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard } from "./CMCCard";
import { CMCPlayer } from "./Player";

enum TriggerType {
  ACTIVATED = 0,
  ACTIVATED_TARGETED,
  AUTOMATIC_STAGE,
  AUTOMATIC_RESPONSE,
  AUTOMATIC_POSTCOMBAT,
  AUTOMATIC_PRECOMBAT,
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

  const triggername: string = trigger_data.name;
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
      const triggerFunc: Function = eval("(" + ability.triggerCode + ")");
      console.log(triggerFunc);
      if (triggerFunc(card, ability, trigger_data, owner, G, ctx)) {
        if (ability.activateCode) {
          const abilityFunc: Function = eval("(" + ability.activateCode + ")");
          console.log(newG);
          newG = abilityFunc(card, ability, trigger_data, owner, G, ctx);
          console.log(newG);
        }
      }
    }
  }

  return newG;
}
export {
  Ability,
  Ability_Trigger,
  TriggeringTrigger,
  TriggerType,
  TriggerPlayerType,
};
