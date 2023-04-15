import { Ctx } from "boardgame.io";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard, StatMod } from "./CMCCard";
import * as CardFunctions from "./CardFunctions";
import {
  AddToGraveyard,
  AllCards,
  CardScan,
  OwnerOf,
  RemoveFromHand,
} from "./LogicFunctions";
import { dataToEsm } from "@rollup/pluginutils";
import { CardType } from "./Constants";
import { Random, RandomAPI } from "boardgame.io/src/plugins/random/random";
import { EventsAPI } from "boardgame.io/src/plugins/events/events";
import { RiCreativeCommonsSaLine } from "react-icons/ri";
import { AbilityFunctionArgs } from "./CardFunctions";

enum TriggerType {
  ACTIVATED = "ACTIVATED",
  ACTIVATED_TARGETED = "ACTIVATED_TARGETED",
  AUTOMATIC_STAGE = "AUTOMATIC_STAGE",
  AUTOMATIC_RESPONSE = "AUTOMATIC_RESPONSE",
  AUTOMATIC_POSTCOMBAT = "AUTOMATIC_POSTCOMBAT",
  AUTOMATIC_PRECOMBAT = "AUTOMATIC_PRECOMBAT",
  CONSTANT_FILTERED = "CONSTANT_FILTERED",
  ACTIVATED_CHAIN = "ACTIVATED_CHAIN",
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
  EITHER = "EITHER",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OWNER = "OWNER",
  OPPONENT = "OPPONENT",
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
  ctx: Ctx,

  random: RandomAPI,
  events: EventsAPI
) {
  let newG = G;
  //console.log("Ability trigger check " + JSON.stringify(trigger_data));
  const allcards = AllCards(G).allinplay;
  allcards.forEach((card) => {
    newG = handleTrigger(
      card,
      trigger_data,
      OwnerOf(card, G),
      ctx,
      G,
      random,
      events
    );
  });

  return newG;
}

function handleTrigger(
  card: CMCCard,
  trigger_data: TriggeringTrigger,
  owner: string,
  ctx: Ctx,
  G: CMCGameState,
  random: RandomAPI,
  events: EventsAPI
) {
  let newG = G;
  for (const ability of card.abilities) {
    if (ability.triggerCode) {
      const triggerFunc: Function = CardFunctions[ability.triggerCode];
      //console.log(CardFunctions);
      const args: AbilityFunctionArgs = {
        card: card,
        ability: ability,
        trigger: trigger_data,
        cardowner: owner,
        G: newG,
        ctx: ctx,
        random: random,
        events: events,
        target: undefined,
        dry: false,
      };
      if (triggerFunc(args)) {
        if (ability.activateCode) {
          const abilityFunc: Function = CardFunctions[ability.activateCode];
          const args: AbilityFunctionArgs = {
            card: card,
            ability: ability,
            trigger: trigger_data,
            cardowner: owner,
            G: newG,
            ctx: ctx,
            random: random,
            events: events,
            target: undefined,
            dry: false,
          };
          abilityFunc(args);
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
  random?: RandomAPI,
  events?: EventsAPI,
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
    const args: AbilityFunctionArgs = {
      card: card,
      ability: ability,
      cardowner: cardowner,
      G: G,
      ctx: ctx,
      random: random,
      events: events,
      target: target,
      dry: true,
    };
    if (!targetFunc(args)) {
      return false;
    }
  }

  // can pay
  if (ability.costCode) {
    const costFunc: Function = CardFunctions[ability.costCode];
    const args: AbilityFunctionArgs = {
      card: card,
      ability: ability,
      cardowner: cardowner,
      G: G,
      ctx: ctx,
      random: random,
      events: events,
      target: undefined,
      dry: true,
    };
    // do dry run of cost.  will run the actual one afterwards.
    if (!costFunc(args)) {
      return false; // cant afford
    }
  }
  return true;
}
function ResolveStack(
  G: CMCGameState,
  ctx: Ctx,
  random: RandomAPI,
  events: EventsAPI
) {
  SortStack(G, ctx);

  while (G.abilityStack.length > 0) {
    const stacked = G.abilityStack.pop();
    if (!stacked) {
      break;
    }
    if (
      !ActivateAbility(
        stacked.card,
        stacked.ability,
        G,
        ctx,
        true,
        random,
        events,
        stacked.target
      )
    ) {
      console.error(
        "Failed to use ability. " + stacked.ability.abilityName + " Going on."
      );
    }
  }
  G.lastAbilityStack = [];

  CardScan(G, random);
}
function ActivateAbility(
  card: CMCCard,
  ability: Ability,
  G: CMCGameState,
  ctx: Ctx,
  resolveStack: boolean,
  random: RandomAPI,
  events: EventsAPI,
  target?: CMCCard
): boolean {
  const cardowner = OwnerOf(card, G);
  if (!CanActivateAbility(card, ability, G, ctx, random, events)) {
    console.error("Cant activate");
    return false;
  }

  if (ability.costCode) {
    const costFunc: Function = CardFunctions[ability.costCode];
    const args: AbilityFunctionArgs = {
      card: card,
      ability: ability,
      cardowner: cardowner,
      G: G,
      ctx: ctx,
      random: random,
      events: events,
      target: undefined,
      dry: true,
    };
    if (!costFunc(args)) {
      console.error("Did not pass " + costFunc);
      return false; // cant afford
    }
  }

  if (resolveStack || ability.speed == AbilitySpeed.S) {
    if (ability.activateCode) {
      const abilityFunc: Function = CardFunctions[ability.activateCode];
      const args: AbilityFunctionArgs = {
        card: card,
        ability: ability,
        cardowner: cardowner,
        G: G,
        ctx: ctx,
        random: random,
        events: events,
        target: target,
        dry: false,
      };
      if (!abilityFunc(args)) {
        console.error("Did not pass " + abilityFunc);
        return false;
      }
    }

    // actually pay mana
    if (ability.costCode) {
      const costFunc: Function = CardFunctions[ability.costCode];
      const args: AbilityFunctionArgs = {
        card: card,
        ability: ability,
        cardowner: cardowner,
        G: G,
        ctx: ctx,
        random: random,
        events: events,
        target: target,
        dry: false,
      };
      // actually pay mana
      if (!costFunc(args)) {
        console.error("Did not pass " + costFunc);
        return false; // cant afford
      }
    }
    if (card.type == CardType.SPELL) {
      // put the card in the graveyard and out of your hand
      AddToGraveyard(card, G);
      RemoveFromHand(card, cardowner, G);
    }
    if (ability.metadata.chain !== undefined) {
      // run another ability afterwards.
      const chainedability = card.abilities[ability.metadata.chain];
      if (chainedability.triggerType != TriggerType.ACTIVATED_CHAIN) {
        console.error("tried 2 chain");
        return false;
      }
      return ActivateAbility(
        card,
        chainedability,
        G,
        ctx,
        resolveStack,
        random,
        events,
        target
      );
    }
  } else {
    if (!AddToStack(card, ability, G, ctx, target)) {
      return false;
    }
  }
  CardScan(G, random);
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

function TriggerAuto(
  name: string,
  ctx: Ctx,
  G: CMCGameState,
  random: RandomAPI,
  events: EventsAPI
): void {
  if (ctx.activePlayers !== null) {
    Ability_Trigger(
      {
        name: name,
        stage: ctx.activePlayers[ctx.currentPlayer],
        triggeringPlayer: ctx.currentPlayer,
      },
      G,
      ctx,
      random,
      events
    );
  }
}

function ApplyStatChangesToThisCard(
  card: CMCCard,
  tcard: CMCCard,
  ctx: Ctx,
  G: CMCGameState
) {
  // wipe out existing ones from this source
  if (tcard.statmods) {
    tcard.statmods = tcard.statmods.filter(
      (mod: StatMod) => mod.sourceGuid != card.guid
    );
  }

  card.abilities.forEach((ability) => {
    if (ability.triggerType != TriggerType.CONSTANT_FILTERED) {
      return;
    }
    if (!ability.metadata.statmod) {
      return;
    }
    if (!ability.targetCode) {
      return;
    }
    const args: AbilityFunctionArgs = {
      card: card,
      ability: ability,
      cardowner: OwnerOf(card, G),
      G: G,
      ctx: ctx,
      target: tcard,
      dry: false,
    };
    const targetFunc: Function = CardFunctions[ability.targetCode];
    if (!targetFunc(args)) {
      return;
    }
    const statmod: StatMod = {
      sourceGuid: card.guid,
      mods: [ability.metadata.statmod],
    };
    if (!card.statmods) {
      card.statmods = [];
    }
    card.statmods.push(statmod);
  });
}

function ApplyStatChanges(card: CMCCard, ctx: Ctx, G: CMCGameState) {
  for (const slotplayer in G.slots) {
    const subplayer = "monsters";
    for (const subrow of G.slots[slotplayer][subplayer]) {
      const tcard: CMCCard = subrow;
      ApplyStatChangesToThisCard(card, tcard, ctx, G);
    }
  }
}
function ApplyAllStatChanges(ctx: Ctx, G: CMCGameState) {
  const allcards = AllCards(G).all;
  allcards.forEach((card) => {
    ApplyStatChanges(card, ctx, G);
  });
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
  ApplyStatChanges,
  ApplyAllStatChanges,
};
