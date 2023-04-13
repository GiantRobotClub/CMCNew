import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../shared/CardmasterGame";

import { CMCBoard } from "./CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import { SocketIO } from "boardgame.io/multiplayer";
import { useParams } from "react-router-dom";

const CmcP1 = Client({
  game: CardmasterConflict,
  numPlayers: 2,
  board: CMCBoard,
  multiplayer: SocketIO({ server: window.location.hostname + ":8000" }),
});

const MultiClient = () => {
  const { id } = useParams();
  return (
    <div>
      <CmcP1 playerID={id} />
    </div>
  );
};

export default MultiClient;
