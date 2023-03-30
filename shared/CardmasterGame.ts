import { INVALID_MOVE } from "boardgame.io/dist/types/src/core/constants";
import type { Game, Move } from "boardgame.io";
import { Stage, TurnOrder } from "boardgame.io/core";
import { CMCCard, CreateBasicCard, CreateDebugCard } from "./CMCCard";
import { CMCPlayer, CreateDefaultPlayer } from "./Player";
import { draw } from "svelte/types/runtime/transition";
import { current } from "immer";
import {
  Ability_Trigger,
  TriggeringTrigger,
  TriggerPlayerType,
} from "./Abilities";

export interface CMCGameState {
  player: [CMCPlayer, CMCPlayer];
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
}
const passTurn: Move<CMCGameState> = ({ G, ctx, events }) => {
  events.endTurn();
};

const passStage: Move<CMCGameState> = ({ G, ctx, events }) => {
  events.endStage();
  Ability_Trigger(
    {
      name: "start_stage",
      stage: "draw",
      triggeringPlayer: ctx.currentPlayer,
    },
    G,
    ctx
  );
  console.log(G);
};

export const CardmasterConflict: Game<CMCGameState> = {
  setup: ({ ctx }, setupData): CMCGameState => {
    return {
      player: [CreateDefaultPlayer(), CreateDefaultPlayer()],
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
      currentPlayer: "initial",
    },
    order: TurnOrder.CUSTOM(["0", "1"]), // anyone else is a spectator
    onBegin: ({ G, ctx, events, random }) => {
      return G;
    },
    stages: {
      initial: {
        moves: {
          passStage: passStage,
        },
        next: "draw",
      },
      draw: {
        moves: {
          passStage: passStage,
        }, // automatically does the draw for you
        next: "play",
      },
      play: {
        moves: {
          //chooseCard
          //chooseAbility
          passStage: passStage,
        },
        next: "combat",
      },
      combat: {
        moves: {
          //chooseCard
          passStage: passStage,
        },

        next: "resolve",
      },
      resolve: {
        moves: {
          passTurn: passTurn,
        },
        next: "draw",
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
