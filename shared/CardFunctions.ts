import { Ctx } from "boardgame.io";
import { couldStartTrivia } from "typescript";
import {
  Ability,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
} from "./Abilities";
import { CMCGameState } from "./CardmasterGame";
import {
  CMCCard,
  CMCEntityCard,
  CMCMonsterCard,
  CMCPersonaCard,
  GetModifiedStatCard,
} from "./CMCCard";
import { CardType } from "./Constants";
import {
  AllCards,
  DealDamage,
  DizzyOne,
  ForceDiscard,
  IsMonster,
  IsPersona,
  OwnerOf,
  PlayerAddResource,
  PlayerPay,
} from "./LogicFunctions";
import { CMCPlayer } from "./Player";
import { GetActivePlayer } from "./Util";
import { Random, RandomAPI } from "boardgame.io/src/plugins/random/random";
import { EventsAPI } from "boardgame.io/src/plugins/plugin-events";

export interface AbilityFunctionArgs {
  card: CMCCard;
  cardowner: string;
  ability?: Ability;
  target?: CMCCard;
  G: CMCGameState;
  ctx: Ctx;
  events?: EventsAPI;
  random?: RandomAPI;
  dry: boolean;
  trigger?: TriggeringTrigger;
}

export function DizzyCost(args: AbilityFunctionArgs): boolean {
  const { card, G, dry } = args;
  if (card.type != CardType.EFFECT && card.type != CardType.MONSTER) {
    console.error("not the right type");
    return false;
  }

  let found: boolean = false;
  for (const playcard of AllCards(G).field) {
    if (card.guid == playcard.guid) {
      found = true;
      break;
    }
  }
  if (!found) {
    console.error("card not found " + card);
    return false;
  }
  if ("dizzy" in card && "destroyed" in card && "status" in card) {
    const entitycard: CMCEntityCard = card as CMCEntityCard;
    if (entitycard.dizzy) {
      console.error(
        "card is already dizzy ",
        card.name,
        entitycard.dizzy,
        entitycard
      );
      return false;
    }
  }

  if (!dry) {
    DizzyOne(card as CMCEntityCard, G);
  }
  return true;
}

// defaultcost checks everything in the player.resources against the card.cost.
export function DefaultCost(args: AbilityFunctionArgs): boolean {
  const { card, G, cardowner, random, events, dry } = args;

  const fullplayer: CMCPlayer = G.playerData[cardowner];

  if (!fullplayer) {
    console.log("no full player");
    return false;
  }
  const modcard = GetModifiedStatCard(card);
  for (const check in modcard.cost) {
    for (const sub in modcard.cost[check]) {
      if (fullplayer.resources[check][sub] < modcard.cost[check][sub]) {
        console.log("Cant play " + modcard.name);
        return false;
      }
    }
  }

  // if we are actually calling to check
  if (!dry) {
    if (!PlayerPay(cardowner, modcard.cost, G, random, events)) {
      return false;
    }
  }
  return true;
}

export function IsDamagable(args: AbilityFunctionArgs): boolean {
  const { target, G } = args;
  if (!target) {
    console.error("no target");
    return false;
  }
  // can only damage in field
  let found: boolean = false;

  AllCards(G).allinplay.forEach((card) => {
    if (card.guid == target.guid && card.type == CardType.MONSTER) {
      found = true;
    }
  });

  if (target.type == CardType.PERSONA) {
    return true;
  }
  // is it a damagable type
  return found && (IsMonster(target) || IsPersona(target));
}

export function ManaGenerate(args: AbilityFunctionArgs): boolean {
  const { card, G, ability, ctx } = args;
  if (!ability) {
    return false;
  }
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

export function TriggerStage(args: AbilityFunctionArgs): boolean {
  const { trigger, ability, ctx, cardowner } = args;
  if (!trigger) {
    return false;
  }
  if (!ability) {
    return false;
  }
  if (!ctx.activePlayers) {
    return false;
  }
  let playerToCheck = cardowner;
  if (trigger.triggeringPlayer != cardowner) {
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

export function DamageTarget(args: AbilityFunctionArgs) {
  const { target, card, ability, G } = args;
  if (!ability) {
    console.error("no ability");
    return false;
  }
  if (!target) {
    console.log("no target");
    return false;
  }
  if (![CardType.PERSONA, CardType.MONSTER].includes(target.type)) {
    console.log("isnt persona or");
    return false;
  }
  if (IsMonster(target) || IsPersona(target)) {
    DealDamage(target, card, ability.metadata.amount, G);
    return true;
  } else {
    console.error("isnt persona or monster");
    return false;
  }
}
export function Always(
  card: CMCCard,
  cardowner: string,
  ability: Ability,
  target: CMCCard,
  G: CMCGameState,
  ctx: Ctx
) {
  return true;
}

function MatchState(original: {}, match: {}) {
  if (!match) {
    return true;
  }
  const entries = Object.entries(match);
  let returnval: boolean = true;
  entries.forEach(([key, value]) => {
    if (typeof value === "object") {
      if (original.hasOwnProperty(key)) {
        returnval = MatchState(original[key], value as object);
        return;
      }
    } else {
      returnval = value == original[key];
      return;
    }
  });
  return returnval;
}

export function Match(args: AbilityFunctionArgs): boolean {
  const { ability, G, target, cardowner, ctx } = args;
  // no match pattern means everybody.
  if (!ability) {
    return false;
  }
  if (!target) {
    return false;
  }
  if (ability.metadata.matchplayer) {
    if (ability.metadata.matchplayer == TriggerPlayerType.EITHER) {
    } else if (ability.metadata.matchplayer == TriggerPlayerType.OWNER) {
      if (cardowner != OwnerOf(target, G)) {
        return false;
      }
    } else if (ability.metadata.matchplayer == TriggerPlayerType.OPPONENT) {
      if (cardowner == OwnerOf(target, G)) {
        return false;
      }
    } else if (ability.metadata.matchplayer == TriggerPlayerType.ACTIVE) {
      if (GetActivePlayer(ctx) == OwnerOf(target, G)) {
        return false;
      }
    } else if (ability.metadata.matchplayer == TriggerPlayerType.ACTIVE) {
      if (GetActivePlayer(ctx) != OwnerOf(target, G)) {
        return false;
      }
    }
  }

  if (ability.metadata.matchPattern) {
    if (!MatchState(target, ability.metadata.matchPattern)) {
      return false;
    }
  }
  return true;
}

export function Discard(args: AbilityFunctionArgs) {
  const { target, cardowner, ability, G, ctx, random, events } = args;
  if (!random || !events) {
    return false;
  }
  if (!ability) {
    return false;
  }
  let targeto = cardowner;

  if (!target) {
    //assume owner
    targeto = cardowner;
  } else {
    targeto = OwnerOf(target, G);
  }
  let discardchoose = false;
  if (ability.metadata && "discardchoose" in ability.metadata) {
    discardchoose = ability.metadata.discardchoose;
  }

  return ForceDiscard(discardchoose, targeto, G, ctx, random, events);
}
