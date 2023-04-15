// // // MOVES // // //

import { ActivePlayersArg, Move } from "boardgame.io";
import { INVALID_MOVE, Stage } from "boardgame.io/core";
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
  ForceDiscard,
  Discard,
  Undizzy,
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
  TriggerAuto(TriggerNames.END_STAGE, ctx, G, random, events);
  const activePlayer = GetActivePlayer(ctx);

  // is there a modified stack? if so go to the response stage.
  if (G.abilityStack.length > G.lastAbilityStack.length) {
    G.lastAbilityStack = G.abilityStack;
    G.returnStage.push(GetActiveStage(ctx));

    const arg: ActivePlayersArg = {
      value: {},
    };
    if (arg.value !== undefined) {
      arg.value[OtherPlayer(GetActivePlayer(ctx))] = Stages.respond;
    }
    events.endStage();
    events.setActivePlayers(arg);
    return;
  }

  if (GetActiveStage(ctx) == Stages.initial) {
    // going into draw phase
    const player: CMCPlayer = G.playerData[activePlayer];
    const okay = DrawCard(activePlayer, player.persona.drawPerTurn, G);
    Undizzy(activePlayer, G, ctx);

    if (!okay) {
      console.log("player lost due to draw out at beginning of stage");
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
    resetActive(G);
    // go into combat stage, set up combat.
    G.combat = StartCombatPhase();
    events.endStage();
  } else if (GetActiveStage(ctx) == Stages.respond) {
    ResolveStack(G, ctx, random, events);
    resetActive(G);
    let returnStage: Stages | undefined = G.returnStage.pop();
    while (returnStage == Stages.respond) {
      returnStage = G.returnStage.pop();
    }
    if (!returnStage) {
      return INVALID_MOVE;
    }
    const arg: ActivePlayersArg = {
      value: {},
    };
    if (arg.value !== undefined) {
      arg.value[ctx.currentPlayer] = returnStage;
    }
    events.endStage();
    events.setActivePlayers(arg);
  } else if (GetActiveStage(ctx) == Stages.combat) {
    // do you have any combat? if no, skip defrense
    if (!G.combat || G.combat.targets.length == 0) {
      events.setStage(Stages.resolve);
    } else {
      // else, go to defense stage.
      events.endStage();
      events.setActivePlayers({ others: Stages.defense });
    }
  } else if (GetActiveStage(ctx) == Stages.defense) {
    ResolveCombat(G, ctx, random);
    events.setActivePlayers({ currentPlayer: Stages.resolve });
    events.endStage();
  } else if (GetActiveStage(ctx) == Stages.resolve) {
    if (
      G.playerData[GetActivePlayer(ctx)].persona.maxHand <
      G.players[GetActivePlayer(ctx)].hand.length
    ) {
      ForceDiscard(true, GetActivePlayer(ctx), G, ctx, random, events);
    }
  } else {
    events.endStage();
  }
};

// click a card in your hand to play
const playCardFromHand: Move<CMCGameState> = (
  { G, ctx, random, events },
  card: CMCCard,
  playerId: string
) => {
  if (!ctx.activePlayers) {
    console.error("No active player");
    return INVALID_MOVE;
  }
  if (G.activeCard && !(GetActiveStage(ctx) == Stages.discardCard)) {
    return INVALID_MOVE;
  }

  if (GetActiveStage(ctx) == Stages.discardCard) {
    if (!Discard(card, playerId, G, ctx)) {
      return INVALID_MOVE;
    } else {
      const stg = G.returnStage.pop();
      if (!stg) {
        return INVALID_MOVE;
      }
      events.setStage(stg);
      return;
    }
  }
  if (card.type == CardType.EFFECT || card.type == CardType.MONSTER) {
    G.activeCard = card;
    G.returnStage.push(Stages[ctx.activePlayers[playerId]]);
    events.setStage(Stages.pickSlot);
  } else if (card.type == CardType.SPELL) {
    if (card.abilities.length == 0) {
      return INVALID_MOVE;
    }
    const ability: Ability = card.abilities[0];
    if (ability.triggerType == TriggerType.ACTIVATED_TARGETED) {
      // move to pick target

      G.returnStage.push(GetActiveStage(ctx));
      events.setStage(Stages.pickAbilityTarget);
      G.activeAbility = ability;
      G.activeCard = card;
    } else if (ability.triggerType == TriggerType.ACTIVATED) {
      if (!CanActivateAbility(card, ability, G, ctx, undefined)) {
        return INVALID_MOVE;
      }
      if (
        !ActivateAbility(
          card,
          ability,
          G,
          ctx,
          false,
          random,
          events,
          undefined
        )
      ) {
        return INVALID_MOVE;
      }
    } else {
      return INVALID_MOVE;
    }
  } else if (card.type == CardType.LOCATION) {
    let success_play = PlayEntity(
      card,
      G.location,
      playerId,
      G,
      ctx,
      random,
      events
    );
    if (!success_play) {
      return INVALID_MOVE;
    }
  }
};

const activateAbility: Move<CMCGameState> = (
  { G, ctx, events, random },
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
      return INVALID_MOVE;
    }
    if (
      !ActivateAbility(card, ability, G, ctx, false, random, events, undefined)
    ) {
      return INVALID_MOVE;
    }
  } else {
    return INVALID_MOVE;
  }
};

// cancel your current selection and go back to the top level selection mode
const cancel: Move<CMCGameState> = ({ G, ctx, events }, playerId: string) => {
  if (!ctx.activePlayers || !ctx.activePlayers[playerId]) {
    return INVALID_MOVE;
  }

  if (GetActiveStage(ctx) == Stages.play && G.abilityStack.length > 0) {
    // clear ability stack
    if (G.abilityStack.length > G.lastAbilityStack.length) {
      // return to previous ability stack
      G.abilityStack = G.lastAbilityStack;
      G.lastAbilityStack = [];
      resetActive(G);
      return;
    } else {
      return INVALID_MOVE;
    }
  } else if (
    GetActiveStage(ctx) == Stages.combat ||
    GetActiveStage(ctx) == Stages.pickCombatTarget
  ) {
    // reset combat
    G.combat = StartCombatPhase();
    if (Stages.pickCombatTarget && G.returnStage.length == 0) {
      console.error("This is a bad state, getting out of it");
      events.setStage(Stages.combat);
    }
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
  } else if (G.returnStage.length > 0) {
    if (G.activeAbility || G.activeCard) {
      const returnStage = G.returnStage.pop();
      if (!returnStage) {
        return INVALID_MOVE;
      }
      events.setStage(returnStage);
    } else if (
      GetActiveStage(ctx) == Stages.pickCombatDefense ||
      GetActiveStage(ctx) == Stages.pickCombatTarget ||
      GetActiveStage(ctx) == Stages.discardCard ||
      GetActiveStage(ctx) == Stages.pickSlot ||
      GetActiveStage(ctx) == Stages.pickAbilityTarget
    ) {
      const returnStage = G.returnStage.pop();
      if (!returnStage) {
        return INVALID_MOVE;
      }
      events.setStage(returnStage);
    }
  } else {
    // oh no your stage is broken???????
    console.error("There's no return stage?");
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
    return INVALID_MOVE;
  }
  // determine based on state
  if (GetActiveStage(ctx) == Stages.combat) {
    if (G.abilityStack) {
      // cant go to combat target stage without resolving first.
      return INVALID_MOVE;
    }
    // pick attacker
    if (card.type != CardType.MONSTER) {
      return INVALID_MOVE;
    }
    if (OwnerOf(card, G) != playerId) {
      return INVALID_MOVE;
    }
    console.error(card);
    G.activeCard = card;
    G.returnStage.push(Stages.combat);
    console.log(
      "Setting returnstage to combat, we are in " + GetActiveStage(ctx)
    );
    events.setStage(Stages.pickCombatTarget);
  } else if (GetActiveStage(ctx) == Stages.pickCombatTarget) {
    if (!G.activeCard) {
      events.setStage(Stages.combat);
      return;
    }
    if (G.activeCard.type != CardType.MONSTER) {
      events.setStage(Stages.combat);
      return;
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
    // you have no defenders
    let found = false;
    for (const card of G.slots[GetActivePlayer(ctx)].effects) {
      if (card.type != CardType.EMPTY) {
        found = true;
        break;
      }
    }

    if (!found) {
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
      return INVALID_MOVE;
    }
    if (
      !CanActivateAbility(
        G.activeCard,
        G.activeAbility,
        G,
        ctx,
        random,
        events,
        card
      )
    ) {
      return INVALID_MOVE;
    }
    if (
      !ActivateAbility(
        G.activeCard,
        G.activeAbility,
        G,
        ctx,
        false,
        random,
        events,
        card
      )
    ) {
      return INVALID_MOVE;
    }
    if (G.returnStage) {
      const returnStage = G.returnStage.pop();
      if (!returnStage) {
        return INVALID_MOVE;
      }
      events.setStage(returnStage);
    } else {
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
  { G, ctx, events, random },
  card: CMCCard,
  playerId: string
) => {
  let returnStage = G.returnStage.length > 0 ? G.returnStage.pop() : "error";
  if (!returnStage) {
    console.error("Cant choose slot in this stage");
    return INVALID_MOVE;
  }
  if (returnStage == "error") {
    console.error("Cant choose slot in this stage: error");
    return INVALID_MOVE;
  }

  let success_play: boolean | CMCGameState = false;
  if (G.activeCard && returnStage == Stages.play) {
    if (OwnerOf(G.activeCard, G) != playerId) {
      //card isnt yours
    }
    //Move card from hand into play
    success_play = PlayEntity(
      G.activeCard,
      card,
      playerId,
      G,
      ctx,
      random,
      events
    );
    if (!success_play) {
      console.error("Couldn't successfully play");
      return INVALID_MOVE;
    }
  }

  events.setStage(returnStage);
  resetActive(G);
};

const StagesDefiniton = {
  error: {},
  initial: {
    moves: {
      passStage: passStage,
    },
    next: Stages.draw,
  },
  draw: {
    moves: {
      playCardFromHand: playCardFromHand,
      activateAbility: activateAbility,
      passStage: passStage,
    }, // automatically does the draw for you
    next: Stages.sacrifice,
  },
  sacrifice: {
    moves: {
      passStage: passStage,
      pickEntity: pickEntity,
    },
    next: Stages.play,
  },
  play: {
    moves: {
      playCardFromHand: playCardFromHand,
      activateAbility: activateAbility,
      passStage: passStage,
      cancel: cancel,
    },
    next: Stages.combat,
  },
  combat: {
    moves: {
      playCardFromHand: playCardFromHand,
      activateAbility: activateAbility,
      passStage: passStage,
      pickEntity: pickEntity,
      cancel: cancel,
    },

    next: Stages.defense,
  },
  defense: {
    moves: {
      playCardFromHand: playCardFromHand,
      activateAbility: activateAbility,
      passStage: passStage,
      pickEntity: pickEntity,
      cancel: cancel,
    },

    next: Stages.resolve,
  },
  resolve: {
    moves: {
      playCardFromHand: playCardFromHand,
      activateAbility: activateAbility,
      passTurn: passTurn,
    },
    next: Stages.draw,
  },

  pickSlot: {
    moves: {
      chooseSlot: chooseSlot,
      cancel: cancel,
    },
  },

  // states depending on player actions

  pickCombatTarget: {
    moves: {
      pickEntity: pickEntity,
      cancel: cancel,
    },
  },
  pickCombatDefense: {
    moves: {
      pickEntity: pickEntity,
      cancel: cancel,
    },
  },
  pickAbilityTarget: {
    moves: {
      pickEntity: pickEntity,
      cancel: cancel,
    },
  },
  discardCard: {
    moves: {
      playCardFromHand: playCardFromHand,
    },
  },
  respond: {
    moves: {
      activateAbility: activateAbility,
      pickEntity: pickEntity,
      passStage: passStage,
    },
  },
};

export {
  chooseSlot,
  cancel,
  pickEntity,
  playCardFromHand,
  passTurn,
  passStage,
  activateAbility,
  StagesDefiniton,
};
