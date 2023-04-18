import { Client } from "boardgame.io/react";
import { CardmasterConflict } from "../../shared/CardmasterGame";
import { CMCBoard } from "../CMCComponents/Board";
import { useParams } from "react-router-dom";

import { SocketIO } from "boardgame.io/multiplayer";
import React from "react";
import SessionHandler from "../CMCComponents/SessionHandler";
<SessionHandler />;
const CmcClient = Client({
  game: CardmasterConflict,
  numPlayers: 2,

  board: CMCBoard,
  multiplayer: SocketIO({ server: window.location.hostname + ":8000" }),
});

const Cmc = () => {
  const { mid, pid, cred } = useParams();
  return (
    <div>
      <CmcClient
        credentials={cred ? JSON.parse(cred).playerCredentials : ""}
        matchID={mid}
        playerID={pid == "-1" ? undefined : pid}
      />
    </div>
  );
};

export default Cmc;
