// // // MOVES // // //

import { Move } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import { TriggerAuto, TriggerNames } from "./Abilities";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard, CMCMonsterCard, CMCPersonaCard } from "./CMCCard";
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
} from "./LogicFunctions";
import { CMCPlayer } from "./Player";
import { GetActivePlayer, GetActiveStage } from "./Util";

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
  if (GetActiveStage(ctx) == Stages.initial) {
    // going into draw phase
    const player: CMCPlayer = G.playerData[activePlayer];
    const okay = DrawCard(activePlayer, player.persona.drawPerTurn, G);

    if (!okay) {
      G.loser = activePlayer;
    }

    events.endStage();
  } else if (GetActiveStage(ctx) == Stages.play) {
    // go into combat stage, set up combat.
    G.combat = StartCombatPhase();
    events.endStage();
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
    return INVALID_MOVE;
  }
  if (G.activeCard) {
    return INVALID_MOVE;
  }
  if (card.type == CardType.EFFECT || card.type == CardType.MONSTER) {
    G.activeCard = card;
    G.returnStage = Stages[ctx.activePlayers[playerId]];
    events.setStage(Stages.pickSlot);
  }
};

// cancel your current selection and go back to the top level selection mode
const cancel: Move<CMCGameState> = ({ G, ctx, events }, playerId: string) => {
  if (!ctx.activePlayers || !ctx.activePlayers[playerId]) {
    return INVALID_MOVE;
  }

  console.log("Returning to " + G.returnStage);
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

  if (G.returnStage) {
    if (G.activeAbility || G.activeCard) {
      events.setStage(G.returnStage);
    } else if (
      GetActiveStage(ctx) == Stages.pickCombatDefense ||
      GetActiveStage(ctx) == Stages.pickCombatTarget ||
      GetActiveStage(ctx) == Stages.pickPlayer ||
      GetActiveStage(ctx) == Stages.pickHandCard ||
      GetActiveStage(ctx) == Stages.pickSlot ||
      GetActiveStage(ctx) == Stages.pickAbilityTarget
    ) {
      events.setStage(G.returnStage);
    }
  } else {
    // oh no your stage is broken???????
    return "INVALID_MOVE";
  }
  resetActive(G);
};

// pick something on the board
const pickEntity: Move<CMCGameState> = (
  { G, ctx, events },
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
    G.returnStage = Stages.combat;
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
      events.setStage(G.returnStage);
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
    G.returnStage = Stages.defense;
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
      events.setStage(G.returnStage);
    } else {
      return INVALID_MOVE;
    }
  } else if (GetActiveStage(ctx) == Stages.pickAbilityTarget) {
    // ability or spell targeting
  }
};

// pick a slot on the board, used to play cards, etc.
const chooseSlot: Move<CMCGameState> = (
  { G, ctx, events },
  card: CMCCard,
  playerId: string
) => {
  let returnStage = G.returnStage ? G.returnStage : "error";
  if (returnStage == "error") {
    return INVALID_MOVE;
  }
  let success_play: boolean | CMCGameState = false;
  if (G.activeCard && returnStage == Stages.play) {
    //Move card from hand into play
    success_play = PlayEntity(G.activeCard, card, playerId, G, ctx);
    if (!success_play) return INVALID_MOVE;
  }

  events.setStage(G.returnStage ? G.returnStage : "error");
  resetActive(G);
};

export {
  chooseSlot,
  cancel,
  pickEntity,
  playCardFromHand,
  passTurn,
  passStage,
};
