const SERVER_PORT = 3030;
const CLIENT_PORT = 3000;
const GAME_PORT = 3050;

enum GameMode {
  NORMAL = "NORMAL",
  BO3 = "BO3",
  SPARECHANGE = "SPARECHANGE",
  CLASSIC = "CLASSIC",
}

enum CardType {
  EMPTY = "EMPTY",
  DUMMY = "DUMMY",
  MONSTER = "MONSTER",
  EFFECT = "EFFECT",
  SPELL = "SPELL",
  LOCATION = "LOCATION",
  PERSONA = "PERSONA",
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
  discardCard = "discardCard",
  pickSlot = "pickSlot",
  sacrifice = "sacrifice",
  error = "error",
}

enum Alignment {
  NONE = "NONE",
  ANODYNE = "ANODYNE",
  PROFANE = "PROFANE",
  VENERATED = "VENERATED",
  AP = "AP",
  PV = "PV",
  VA = "VA",
  VAP = "VAP",
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
  GameMode,
};
