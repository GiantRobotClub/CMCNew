import { INVALID_MOVE } from "boardgame.io/core";
import type { Ctx, Game, Move } from "boardgame.io";
import { Stage, TurnOrder } from "boardgame.io/core";
import crypto from "crypto";
import {
  CMCCard,
  CMCLocationCard,
  CreateBasicCard,
  CreateInitialLocationCard,
} from "./CMCCard";
import { CMCPlayer, CreateDefaultPlayer, ParseDbPlayer } from "./Player";

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
import {
  CreateDebugSetupData,
  ParseDbDeck,
  ParseDecks,
  PlayerDecks,
} from "./Decks";
import { isModuleDeclaration } from "typescript";
import { DbFullDeck, DbPlayer } from "../server/DbTypes";
import { GetPlayer } from "../server/DbWrapper";
import { GetFullDeck } from "../server/DbWrapper";
import { Events } from "boardgame.io/src/plugins/events/events";

export interface CMCGameState {
  playerData: {
    "0": CMCPlayer;
    "1": CMCPlayer;
  };
  ready: number;
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
  gameStarted: boolean;
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
  wait: boolean;
}

// Initial game state
export const CardmasterConflict: Game<CMCGameState> = {
  setup: ({ ctx }, setupData): CMCGameState => {
    // decks can be done through the game creation api, but here we will set up a default deck
    let decks: PlayerDecks = {
      "0": [],
      "1": [],
    };
    let gameStarted = false;
    let playerData: any;
    let isMulti = false;
    console.dir(setupData);
    if (!setupData || setupData.multi == false) {
      setupData = CreateDebugSetupData();
      decks = ParseDecks(CreateDebugSetupData());
      playerData = {
        "0": CreateDefaultPlayer("0", setupData.decks),
        "1": CreateDefaultPlayer("1", setupData.decks),
      };
    } else {
      isMulti = true;
      // put in blank info, then set decks later whne game starts.
      playerData = {
        "0": CreateDefaultPlayer("0"),
        "1": CreateDefaultPlayer("1"),
      };
    }
    /*
    if (!setupData) {
      setupData = CreateDebugSetupData();
      console.log(setupData.decks);
    }
    decks = ParseDecks(setupData.decks);

   
*/
    return {
      ready: 0,
      wait: isMulti,
      lastAbilityLength: 0,
      playerData: playerData,
      returnStage: [],
      didinitialsetup: false,
      currentmetadata: {},
      gameStarted: gameStarted,

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
  name: "cmcr",
  seed: Date.now().toString(),
  phases: {
    Before: {
      onBegin: ({ G, ctx, events }) => {},
      start: true,
      next: "Game",
      turn: {
        activePlayers: { all: Stage.NULL },
        minMoves: 1,
        maxMoves: 1,
      },
      moves: {
        // move performed by a multiplayer client automatically to load decks/etc.
        ready: (
          { G, ctx, events },

          gameplayerid: string,
          dbplayerid: string
        ) => {
          // we are only going to do this in multiplayer games, so it's safe to load decks here.  i think.
          const player: DbPlayer | undefined = GetPlayer(dbplayerid);
          if (player == undefined) {
            // game is in an error state :( we need a way to handle these.
            console.log("COULDNT LOAD PLAYER");
            return INVALID_MOVE;
          }
          const deck: DbFullDeck | undefined = GetFullDeck(player.selecteddeck);
          if (deck == undefined) {
            console.log("COULDNT LOAD DECK");
            return INVALID_MOVE;
          }
          console.log("Deck:");
          console.dir(deck.deck);
          // parse out your deck
          const deckholder = {};
          deckholder[gameplayerid] = deck.deck;
          ParseDbPlayer(G, gameplayerid, deck, player);

          ParseDbDeck(gameplayerid, deck, G);

          console.log("PLAYER HAS JOINED : " + player.username);
          G.ready += 1;
          if (G.ready == 2) {
            G.wait = false;
            G.gameStarted = true;
            //time to start the game
            events.endPhase();
          }
        },
      },
    },
    Game: {
      onBegin: ({ G, ctx, events, random }) => {
        console.log("Beginning first turn!!!!");

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
            console.log("player lost due to draw out during inital setup");
            G.loser = playerno;
          }
          PlayerAddResource(playerno, player.persona.startingResource, G);
        }
      },
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

            const player: CMCPlayer = G.playerData[activePlayer];

            PlayerAddResource(activePlayer, player.persona.resourcePerTurn, G);
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
