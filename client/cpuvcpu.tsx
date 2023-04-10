import { Client } from "boardgame.io/react";
import React from "react";
import { CMCGameState, CardmasterConflict } from "../shared/CardmasterGame";
import { TicTacToe } from "../shared/Game";
import { TicTacToeBoard } from "./Board";
import { CMCBoard } from "./CMCComponents/Board";
import { Local, SocketIO } from "boardgame.io/multiplayer";
import { MCTSBot } from "boardgame.io/ai";
import { Ctx } from "boardgame.io";
import { GetActivePlayer, OtherPlayer } from "../shared/Util";
import { CardType } from "../shared/Constants";
import { PlayerID } from "boardgame.io/src/types";

const Config = {
  depth: 10,
  iterations: 75,
};
interface Objective {
  checker: (G: any, ctx: Ctx) => boolean;
  weight: number;
}

type Objectives = Record<string, Objective>;

const objectivehealth: Objective = {
  checker: (G: CMCGameState, ctx: Ctx) => {
    return (
      G.playerData[OtherPlayer(GetActivePlayer(ctx))].resources.intrinsic
        .health < G.playerData[GetActivePlayer(ctx)].resources.intrinsic.health
    );
  },
  weight: 4,
};
const objectivemonsters: Objective = {
  checker: (G: CMCGameState, ctx: Ctx) => {
    let yourmonsters = 0;
    let theirmonsters = 0;

    G.slots[OtherPlayer(GetActivePlayer(ctx))].monsters.forEach((card) => {
      if (card.type != CardType.EMPTY) {
        theirmonsters = theirmonsters + 1;
      }
    });
    G.slots[GetActivePlayer(ctx)].monsters.forEach((card) => {
      if (card.type != CardType.EMPTY) {
        yourmonsters = yourmonsters + 1;
      }
    });
    return yourmonsters >= theirmonsters;
  },
  weight: 2,
};

function objectivesfunc(G: any, ctx: Ctx, playerID?: PlayerID): Objectives {
  const obs: Objectives = {
    monster: objectivemonsters,
    health: objectivehealth,
  };
  return obs;
}
class MyBot extends MCTSBot {
  constructor({
    enumerate,
    seed,
    objectives,
    game,
    iterations,
    playoutDepth,
    iterationCallback,
  }) {
    console.log("Creating bot..");
    iterations = Config.iterations;
    playoutDepth = Config.depth;
    if (!objectives) {
      objectives = [];
    }
    objectives.push(objectivemonsters);
    objectives.push(objectivehealth);
    super({
      enumerate,
      seed,
      objectives: objectivesfunc,
      game,
      iterations,
      playoutDepth,
      iterationCallback,
    });
  }
}
const transport = Local({ bots: { 0: MyBot, 1: MyBot } });
const Cmcpu = Client({
  game: CardmasterConflict,
  numPlayers: 2,
  board: CMCBoard,
  multiplayer: transport,
});

const DualCpu = () => (
  <div>
    <Cmcpu playerID="0" />
    <Cmcpu playerID="1" />
  </div>
);

export default DualCpu;
