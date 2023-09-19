import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../../shared/CardmasterGame";

import { CMCBoard } from "../CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import { CMCGameBot } from "../CMCComponents/BotDefinition";

const transport = Local({ bots: { 0: CMCGameBot, 1: CMCGameBot } });
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
