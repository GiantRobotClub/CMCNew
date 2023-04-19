import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../../shared/CardmasterGame";

import { CMCBoard } from "../CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import { MCTSBot } from "boardgame.io/ai";
import { useParams } from "react-router-dom";

const Config = {
  depth: 5,
  iterations: 3,
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

const CPUClient = () => {
  const { pid, enemy } = useParams();
  const playerid = pid ? pid : "";
  const enemyid = enemy ? enemy : "none";
  return (
    <div>
      <Cmcpu
        dbplayerid={playerid}
        goesfirst="0"
        cpuopponent={enemyid}
        playerID="0"
        showChat={false}
      />
    </div>
  );
};

export default CPUClient;
