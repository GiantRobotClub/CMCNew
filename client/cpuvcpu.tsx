import { Client } from "boardgame.io/react";
import React from "react";
import { CMCGameState, CardmasterConflict } from "../shared/CardmasterGame";

import { CMCBoard } from "./CMCComponents/Board";
import { Local, SocketIO } from "boardgame.io/multiplayer";
import { MCTSBot } from "boardgame.io/ai";
import { Ctx } from "boardgame.io";
import { GetActivePlayer, GetActiveStage, OtherPlayer } from "../shared/Util";
import { CardType, PlayerIDs, Stages } from "../shared/Constants";
import { PlayerID } from "boardgame.io/src/types";
import { Stage } from "boardgame.io/src/core/turn-order";

const Config = {
  depth: 3,
  iterations: 40,
};
interface Objective {
  checker: (G: any, ctx: Ctx) => boolean;
  weight: number;
}

type Objectives = Record<string, Objective>;

const objectivehealth: Objective = {
  checker: (G: CMCGameState, ctx: Ctx) => {
    const playerid = "0";
    if (
      GetActiveStage(ctx) == Stages.respond ||
      GetActiveStage(ctx) == Stages.defense
    ) {
      return true;
    }

    const objective =
      G.playerData[OtherPlayer(playerid)].resources.intrinsic.health >=
      G.playerData[playerid].resources.intrinsic.health;

    return objective;
  },
  weight: 4,
};
function objectivesfunc(G: any, ctx: Ctx, playerID?: PlayerID): Objectives {
  if (playerID == "0") {
    const obs: Objectives = {
      health: objectivehealth,
    };
    return obs;
  } else {
    const obs: Objectives = {
      health: objectivehealth,
    };
    return obs;
  }
}
class MyBot extends MCTSBot {
  constructor({
    enumerate,
    seed,
    game,
    iterations,
    playoutDepth,
    iterationCallback,
  }) {
    console.log("Creating bot..");
    iterations = Config.iterations;
    playoutDepth = Config.depth;

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
