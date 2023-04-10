import React, { useEffect, useState } from "react";
import { LobbyClient, LobbyClientError } from "boardgame.io/client";
import { Link, matchRoutes } from "react-router-dom";
import { LobbyAPI } from "boardgame.io/src/types";
import { DbPlayer } from "../server/DbTypes";
import { useNavigate } from "react-router-dom";
import { GiCoinsPile } from "react-icons/gi";
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
    console.log("Creating match with setup data");
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

    setopengames(
      <div>
        {timertick} {isLoading ? "loading" : "loaded"}
        {games.map((match, index) => (
          <div
            className="match"
            key={match.matchID}
            style={{ border: "1px solid white" }}
          >
            <div className="matchtime">{match.createdAt}</div>

            <div className="matchplayers">
              {" "}
              players:
              {match.players.map((player, index) => (
                <div key={player.id}>
                  name: {player.name} pid: {player.id}
                  connected:
                  {player.isConnected ? "yes" : "no"}
                  {!player.name ? (
                    <Link
                      onClick={() => {
                        JoinGame(match.matchID, player.id.toString());
                      }}
                      to={""}
                    >
                      Join
                    </Link>
                  ) : player.name == Player.username ? (
                    ""
                  ) : (
                    <Link to={"/play/" + match.matchID + "/-1/none"}>
                      Spectate
                    </Link>
                  )}
                  <Link to={"/play/" + match.matchID + "/-1/none"}>
                    Spectate Debug
                  </Link>
                </div>
              ))}
            </div>
            <div className="matchoptions"></div>
          </div>
        ))}
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
      <div>Current Games:</div>
      <div id="gamelist">{opengames}</div>
    </div>
  );
};

export default LobbyCustom;
