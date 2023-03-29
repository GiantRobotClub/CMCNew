import { INVALID_MOVE } from "boardgame.io/dist/types/src/core/constants";
import type { Game, Move } from "boardgame.io";
import { CMCCard, CreateBasicCard, CreateDebugCard } from "./CMCCard";
import { CMCPlayer, CreateDefaultPlayer } from "./Player";

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
      hand: [];
    };
    "1": {
      hand: [];
    };
  };
  secret: {
    decks: {
      "0": [];
      "1": [];
    };
  };
}
const passTurn: Move<CMCGameState> = ({ G, ctx }) => {};

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
          hand: [],
        },
        "1": {
          hand: [],
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
