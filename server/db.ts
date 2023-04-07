import DatabaseConstructor, { Database } from "better-sqlite3";
import fs from "fs";
import premadeDecks from "../shared/data/premade.json";
import { nanoid } from "nanoid";
interface DbPlayer {
  playerid: string;
  username: string;
  visualname: string;
  authenticationcode: string;
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

let database: Database;
function db(): Database {
  if (database) return database;
  database = new DatabaseConstructor("./cmc.sqlite");
  const buf = fs.readFileSync("./shared/data/deckdb.sql");
  database.exec(buf.toString());
  //  database.pragma("journal_mode = WAL");
  return database;
}

function GetPlayer(playerId: string): DbPlayer | undefined {
  const database = db();
  const stmt = database.prepare(
    "SELECT playerid, username from player where playerid=(?)"
  );
  const row = stmt.get(playerId);
  if (!row) {
    return undefined;
  }
  const player: DbPlayer = row as DbPlayer;
  return player;
}

function GetDeckList(playerid: string): DbDeck[] {
  const database = db();
  const stmt = database.prepare(
    "SELECT deckid, ownerid, deckicon, persona, deckname from deck where ownerid=(?)"
  );
  const rows = stmt.all(playerid);
  const deck: DbDeck[] = rows as DbDeck[];
  return deck;
}
function GetDeck(deckid: string): DbDeck | undefined {
  const database = db();
  const stmt = database.prepare(
    "SELECT deckid,ownerid,deckname,deckicon,persona from deck where deckid=(?)"
  );
  const row = stmt.get(deckid);
  if (!row) {
    return undefined;
  }
  const deck: DbDeck = row as DbDeck;
  return deck;
}

function GetDeckCards(deckid: string): DbDeckCard[] | undefined {
  const database = db();
  const stmt = database.prepare(
    "SELECT deckid, cardid,amount from deck_card where deckid=(?)"
  );
  const rows = stmt.all(deckid);
  if (!rows) {
    return undefined;
  }
  const deck: DbDeckCard[] = rows as DbDeckCard[];
  return deck;
}

function GetFullDeck(deckid: string): DbFullDeck | undefined {
  const deck = GetDeck(deckid);
  const cards = GetDeckCards(deckid);
  if (deck === undefined || cards === undefined) {
    return undefined;
  }
  const fulldeck: DbFullDeck = {
    deck: deck,
    cards: cards,
  };
  return fulldeck;
}
function GetOwnedCards(playerid: string): DbOwnedCard[] | undefined {
  const database = db();
  const stmt = database.prepare(
    "SELECT playerid, cardid,amount from owned_card where playerid=(?)"
  );
  const rows = stmt.all(playerid);
  if (!rows) {
    return undefined;
  }
  const deck: DbOwnedCard[] = rows as DbOwnedCard[];
  return deck;
}

function CreateDeck(deck: DbFullDeck) {
  const check = GetDeck(deck.deck.deckid);
  if (check !== undefined) {
    console.log("Deck already exists");
    return false;
  }
  //todo make this not awful
  let stmtsql =
    "INSERT INTO deck (deckid, ownerid, deckname, deckicon, persona) values (?,?,?,?,?)";
  const stmt = database.prepare(stmtsql);

  stmt.run(
    deck.deck.deckid,
    deck.deck.ownerid,
    deck.deck.deckname,
    deck.deck.deckicon,
    deck.deck.persona
  );

  deck.cards.forEach((card) => {
    let cstmtsql =
      "INSERT INTO deck_card (deckid, cardid, amount) values (?,?,?)";
    const cstmt = database.prepare(cstmtsql);

    cstmt.run(deck.deck.deckid, card.cardid, card.amount);
  });
}

function GetPlayerIdFromName(name: string): string {
  const database = db();
  const stmt = database.prepare(
    "SELECT playerid from player where username=(?)"
  );
  const row: any = stmt.get(name);
  if (!row) {
    return "";
  }

  return row.playerid;
}
function CreatePlayer(
  player: DbPlayer,
  startingcards: DbOwnedCard[],
  deck: DbFullDeck
): DbPlayer | undefined {
  const check = GetPlayer(player.playerid);
  if (check !== undefined) {
    return undefined;
  }
  const stmt = database.prepare(
    "INSERT into player (playerid,username) values (?, ?)"
  );
  stmt.run(player.playerid, player.username);

  // create a deck for that user
  startingcards.forEach((card) => {
    const cardstmt = database.prepare(
      "INSERT into owned_card (playerid, cardid, amount) values (?, ?, ?)"
    );
    cardstmt.run(player.playerid, card.cardid, card.amount);
  });
  CreateDeck(deck);
  return player;
}

function LoadJsonDeck(premade: string): DbFullDeck | undefined {
  if (!premadeDecks.premadeDecks.hasOwnProperty(premade)) {
    return undefined;
  }
  const deck = premadeDecks.premadeDecks[premade];
  const dbdeck: DbDeck = {
    deckid: "NONE",
    ownerid: "NONE",
    deckname: deck.name,
    persona: deck.persona,
    deckicon: deck.deckicon,
  };
  const dbDeckCard: DbDeckCard[] = deck.cards;

  const fulldeck: DbFullDeck = {
    deck: deck,
    cards: dbDeckCard,
  };
  return fulldeck;
}

export {
  CreateDeck,
  CreatePlayer,
  GetDeck,
  GetDeckCards,
  GetPlayer,
  GetOwnedCards,
  GetFullDeck,
  LoadJsonDeck,
  DbDeckCard,
  DbDeck,
  DbFullDeck,
  DbOwnedCard,
  DbPlayer,
  GetDeckList,
  GetPlayerIdFromName,
};
