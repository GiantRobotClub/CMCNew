import React, { useEffect, useState } from "react";
import { LobbyClient, LobbyClientError } from "boardgame.io/client";
import { Link, matchRoutes } from "react-router-dom";
import { LobbyAPI } from "boardgame.io/src/types";
import { DbPlayer } from "../../server/DbTypes";
import { useNavigate } from "react-router-dom";
import { GiCoinsPile } from "react-icons/gi";
import SessionHandler from "../CMCComponents/SessionHandler";
import { icons } from "../CMCComponents/Icons";
import CMCPlayerVisual from "../CMCComponents/PlayerData";

<SessionHandler />;
const baseplayer: DbPlayer = {
  playerid: "",
  username: "",
  visualname: "",
  authenticationcode: "",
  selecteddeck: "",
};

const LobbyCustom = () => {
  const [games, setGames] = useState<LobbyAPI.Match[]>([]);
  const [opengames, setopengames] = useState(<div>loading</div>);
  const [PlayerID, setPlayerID] = useState("");
  const [isLoading, setisLoading] = useState(true);
  const [Player, setPlayer] = useState<DbPlayer>(baseplayer);
  const [GotGamesOnce, setGotGamesOnce] = useState(false);
  const [timertick, settimertick] = useState(Math.floor(Date.now() / 10000));

  // check session, redirect to login if needed.
  useEffect(() => {
    fetch("/api/games").then((response) => response.json());
    setisLoading(true);
    fetch("/api/manage/player/getsession")
      .then((response) => response.json())
      .then((data) => {
        if (data.playerid !== "") {
          setPlayerID(data.playerid);
          console.log("dta is : " + data);
          fetch("/api/manage/player/getbyid/" + data.playerid)
            .then((response) => response.json())
            .then((data) => {
              setPlayer(data.player);
              console.log("Player is : " + data.player);
              setisLoading(false);
              settimertick(0);
            });
        } else {
          // return to login screen
          nav("/");
        }
      });
  }, []);

  const lobbyClient = new LobbyClient({
    server: `http://${window.location.hostname}:3000/gameserver/`,
  });
  useEffect(() => {
    const interval = setInterval(() => {
      settimertick(Math.floor(Date.now() / 10000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timertick]);
  const nav = useNavigate();
  async function JoinGame(matchid: string, pid: string) {
    lobbyClient
      .joinMatch("cmcr", matchid, {
        playerID: pid,
        playerName: Player.username,
        player: Player,
        data: {
          dbPlayerId: Player.playerid,
        },
      })
      .then((playerCredentials) => {
        // todo: save credentials to the cookie temporarily
        console.log("Go to play screen for the match");
        nav(
          "/play/" +
            matchid +
            "/" +
            pid +
            "/" +
            JSON.stringify(playerCredentials)
        );
      });
  }
  async function CreateMatch() {
    console.log("Creating match with deck data");
    lobbyClient
      .createMatch("cmcr", {
        numPlayers: 2,
        setupData: {
          isMulti: true,
        },
      })
      .then((matchid) => {
        console.log(
          "Trying to join match" + matchid.matchID + " as " + Player.username
        );
        lobbyClient
          .joinMatch("cmcr", matchid.matchID, {
            playerID: "0",
            playerName: Player.username,
            player: Player,
            data: {
              dbPlayerId: Player.playerid,
            },
          })
          .then((playerCredentials) => {
            console.log("Go to play screen for the match");
            nav(
              "/play/" +
                matchid.matchID +
                "/0/" +
                JSON.stringify(playerCredentials)
            );
          });
      })
      .catch((error) => {
        const err: LobbyClientError = error as LobbyClientError;
        console.error(err);
      });
  }

  useEffect(() => {
    async function GetGames() {
      setisLoading(true);
      console.log("Getting game list...");
      const { matches } = await lobbyClient.listMatches("cmcr");
      setGames(matches);

      setisLoading(false);
    }
    if (!GotGamesOnce) {
      GetGames();
      setGotGamesOnce(true);
    }

    function makeplayerbox(player, index, alreadyin, match) {
      return (
        <div className={"player-in-match" + index} key={player.id}>
          <div className="playercontainer">
            <CMCPlayerVisual player={player} />
          </div>
          <div className="ready">
            {player.isConnected ? icons.check : icons.x}
          </div>
          <div className="playerseatcontrols">
            {!alreadyin && !player.name ? (
              <Link
                onClick={() => {
                  JoinGame(match.matchID, player.id.toString());
                }}
                to={""}
              >
                {icons.controller} Play
              </Link>
            ) : (
              <></>
            )}
          </div>
        </div>
      );
    }
    setopengames(
      <div className="opengames">
        {isLoading ? "loading" : ""}
        {games.map((match, index) => {
          let alreadyin = false;
          if (
            match.players["0"].data.dbPlayerId == PlayerID ||
            match.players["1"].data.dbPlayerId == PlayerID
          ) {
            alreadyin = true;
          }
          return (
            <div
              className="match"
              key={match.matchID}
              style={{ border: "1px solid white" }}
            >
              <div className="matchtime">
                {new Date(match.createdAt).toUTCString()}
              </div>

              <div className="matchplayers">
                <div className="matchplayerline">
                  {makeplayerbox(match.players["0"], index, alreadyin, match)}
                  <div className="vsbox">VS</div>

                  {makeplayerbox(match.players["1"], index, alreadyin, match)}
                </div>
                <Link to={"/play/" + match.matchID + "/-1/none"}>
                  {icons.eye} Spectate
                </Link>
              </div>
              <div className="matchoptions"></div>
            </div>
          );
        })}
      </div>
    );
  }, [timertick]);

  return (
    <div>
      <div id="create">
        <button name="createbutton" onClick={() => CreateMatch()}>
          Create Match
        </button>
      </div>
      <div id="gamelist">{opengames}</div>
    </div>
  );
};

export default LobbyCustom;
