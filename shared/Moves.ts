// // // MOVES // // //

import { ActivePlayersArg, Move } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import {
  Ability,
  ActivateAbility,
  CanActivateAbility,
  ResolveStack,
  TriggerAuto,
  TriggerNames,
  TriggerType,
} from "./Abilities";
import { CMCGameState } from "./CardmasterGame";
import {
  CMCCard,
  CMCLocationCard,
  CMCMonsterCard,
  CMCPersonaCard,
} from "./CMCCard";
import {
  StartCombatPhase,
  ResolveCombat,
  SetCombatAttacker,
} from "./CMCCombat";
import { Stages, CardType, ClickType } from "./Constants";
import {
  DrawCard,
  CanClickCard,
  OwnerOf,
  PlayEntity,
  resetActive,
  Sacrifice,
} from "./LogicFunctions";
import { CMCPlayer } from "./Player";
import { GetActivePlayer, GetActiveStage, OtherPlayer } from "./Util";

// go to next turn, must be in resolve state.
const passTurn: Move<CMCGameState> = ({ G, ctx, events }) => {
  resetActive(G);
  events.endTurn();
};

// move to next stage and handle the new stage's start
const passStage: Move<CMCGameState> = ({ G, ctx, events, random }) => {
  resetActive(G);
  TriggerAuto(TriggerNames.END_STAGE, ctx, G);
  const activePlayer = GetActivePlayer(ctx);
  console.log("check:" + GetActiveStage(ctx));

  // is there a modified stack? if so go to the response stage.
  if (G.abilityStack.length > G.lastAbilityLength) {
    G.lastAbilityLength = G.abilityStack.length;
    G.returnStage.push(GetActiveStage(ctx));

    const arg: ActivePlayersArg = {
      value: {},
    };
    if (arg.value !== undefined) {
      arg.value[OtherPlayer(GetActivePlayer(ctx))] = Stages.respond;
    }
    events.setActivePlayers(arg);
    events.setStage(Stages.respond);
    return;
  }

  if (GetActiveStage(ctx) == Stages.initial) {
    // going into draw phase
    const player: CMCPlayer = G.playerData[activePlayer];
    const okay = DrawCard(activePlayer, player.persona.drawPerTurn, G);

    if (!okay) {
      G.loser = activePlayer;
    }

    events.endStage();
  } else if (GetActiveStage(ctx) == Stages.draw) {
    // do you have anything to sacrifice?
    let found = false;
    ["effects", "monsters"].forEach((tray) => {
      G.slots[GetActivePlayer(ctx)][tray].forEach((crd: CMCCard) => {
        if (crd.type != CardType.EMPTY) {
          found = true;
          return;
        }
        if (found) return;
      });
      if (found) {
        return;
      }
      if (found) {
        return;
      }
    });

    if (found) {
      events.setStage(Stages.sacrifice);
    } else {
      events.setStage(Stages.play);
    }
  } else if (GetActiveStage(ctx) == Stages.play) {
    // go into combat stage, set up combat.
    G.combat = StartCombatPhase();
    events.endStage();
  } else if (GetActiveStage(ctx) == Stages.respond) {
    ResolveStack(G, ctx);
    let returnStage: Stages | undefined = G.returnStage.pop();
    while (returnStage == Stages.respond) {
      returnStage = G.returnStage.pop();
    }
    if (!returnStage) {
      return INVALID_MOVE;
    }
    events.setStage(returnStage);
  } else if (GetActiveStage(ctx) == Stages.combat) {
    // do you have any combat? if no, skip defrense
    if (!G.combat) {
      events.setStage(Stages.resolve);
    } else {
      // else, go to defense stage.
      events.setActivePlayers({ others: Stages.defense });
      events.setStage(Stages.defense);
    }
  } else if (GetActiveStage(ctx) == Stages.defense) {
    events.setActivePlayers({ currentPlayer: Stages.resolve });
    ResolveCombat(G, ctx, random);
    // resolve combat and go to resolve step.
    // resolveCombat(G,ctx)
  } else {
    events.endStage();
  }
};

// click a card in your hand to play
const playCardFromHand: Move<CMCGameState> = (
  { G, ctx, events },
  card: CMCCard,
  playerId: string
) => {
  if (!ctx.activePlayers) {
    console.log("No active player");
    return INVALID_MOVE;
  }
  if (G.activeCard) {
    console.log("No active card to play");
    return INVALID_MOVE;
  }
  if (card.type == CardType.EFFECT || card.type == CardType.MONSTER) {
    G.activeCard = card;
    G.returnStage.push(Stages[ctx.activePlayers[playerId]]);
    events.setStage(Stages.pickSlot);
  } else if (card.type == CardType.SPELL) {
    if (card.abilities.length != 1) {
      console.log("Card has too many or too few abilities to be a spell");
      return INVALID_MOVE;
    }
    const ability: Ability = card.abilities[0];
    if (ability.triggerType == TriggerType.ACTIVATED_TARGETED) {
      // move to pick target
      console.log("Is targeted");

      G.returnStage.push(GetActiveStage(ctx));
      events.setStage(Stages.pickAbilityTarget);
      G.activeAbility = ability;
      G.activeCard = card;
    } else if (ability.triggerType == TriggerType.ACTIVATED) {
      console.log("Is not targeted");

      if (!CanActivateAbility(card, ability, G, ctx, undefined)) {
        console.log("can activate is false");
        return INVALID_MOVE;
      }
      if (!ActivateAbility(card, ability, G, ctx, false, undefined)) {
        console.log("activate is false");
        return INVALID_MOVE;
      }
    } else {
      console.dir(ability);
      return INVALID_MOVE;
    }
  } else if (card.type == CardType.LOCATION) {
    let success_play = PlayEntity(card, G.location, playerId, G, ctx);
    if (!success_play) {
      console.log("Couldnt play location");
      return INVALID_MOVE;
    }
  }
};

const activateAbility: Move<CMCGameState> = (
  { G, ctx, events },
  card: CMCCard,
  ability: Ability,
  playerId: string
) => {
  if (ability.triggerType == TriggerType.ACTIVATED_TARGETED) {
    // move to pick target

    G.returnStage.push(GetActiveStage(ctx));
    events.setStage(Stages.pickAbilityTarget);
    G.activeAbility = ability;
    G.activeCard = card;
  } else if (ability.triggerType == TriggerType.ACTIVATED) {
    if (!CanActivateAbility(card, ability, G, ctx, undefined)) {
      console.log("canactivate is false");
      return INVALID_MOVE;
    }
    if (!ActivateAbility(card, ability, G, ctx, false, undefined)) {
      console.log("ctivate is false");
      return INVALID_MOVE;
    }
  } else {
    console.dir(ability);
    return INVALID_MOVE;
  }
};

// cancel your current selection and go back to the top level selection mode
const cancel: Move<CMCGameState> = ({ G, ctx, events }, playerId: string) => {
  console.log("Got here");
  if (!ctx.activePlayers || !ctx.activePlayers[playerId]) {
    console.log("no active player stage for " + playerId);
    return INVALID_MOVE;
  }

  console.log("Returning to previous stage");
  if (
    GetActiveStage(ctx) == Stages.combat ||
    GetActiveStage(ctx) == Stages.pickCombatTarget
  ) {
    // reset combat
    G.combat = StartCombatPhase();
  } else if (
    GetActiveStage(ctx) == Stages.defense ||
    GetActiveStage(ctx) == Stages.pickCombatDefense
  ) {
    // reset defenders except locked ones.
    if (G.combat) {
      for (const combatant of G.combat.targets) {
        if (combatant.locked) {
          continue;
        }
        if (combatant.defender && combatant.defender.type == CardType.MONSTER) {
          combatant.defender = G.playerData[GetActivePlayer(ctx)].persona;
        }
      }
    }
  }

  if (G.returnStage.length > 0) {
    if (G.activeAbility || G.activeCard) {
      const returnStage = G.returnStage.pop();
      if (!returnStage) {
        console.dir(G.returnStage);
        console.log("Returnstage:" + returnStage);
        return INVALID_MOVE;
      }
      events.setStage(returnStage);
    } else if (
      GetActiveStage(ctx) == Stages.pickCombatDefense ||
      GetActiveStage(ctx) == Stages.pickCombatTarget ||
      GetActiveStage(ctx) == Stages.pickHandCard ||
      GetActiveStage(ctx) == Stages.pickSlot ||
      GetActiveStage(ctx) == Stages.pickAbilityTarget
    ) {
      const returnStage = G.returnStage.pop();
      if (!returnStage) {
        console.dir(G.returnStage);
        console.log("Return stage: " + returnStage);
        return INVALID_MOVE;
      }
      events.setStage(returnStage);
    }
  } else {
    // oh no your stage is broken???????
    console.log("There's no return stage?");
    return INVALID_MOVE;
  }
  resetActive(G);
};

// pick something on the board
const pickEntity: Move<CMCGameState> = (
  { G, ctx, events, random },
  card: CMCCard,
  playerId: string
) => {
  const clickType =
    card.type == CardType.MONSTER
      ? ClickType.MONSTER
      : card.type == CardType.EFFECT
      ? ClickType.EFFECT
      : card.type == CardType.PERSONA
      ? ClickType.PERSONA
      : ClickType.INVALID;
  if (clickType == ClickType.INVALID) {
    return INVALID_MOVE;
  }

  if (!CanClickCard(card, playerId, clickType, ctx, G)) {
    console.log("Cant click that card");
    return INVALID_MOVE;
  }
  // determine based on state
  if (GetActiveStage(ctx) == Stages.combat) {
    // pick attacker
    if (card.type != CardType.MONSTER) {
      return INVALID_MOVE;
    }
    if (OwnerOf(card, G) != playerId) {
      return INVALID_MOVE;
    }
    G.activeCard = card;
    G.returnStage.push(Stages.combat);
    console.log("Setting returnstage to combat");
    events.setStage(Stages.pickCombatTarget);
  } else if (GetActiveStage(ctx) == Stages.pickCombatTarget) {
    if (!G.activeCard) {
      return INVALID_MOVE;
    }
    if (G.activeCard.type != CardType.MONSTER) {
      return INVALID_MOVE;
    }
    if (card.type != CardType.PERSONA && card.type != CardType.MONSTER) {
      return INVALID_MOVE;
    }
    if (OwnerOf(card, G) == playerId) {
      return INVALID_MOVE;
    }
    const target = card as CMCMonsterCard | CMCPersonaCard;
    if (!SetCombatAttacker(G.activeCard as CMCMonsterCard, true, G, target)) {
      return INVALID_MOVE;
    }
    G.activeCard = undefined;
    if (G.returnStage) {
      const returnStage = G.returnStage.pop();
      if (!returnStage) {
        return INVALID_MOVE;
      }
      events.setStage(returnStage);
    } else {
      return INVALID_MOVE;
    }
    // pick defender
  } else if (GetActiveStage(ctx) == Stages.defense) {
    if (card.type != CardType.MONSTER) {
      return INVALID_MOVE;
    }
    if (OwnerOf(card, G) == playerId) {
      return INVALID_MOVE;
    }
    // pick attacking card

    G.activeCard = card;
    G.returnStage.push(Stages.defense);
    events.setStage(Stages.pickCombatDefense);
  } else if (GetActiveStage(ctx) == Stages.pickCombatDefense) {
    // pick who is defending
    if (!G.activeCard) {
      return INVALID_MOVE;
    }
    if (G.activeCard.type != CardType.MONSTER) {
      return INVALID_MOVE;
    }
    if (card.type != CardType.PERSONA && card.type != CardType.MONSTER) {
      return INVALID_MOVE;
    }
    if (OwnerOf(card, G) != playerId) {
      return INVALID_MOVE;
    }
    const target = card as CMCMonsterCard;
    if (!SetCombatAttacker(G.activeCard as CMCMonsterCard, false, G, target)) {
      return INVALID_MOVE;
    }
    G.activeCard = undefined;
    if (G.returnStage) {
      const returnStage = G.returnStage.pop();
      if (!returnStage) {
        return INVALID_MOVE;
      }
      events.setStage(returnStage);
    } else {
      return INVALID_MOVE;
    }
  } else if (GetActiveStage(ctx) == Stages.pickAbilityTarget) {
    // ability or spell targeting
    if (!G.activeAbility || !G.activeCard) {
      console.log("No active card");
      return INVALID_MOVE;
    }
    if (!CanActivateAbility(G.activeCard, G.activeAbility, G, ctx, card)) {
      console.log("cannot activate ability");
      return INVALID_MOVE;
    }
    if (!ActivateAbility(G.activeCard, G.activeAbility, G, ctx, false, card)) {
      console.log("ability failed to activate");
      return INVALID_MOVE;
    }
    if (G.returnStage) {
      const returnStage = G.returnStage.pop();
      if (!returnStage) {
        console.log("No reurn stage");
        return INVALID_MOVE;
      }
      events.setStage(returnStage);
    } else {
      console.log("some other possibility");
      return INVALID_MOVE;
    }
  } else if (GetActiveStage(ctx) == Stages.sacrifice) {
    if (OwnerOf(card, G) != playerId) {
      return INVALID_MOVE;
    }
    if (!CanClickCard(card, playerId, clickType, ctx, G)) {
      return INVALID_MOVE;
    }
    if (!Sacrifice(card, G, ctx, random)) {
      return INVALID_MOVE;
    }
  }
};

// pick a slot on the board, used to play cards, etc.
const chooseSlot: Move<CMCGameState> = (
  { G, ctx, events },
  card: CMCCard,
  playerId: string
) => {
  let returnStage = G.returnStage.length > 0 ? G.returnStage.pop() : "error";
  if (!returnStage) {
    return INVALID_MOVE;
  }
  if (returnStage == "error") {
    return INVALID_MOVE;
  }
  let success_play: boolean | CMCGameState = false;
  if (G.activeCard && returnStage == Stages.play) {
    //Move card from hand into play
    success_play = PlayEntity(G.activeCard, card, playerId, G, ctx);
    if (!success_play) return INVALID_MOVE;
  }

  events.setStage(returnStage);
  resetActive(G);
};

export {
  chooseSlot,
  cancel,
  pickEntity,
  playCardFromHand,
  passTurn,
  passStage,
  activateAbility,
};
