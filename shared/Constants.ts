const SERVER_PORT = 3030;
const CLIENT_PORT = 3000;
const GAME_PORT = 3050;

enum CardType {
  EMPTY = 0,
  DUMMY,
  MONSTER,
  EFFECT,
  SPELL,
  LOCATION,
  PERSONA,
}

enum ClickType {
  HAND = 0,
  EFFECT,
  MONSTER,
  GRAVEYARD,
  LOCATION,
  PERSONA,
  PLAYER,
}

enum Stages {
  initial = "initial",
  draw = "draw",
  play = "play",
  combat = "combat",
  resolve = "resolve",
  respond = "respond",
  defense = "defense",
  pickTarget = "pickTarget",
  pickHandCard = "pickHandCard",
  pickSlot = "pickSlot",
  pickPlayer = "pickPlayer",
}

export { SERVER_PORT, CLIENT_PORT, GAME_PORT, CardType, ClickType, Stages };
