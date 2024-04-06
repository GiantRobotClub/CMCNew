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
  DrawCard,
  ForceDiscard,
  GainLife,
  GainTemporaryStats,
  IsEffect,
  IsMonster,
  IsPersona,
  OwnerOf,
  PlaceCard,
  PlayerAddResource,
  PlayerPay,
} from "./LogicFunctions";
import { CMCPlayer } from "./Player";
import { GetActivePlayer, OtherPlayer } from "./Util";
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

export function DestroyCost(args: AbilityFunctionArgs): Targets {
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
    if (entitycard.destroyed) {
      console.error(
        "card is already destroyed ",
        card.name,
        entitycard.dizzy,
        entitycard
      );
      return [];
    }
  }

  if (!dry) {
    (card as CMCEntityCard).destroyed = true;
  }
  return card;
}

// defaultcost checks everything in the player.resources against the card.cost.
export function DefaultCost(args: AbilityFunctionArgs): Targets {
  const { card, G, ctx, cardowner, random, events, dry } = args;

  const fullplayer: CMCPlayer = G.playerData[cardowner];

  if (!fullplayer) {
    //console.log("no full player");
    return [];
  }
  const modcard = GetModifiedStatCard(card, G, ctx);
  for (const check in modcard.cost) {
    for (const sub in modcard.cost[check]) {
      if (fullplayer.resources[check][sub] < modcard.cost[check][sub]) {
        //console.log("Cant play " + modcard.name);
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

// defaultcost checks everything in the player.resources against the card.cost.
export function DiscardCost(args: AbilityFunctionArgs): Targets {
  const { card, G, ability, ctx, cardowner, random, events, dry } = args;

  const fullplayer: CMCPlayer = G.playerData[cardowner];

  if (!fullplayer) {
    //console.log("no full player");
    return [];
  }

  const amount = ability?.metadata.costamount;

  if (G.players[cardowner].hand.length < amount) {
    // can't discard enough cards.
    return [];
  }
  const newargs = {
    ...args,
    target: undefined,
  };
  Discard(newargs);
  // if we are actually calling to check

  return fullplayer.persona;
}

// defaultcost checks everything in the player.resources against the card.cost.
export function ResourceCost(args: AbilityFunctionArgs): Targets {
  const { card, G, ctx, cardowner, random, events, dry, ability } = args;

  const fullplayer: CMCPlayer = G.playerData[cardowner];

  if (!fullplayer) {
    //console.log("no full player");
    return [];
  }
  if (!ability || !ability.metadata || !ability.metadata.cost) {
    return [];
  }
  // if we are actually calling to check
  if (!dry) {
    if (!PlayerPay(cardowner, ability.metadata.cost, G, random, events)) {
      return [];
    }
  }
  return card;
}

function ApplyRecursion(target: any, stats: any, add: boolean) {
  if (!target) {
    return target;
  }
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
      const stats = ability.metadata.statset;
      // go through entir etree and set
      ApplyRecursion(target, stats, false);
      realtargets.push(target);
    }
  }
  return realtargets;
}


export function TemporaryStatGain(args: AbilityFunctionArgs): Targets {
  const { target, card, ability, G } = args;
  if (!ability ) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  const realtargets: CMCCard[] = [];
  for (const target of targets) {

    if (IsMonster(target)) {
      GainTemporaryStats(target, ability.metadata.lifeAmount, ability.metadata.attackAmount, G);
      realtargets.push(target);
    } else {
      console.error("isnt monster");
      continue;
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
      } else if (card.guid == target.guid && card.type == CardType.PERSONA) {
        realtargets.push(card);
      }
    });

    // is it a damagable type
  }
  return realtargets;
}

export function IsDestroyable(args: AbilityFunctionArgs): Targets {
  const { target, G } = args;
  const targets: CMCCard[] = [];
  if (!target) {
    // no base target so let's create it based on the 'truth'

    targets.push(...AllCards(G).field);
  } else {
    targets.push(...(Array.isArray(target) ? target : [target]));
  }

  const realtargets: CMCCard[] = [];

  for (const target of targets) {
    // can only damage in field

    AllCards(G).allinplay.forEach((card) => {
      if (card.guid == target.guid && card.type == CardType.MONSTER) {
        realtargets.push(card);
      } else if (card.guid == target.guid && card.type == CardType.EFFECT) {
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

export function DrawACard(args: AbilityFunctionArgs): Targets {
  const { card, G, ability, ctx, target, random, events } = args;
  if (!ability) {
    return [];
  }

  const doyou: boolean =
    ability.metadata.owner ||
    (!ability.metadata.opponent && !ability.metadata.owner);
  const doop: boolean = ability.metadata.opponent;
  let playerid = OwnerOf(card, G);
  if (doyou) {
    DrawCard(playerid, ability.metadata.amount, G, ctx, random!, events!);
  }
  if (doop) {
    DrawCard(
      OtherPlayer(playerid),
      ability.metadata.amount,
      G,
      ctx,
      random!,
      events!
    );
  }

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
  return AllCards(G).all;
}

export function TriggerIntoPlay(args: AbilityFunctionArgs): Targets {
  const { trigger, ability, ctx, cardowner, G } = args;
  if (!trigger) {
    return [];
  }
  if (!ability) {
    return [];
  }
  if (!trigger.triggeringcard) {
    return [];
  }
  if (cardowner != GetActivePlayer(ctx)) {
    return [];
  }
  if (trigger.name != ability.metadata.triggername) {
    return [];
  }
  return trigger.triggeringcard;
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
      //console.log("isnt persona or");
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
  console.log("targets:", target);
  const playablecard = GetCardPrototype(ability.metadata.cardid);
  const count = ability.metadata.count ?? 1;
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).field);
  let curcount = 0;
  for (const target of targets) {
    if (target.type != CardType.EMPTY) {
      continue;
    }
    const thiscard: CMCEntityCard = JSON.parse(JSON.stringify(playablecard));
    thiscard.guid = nanoid();
    thiscard.status.token = true;

    PlaceCard(playablecard, target, OwnerOf(target, G), G);
    curcount++;
    if (curcount >= count) {
      break;
    }
  }
  return realtargs;
}

export function SpawnCopy(args: AbilityFunctionArgs): Targets {
  const realtargs: CMCCard[] = [];
  const { target, card, ability, G } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).field);
  for (const target of targets) {
    if (target.type != CardType.EMPTY) {
      return [];
    }
    const thiscard: CMCEntityCard = JSON.parse(JSON.stringify(card));
    thiscard.guid = nanoid();
    thiscard.status.token = true;
    if (ability.metadata.split && thiscard.type == CardType.MONSTER) {
      const origlife = (thiscard as CMCMonsterCard).life;
      (thiscard as CMCMonsterCard).life = Math.ceil(origlife / 2);
      (card as CMCMonsterCard).life = Math.ceil(origlife / 2);
    }

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
      //console.log("isnt persona or");
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
export function CopyTarget(args: AbilityFunctionArgs): Targets {
  const { target, card, ability, G } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  const realtargets: CMCCard[] = [];
  // can only do one of these, naturally
  for (const target of targets) {
    if (![CardType.EFFECT, CardType.MONSTER].includes(target.type)) {
      console.error("isnt effect or monster");
      continue;
    }
    if (IsMonster(target) || IsEffect(target)) {
      for (const slotplayer in G.slots) {
        for (const subplayer in G.slots[slotplayer]) {
          for (const subrow of G.slots[slotplayer][subplayer]) {
            const foundcard: CMCEntityCard = subrow;
            if (card.guid == foundcard.guid) {
              G.slots[slotplayer][subplayer] = target;
              return target;
            }
          }
        }
      }
    } else {
      console.error("isnt pereffectsona or monster");
    }
  }
  return [];
}
export function DestroyTarget(args: AbilityFunctionArgs): Targets {
  const { target, card, ability, G } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  const realtargets: CMCCard[] = [];
  let found = false;
  for (const target of targets) {
    if (![CardType.EFFECT, CardType.MONSTER].includes(target.type)) {
      console.error("isnt effect or monster");
      continue;
    }
    if (IsMonster(target) || IsEffect(target)) {
      if (!target.destroyed) {
        target.destroyed = true;
        realtargets.push(target);
      }
    } else {
      console.error("isnt pereffectsona or monster");
    }
  }
  return realtargets;
}

export function DizzyTarget(args: AbilityFunctionArgs): Targets {
  const { target, card, ability, G } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  const realtargets: CMCCard[] = [];
  let found = false;
  for (const target of targets) {
    if (![CardType.EFFECT, CardType.MONSTER].includes(target.type)) {
      console.error("isnt effect or monster");
      continue;
    }
    if (IsMonster(target) || IsEffect(target)) {
      if (!target.dizzy) {
        target.dizzy = true;
        realtargets.push(target);
      }
    } else {
      console.error("isnt pereffectsona or monster");
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
      //console.log("isnt persona or");
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

export function Self(args: AbilityFunctionArgs): Targets {
  const { card } = args;
  return card;
}

export function Match(args: AbilityFunctionArgs): Targets {
  const { ability, G, target, cardowner, ctx } = args;
  if (!ability) {
    return [];
  }
  const targets: CMCCard[] = ValidTargets(args, AllCards(G).allinplay);
  let realtargets: CMCCard[] = [];
  let found = false;
  for (const target of targets) {
    if (ability.metadata.matchPlayer) {
      if (ability.metadata.matchPlayer == TriggerPlayerType.EITHER) {
      } else if (ability.metadata.matchPlayer == TriggerPlayerType.OWNER) {
        if (cardowner != OwnerOf(target, G)) {
          continue;
        }
      } else if (ability.metadata.matchPlayer == TriggerPlayerType.OPPONENT) {
        if (cardowner == OwnerOf(target, G)) {
          continue;
        }
      } else if (ability.metadata.matchPlayer == TriggerPlayerType.INACTIVE) {
        if (GetActivePlayer(ctx) == OwnerOf(target, G)) {
          continue;
        }
      } else if (ability.metadata.matchPlayer == TriggerPlayerType.ACTIVE) {
        if (GetActivePlayer(ctx) != OwnerOf(target, G)) {
          continue;
        }
      }
    }
    if (ability.metadata.matchType) {
      if (!target.subtype.includes(ability.metadata.matchType)) {
        continue;
      }
    }
    if (ability.metadata.matchPattern) {
      if (!MatchState(target, ability.metadata.matchPattern)) {
        continue;
      }
    }
    if (ability.metadata.allCardsPattern) {
      const allcards = AllCards(G)[
        ability.metadata.allCardsPattern
      ] as CMCCard[];
      found = false;
      for (const allcard of allcards) {
        if (allcard.guid == target.guid) {
          found = true;
        }
      }
      if (!found) {
        continue;
      }
    }
    realtargets.push(target);
  }
  if (ability.metadata.matchOne) {
    realtargets = realtargets.slice(1);
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
  if (targets.length > 0) {
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
  } else {
    let targeto = cardowner;
    let discardchoose = false;
    if (ability.metadata && "discardchoose" in ability.metadata) {
      discardchoose = ability.metadata.discardchoose;
    }

    found =
      found && ForceDiscard(discardchoose, targeto, G, ctx, random, events);
  }
  return found;
}
