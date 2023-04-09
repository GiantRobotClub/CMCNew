import { DbDeckCard, DbFullDeck } from "../server/DbTypes";
import { PlayerIDs } from "../shared/Constants";

import { CMCCard, GetCardPrototype } from "./CMCCard";
import { CMCGameState } from "./CardmasterGame";

interface PlayerDecks {
  "0": CMCCard[];
  "1": CMCCard[];
}
function ParseDecks(decksJson: any): any {
  console.dir(decksJson);
  let decks: PlayerDecks = {
    "0": [],
    "1": [],
  };
  PlayerIDs.forEach((id) => {
    const newDeck: CMCCard[] = [];
    decksJson[id].cards.forEach(function (card: any) {
      for (let i = 0; i < card.amount; i++) {
        newDeck.push(GetCardPrototype(card.id));
      }
    });

    decks[id] = newDeck;
  });
  return decks;
}

function ParseDbDeck(playerid: string, deck: DbFullDeck, G: CMCGameState) {
  const newDeck: CMCCard[] = [];
  deck.cards.forEach(function (card: DbDeckCard) {
    for (let i = 0; i < card.amount; i++) {
      newDeck.push(GetCardPrototype(card.cardid));
    }
  });
  G.secret.decks[playerid] = newDeck;
}

function CreateDebugSetupData() {
  const setupData = {
    decks: {
      "0": {
        persona: "debugpersona",
        cards: [
          { id: "debugslime", amount: 10 },

          { id: "debugspell", amount: 10 },

          { id: "debugloc", amount: 10 },

          { id: "debuggen", amount: 10 },
        ],
      },
      "1": {
        persona: "debugpersona",
        cards: [
          { id: "debugslime", amount: 10 },

          { id: "debugspell", amount: 10 },

          { id: "debugloc", amount: 10 },

          { id: "debuggen", amount: 10 },
        ],
      },
    },
  };
  return setupData;
}

export { PlayerDecks, ParseDecks, CreateDebugSetupData, ParseDbDeck };
