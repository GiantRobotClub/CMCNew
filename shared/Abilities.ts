import { Ctx } from "boardgame.io";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard } from "./CMCCard";
import * as CardFunctions from "./CardFunctions";
import {
  AddToGraveyard,
  AllCards,
  CardScan,
  OwnerOf,
  RemoveFromHand,
} from "./LogicFunctions";
import { CardType } from "./Constants";
import { Random, RandomAPI } from "boardgame.io/src/plugins/random/random";
import { EventsAPI } from "boardgame.io/src/plugins/events/events";
import { RiCreativeCommonsSaLine } from "react-icons/ri";
import { AbilityFunctionArgs } from "./CardFunctions";

enum TriggerType {
  ACTIVATED = "ACTIVATED",
  ACTIVATED_TARGETED = "ACTIVATED_TARGETED",
  AUTOMATIC = "AUTOMATIC",
  CONSTANT_FILTERED = "CONSTANT_FILTERED",
  ACTIVATED_CHAIN = "ACTIVATED_CHAIN",
  COMBAT_MODIFIER = "COMBAT_MODIFIER",
  TEXT = "TEXT",
}

enum AbilitySpeed {
  "S" = 0,
  "A" = 1,
  "B" = 2,
  "C" = 3,
  "D" = 4,
  "E" = 5,
  "F" = 10,
}
enum TriggerNames {
  START_TURN = "start_turn",
  END_STAGE = "end_stage",
  END_TURN = "end_turn",
  ON_DESTROY = "destroy",
  ON_PLAY = "play",
  SPELL = "spell",
  ABILITY = "ability",
  ABILITYTARGET = "abilitytarget",
  PRECOMBAT = "precombat",
  POSTCOMBAT = "postcombat",
  PRECOMBATDEF = "precombatdef",
  POSTCOMBATDEF = "postcombatdef",
  DRAW = "drawcard",
}

interface CombatCode {
  DEFENDER: "DEFENDER"; // cannot attack
  STEALTH: "STEALTH"; // cannot be defended against
  AGGRESSIVE: "AGGRESSIVE"; // cannot defend
  SLIPPERY: "SLIPPERY"; //Cannot be attacked
  DAM: "DAM"; // no overage damage when blocking
  VISION: "VISION"; // can block stealth
  TRACKING: "TRACKING"; // can attack creatures with slippery
}
interface Ability {
  triggerType: TriggerType;
  targetCode?: string;
  triggerCode?: string;
  activateCode?: string | string[];
  combatCodes?: CombatCode[];
  costCode?: string | string[];
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

type Targets = CMCCard | CMCCard[];

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
      let triggerResult = triggerFunc(args);
      if (
        (Array.isArray(triggerResult) && triggerResult.length > 0) ||
        (!Array.isArray(triggerResult) && triggerResult)
      ) {
        if (ability.activateCode) {
          var codearray: string[] = [];
          if (Array.isArray(ability.activateCode)) {
            codearray = ability.activateCode;
          } else {
            codearray = [ability.activateCode];
          }

          for (const code of codearray) {
            //console.log("Ability code", code);
            const abilityFunc: Function = CardFunctions[code];
            const args: AbilityFunctionArgs = {
              card: card,
              ability: ability,
              trigger: trigger_data,
              cardowner: owner,
              G: newG,
              ctx: ctx,
              random: random,
              events: events,
              target: trigger_data.triggeringcard
                ? trigger_data.triggeringcard
                : [],
              dry: false,
            };
            abilityFunc(args);
          }
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
  target?: Targets
): Targets {
  const successTargets: Targets = [];
  const cardowner = OwnerOf(card, G);
  if (
    ![TriggerType.ACTIVATED_TARGETED, TriggerType.ACTIVATED].includes(
      ability.triggerType
    )
  ) {
    return [];
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
      return [];
    }
  }
  // is the trigger target valid
  const targets: (CMCCard | undefined)[] = Array.isArray(target)
    ? target
    : [target];

  let found = false;
  for (const target of targets) {
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
      if (targetFunc(args)) {
        found = true;
        continue;
      }
    }
    if (!found) {
      return [];
    }
    // can pay
    const costcodes = ability.costCode
      ? Array.isArray(ability.costCode)
        ? ability.costCode
        : [ability.costCode]
      : [];
    for (const costcode of costcodes) {
      const costFunc: Function = CardFunctions[costcode];
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
      successTargets.push(card);
      // do dry run of cost.  will run the actual one afterwards.
      const result = costFunc(args);
      if (!result || result.length == 0) {
        return []; // cant afford
      }
    }
  }
  return successTargets;
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
      !CanActivateAbility(
        stacked.card,
        stacked.ability,
        G,
        ctx,
        random,
        events,
        stacked.target
      )
    ) {
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

  CardScan(G, random, ctx, events);
}
function ActivateAbility(
  card: CMCCard,
  ability: Ability,
  G: CMCGameState,
  ctx: Ctx,
  resolveStack: boolean,
  random: RandomAPI,
  events: EventsAPI,
  target?: Targets
): boolean {
  const cardowner = OwnerOf(card, G);
  if (!CanActivateAbility(card, ability, G, ctx, random, events)) {
    console.error("Cant activate");
    return false;
  }

  const costcodes = ability.costCode
    ? Array.isArray(ability.costCode)
      ? ability.costCode
      : [ability.costCode]
    : [];
  for (const costcode of costcodes) {
    const costFunc: Function = CardFunctions[costcode];
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
    const result = costFunc(args);
    if (!result || result.length == 0) {
      console.error("Did not pass " + costFunc);
      return false; // cant afford
    }
  }

  if (resolveStack || ability.speed == AbilitySpeed.S) {
    if (ability.activateCode) {
      var codearray: string[] = [];
      if (Array.isArray(ability.activateCode)) {
        codearray = ability.activateCode;
      } else {
        codearray = [ability.activateCode];
      }
      for (const code of codearray) {
        const abilityFunc: Function = CardFunctions[code];
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
        if (Array.isArray(target)) {
          for (const card of target) {
            TriggerCard(
              TriggerNames.ABILITYTARGET,
              ctx,
              card,
              G,
              random,
              events
            );
          }
        } else if (target) {
          TriggerCard(
            TriggerNames.ABILITYTARGET,
            ctx,
            target,
            G,
            random,
            events
          );
        }
        TriggerCard(TriggerNames.ABILITY, ctx, card, G, random, events);
      }
      //console.log(newG);
    }

    // actually pay mana
    const costcodes = ability.costCode
      ? Array.isArray(ability.costCode)
        ? ability.costCode
        : [ability.costCode]
      : [];
    for (const costcode of costcodes) {
      const costFunc: Function = CardFunctions[costcode];
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
      const result = costFunc(args);
      if (!result || result.length == 0) {
        console.error("Did not pass " + costFunc);
        return false; // cant afford
      }
    }
    if (card.type == CardType.SPELL) {
      // put the card in the graveyard and out of your hand
      AddToGraveyard(card, G);
      RemoveFromHand(card, cardowner, G);

      TriggerCard(TriggerNames.SPELL, ctx, card, G, random, events);
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
  CardScan(G, random, ctx, events);
  return true;
}

function AddToStack(
  card: CMCCard,
  ability: Ability,
  G: CMCGameState,
  ctx: Ctx,
  target?: Targets
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

function TriggerCard(
  name: string,
  ctx: Ctx,
  target: CMCCard,
  G: CMCGameState,
  random: RandomAPI,
  events: EventsAPI
): void {
  if (ctx.activePlayers !== null) {
    Ability_Trigger(
      {
        triggeringcard: target,
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

interface StackedAbility {
  card: CMCCard;
  ability: Ability;
  target?: Targets;
}

function ValidTargets(args: AbilityFunctionArgs, possible: CMCCard[]) {
  const { target, ability, G } = args;
  if (!ability) {
    console.error("no ability");
    return [];
  }
  const targets: CMCCard[] = [];

  if (!target || (Array.isArray(target) && target.length == 0)) {
    if (ability.targetCode) {
      args.target = possible;
      const targetFunc: Function = CardFunctions[ability.targetCode];
      const newTargets = targetFunc(args);
      targets.push(...newTargets);
    }

    // no base target so let's create it based on the 'truth'
    else targets.push(...possible);
  } else {
    targets.push(...(Array.isArray(target) ? target : [target]));
  }
  return targets;
}

function GetModifiedCopy(card: CMCCard, G: CMCGameState, ctx: Ctx) {
  const newcard = JSON.parse(JSON.stringify(card));
  // check if there are any abilities that could affect this card
  const allinplay = AllCards(G).allinplay;
  for (const play of allinplay) {
    for (const ability of play.abilities) {
      if (ability.triggerType == TriggerType.CONSTANT_FILTERED) {
        if (!ability.targetCode || !ability.activateCode) {
          continue;
        }
        const args: AbilityFunctionArgs = {
          card: card,
          ability: ability,
          cardowner: OwnerOf(card, G),
          G: G,
          ctx: ctx,
          target: newcard,
          dry: false,
        };
        const targetFunc: Function = CardFunctions[ability.targetCode];
        if (targetFunc(args)) {
          const activatecode = Array.isArray(ability.activateCode)
            ? ability.activateCode
            : [ability.activateCode];
          //console.log("Ability ", ability, activatecode);
          for (const code of activatecode) {
            //console.log("Got code ", code);
            const applyFunc: Function = CardFunctions[code];
            //console.log("Ability apply", code, applyFunc, args);
            applyFunc(args);
          }
        }
      }
    }
  }

  return newcard;
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
  Targets,
  ValidTargets,
  GetModifiedCopy,
  TriggerCard,
};
