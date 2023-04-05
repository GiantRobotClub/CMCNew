import { Ctx } from "boardgame.io";
import { FaLeaf, FaSearch } from "react-icons/fa";
import { Alignment, CardType, ClickType, Stages } from "../shared/Constants";
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
    guid: guid ? guid : crypto.randomUUID(),
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
  const card: CMCEffectCard = CreateEffectCard();
  card.name = "GENERATOR";
  card.sac.mana.A = 2;
  card.cost.mana.A = 1;

  card.cardtext = " A basic generator ";
  const debugAbility: Ability = {
    triggerType: TriggerType.AUTOMATIC_STAGE,
    activateCode: "ManaGenerate",
    triggerCode: "TriggerStage",
    metadata: {
      triggername: TriggerNames.START_TURN,
      triggerstage: "initial",
      color: "A",
      amount: 1,
    },
    abilityName: "Generate Mana",
    abilityText: "Adds one Anodyne per turn",
    abilityCostText: undefined,
  };
  card.abilities = [debugAbility];
  return card;
}

function CreateDebugMonsterCard(): CMCMonsterCard {
  const card: CMCMonsterCard = CreateMonsterCard();
  card.name = "SLIME";
  card.sac.mana.A = 2;
  card.cost.mana.A = 1;
  card.life = 10;
  card.attack = 10;
  card.cardtext = " Just a debug slime ";
  const debugAbility: Ability = {
    triggerType: TriggerType.ACTIVATED,
    activateCode: "ManaGenerate",
    triggerCode: undefined,
    metadata: {
      color: "A",
      amount: 1,
    },

    speed: AbilitySpeed.A,
    abilityName: "Generate Mana",
    abilityText: "Add one anodyne",
    abilityCostText: "Z",
  };
  card.abilities = [debugAbility];
  return card;
}

function CreateDebugPersonaCard(playerid: string): CMCPersonaCard {
  const card: CMCPersonaCard = CreatePersonaCard(playerid);
  card.resourcePerTurn = { mana: { V: 1, A: 1, P: 1 } };
  card.startingResource = {
    mana: { V: 1, A: 1, P: 1 },
    intrinsic: { health: 100 },
  };
  card.drawPerTurn = 1;
  card.startingHand = 1;
  card.cardtext = " Garden Variety ";

  return card;
}

function CreateDebugLocationCard(playerid: string): CMCLocationCard {
  const card: CMCLocationCard = CreateLocationCard("");
  card.name = "MANA LAND";
  card.cardtext = "A lot of mana here";
  const debugAbility: Ability = {
    triggerType: TriggerType.AUTOMATIC_STAGE,
    activateCode: "ManaGenerate",
    triggerCode: "TriggerStage",
    metadata: {
      triggername: TriggerNames.START_TURN,
      triggerstage: "initial",
      color: "A",
      amount: 1,
    },
    abilityName: "Generate Mana",
    abilityText: "Adds one Anodyne per turn",
    abilityCostText: undefined,
  };

  card.abilities = [debugAbility];
  card.cost.mana.V = 1;
  card.cost.mana.A = 1;
  card.cost.mana.P = 1;

  return card;
}

function CreateDebugSpellCard(): CMCSpellCard {
  const card = CreateSpellCard();
  card.name = "zoop";
  card.cardtext = "a spell to damage players and monsters";
  const debugAbility: Ability = {
    triggerType: TriggerType.ACTIVATED_TARGETED,
    targetCode: "IsDamagable",
    activateCode: "DamageTarget",
    metadata: {
      amount: 10,
    },
    abilityName: "Zoop!!",
    abilityText: "Deal 10 damage to target player or monster",
    speed: AbilitySpeed.B,
  };
  card.abilities = [debugAbility];
  card.cost.mana.A = 1;
  return card;
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
};
