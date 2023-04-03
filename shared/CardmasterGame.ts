import { INVALID_MOVE } from "boardgame.io/core";
import type { Ctx, Game, Move } from "boardgame.io";
import { Stage, TurnOrder } from "boardgame.io/core";
import {
  CMCCard,
  CMCMonsterCard,
  CMCPersonaCard,
  CreateBasicCard,
  CreateDebugCard,
  CreateDebugMonsterCard,
} from "./CMCCard";
import { CMCPlayer, CreateDefaultPlayer } from "./Player";

import {
  Ability,
  Ability_Trigger,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
} from "./Abilities";
import { CardType, ClickType, PlayerIDs, Stages } from "./Constants";
import {
  CanClickCard,
  DrawCard,
  GenerateRandomGuid,
  OwnerOf,
  PlayEntity,
  PlayerAddResource,
} from "./LogicFunctions";
import { GetActivePlayer, GetActiveStage, OtherPlayer } from "./Util";
import {
  CMCCombat,
  CMCCombatResults,
  ResolveCombat,
  SetCombatAttacker,
  StartCombatPhase,
} from "./CMCCombat";

export interface CMCGameState {
  playerData: {
    "0": CMCPlayer;
    "1": CMCPlayer;
  };
  returnstage: string;
  currentmetadata: any;
  slots: {
    "0": {
      effects: [CMCCard, CMCCard, CMCCard, CMCCard, CMCCard];
      monsters: [CMCCard, CMCCard, CMCCard, CMCCard, CMCCard];
    };

    "1": {
      effects: [CMCCard, CMCCard, CMCCard, CMCCard, CMCCard];
      monsters: [CMCCard, CMCCard, CMCCard, CMCCard, CMCCard];
    };
  };
  players: {
    "0": {
      hand: CMCCard[];
    };
    "1": {
      hand: CMCCard[];
    };
  };
  secret: {
    decks: {
      "0": CMCCard[];
      "1": CMCCard[];
    };
  };
  activeAbility?: Ability;
  activeCard?: CMCCard;
  returnStage?: Stages;
  loser?: string;
  location?: CMCCard;
  didinitialsetup: boolean;
  combat?: CMCCombat;
  resolution?: CMCCombatResults;
}

// // // MOVES // // //

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
    console.log("Drawing another card");
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
    return;
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
    return;
  }
  if (G.returnStage) {
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
          if (combatant.defender.type == CardType.MONSTER) {
            combatant.defender = G.players[GetActivePlayer(ctx)].persona;
          }
        }
      }
    }
    if (
      GetActiveStage(ctx) != Stages.combat &&
      GetActiveStage(ctx) != Stages.defense
    )
      events.setStage(G.returnStage);

    resetActive(G);
  }
};

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
    console.log("Click is invalid");
    return INVALID_MOVE;
  }

  if (!CanClickCard(card, playerId, clickType, ctx, G)) {
    console.log("Cant click card");
    return INVALID_MOVE;
  }
  // determine based on state
  if (GetActiveStage(ctx) == Stages.combat) {
    // pick attacker
    if (card.type != CardType.MONSTER) {
      console.log("Card is not a monster");
      return INVALID_MOVE;
    }
    if (OwnerOf(card, G) != playerId) {
      console.log("Card is not owned by you");
      return INVALID_MOVE;
    }
    G.activeCard = card;
    G.returnstage = Stages.combat;
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
    events.setStage(G.returnstage);
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
    G.returnstage = Stages.defense;
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
    events.setStage(G.returnstage);
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
    console.log(card.name);
    success_play = PlayEntity(G.activeCard, card, playerId, G, ctx);
    if (!success_play) return INVALID_MOVE;

    console.log(card.name);
  }

  events.setStage(G.returnStage ? G.returnStage : "error");
  resetActive(G);
};

function resetActive(G: CMCGameState) {
  G.activeAbility = undefined;
  G.activeCard = undefined;
  G.returnStage = undefined;
}
function resetCombat(G: CMCGameState) {
  G.combat = undefined;
  G.resolution = undefined;
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

// Initial game state
export const CardmasterConflict: Game<CMCGameState> = {
  setup: ({ ctx }, setupData): CMCGameState => {
    // decks can be done through the game creation api, but here we will set up a default deck

    const decks = {
      "0": [
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),

        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
      ],
      "1": [
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),

        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
      ],
    };
    return {
      playerData: {
        "0": CreateDefaultPlayer("0"),
        "1": CreateDefaultPlayer("1"),
      },
      returnstage: "",
      didinitialsetup: false,
      currentmetadata: {},
      slots: {
        "0": {
          effects: [
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
          ],
          monsters: [
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
          ],
        },

        "1": {
          effects: [
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
          ],
          monsters: [
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
          ],
        },
      },
      players: {
        "0": {
          hand: [],
        },
        "1": {
          hand: [],
        },
      },
      secret: {
        decks: decks,
      },
    };
  },

  turn: {
    activePlayers: {
      currentPlayer: Stages.initial,
    },
    order: TurnOrder.CUSTOM(PlayerIDs), // anyone else is a spectator
    onBegin: ({ G, ctx, events, random }) => {
      if (ctx.activePlayers !== null) {
        TriggerAuto(TriggerNames.START_TURN, ctx, G);

        const activePlayer = GetActivePlayer(ctx);
        // do turn mana, unless this is the first turn, then do initial mana and hand
        if (ctx.turn == 1 && activePlayer == "0" && !G.didinitialsetup) {
          // sjhuffle decks
          random.Shuffle(G.secret.decks["0"]);
          random.Shuffle(G.secret.decks["1"]);

          // go through every card and reset the guids to something random
          for (const playerno in PlayerIDs) {
            for (const card in G.secret.decks[playerno]) {
              G.secret.decks[playerno][card].guid = GenerateRandomGuid(random);
            }
            G.playerData[playerno].persona.guid = GenerateRandomGuid(random);
          }

          for (const slotplayer in G.slots) {
            for (const subplayer in G.slots[slotplayer]) {
              for (const [index, card] of G.slots[slotplayer][
                subplayer
              ].entries()) {
                G.slots[slotplayer][subplayer][index].guid =
                  GenerateRandomGuid(random);
              }
            }
          }

          G.didinitialsetup = true;
          // this is the beginning of the game
          for (const playerno in PlayerIDs) {
            const player: CMCPlayer = G.playerData[playerno];
            const okay = DrawCard(playerno, player.persona.startingHand, G);
            if (!okay) {
              G.loser = playerno;
            }
            PlayerAddResource(playerno, player.persona.startingResource, G);
          }
        } else {
          const player: CMCPlayer = G.playerData[activePlayer];

          PlayerAddResource(activePlayer, player.persona.resourcePerTurn, G);
        }
      }
      CheckState(G);
    },
    onEnd: ({ G, ctx, events, random }) => {
      if (ctx.activePlayers !== null) {
        TriggerAuto(TriggerNames.END_STAGE, ctx, G);
        TriggerAuto(TriggerNames.END_TURN, ctx, G);
      }

      resetCombat(G);
      return G;
    },
    onMove: ({ G, ctx, events, random }) => {
      CheckState(G);
    },
    stages: {
      error: {},
      initial: {
        moves: {
          passStage: passStage,
        },
        next: Stages.draw,
      },
      draw: {
        moves: {
          passStage: passStage,
        }, // automatically does the draw for you
        next: Stages.play,
      },
      play: {
        moves: {
          playCardFromHand: playCardFromHand,
          //chooseAbility
          passStage: passStage,
        },
        next: Stages.combat,
      },
      combat: {
        moves: {
          //chooseCard
          passStage: passStage,
          pickEntity: pickEntity,
          cancel: cancel,
        },

        next: Stages.defense,
      },
      defense: {
        moves: {
          //chooseCard
          passStage: passStage,
          pickEntity: pickEntity,
          cancel: cancel,
        },

        next: Stages.resolve,
      },
      resolve: {
        moves: {
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
      respond: {
        moves: {
          pickEntity: pickEntity,
          passStage: passStage,
        },
      },
    },
  },

  moves: {
    passTurn: passTurn,
  },
  endIf: ({ G, ctx }) => {
    if (IsVictory(G)) {
      return { winner: ctx.currentPlayer };
    }
    if (IsDraw(G)) {
      return { draw: true };
    }
  },
};

// update player data with secret info such as deck size
function CheckState(G: CMCGameState) {
  for (const playerid in PlayerIDs) {
    // check player health
    const player: CMCPlayer = G.playerData[playerid];
    if (player.resources.intrinsic.health <= 0) {
      G.loser = playerid;
    }
    // set player deck values for visual reasons
    player.currentDeck = G.secret.decks[playerid].length;
    player.currentGrave = G.playerData[playerid].graveyard.length;
    player.currentHand = G.players[playerid].hand.length;
  }
}

// something has set the loser flag.
function IsVictory(G: CMCGameState) {
  if (G.loser) {
    return { winner: OtherPlayer(G.loser) };
  }
  return false;
}

// there's no draws in this game
function IsDraw(G: CMCGameState) {
  return false;
}

export default { CardmasterConflict };
