interface DbPlayer {
  playerid: string;
  username: string;
  visualname: string;
  authenticationcode: string;
  selecteddeck: string;
}

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

interface DbFullDeck {
  deck: DbDeck;
  cards: DbDeckCard[];
}

export { DbDeck, DbFullDeck, DbOwnedCard, DbPlayer, DbDeckCard };
