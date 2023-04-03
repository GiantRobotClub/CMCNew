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
  INVALID,
}

enum Stages {
  initial = "initial",
  draw = "draw",
  play = "play",
  combat = "combat",
  resolve = "resolve",
  respond = "respond",
  defense = "defense",
  pickCombatTarget = "pickCombatTarget",
  pickAbilityTarget = "pickAbilityTarget",
  pickCombatDefense = "pickCombatDefense",
  pickHandCard = "pickHandCard",
  pickSlot = "pickSlot",
  pickPlayer = "pickPlayer",
  error = "error",
}

enum Alignment {
  NONE,
  ANODYNE,
  PROFANE,
  VENERATED,
  AP,
  PV,
  VA,
  GOLDEN,
}

const PlayerIDs = ["0", "1"];
export {
  SERVER_PORT,
  CLIENT_PORT,
  GAME_PORT,
  CardType,
  ClickType,
  Stages,
  Alignment,
  PlayerIDs,
};
