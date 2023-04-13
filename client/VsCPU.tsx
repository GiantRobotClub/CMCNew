import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../shared/CardmasterGame";

import { CMCBoard } from "./CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import { MCTSBot } from "boardgame.io/ai";

const Config = {
  depth: 10,
  iterations: 75,
};

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
    iterations = Config.iterations;
    playoutDepth = Config.depth;
    super({
      enumerate,
      seed,
      objectives,
      game,
      iterations,
      playoutDepth,
      iterationCallback,
    });
  }
}
const Cmcpu = Client({
  game: CardmasterConflict,
  numPlayers: 2,
  board: CMCBoard,
  multiplayer: Local({ bots: { 1: MyBot } }),
});

const CPUClient = () => (
  <div>
    <Cmcpu playerID="0" />
  </div>
);

export default CPUClient;
