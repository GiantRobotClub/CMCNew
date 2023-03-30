import { CardType } from "../shared/Constants";
import {
  Ability,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
  TriggerType,
} from "./Abilities";
import { ManaGenerate, TriggerStage } from "./CardFunctions";
interface CMCCardBase {
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
}

function CreateBasicCard(): CMCCard {
  const card: CMCCard = {
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
  card.sac.mana.A = 1;
  card.cost.mana.A = 1;

  const debugAbility: Ability = {
    triggerType: TriggerType.AUTOMATIC_STAGE,
    activateCode: ManaGenerate.toString(),
    triggerCode: TriggerStage.toString(),
    metadata: {
      triggername: TriggerNames.START_TURN,
      triggerstage: "draw",
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
