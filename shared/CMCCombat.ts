import { Ctx } from "boardgame.io";
import { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import { current } from "immer";
import { instanceOf } from "prop-types";
import { FaCcMastercard } from "react-icons/fa";
import { CMCGameState } from "./CardmasterGame";
import { CMCCard, CMCMonsterCard, CMCPersonaCard } from "./CMCCard";
import { CardType } from "./Constants";
import { CardScan, DamageResult, DealDamage } from "./LogicFunctions";

interface CMCCombatant {
  attacker: CMCMonsterCard;
  defender: CMCPersonaCard | CMCMonsterCard;
  locked: boolean;
  player: boolean;
}

interface CMCCombatantResult {
  card: CMCCard;
  destroyed: boolean;
  damage: number;
  resisted: number;
  overage: number;
}

interface CMCCombatResult {
  attacker: CMCCombatantResult;
  defender: CMCCombatantResult;
}

interface CMCCombatResults {
  results: CMCCombatResult[];
}
interface CMCCombat {
  targets: CMCCombatant[];
}

function StartCombatPhase(): CMCCombat {
  const combatState: CMCCombat = {
    targets: [],
  };
  return combatState;
}

// do combat calculations including damage

function ResolveCombat(G: CMCGameState, ctx: Ctx, random: RandomAPI) {
  if (G.combat === undefined) {
    // combat is not ready, return.
    return false;
  }

  const combat = G.combat;
  const fullresults: CMCCombatResults = {
    results: [],
  };

  for (const resolution of combat.targets) {
    console.dir(current(resolution));
    const resolvedatk: CMCCombatantResult = {
      card: resolution.attacker,
      destroyed: false,
      damage: 0,
      resisted: 0,
      overage: 0,
    };
    const resolveddef: CMCCombatantResult = {
      card: resolution.defender,
      destroyed: false,
      damage: 0,
      resisted: 0,
      overage: 0,
    };

    // phase zero, trigger
    // check if card is dead yet
    if (resolution.attacker.destroyed) {
      continue;
    }
    if (
      resolution.defender.type == CardType.MONSTER &&
      "attack" in resolution.defender
    ) {
      console.dir(current(resolution.defender));
      // attacker->defender damage for agility

      // check card state
      //  defender->attacker damage

      let dresult: DamageResult = DealDamage(
        resolution.attacker,
        resolution.defender,
        resolution.defender.attack,
        G
      );
      resolvedatk.damage = dresult.damage;
      resolvedatk.destroyed = resolution.attacker.life <= 0;
      resolvedatk.overage = dresult.overage;
      resolvedatk.resisted = 0;

      console.dir(dresult);
      // check card state for reflexes

      //todo
      // attacker->defender damage if not already done

      dresult = DealDamage(
        resolution.defender,
        resolution.attacker,
        resolution.attacker.attack,
        G
      );

      console.dir(dresult);

      resolveddef.damage = dresult.damage;
      resolveddef.destroyed = resolution.defender.life <= 0;
      resolveddef.overage = dresult.overage;
      resolveddef.resisted = 0;
    }
    let playerDamage: number = 0;
    // check if there's overage damage or it's a direct player attack
    if ("attack" in resolution.defender) {
      if (resolution.locked) {
        playerDamage = 0;
      } else {
        playerDamage = resolveddef.overage;
      }
    } else {
      playerDamage = resolution.attacker.attack;
    }
    // player damage
    if (playerDamage > 0) {
      let dresult = DealDamage(
        resolution.defender,
        resolution.attacker,
        resolution.attacker.attack,
        G
      );
    }
    // add results
    const result: CMCCombatResult = {
      attacker: resolvedatk,
      defender: resolveddef,
    };
    fullresults.results.push(result);
  }
  CardScan(G, random);
  // complete
  G.resolution = fullresults;
}

// add an attack, either to a persona (player) or to another monster directly.
// todo: Add cards that cannot be attacked, and cards that prevent attacks from
// hitting the player directly.
function SetCombatAttacker(
  attacker: CMCMonsterCard,
  attackerPlayer: boolean,
  G: CMCGameState,
  defender: CMCMonsterCard | CMCPersonaCard
): boolean {
  if (G.combat === undefined) {
    // combat is not ready, return.
    return false;
  }
  const combat = G.combat;

  // is the attacker a monster?
  if (attacker.type != CardType.MONSTER) {
    return false;
  }

  // is the attacker already attacking?
  // is the defender already defending?
  for (const existingattacker of G.combat.targets) {
    if (attacker.guid == existingattacker.attacker.guid) {
      return false;
    }
    if (defender.guid == existingattacker.defender.guid) {
      return false;
    }
  }
  const newAttacker: CMCCombatant = {
    attacker: attacker,
    defender: defender,
    locked: defender.type !== CardType.PERSONA && attackerPlayer, // defender can set unlocked ones, attacker direct is always locked unless the card is a persona.
    player: defender.type === CardType.PERSONA,
  };
  combat.targets.push(newAttacker);
  return true;
}

export {
  CMCCombat,
  CMCCombatant,
  CMCCombatResult,
  CMCCombatantResult,
  CMCCombatResults,
  StartCombatPhase,
  SetCombatAttacker,
  ResolveCombat,
};
