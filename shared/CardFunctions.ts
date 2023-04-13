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

export function DizzyCost(
  card: CMCCard,
  cardowner: string,
  ability: Ability,
  target: CMCCard,
  G: CMCGameState,
  ctx: Ctx,
  events: EventsAPI,
  random: RandomAPI,
  dry: boolean
): boolean {
  if (card.type != CardType.EFFECT && card.type != CardType.MONSTER) {
    return false;
  }

  let found: boolean = false;
  for (const playcard of AllCards(G).allinplay) {
    if (card.guid == playcard.guid) {
      found = true;
      break;
    }
  }
  if (!found) {
    return false;
  }
  if ((card as CMCEntityCard).dizzy) {
    return false;
  }
  if (!dry) {
    (card as CMCEntityCard).dizzy = true;
  }
  return true;
}

// defaultcost checks everything in the player.resources against the card.cost.
export function DefaultCost(
  card: CMCCard,
  playertocheck: string,
  G: CMCGameState,
  ctx: Ctx,
  random: RandomAPI,
  events: EventsAPI,
  dry: boolean
): boolean {
  const fullplayer: CMCPlayer = G.playerData[playertocheck];

  if (!fullplayer) {
    return false;
  }
  const modcard = GetModifiedStatCard(card);
  for (const check in modcard.cost) {
    for (const sub in modcard.cost[check]) {
      if (fullplayer.resources[check][sub] < modcard.cost[check][sub]) {
        return false;
      }
    }
  }

  // if we are actually calling to check
  if (!dry) {
    if (!PlayerPay(playertocheck, modcard.cost, G)) {
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
  random: RandomAPI,
  events: EventsAPI,
  ctx: Ctx
): boolean {
  // can only damage in field
  let found: boolean = false;

  if (target.type == CardType.MONSTER) {
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
  } else if (target.type == CardType.PERSONA) {
    return true;
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
  random: RandomAPI,
  events: EventsAPI,
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
  ctx: Ctx,
  random: RandomAPI,
  events: EventsAPI
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
  random: RandomAPI,
  events: EventsAPI,
  target?: CMCCard
) {
  if (!target) return false;
  if (![CardType.PERSONA, CardType.MONSTER].includes(target.type)) {
    return false;
  }
  if (IsMonster(target) || IsPersona(target)) {
    DealDamage(target, card, ability.metadata.amount, G);
    return true;
  } else {
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

export function Match(
  card: CMCCard,
  cardowner: string,
  ability: Ability,
  target: CMCCard,
  G: CMCGameState,
  ctx: Ctx
): boolean {
  // no match pattern means everybody.

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

export function Discard(
  card: CMCCard,
  ability: Ability,
  trigger: TriggeringTrigger,
  owner: string,
  G: CMCGameState,
  ctx: Ctx,
  random: RandomAPI,
  events: EventsAPI,
  target?: CMCCard
) {
  let targeto = owner;

  if (!target) {
    //assume owner
    targeto = owner;
  } else {
    targeto = OwnerOf(target, G);
  }
  let discardchoose = false;
  if (ability.metadata && "discardchoose" in ability.metadata) {
    discardchoose = ability.metadata.discardchoose;
  }

  return ForceDiscard(discardchoose, targeto, G, ctx, random, events);
}
