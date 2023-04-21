import { Ctx } from "boardgame.io";
import { nanoid } from "nanoid";
import { couldStartTrivia } from "typescript";
import {
  Ability,
  Targets,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
  ValidTargets,
} from "./Abilities";
import { CMCGameState } from "./CardmasterGame";
import {
  CMCCard,
  CMCEntityCard,
  CMCMonsterCard,
  CMCPersonaCard,
  CreateBasicCard,
  GetCardPrototype,
  GetModifiedStatCard,
} from "./CMCCard";
import { CardType } from "./Constants";
import {
  AllCards,
  DealDamage,
  DizzyOne,
  ForceDiscard,
  GainLife,
  IsMonster,
  IsPersona,
  OwnerOf,
  PlaceCard,
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
  target?: Targets;
  G: CMCGameState;
  ctx: Ctx;
  events?: EventsAPI;
  random?: RandomAPI;
  dry: boolean;
  trigger?: TriggeringTrigger;
}

export function DizzyCost(args: AbilityFunctionArgs): Targets {
  const { card, G, dry } = args;
  if (card.type != CardType.EFFECT && card.type != CardType.MONSTER) {
    console.error("not the right type");
    return [];
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
    return [];
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
      return [];
    }
  }

  if (!dry) {
    DizzyOne(card as CMCEntityCard, G);
  }
  return card;
}

// defaultcost checks everything in the player.resources against the card.cost.
export function DefaultCost(args: AbilityFunctionArgs): Targets {
  const { card, G, ctx, cardowner, random, events, dry } = args;

  const fullplayer: CMCPlayer = G.playerData[cardowner];

  if (!fullplayer) {
    console.log("no full player");
    return [];
  }
  const modcard = GetModifiedStatCard(card, G, ctx);
  for (const check in modcard.cost) {
    for (const sub in modcard.cost[check]) {
      if (fullplayer.resources[check][sub] < modcard.cost[check][sub]) {
        console.log("Cant play " + modcard.name);
        return [];
      }
    }
  }

  // if we are actually calling to check
  if (!dry) {
    if (!PlayerPay(cardowner, modcard.cost, G, random, events)) {
      return [];
    }
  }
  return modcard;
}

function ApplyRecursion(target: any, stats: any, add: boolean) {
  if (typeof stats == "object") {
    for (const [key, value] of Object.entries(stats)) {
      ApplyRecursion(target[key], value, add);
    }
  } else if (typeof stats == "number") {
    target = stats + (add ? target : 0);
  } else {
    target = stats;
  }
  return target;
}
export function ApplyStats(args: AbilityFunctionArgs): Targets {
  const { card, G, target, ability } = args;
  const targets: CMCCard[] = [];
  if (!ability) {
    return [];
  }
  if (!target) {
    // no base target so let's do it to everyone

    targets.push(...AllCards(G).allinplay);
  } else {
    targets.push(...(Array.isArray(target) ? target : [target]));
  }
  const realtargets: CMCCard[] = [];
  for (const target of targets) {
    if (ability.metadata.statmod) {
      const stats = ability.metadata.statmod;
      //go through entire tree and apply
      ApplyRecursion(target, stats, true);
      realtargets.push(target);
    } else if (ability.metadata.statset) {
      const stats = ability.metadata.statmod;
      // go through entir etree and set
      ApplyRecursion(target, stats, false);
      realtargets.push(target);
    }
  }
  return realtargets;
}

export function IsDamagable(args: AbilityFunctionArgs): Targets {
  const { target, G } = args;
  const targets: CMCCard[] = [];
  if (!target) {
    // no base target so let's create it based on the 'truth'

    targets.push(...AllCards(G).allinplay);
  } else {
    targets.push(...(Array.isArray(target) ? target : [target]));
  }

  const realtargets: CMCCard[] = [];

  for (const target of targets) {
    // can only damage in field
    let found: boolean = false;

    AllCards(G).allinplay.forEach((card) => {
      if (card.guid == target.guid && card.type == CardType.MONSTER) {
        realtargets.push(card);
      } else if (card.guid == target.guid && card.type == CardType.EFFECT) {
        realtargets.push(card);
      } else if (card.guid == target.guid && card.type == CardType.PERSONA) {
        realtargets.push(card);
      }
    });

    // is it a damagable type
  }
  return realtargets;
}

export function ManaGenerate(args: AbilityFunctionArgs): Targets {
  const { card, G, ability, ctx } = args;
  if (!ability) {
    return [];
  }
  let playerid = OwnerOf(card, G);
  let player: CMCPlayer = G.playerData[playerid];

  let resource = {
    mana: {},
  };
  resource.mana[ability.metadata.color] = ability.metadata.amount;

  PlayerAddResource(playerid, resource, G);

  G.playerData[ctx.currentPlayer] = player;
  return card;
}

export function TriggerStage(args: AbilityFunctionArgs): Targets {
  const { trigger, ability, ctx, cardowner, G } = args;
  if (!trigger) {
    return [];
  }
  if (!ability) {
    return [];
  }
  if (!ctx.activePlayers) {
    return [];
  }
  let playerToCheck = cardowner;
  if (trigger.triggeringPlayer != cardowner) {
    return [];
  }
  if (ctx.activePlayers[playerToCheck] != ability.metadata.triggerstage) {
    return [];
  }
  if (trigger.name != ability.metadata.triggername) {
    return [];
  }
  return G.location;
}

export function LifeGain(args: AbilityFunctionArgs): Targets {
  const { target, card, ability, G } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  const realtargets: CMCCard[] = [];
  for (const target of targets) {
    if (![CardType.PERSONA, CardType.MONSTER].includes(target.type)) {
      console.log("isnt persona or");
      continue;
    }
    if (IsMonster(target) || IsPersona(target)) {
      GainLife(target, ability.metadata.amount, G);

      realtargets.push(target);
    } else {
      console.error("isnt persona or monster");
      continue;
    }
  }

  return realtargets;
}

export function SpawnEntity(args: AbilityFunctionArgs): Targets {
  const realtargs: CMCCard[] = [];
  const { target, card, ability, G } = args;
  if (!ability) {
    return [];
  }
  const playablecard = GetCardPrototype(ability.metadata.cardid);
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).field);
  for (const target of targets) {
    if (target.type != CardType.EMPTY) {
      return [];
    }
    const thiscard: CMCEntityCard = JSON.parse(JSON.stringify(playablecard));
    thiscard.guid = nanoid();
    thiscard.status.token = true;

    PlaceCard(card, target, OwnerOf(target, G), G);
  }
  return realtargs;
}

export function DamageTarget(args: AbilityFunctionArgs): Targets {
  const { target, card, ability, G } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  const realtargets: CMCCard[] = [];
  let found = false;
  for (const target of targets) {
    if (![CardType.PERSONA, CardType.MONSTER].includes(target.type)) {
      console.log("isnt persona or");
      continue;
    }
    if (IsMonster(target) || IsPersona(target)) {
      DealDamage(target, card, ability.metadata.amount, G);
      realtargets.push(target);
    } else {
      console.error("isnt persona or monster");
    }
  }
  return realtargets;
}

export function Bounce(args: AbilityFunctionArgs): Targets {
  const { target, card, ability, G } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  const realtargets: CMCCard[] = [];
  let found = false;
  for (const target of targets) {
    if (![CardType.PERSONA, CardType.MONSTER].includes(target.type)) {
      console.log("isnt persona or");
      continue;
    }
    if (IsMonster(target) || IsPersona(target)) {
      G.players[OwnerOf(target, G)].hand.push(
        JSON.parse(JSON.stringify(target))
      );
      Object.assign(target, CreateBasicCard());
      realtargets.push(target);
    } else {
      console.error("isnt persona or monster");
    }
  }
  return realtargets;
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

export function Match(args: AbilityFunctionArgs): Targets {
  const { ability, G, target, cardowner, ctx } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  const realtargets: CMCCard[] = [];
  let found = false;
  for (const target of targets) {
    if (ability.metadata.matchplayer) {
      if (ability.metadata.matchplayer == TriggerPlayerType.EITHER) {
      } else if (ability.metadata.matchplayer == TriggerPlayerType.OWNER) {
        if (cardowner != OwnerOf(target, G)) {
          continue;
        }
      } else if (ability.metadata.matchplayer == TriggerPlayerType.OPPONENT) {
        if (cardowner == OwnerOf(target, G)) {
          continue;
        }
      } else if (ability.metadata.matchplayer == TriggerPlayerType.ACTIVE) {
        if (GetActivePlayer(ctx) == OwnerOf(target, G)) {
          continue;
        }
      } else if (ability.metadata.matchplayer == TriggerPlayerType.ACTIVE) {
        if (GetActivePlayer(ctx) != OwnerOf(target, G)) {
          continue;
        }
      }
      realtargets.push(target);
    }

    if (ability.metadata.matchPattern) {
      if (!MatchState(target, ability.metadata.matchPattern)) {
        return [];
      }
    }
  }
  return realtargets;
}

export function Discard(args: AbilityFunctionArgs) {
  const { target, cardowner, ability, G, ctx, random, events } = args;
  if (!random || !events) {
    return false;
  }
  if (!ability) {
    return false;
  }

  const targets: (CMCCard | undefined)[] = Array.isArray(target)
    ? target
    : [target];

  let found = false;
  for (const target of targets) {
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

    found =
      found && ForceDiscard(discardchoose, targeto, G, ctx, random, events);
  }
  return found;
}
