import React, { useEffect, useState } from "react";
import { Server } from "boardgame.io/src/types";
import { DbDeck, DbFullDeck } from "../../server/DbTypes";
import { CreateDeckVisual, decklistdefinition } from "../Pages/DeckVisual";
import { CreateDefaultPlayer } from "../../shared/Player";
const emptydbdeck: DbDeck = {
  deckicon: "",
  ownerid: "",
  persona: "empty",
  deckname: "",
  deckid: "",
};
const emptydbfulldeck: DbFullDeck = {
  deck: emptydbdeck,
  cards: [],
};
function CMCPlayerVisual({ player }: { player: Server.PlayerMetadata }) {
  const [DeckID, setDeckID] = useState("");
  const [DataPlayer, setDbPlayer] = useState("");
  const [FullDeck, setFullDeck] = useState(emptydbfulldeck);
  let playervisual = <></>;
  let deckvisual = <></>;
  let playerid = "";
  if (!player.name) {
    const emptyplayer = CreateDefaultPlayer("");
    emptyplayer.name = "";

    deckvisual = CreateDeckVisual(emptyplayer, FullDeck.deck, () => {});
  } else {
    playervisual = <>{player.name}</>;
    playerid = player.data.dbPlayerId;

    const emptyplayer = CreateDefaultPlayer(playerid);
    emptyplayer.name = player.name;
    deckvisual = CreateDeckVisual(emptyplayer, FullDeck.deck, () => {});
  }

  useEffect(() => {
    fetch("/api/manage/player/getbyid/" + playerid)
      .then((response) => response.json())
      .then((data) => {
        setDbPlayer(data.player);
        setDeckID(data.player.selecteddeck);

        fetch("/api/manage/decks/get/" + data.player.selecteddeck)
          .then((response) => response.json())
          .then((data) => {
            console.dir(data);
            const fulldeck = data.decks as DbFullDeck;
            setFullDeck(fulldeck);
          });
      });
  }, [player]);

  return (
    <div className="gameplayer">
      <div className="deckvisualcontainer">{deckvisual}</div>
    </div>
  );
}

export default CMCPlayerVisual;
