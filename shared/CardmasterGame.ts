import { INVALID_MOVE } from "boardgame.io/core";
import type { Ctx, Game, Move } from "boardgame.io";
import { Stage, TurnOrder } from "boardgame.io/core";
import crypto from "crypto";
import {
  CMCCard,
  CMCLocationCard,
  CMCMonsterCard,
  CMCPersonaCard,
  CreateBasicCard,
  CreateDebugCard,
  CreateDebugLocationCard,
  CreateDebugMonsterCard,
  CreateDebugSpellCard,
  CreateInitialLocationCard,
} from "./CMCCard";
import { CMCPlayer, CreateDefaultPlayer } from "./Player";

import {
  Ability,
  Ability_Trigger,
  StackedAbility,
  TriggerAuto,
  TriggeringTrigger,
  TriggerNames,
  TriggerPlayerType,
} from "./Abilities";
import { CardType, ClickType, PlayerIDs, Stages } from "./Constants";
import {
  CanClickCard,
  CheckState,
  DrawCard,
  GenerateRandomGuid,
  OwnerOf,
  PlayEntity,
  PlayerAddResource,
  resetCombat,
} from "./LogicFunctions";
import { GetActivePlayer, GetActiveStage, OtherPlayer } from "./Util";
import {
  CMCCombat,
  CMCCombatResults,
  ResolveCombat,
  SetCombatAttacker,
  StartCombatPhase,
} from "./CMCCombat";
import {
  passStage,
  playCardFromHand,
  pickEntity,
  cancel,
  passTurn,
  chooseSlot,
  activateAbility,
} from "./Moves";
import { GiConsoleController } from "react-icons/gi";

export interface CMCGameState {
  playerData: {
    "0": CMCPlayer;
    "1": CMCPlayer;
  };
  currentmetadata: any;
  slots: {
    "0": {
      effects: [CMCCard, CMCCard, CMCCard, CMCCard, CMCCard];
      monsters: [CMCCard, CMCCard, CMCCard, CMCCard, CMCCard];
    };

    "1": {
      effects: [CMCCard, CMCCard, CMCCard, CMCCard, CMCCard];
      monsters: [CMCCard, CMCCard, CMCCard, CMCCard, CMCCard];
    };
  };
  players: {
    "0": {
      hand: CMCCard[];
    };
    "1": {
      hand: CMCCard[];
    };
  };
  secret: {
    decks: {
      "0": CMCCard[];
      "1": CMCCard[];
    };
  };
  activeAbility?: Ability;
  activeCard?: CMCCard;
  returnStage: Stages[];
  loser?: string;
  location: CMCLocationCard;
  didinitialsetup: boolean;
  combat?: CMCCombat;
  resolution?: CMCCombatResults;
  abilityStack: StackedAbility[];
  lastAbilityLength: number;
}

// Initial game state
export const CardmasterConflict: Game<CMCGameState> = {
  setup: ({ ctx }, setupData): CMCGameState => {
    // decks can be done through the game creation api, but here we will set up a default deck

    const decks = {
      "0": [
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),

        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
      ],
      "1": [
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugLocationCard(""),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugLocationCard(""),
        CreateDebugLocationCard(""),
        CreateDebugLocationCard(""),
        CreateDebugMonsterCard(),

        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugSpellCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
        CreateDebugMonsterCard(),
        CreateDebugCard(),
        CreateDebugLocationCard(""),
        CreateDebugLocationCard(""),
        CreateDebugLocationCard(""),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugCard(),
        CreateDebugMonsterCard(),
      ],
    };
    return {
      lastAbilityLength: 0,
      playerData: {
        "0": CreateDefaultPlayer("0"),
        "1": CreateDefaultPlayer("1"),
      },
      returnStage: [],
      didinitialsetup: false,
      currentmetadata: {},

      slots: {
        "0": {
          effects: [
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
          ],
          monsters: [
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
          ],
        },

        "1": {
          effects: [
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
          ],
          monsters: [
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
            CreateBasicCard(),
          ],
        },
      },
      location: CreateInitialLocationCard(),
      players: {
        "0": {
          hand: [],
        },
        "1": {
          hand: [],
        },
      },
      secret: {
        decks: decks,
      },
      abilityStack: [],
    };
  },

  seed: Date.now().toString(),
  turn: {
    activePlayers: {
      currentPlayer: Stages.initial,
    },
    order: TurnOrder.CUSTOM(PlayerIDs), // anyone else is a spectator
    onBegin: ({ G, ctx, events, random }) => {
      if (ctx.activePlayers !== null) {
        TriggerAuto(TriggerNames.START_TURN, ctx, G);

        const activePlayer = GetActivePlayer(ctx);
        // do turn mana, unless this is the first turn, then do initial mana and hand
        if (ctx.turn == 1 && activePlayer == "0" && !G.didinitialsetup) {
          // sjhuffle decks
          G.secret.decks["0"] = random.Shuffle(G.secret.decks["0"]);
          G.secret.decks["0"] = random.Shuffle(G.secret.decks["1"]);

          // go through every card and reset the guids to something random
          for (const playerno in PlayerIDs) {
            for (const card in G.secret.decks[playerno]) {
              G.secret.decks[playerno][card].guid = GenerateRandomGuid(random);
            }
            G.playerData[playerno].persona.guid = GenerateRandomGuid(random);
          }

          for (const slotplayer in G.slots) {
            for (const subplayer in G.slots[slotplayer]) {
              for (const [index, card] of G.slots[slotplayer][
                subplayer
              ].entries()) {
                G.slots[slotplayer][subplayer][index].guid =
                  GenerateRandomGuid(random);
              }
            }
          }

          G.didinitialsetup = true;
          // this is the beginning of the game
          for (const playerno in PlayerIDs) {
            const player: CMCPlayer = G.playerData[playerno];
            const okay = DrawCard(playerno, player.persona.startingHand, G);
            if (!okay) {
              G.loser = playerno;
            }
            PlayerAddResource(playerno, player.persona.startingResource, G);
          }
        } else {
          const player: CMCPlayer = G.playerData[activePlayer];

          PlayerAddResource(activePlayer, player.persona.resourcePerTurn, G);
        }
      }
      CheckState(G);
    },
    onEnd: ({ G, ctx, events, random }) => {
      if (ctx.activePlayers !== null) {
        TriggerAuto(TriggerNames.END_STAGE, ctx, G);
        TriggerAuto(TriggerNames.END_TURN, ctx, G);
      }

      resetCombat(G);
      return G;
    },
    onMove: ({ G, ctx, events, random }) => {
      CheckState(G);
    },

    stages: {
      error: {},
      initial: {
        moves: {
          passStage: passStage,
        },
        next: Stages.draw,
      },
      draw: {
        moves: {
          passStage: passStage,
        }, // automatically does the draw for you
        next: Stages.sacrifice,
      },
      sacrifice: {
        moves: {
          passStage: passStage,
          pickEntity: pickEntity,
        },
        next: Stages.play,
      },
      play: {
        moves: {
          playCardFromHand: playCardFromHand,
          activateAbility: activateAbility,
          passStage: passStage,
        },
        next: Stages.combat,
      },
      combat: {
        moves: {
          activateAbility: activateAbility,
          //chooseCard
          passStage: passStage,
          pickEntity: pickEntity,
          cancel: cancel,
        },

        next: Stages.defense,
      },
      defense: {
        moves: {
          activateAbility: activateAbility,
          //chooseCard
          passStage: passStage,
          pickEntity: pickEntity,
          cancel: cancel,
        },

        next: Stages.resolve,
      },
      resolve: {
        moves: {
          passTurn: passTurn,
        },
        next: Stages.draw,
      },

      pickSlot: {
        moves: {
          chooseSlot: chooseSlot,
          cancel: cancel,
        },
      },

      // states depending on player actions

      pickCombatTarget: {
        moves: {
          pickEntity: pickEntity,
          cancel: cancel,
        },
      },
      pickCombatDefense: {
        moves: {
          pickEntity: pickEntity,
          cancel: cancel,
        },
      },
      pickAbilityTarget: {
        moves: {
          pickEntity: pickEntity,
          cancel: cancel,
        },
      },
      discardCard: {
        moves: {
          playCardFromHand: playCardFromHand,
        },
      },
      respond: {
        moves: {
          activateAbility: activateAbility,
          pickEntity: pickEntity,
          passStage: passStage,
        },
      },
    },
  },

  moves: {
    passTurn: passTurn,
  },
  endIf: ({ G, ctx }) => {
    if (IsVictory(G)) {
      return { winner: ctx.currentPlayer };
    }
    if (IsDraw(G)) {
      return { draw: true };
    }
  },

  ai: {
    enumerate: (G, ctx) => {
      let moves: any[] = [];

      if (GetActiveStage(ctx) != Stages.resolve) {
        if (!G.activeAbility && !G.activeCard) {
          moves.push({ move: "passStage" });
        }
      } else {
        moves.push({ move: "passTurn" });
      }

      if (
        G.activeAbility ||
        G.activeCard ||
        [
          Stages.pickAbilityTarget,
          Stages.pickCombatDefense,
          Stages.pickCombatTarget,
          Stages.pickSlot,
        ].includes(GetActiveStage(ctx))
      ) {
        moves.push({ move: "cancel", args: [GetActivePlayer(ctx)] });
      }

      if (GetActiveStage(ctx) == Stages.play) {
        let hand: CMCCard[] = G.players[GetActivePlayer(ctx)].hand;
        if (!G.activeCard) {
          hand.forEach((crd, idx) => {
            if (
              CanClickCard(crd, GetActivePlayer(ctx), ClickType.HAND, ctx, G)
            ) {
              moves.push({
                move: "playCardFromHand",
                args: [
                  G.players[GetActivePlayer(ctx)].hand[idx],
                  GetActivePlayer(ctx),
                ],
              });
            }
          });
        }
      }
      for (const slotplayer in G.slots) {
        if (
          CanClickCard(
            G.playerData[slotplayer].persona,
            GetActivePlayer(ctx),
            ClickType.PERSONA,
            ctx,
            G
          )
        ) {
          moves.push({
            move: "pickEntity",
            args: [G.playerData[slotplayer].persona, GetActivePlayer(ctx)],
          });
        }
        for (const subplayer in G.slots[slotplayer]) {
          for (const [index, card] of G.slots[slotplayer][
            subplayer
          ].entries()) {
            if (
              CanClickCard(
                card,
                GetActivePlayer(ctx),
                subplayer == "effects" ? ClickType.EFFECT : ClickType.MONSTER,
                ctx,
                G
              )
            ) {
              moves.push({
                move: card.type == CardType.EMPTY ? "chooseSlot" : "pickEntity",
                args: [
                  G.slots[slotplayer][subplayer][index],
                  GetActivePlayer(ctx),
                ],
              });
            }
          }
        }
      }
      return moves;
    },
  },
};

// something has set the loser flag.
function IsVictory(G: CMCGameState) {
  if (G.loser) {
    return { winner: OtherPlayer(G.loser) };
  }
  return false;
}

// there's no draws in this game
function IsDraw(G: CMCGameState) {
  return false;
}

export default { CardmasterConflict };
