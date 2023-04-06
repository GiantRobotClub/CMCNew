import { Ctx } from "boardgame.io";
import { FaLeaf, FaSearch } from "react-icons/fa";
import { prototypes } from "../shared/data/cards.json";
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

interface CMCCardBase {
  guid: string;
  name: string;
  type: CardType;
  alignment: Alignment;
  subtype: string;
  cardtext: string;
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
  const card: CMCLocationCard = CreateLocationCard("");
  card.name = "Nowhere";
  card.cardtext = "Nothing";

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

/////////////////debugging cards //////////////////
function CreateDebugCard(): CMCEffectCard {
  const card: CMCEffectCard = GetCardPrototype("debuggen") as CMCEffectCard;
  return card;
}

function CreateDebugMonsterCard(): CMCMonsterCard {
  const card: CMCMonsterCard = GetCardPrototype("debugslime") as CMCMonsterCard;
  return card;
}

function CreateDebugPersonaCard(playerid: string): CMCPersonaCard {
  const card: CMCPersonaCard = GetCardPrototype(
    "debugpersona"
  ) as CMCPersonaCard;
  return card;
}

function CreateDebugLocationCard(playerid: string): CMCLocationCard {
  const card: CMCLocationCard = GetCardPrototype("debugloc") as CMCLocationCard;
  return card;
}

function CreateDebugSpellCard(): CMCSpellCard {
  const card: CMCSpellCard = GetCardPrototype("debugspell");
  return card;
}

function GetCardPrototype(name: string): CMCCard {
  return prototypes[name];
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
  CreateDebugCard,
  CreatePersonaCard,
  CreateBasicCard,
  CreateInitialLocationCard,
  CreateDebugMonsterCard,
  CreateDebugPersonaCard,
  CreateLocationCard,
  CreateSpellCard,
  CreateDebugLocationCard,
  CreateDebugSpellCard,
  GetCardPrototype,
};
