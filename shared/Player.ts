import { DbFullDeck, DbPlayer } from "../server/DbTypes";
import {
  CMCCard,
  CMCPersonaCard,
  CreatePersonaCard,
  GetCardPrototype,
} from "./CMCCard";
import { CMCGameState } from "./CardmasterGame";

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
function ParseDbPlayer(
  G: CMCGameState,
  gameplayerid: string,
  deck: DbFullDeck,
  player: DbPlayer
) {
  const newplayer: CMCPlayer = CreateDefaultPlayer(gameplayerid);
  newplayer.name = player.username;
  const newcard = GetCardPrototype(deck.deck.persona) as CMCPersonaCard;
  let card: CMCPersonaCard = {
    ...newcard,
    playerID: gameplayerid,
  };

  G.playerData[gameplayerid] = newplayer;

  G.playerData[gameplayerid].persona = card;
}
function CreateDefaultPlayer(playerId: string, decks?: any): CMCPlayer {
  let card: CMCPersonaCard;
  if (decks) {
    const newcard = GetCardPrototype(decks[playerId].persona) as CMCPersonaCard;
    card = {
      ...newcard,
      playerID: playerId,
    };
    card.playerID = playerId;
  } else {
    card = CreatePersonaCard(playerId);
  }
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
    persona: card,
    graveyard: [],
  };
  return player;
}

export { CMCPlayer, CreateDefaultPlayer, ParseDbPlayer };
