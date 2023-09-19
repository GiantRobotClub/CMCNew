import { INVALID_MOVE } from "boardgame.io/core";
import type { Ctx, Game, Move } from "boardgame.io";
import { Stage, TurnOrder } from "boardgame.io/core";
import premadeDecks from "../shared/data/premade.json";
import {
  CMCCard,
  CMCLocationCard,
  CreateBasicCard,
  CreateInitialLocationCard,
  GetCardPrototype,
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
import { CardType, ClickType, GameMode, PlayerIDs, Stages } from "./Constants";
import {
  CanClickCard,
  CheckState,
  DrawCard,
  ForceDiscard,
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
  StagesDefiniton,
} from "./Moves";
import { GiConsoleController } from "react-icons/gi";
import {
  CreateDebugSetupData,
  ParseDbDeck,
  ParseDecks,
  PlayerDecks,
} from "./Decks";
import { isModuleDeclaration } from "typescript";
import {
  DbDeck,
  DbDeckCard,
  DbFullDeck,
  DbOwnedCard,
  DbPlayer,
} from "../server/DbTypes";
import { GetPlayer } from "../server/DbWrapper";
import { GetFullDeck } from "../server/DbWrapper";
import ai from "./ai";

import bosses from "../shared/data/singleplayer.json";
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
  lastAbilityStack: StackedAbility[];
  wait: boolean;
  gamemode: GameMode;
}

// Initial game state
export const CardmasterConflict: Game<CMCGameState> = {
  setup: ({ ctx, events }, setupData): CMCGameState => {
    // decks can be done through the game creation api, but here we will set up a default deck
    let decks: PlayerDecks = {
      "0": [],
      "1": [],
    };
    let gameStarted = false;
    let playerData: any;
    let isMulti = false;

    isMulti = true;
    // put in blank info, then set decks later whne game starts.
    playerData = {
      "0": CreateDefaultPlayer("0"),
      "1": CreateDefaultPlayer("1"),
    };
    let gamemode = GameMode.NORMAL;
    if (setupData && setupData.hasOwnProperty("gamemode")) {
      gamemode = setupData.gamemode;
    }
    return {
      gamemode: gamemode,
      ready: 0,
      wait: isMulti,
      abilityStack: [],
      lastAbilityStack: [],
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
    };
  },

  name: "cmcr",
  seed: Date.now().toString(),
  phases: {
    Before: {
      onBegin: ({ G, ctx, events }) => {
        if (!G.wait) {
          events.endPhase();
        }
      },
      start: true,
      next: "Game",
      turn: {
        activePlayers: { all: Stage.NULL },
        minMoves: 1,
        maxMoves: 1,
      },
      moves: {
        // performed by singleplayer client to load you and cpu player data.
        cpu: (
          { G, ctx, events },
          gameplayerid: string,
          dbplayerid: string,
          cpuopponent: string,
          deck: DbFullDeck,
          player: DbPlayer
        ) => {
          if (player == undefined) {
            // game is in an error state :( we need a way to handle these.
            console.log("COULDNT LOAD PLAYER");
            return INVALID_MOVE;
          }

          if (deck == undefined) {
            console.log("COULDNT LOAD DECK");
            return INVALID_MOVE;
          }
          console.dir(deck);
          const deckholder = {};
          deckholder[gameplayerid] = deck.deck;
          ParseDbPlayer(G, gameplayerid, deck, player);

          ParseDbDeck(gameplayerid, JSON.parse(JSON.stringify(deck)), G);

          console.log("PLAYER HAS JOINED : " + player.username);

          // load  character
          const bossplayer = bosses.bosses[cpuopponent];
          const bosscard = GetCardPrototype(bossplayer.persona);
          const cpuPlayer: DbPlayer = {
            playerid: cpuopponent,
            selecteddeck: bossplayer.deck,
            username: bosscard.name,
            visualname: bosscard.name,
            authenticationcode: "",
          };

          const cpucards: DbDeckCard[] = [];
          const premade = premadeDecks.premadeDecks[bossplayer.deck];
          premade.cards.map((premadecard) => {
            const amount: number = premadecard.amount;
            const cardid: string = premadecard.cardid;
            const dcard: DbDeckCard = {
              amount: amount,
              cardid: cardid,
              deckid: bossplayer.deck,
            };
            cpucards.push(dcard);
          });
          const cpudeck: DbFullDeck = {
            deck: {
              deckid: bossplayer.deck,
              ownerid: bossplayer,
              deckicon: "",
              deckname: bosscard.name,
              persona: bossplayer.persona,
            },

            cards: cpucards,
          };

          ParseDbPlayer(G, "1", cpudeck, cpuPlayer);

          ParseDbDeck("1", cpudeck, G);

          G.gameStarted = true;
          //time to start the game
          events.endPhase();
        },

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

          if (G.gamemode == GameMode.NORMAL) {
            const deck: DbFullDeck | undefined = GetFullDeck(
              player.selecteddeck
            );
            if (deck == undefined) {
              console.log("COULDNT LOAD DECK");
              return INVALID_MOVE;
            }
            // parse out your deck
            const deckholder = {};
            deckholder[gameplayerid] = deck.deck;
            ParseDbPlayer(G, gameplayerid, deck, player);

            ParseDbDeck(gameplayerid, deck, G);
          } else if ((G.gamemode = GameMode.SPARECHANGE)) {
            const owned: DbOwnedCard[] | undefined = GetFullDeck(
              player.playerid
            );
            // create fake spare change deck

            if (owned == undefined) {
              console.log("COULDNT LOAD DECK");
              return INVALID_MOVE;
            }
            const cards: DbDeckCard[] = owned.map((ownedcard) => {
              const newcard: DbDeckCard = {
                cardid: ownedcard.cardid,
                amount: ownedcard.amount,
                deckid: "",
              };
              return newcard;
            });
            const deck: DbFullDeck = {
              deck: {
                persona: "classicpersona",
                deckid: "",
                deckname: "SPARE CHANGE",
                deckicon: "",
                ownerid: player.playerid,
              },
              cards: [],
            };

            // parse out your deck
            const deckholder = {};
            deckholder[gameplayerid] = deck.deck;
            ParseDbPlayer(G, gameplayerid, deck, player);

            ParseDbDeck(gameplayerid, deck, G);
          }
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

        G.gameStarted = true;
        // sjhuffle decks
        G.secret.decks["0"] = random.Shuffle(G.secret.decks["0"]);
        G.secret.decks["1"] = random.Shuffle(G.secret.decks["1"]);
        if (random.D6() % 2) {
          PlayerIDs.reverse(); // swap turn order.
        }
        // go through every card and reset the guids to something random
        for (const playerno in PlayerIDs) {
          for (const card in G.secret.decks[playerno]) {
            G.secret.decks[playerno][card].guid = GenerateRandomGuid(random);
          }
          G.playerData[playerno].persona.guid = GenerateRandomGuid(random);
          console.log(
            "PLAYER:",
            playerno,
            "GUID:",
            G.playerData[playerno].persona.guid
          );
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
          const okay = DrawCard(
            playerno,
            player.persona.startingHand,
            G,
            ctx,
            random,
            events
          );
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
            TriggerAuto(TriggerNames.START_TURN, ctx, G, random, events);

            const activePlayer = GetActivePlayer(ctx);
            // do turn mana, unless this is the first turn, then do initial mana and hand

            const player: CMCPlayer = G.playerData[activePlayer];

            PlayerAddResource(activePlayer, player.persona.resourcePerTurn, G);
          }
          CheckState(G);
        },
        onEnd: ({ G, ctx, events, random }) => {
          if (ctx.activePlayers !== null) {
            TriggerAuto(TriggerNames.END_STAGE, ctx, G, random, events);
            TriggerAuto(TriggerNames.END_TURN, ctx, G, random, events);
          }

          resetCombat(G);
          return G;
        },
        onMove: ({ G, ctx, events, random }) => {
          CheckState(G);
        },

        stages: StagesDefiniton,
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

  ai: ai,
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
