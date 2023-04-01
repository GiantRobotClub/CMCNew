import { Ctx } from "boardgame.io";
import { FaLeaf, FaSearch } from "react-icons/fa";
import { CardType, ClickType, Stages } from "../shared/Constants";
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

  costFunction: string;
  playFunction: string;
}

function CreateBasicCard(): CMCCard {
  const card: CMCCard = {
    guid: crypto.randomUUID(),
    costFunction: "DefaultCost",
    playFunction: "DefaultPlay",
    name: "",
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

interface CMCEffectCard extends CMCCard {}

function CreateEffectCard(): CMCEffectCard {
  const card: CMCEffectCard = CreateBasicCard();
  card.type = CardType.EFFECT;
  return card;
}

function CreateDebugCard(): CMCEffectCard {
  const card: CMCEffectCard = CreateEffectCard();
  card.name = "DEBUG";
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

export {
  CMCCard,
  CMCEffectCard,
  CreateEffectCard,
  CreateDebugCard,
  CreateBasicCard,
};
