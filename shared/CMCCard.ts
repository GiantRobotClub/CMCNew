import { Ctx } from "boardgame.io";
import { FaLeaf, FaSearch } from "react-icons/fa";
import { prototypes } from "../shared/data/cards.json";
import { current } from "immer";
import {
  Alignment,
  CardType,
  ClickType,
  PlayerIDs,
  Stages,
} from "../shared/Constants";
import {
  Ability,
  AbilitySpeed,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
  TriggerType,
} from "./Abilities";
import { GiConsoleController } from "react-icons/gi";

interface StatMod {
  sourceGuid: string;
  mods: [{}];
}
interface CMCCardBase {
  expansion: string;
  guid: string;
  name: string;
  type: CardType;
  alignment: Alignment;
  subtype: string;
  cardtext: string;
  statmods?: StatMod[]; // applies to getters
  original?: CMCCard;
  cost: {
    mana: {
      V: Number;
      A: Number;
      P: Number;
    };
  };

  sac: {
    mana: {
      V: Number;
      A: Number;
      P: Number;
    };
  };
}

interface CMCCard extends CMCCardBase {
  abilities: Ability[];
  picture: string;
  costFunction: string;
  playFunction: string;
}

function CreateBasicCard(guid: string = ""): CMCCard {
  const card: CMCCard = {
    expansion: "base",
    alignment: Alignment.NONE,
    guid: guid ? guid : "TEMPORARY",
    subtype: "",
    costFunction: "DefaultCost",
    playFunction: "DefaultPlay",
    name: "",
    picture: "",
    cardtext: "",
    type: CardType.EMPTY,
    sac: {
      mana: {
        V: 0,
        A: 0,
        P: 0,
      },
    },
    cost: {
      mana: {
        V: 0,
        A: 0,
        P: 0,
      },
    },
    abilities: [],
  };

  return card;
}

interface CMCLocationCard extends CMCCard {
  owner: string;
}
interface CMCEntityCard extends CMCCard {
  destroyed: boolean;
  dizzy: boolean;
  status: any;
}
interface CMCEffectCard extends CMCEntityCard {}
interface CMCMonsterCard extends CMCEntityCard {
  attack: number;
  life: number;
}

interface CMCPersonaCard extends CMCCard {
  playerID: string;
  startingResource: any;
  resourcePerTurn: any;
  startingHand: number;
  drawPerTurn: number;
  maxHand: number;
  // anything else you can do through ability triggers
}

interface CMCSpellCard extends CMCCard {}

function CreateSpellCard(): CMCSpellCard {
  const card: CMCSpellCard = {
    ...CreateBasicCard(),
  };
  card.type = CardType.SPELL;
  return card;
}

function CreateLocationCard(playerID: string): CMCLocationCard {
  const card: CMCLocationCard = {
    owner: "",
    ...CreateBasicCard(),
  };

  card.type = CardType.LOCATION;
  return card;
}
function CreateInitialLocationCard(): CMCLocationCard {
  const card: CMCLocationCard = {
    ...CreateLocationCard(""),
    ...GetCardPrototype("emptyloc"),
  };

  return card;
}
function CreatePersonaCard(playerID: string): CMCPersonaCard {
  const card: CMCPersonaCard = {
    playerID: playerID,
    startingResource: {},
    resourcePerTurn: {},
    startingHand: 1,
    drawPerTurn: 1,
    maxHand: 1,

    ...CreateBasicCard(),
  };

  card.type = CardType.PERSONA;
  return card;
}
function CreateEntityCard(): CMCEntityCard {
  const card: CMCEntityCard = {
    dizzy: false,
    status: {},
    destroyed: false,
    ...CreateBasicCard(),
  };
  return card;
}

function CreateMonsterCard(): CMCMonsterCard {
  const card: CMCMonsterCard = {
    life: 0,
    attack: 0,
    ...CreateEntityCard(),
  };
  card.type = CardType.MONSTER;

  return card;
}

function CreateEffectCard(): CMCEffectCard {
  const card: CMCEffectCard = CreateEntityCard();
  card.type = CardType.EFFECT;
  return card;
}
function GetCardPrototype(name: string): CMCCard {
  const newprototype = JSON.parse(JSON.stringify(prototypes[name]));

  newprototype.original = prototypes[name];

  return newprototype;
}

function LoadCardPrototype(json: string | object): CMCCard {
  const newprototype = typeof json === "string" ? JSON.parse(json) : json;
  return newprototype;
}

function ApplyStat(mod: {}, orig: {}): any {
  const modified: {} = orig;
  Object.entries(mod).forEach(([index, submod]) => {
    if (typeof submod === "number") {
      modified[index] = submod + orig[index];
    } else if (typeof submod === "object" && submod !== null) {
      modified[index] = ApplyStat(submod, orig[index]);
    }
  });

  return modified;
}

function GetModifiedStatCard(card: CMCCard): CMCCard {
  let newCard: CMCCard = JSON.parse(JSON.stringify(card));
  if (newCard.original) {
    newCard = newCard.original;
  }
  if (!("statmods" in card) || card.statmods === undefined || !card.statmods) {
    return card;
  }
  card.statmods.forEach((mod) => {
    mod.mods.forEach((modding) => {
      // apply stats
      newCard = ApplyStat(modding, newCard);
    });
  });
  newCard.statmods = undefined;
  return newCard;
}

export {
  CMCCard,
  CMCEffectCard,
  CMCMonsterCard,
  CMCEntityCard,
  CMCPersonaCard,
  CMCLocationCard,
  CMCSpellCard,
  CreateEffectCard,
  CreatePersonaCard,
  CreateBasicCard,
  CreateInitialLocationCard,
  CreateLocationCard,
  CreateSpellCard,
  GetCardPrototype,
  GetModifiedStatCard,
  LoadCardPrototype,
  StatMod,
  ApplyStat,
};
