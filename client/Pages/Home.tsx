import { useEffect, useState } from "react";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { icons } from "../CMCComponents/Icons";
import { DbPlayer } from "../../server/DbTypes";
import SessionHandler from "../CMCComponents/SessionHandler";
import CMCPlayerVisual from "../CMCComponents/PlayerData";
import { Server } from "boardgame.io";

function Home() {
  const [LoggedIn, setLoggedIn] = useState(false);
  const [PlayerID, setPlayerID] = useState("");

  const navigate = useNavigate();
  const emptydb: DbPlayer = {
    playerid: "",
    visualname: "",
    username: "",
    authenticationcode: "",
    selecteddeck: "",
  };

  const emptymeta: Server.PlayerMetadata = {
    id: 0,
    name: "",
    data: {
      dbPlayerId: "",
    },
  };
  const [metaplayer, setMetaplayer] = useState(emptymeta);
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
              console.dir("Player is : ", data.player);
              const newmeta: Server.PlayerMetadata = {
                id: 0,
                name: data.player.username,
                data: {
                  dbPlayerId: data.player.playerid,
                },
              };
              setMetaplayer(newmeta);
            });
        } else {
          navigate("/");
        }
      });
  }, []);

  return (
    <div className="mainmenu">
      <div className="playersettings">
        <CMCPlayerVisual player={metaplayer} />
      </div>
      <div className="menubuttons">
        <Link to="/Lobby" className="menuoption">
          <div className="play-icon">{icons.hand}</div>
          <div className="play-text">
            <div className="play-name">PLAY</div>
          </div>
          <div className="play-description">
            Join or create games by other players
          </div>
        </Link>
        <Link to="/Craft" className="menuoption">
          <div className="play-icon">{icons.cauldron}</div>
          <div className="play-text">
            <div className="play-name">SPELL CRAFTING</div>
          </div>
          <div className="play-description">
            Craft materials into new cards and packs
          </div>
        </Link>
        <Link to="/Craft" className="menuoption">
          <div className="play-icon">{icons.cpu}</div>
          <div className="play-text">
            <div className="play-name">SINGLE PLAYER</div>
          </div>
          <div className="play-description">
            Challenge a collection of Cardmasters to earn their Persona cards.
          </div>
        </Link>
        <Link className="menuoption" to="/decks">
          <div className="play-icon">{icons.default}</div>
          <div className="play-text">
            <div className="play-name">DECKS</div>
          </div>
          <div className="play-description">Manage your decks.</div>
        </Link>
      </div>
      <SessionHandler />;
    </div>
  );
}

export default Home;
