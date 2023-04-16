import { useEffect, useState } from "react";
import "./App.css";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { icons } from "./CMCComponents/Icons";
import { DbPlayer } from "../server/DbTypes";
import SessionHandler from "./SessionHandler";

function Home() {
  const [LoggedIn, setLoggedIn] = useState(false);
  const [PlayerID, setPlayerID] = useState("");
  const emptydb: DbPlayer = {
    playerid: "",
    visualname: "",
    username: "",
    authenticationcode: "",
    selecteddeck: "",
  };
  const [Player, setPlayer] = useState(emptydb);
  // check session, redirect to login if needed.
  useEffect(() => {
    fetch("/api/manage/player/getsession")
      .then((response) => response.json())
      .then((data) => {
        console.dir(data);
        if (data.playerid !== "") {
          setPlayerID(data.playerid);
          setLoggedIn(true);
          fetch("/api/manage/player/getbyid/" + data.playerid)
            .then((response) => response.json())
            .then((data) => {
              setPlayer(data.player);
              console.log("Player is : " + data.player);
            });
        }
      });
  });

  return (
    <div className="mainmenu">
      <div className="playersettings">
        <div className="playerblock-name">PLAYER: {Player.username}</div>
        <div className="currentdeckname">DECK: {Player.selecteddeck}</div>
      </div>
      <Link to="/Lobby" className="menuoption">
        <div className="play-icon">{icons.hand}</div>
        <div className="play-text">PLAY</div>
        <div className="play-description">
          Join or create games by other players
        </div>
      </Link>
      <Link to="/Craft" className="menuoption">
        <div className="play-icon">{icons.cauldron}</div>
        <div className="play-text">SPELLWEAVING</div>
        <div className="play-description">
          Craft materials into new cards and packs
        </div>
      </Link>
      <Link to="/Craft" className="menuoption">
        <div className="play-icon">{icons.cpu}</div>
        <div className="play-text">SINGLE PLAYER</div>
        <div className="play-description">
          Challenge a collection of Cardmasters to earn their Persona cards.
        </div>
      </Link>
      <Link className="menuoption" to="/decks">
        <div className="play-icon">{icons.default}</div>
        <div className="play-text">DECKS</div>
        <div className="play-description">Manage your decks.</div>
      </Link>
      <SessionHandler />;
    </div>
  );
}

export default Home;
