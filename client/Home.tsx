import { useEffect, useState } from "react";
import "./App.css";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const [LoggedIn, setLoggedIn] = useState(false);
  const [PlayerID, setPlayerID] = useState("");
  // check session, redirect to login if needed.
  useEffect(() => {
    fetch("/api/manage/player/getsession")
      .then((response) => response.json())
      .then((data) => {
        if (data.playerid !== "") {
          setPlayerID(data.playerid);
          setLoggedIn(true);
        }
      });
  });

  return (
    <div>
      <div>
        {" "}
        {LoggedIn ? "Logged in as id " : ""} - {PlayerID}{" "}
      </div>
      <div>
        <Link to="/Lobby">Multiplayer</Link>
      </div>
      <div>
        <Link to="/playcpu">Single Player</Link>
      </div>
      <div>
        <Link to="/Game">Test local</Link>
      </div>
      <div>
        <Link to="/multi/0">Test as player 0</Link>
      </div>
      <div>
        <Link to="/multi/1">Test as player 1</Link>
      </div>
    </div>
  );
}

export default Home;
