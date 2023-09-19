import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../../shared/CardmasterGame";

import { CMCBoard } from "../CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import { MCTSBot } from "boardgame.io/ai";
import { useParams } from "react-router-dom";
import { CMCGameBot } from "../CMCComponents/BotDefinition";

const Config = {
  depth: 2,
  iterations: 10,
};

const Cmcpu = Client({
  game: CardmasterConflict,
  numPlayers: 2,
  board: CMCBoard,
  multiplayer: Local({ bots: { 1: CMCGameBot } }),
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
