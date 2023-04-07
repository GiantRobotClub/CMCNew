import { useEffect, useState } from "react";
import "./App.css";
import React from "react";
import { useNavigate } from "react-router-dom";

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
      {LoggedIn ? "Logged in as id " : ""} - {PlayerID}
    </div>
  );
}

export default Home;
