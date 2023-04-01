import { Ctx } from "boardgame.io";
import { FaLeaf, FaSearch } from "react-icons/fa";
import { Alignment, CardType, ClickType, Stages } from "../shared/Constants";
import {
  Ability,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
  TriggerType,
} from "./Abilities";
import { ManaGenerate, TriggerStage } from "./CardFunctions";
import { CMCGameState } from "./CardmasterGame";

import * as CardFunctions from "./CardFunctions";
import { Stage } from "boardgame.io/dist/types/packages/core";
import { UUID } from "crypto";
import { GiCutDiamond } from "react-icons/gi";

interface CMCCardBase {
  guid: string;
  name: string;
  type: CardType;
  alignment: Alignment;
  subtype: string;

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

function CreateBasicCard(): CMCCard {
  const card: CMCCard = {
    alignment: Alignment.NONE,
    guid: crypto.randomUUID(),
    subtype: "",
    costFunction: "DefaultCost",
    playFunction: "DefaultPlay",
    name: "",
    picture: "",
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

interface CMCEntityCard extends CMCCard {
  dizzy: boolean;
  status: any;
}
interface CMCEffectCard extends CMCEntityCard {}
interface CMCMonsterCard extends CMCEntityCard {
  attack: number;
  life: number;
}

function CreateEntityCard(): CMCEntityCard {
  const card: CMCEntityCard = {
    dizzy: false,
    status: {},
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

function CreateDebugCard(): CMCEffectCard {
  const card: CMCEffectCard = CreateEffectCard();
  card.name = "GENERATOR";
  card.sac.mana.A = 2;
  card.cost.mana.A = 1;

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
  };
  card.abilities = [debugAbility];
  return card;
}

export {
  CMCCard,
  CMCEffectCard,
  CreateEffectCard,
  CreateDebugCard,
  CreateBasicCard,
  CreateDebugMonsterCard,
};
