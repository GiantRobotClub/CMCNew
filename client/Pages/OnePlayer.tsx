import React, { useEffect } from "react";
import { useState } from "react";
import { bosses } from "../../shared/data/singleplayer.json";
import { CreateDeckVisual } from "./DeckVisual";
import CMCCardVisual from "../CMCComponents/Card";
import { GetCardPrototype } from "../../shared/CMCCard";
import { CMCPlayer, CreateDefaultPlayer } from "../../shared/Player";
import { useNavigate } from "react-router-dom";
import { DbCompletion } from "../../server/DbTypes";

function OnePlayer() {
  const [LoggedIn, setLoggedIn] = useState(false);
  const [PlayerID, setPlayerID] = useState("");
  const enemies: JSX.Element[] = [];
  const [Enemies, setEnemies] = useState(enemies);
  const [Completions, setCompletions] = useState([""]);

  const navigate = useNavigate();
  useEffect(() => {
    fetch("/api/manage/player/getsession")
      .then((response) => response.json())
      .then((data) => {
        console.dir(data);
        if (data.playerid !== "") {
          setPlayerID(data.playerid);
          fetch("/api/manage/completions/get/" + data.playerid + "/persona")
            .then((response) => response.json())
            .then((pdata) => {
              const completions: DbCompletion[] = pdata.completions;
              const completionlist = completions.map(
                (completions) => completions.completionname
              );
              setCompletions(completionlist);

              let newenemies: JSX.Element[] = [];
              newenemies = [];
              for (const [enemy, def] of Object.entries(bosses)) {
                const persona = def.persona;
                const name = enemy;
                const deck = def.deck;
                const fakeplayer: CMCPlayer = CreateDefaultPlayer(enemy);
                fakeplayer.name = "";
                console.dir(def);

                const newenemy = (
                  <div
                    className={
                      "enemyportrait " +
                      (completionlist.includes(enemy)
                        ? "completed"
                        : "uncompleted")
                    }
                    key={enemy}
                  >
                    <div className="deckdisplay">
                      <CMCCardVisual
                        card={GetCardPrototype(persona)}
                        canClick={true}
                        doClick={() => {
                          navigate("/1P/" + data.playerid + "/" + enemy);
                        }}
                        player={fakeplayer}
                        big={true}
                        activeCard={false}
                      />
                    </div>
                  </div>
                );

                newenemies.push(newenemy);
              }

              setEnemies(newenemies);
            });
        }
      });
  }, []);

  return (
    <div className="enemyselector">
      {Enemies.map((enemy) => {
        return enemy;
      })}
    </div>
  );
}

export default OnePlayer;
