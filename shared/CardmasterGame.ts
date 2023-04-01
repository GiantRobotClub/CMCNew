import { INVALID_MOVE } from "boardgame.io/core";
import type { Ctx, Game, Move } from "boardgame.io";
import { Stage, TurnOrder } from "boardgame.io/core";
import { CMCCard, CreateBasicCard, CreateDebugCard } from "./CMCCard";
import { CMCPlayer, CreateDefaultPlayer } from "./Player";

import {
  Ability,
  Ability_Trigger,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
} from "./Abilities";
import { CardType, Stages } from "./Constants";
import { PlayEntity } from "./LogicFunctions";

export interface CMCGameState {
  player: {
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
}

function resetActive(G: CMCGameState) {
  G.activeAbility = undefined;
  G.activeCard = undefined;
  G.returnStage = undefined;
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

// moves
const passTurn: Move<CMCGameState> = ({ G, ctx, events }) => {
  resetActive(G);
  events.endTurn();
};

const passStage: Move<CMCGameState> = ({ G, ctx, events }) => {
  resetActive(G);
  TriggerAuto(TriggerNames.END_STAGE, ctx, G);
  events.endStage();
};
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

const cancel: Move<CMCGameState> = ({ G, ctx, events }, playerId: string) => {
  if (!ctx.activePlayers || !ctx.activePlayers[playerId]) {
    return;
  }
  if (G.returnStage) {
    events.setStage(G.returnStage);
    resetActive(G);
  }
};

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

export const CardmasterConflict: Game<CMCGameState> = {
  setup: ({ ctx }, setupData): CMCGameState => {
    return {
      player: {
        "0": CreateDefaultPlayer("0"),
        "1": CreateDefaultPlayer("1"),
      },
      returnstage: "",
      currentmetadata: {},
      slots: {
        "0": {
          effects: [
            CreateDebugCard(),
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
          hand: [CreateDebugCard()],
        },
        "1": {
          hand: [CreateDebugCard(), CreateDebugCard()],
        },
      },
      secret: {
        decks: {
          "0": [],
          "1": [],
        },
      },
    };
  },
  turn: {
    activePlayers: {
      currentPlayer: Stages.initial,
    },
    order: TurnOrder.CUSTOM(["0", "1"]), // anyone else is a spectator
    onBegin: ({ G, ctx, events, random }) => {
      if (ctx.activePlayers !== null) {
        TriggerAuto(TriggerNames.START_TURN, ctx, G);
      }

      return G;
    },
    onEnd: ({ G, ctx, events, random }) => {
      if (ctx.activePlayers !== null) {
        TriggerAuto(TriggerNames.END_STAGE, ctx, G);
        TriggerAuto(TriggerNames.END_TURN, ctx, G);
      }

      return G;
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
        },

        next: Stages.defense,
      },
      defense: {
        moves: {
          //chooseCard
          passStage: passStage,
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
      pickTarget: {},
      pickHandCard: {},
      pickPlayer: {},
      respond: {
        moves: {
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

function IsVictory(G: CMCGameState) {
  return false;
}

// Return true if all `cells` are occupied.
function IsDraw(G: CMCGameState) {
  return false;
}

export default { CardmasterConflict };
