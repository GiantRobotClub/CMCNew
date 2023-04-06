import { Lobby } from "boardgame.io/react";
import React, { useEffect, useState } from "react";
import { CardmasterConflict } from "../shared/CardmasterGame";
import { CMCBoard } from "./CMCComponents/Board";
import { LobbyClient } from "boardgame.io/client";

const LobbyCustom = () => {
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
  return <div>{games}</div>;
};

export default LobbyCustom;
