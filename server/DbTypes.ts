interface DbDeck {
  deckid: string;
  ownerid: string;
  deckname: string;
  deckicon: string;
  persona: string;
}
interface DbDeckCard {
  deckid: string;
  cardid: string;
  amount: number;
}

interface DbOwnedCard {
  playerid: string;
  cardid: string;
  amount: number;
}
interface DbPlayer {
  playerid: string;
  username: string;
  visualname: string;
  authenticationcode: string;
  selecteddeck: string;
}

interface DbFullDeck {
  deck: DbDeck;
  cards: DbDeckCard[];
}

interface DbCraftingMat {
  playerid: string;
  letter: string;
  amount: number;
}
interface DbCraftingMats {
  playerid: string;
  mats: DbCraftingMat[];
}

interface DbCompletion {
  playerid: string;
  completiontype: string;
  completionname: string;
  info: string;
}

export {
  DbDeck,
  DbFullDeck,
  DbOwnedCard,
  DbDeckCard,
  DbCraftingMat,
  DbCraftingMats,
  DbCompletion,
  DbPlayer,
};
