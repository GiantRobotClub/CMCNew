import { CMCCard, CMCPersonaCard, CreateDebugPersonaCard } from "./CMCCard";

interface CMCPlayer {
  resources: {
    mana: {
      V: number;
      A: number;
      P: number;
    };
    intrinsic: {
      health: number;
    };
    power: {
      power: number;
      max: number;
    };
  };
  decksize: number;
  currentDeck: number;
  currentGrave: number;
  currentHand: number;
  name: string;
  id: string;
  persona: CMCPersonaCard;

  graveyard: CMCCard[];
}

function CreateDefaultPlayer(playerId: string): CMCPlayer {
  const player: CMCPlayer = {
    resources: {
      power: {
        power: 0,
        max: 0,
      },
      intrinsic: {
        health: 0,
      },
      mana: {
        V: 0,
        A: 0,
        P: 0,
      },
    },
    currentDeck: 100,
    currentGrave: 0,
    currentHand: 0,
    decksize: 100,
    name: "CARDMASTER" + playerId,
    id: playerId,
    persona: CreateDebugPersonaCard(playerId),
    graveyard: [],
  };
  return player;
}

export { CMCPlayer, CreateDefaultPlayer };
