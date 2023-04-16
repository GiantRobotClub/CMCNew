import React, { useEffect, useState } from "react";
import { Server } from "boardgame.io/src/types";
import { DbDeck, DbFullDeck } from "../../server/DbTypes";
import { CreateDeckVisual, decklistdefinition } from "../DeckVisual";
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
  const [DbPlayer, setDbPlayer] = useState("");
  const [FullDeck, setFullDeck] = useState(emptydbfulldeck);
  let playervisual = <></>;
  let deckvisual = <></>;
  if (!player.name) {
    const emptyplayer = CreateDefaultPlayer("");
    emptyplayer.name = "";

    deckvisual = CreateDeckVisual(emptyplayer, FullDeck.deck, () => {});
  } else {
    playervisual = <>{player.name}</>;
    const playerid = player.data.dbPlayerId;

    useEffect(() => {
      fetch("/api/manage/player/getbyid/" + playerid)
        .then((response) => response.json())
        .then((data) => {
          setDbPlayer(data.player);
          setDeckID(data.player.selecteddeck);
          console.dir("Player is : ", data.player);

          fetch("/api/manage/decks/get/" + data.player.selecteddeck)
            .then((response) => response.json())
            .then((data) => {
              console.dir(data);
              const fulldeck = data.decks as DbFullDeck;
              setFullDeck(fulldeck);
            });
        });
    }, []);
    const emptyplayer = CreateDefaultPlayer(playerid);
    emptyplayer.name = player.name;
    deckvisual = CreateDeckVisual(emptyplayer, FullDeck.deck, () => {});
  }
  return (
    <div className="gameplayer">
      <div className="deckvisualcontainer">{deckvisual}</div>
    </div>
  );
}

export default CMCPlayerVisual;
