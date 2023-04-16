import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../shared/CardmasterGame";

import { CMCBoard } from "./CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";

const CmcP1 = Client({
  game: CardmasterConflict,
  numPlayers: 2,
  board: CMCBoard,
  multiplayer: Local(),
});

const DualClient = () => (
  <div>
    <CmcP1 playerID="0" />
    <CmcP1 playerID="1" />
  </div>
);

export default DualClient;
