import { Ctx } from "boardgame.io";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard } from "./CMCCard";
import * as CardFunctions from "./CardFunctions";
import { AddToGraveyard, OwnerOf, RemoveFromHand } from "./LogicFunctions";
import { dataToEsm } from "@rollup/pluginutils";
import { CardType } from "./Constants";

enum TriggerType {
  ACTIVATED = 0,
  ACTIVATED_TARGETED,
  AUTOMATIC_STAGE,
  AUTOMATIC_RESPONSE,
  AUTOMATIC_POSTCOMBAT,
  AUTOMATIC_PRECOMBAT,
  CONSTANT_FILTERED,
}

enum AbilitySpeed {
  S = -99,
  A = 1,
  B = 2,
  C = 3,
  D = 4,
  E = 5,
  F = 99,
}
enum TriggerNames {
  START_TURN = "start_turn",
  END_STAGE = "end_stage",
  END_TURN = "end_turn",
  ON_DESTROY = "destroy",
  ON_PLAY = "play",
  SPELL = "spell",
  PRECOMBAT = "precombat",
  POSTCOMBAT = "postcombat",
}
interface Ability {
  triggerType: TriggerType;
  targetCode?: string;
  triggerCode?: string;
  activateCode?: string;
  costCode?: string;
  metadata: any;
  speed?: AbilitySpeed;
  abilityName: string;
  abilityText: string;
  abilityCostText?: string;
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

const EmptyTriggerData = {
  name: "",
};

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
      if (triggerFunc(card, ability, trigger_data, owner, newG, ctx)) {
        if (ability.activateCode) {
          const abilityFunc: Function = CardFunctions[ability.activateCode];
          abilityFunc(card, ability, trigger_data, owner, newG, ctx);
          //console.log(newG);
        }
      }
    }
  }

  return newG;
}

function CanActivateAbility(
  card: CMCCard,
  ability: Ability,
  G: CMCGameState,
  ctx: Ctx,

  target?: CMCCard
): boolean {
  const cardowner = OwnerOf(card, G);
  if (
    ![TriggerType.ACTIVATED_TARGETED, TriggerType.ACTIVATED].includes(
      ability.triggerType
    )
  ) {
    return false;
  }

  // is the card a spell in your hand
  if (card.type == CardType.SPELL) {
    let found: boolean = false;
    G.players[cardowner].hand.forEach((crd) => {
      if (crd.guid == card.guid) {
        found = true;
      }
    });
    if (!found) {
      return false;
    }
  }
  // is the trigger target valid
  if (
    target &&
    ability.triggerType == TriggerType.ACTIVATED_TARGETED &&
    ability.targetCode
  ) {
    const targetFunc: Function = CardFunctions[ability.targetCode];
    if (!targetFunc(card, cardowner, target, G, ctx)) {
      return false;
    }
  }

  // pay if needed
  if (ability.costCode) {
    const costFunc: Function = CardFunctions[ability.costCode];
    // do dry run of cost.  will run the actual one afterwards.
    if (!costFunc(card, cardowner, G, ctx, false, true)) {
      return false; // cant afford
    }
  }
  return true;
}
function ResolveStack(G, ctx) {
  SortStack(G, ctx);
  while (G.abilityStack.length > 0) {
    const stacked = G.abilityStack.pop();
    if (
      !ActivateAbility(
        stacked.card,
        stacked.ability,
        G,
        ctx,
        true,
        stacked.target
      )
    ) {
    }
  }
  G.lastAbilityStack = [];
}
function ActivateAbility(
  card: CMCCard,
  ability: Ability,
  G: CMCGameState,
  ctx: Ctx,
  resolveStack: boolean,
  target?: CMCCard
): boolean {
  const cardowner = OwnerOf(card, G);
  if (!CanActivateAbility(card, ability, G, ctx)) {
    return false;
  }

  if (resolveStack || ability.speed == AbilitySpeed.S) {
    if (ability.activateCode) {
      const abilityFunc: Function = CardFunctions[ability.activateCode];
      if (
        !abilityFunc(card, ability, EmptyTriggerData, cardowner, G, ctx, target)
      ) {
        return false;
      }
    }

    if (ability.costCode) {
      const costFunc: Function = CardFunctions[ability.costCode];
      // actually pay mana
      if (!costFunc(card, cardowner, G, ctx, false, false)) {
        return false; // cant afford
      }
    }
    if (card.type == CardType.SPELL) {
      // put the card in the graveyard and out of your hand

      AddToGraveyard(card, G);
      RemoveFromHand(card, cardowner, G);
    }
  } else {
    if (!AddToStack(card, ability, G, ctx, target)) {
      return false;
    }
  }
  return true;
}

function AddToStack(
  card: CMCCard,
  ability: Ability,
  G: CMCGameState,
  ctx: Ctx,
  target?: CMCCard
): boolean {
  if (!ability.speed) {
    return false;
  }
  const stackedAbility: StackedAbility = {
    card: card,
    ability: ability,
    target: target,
  };
  G.abilityStack.push(stackedAbility);
  SortStack(G, ctx);
  return true;
}

function SortStack(G: CMCGameState, ctx: Ctx) {
  G.abilityStack.sort((a, b) =>
    (a.ability.speed ? a.ability.speed : -99) <
    (b.ability.speed ? b.ability.speed : -99)
      ? -1
      : (a.ability.speed ? a.ability.speed : -99) >
        (b.ability.speed ? b.ability.speed : -99)
      ? 1
      : 0
  );
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

interface StackedAbility {
  card: CMCCard;
  ability: Ability;
  target?: CMCCard;
}
export {
  Ability,
  Ability_Trigger,
  TriggeringTrigger,
  TriggerType,
  TriggerPlayerType,
  TriggerNames,
  TriggerAuto,
  CanActivateAbility,
  ActivateAbility,
  StackedAbility,
  AbilitySpeed,
  ResolveStack,
};
