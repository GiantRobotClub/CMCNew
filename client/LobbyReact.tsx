import { Lobby } from "boardgame.io/react";
import React, { useEffect, useState } from "react";
import { CardmasterConflict } from "../shared/CardmasterGame";
import { CMCBoard } from "./CMCComponents/Board";
import { LobbyClient } from "boardgame.io/client";

const LobbyReact = () => {
  const [games, setGames] = useState([""]);
  const lobbyClient = new LobbyClient({
    server: `http://${window.location.hostname}:3000/gameserver/`,
  });
  useEffect(() => {
    async function GetGames() {
      setGames(await lobbyClient.listGames());
    }

    GetGames();
  });
  return (
    <div>
      <div style={{ background: "grey" }}>
        <Lobby
          gameServer={`http://${window.location.hostname}:3000/gameserver/`}
          lobbyServer={`http://${window.location.hostname}:3000/gameserver/`}
          gameComponents={[{ game: CardmasterConflict, board: CMCBoard }]}
        />
        ;
      </div>
    </div>
  );
};

export default LobbyReact;
