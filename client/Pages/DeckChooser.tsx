import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CMCCardVisual from "../CMCComponents/Card";
import {
  CMCPersonaCard,
  CreateBasicCard,
  GetCardPrototype,
} from "../../shared/CMCCard";
import { CMCPlayer, CreateDefaultPlayer } from "../../shared/Player";
import { icons } from "../CMCComponents/Icons";

import { CreateDeckVisual, decklistdefinition } from "./DeckVisual";
import { DbPlayer } from "../../server/DbTypes";

const DeckChooser = () => {
  const nav = useNavigate();
  const decklist: decklistdefinition[] = [];
  const [PlayerID, setPlayerID] = useState("");
  const [isLoading, setisLoading] = useState(true);
  const [Decks, setDecks] = useState(decklist);
  const [fetchflag, setfetchflag] = useState(true);
  const emptydb: DbPlayer = {
    playerid: "",
    username: "",
    selecteddeck: "",
    visualname: "",
    authenticationcode: "",
  };
  const [DbPlayer, setDbPlayer] = useState(emptydb);
  function gotodeck(deckid: string) {
    console.log("Going to " + deckid);
    if (deckid == "create") {
      fetch("/api/manage/decks/create/" + PlayerID).then(() => {
        setfetchflag(!fetchflag);
      });
    } else {
      nav("/decks/" + deckid, { state: DbPlayer.selecteddeck });
    }
  }
  function selectdeck(deckid: string) {
    console.log("Selecting deck " + deckid);
    fetch("/api/manage/decks/select/" + PlayerID + "/" + deckid).then(() => {
      setfetchflag(!fetchflag);
    });
  }
  function createNewDeck() {
    fetch("/api/manage/decks/create/" + PlayerID).then(() => {
      setfetchflag(!fetchflag);
    });
  }
  useEffect(() => {
    setisLoading(true);
    fetch("/api/manage/player/getsession")
      .then((response) => response.json())
      .then((data) => {
        if (data.playerid !== "") {
          setPlayerID(data.playerid);
          const playerid = data.playerid;
          fetch("/api/manage/decks/list/" + data.playerid)
            .then((response) => response.json())
            .then((data) => {
              if (data.playerid != playerid) {
                // error
                console.log("Data is wrong");
                console.dir(data);
                nav("/");
              }
              setDecks(data.decks);
              fetch("/api/manage/player/getbyid/" + playerid)
                .then((response) => response.json())
                .then((data) => {
                  setDbPlayer(data.player);
                });
              setisLoading(false);
            });
        } else {
          console.log("No Session");
          nav("/");
        }
      });
  }, [fetchflag]);
  if (isLoading) {
    return <div id="loading">LOADING</div>;
  }

  let emptylinkdeck: decklistdefinition = {
    deckid: "create",
    ownerid: PlayerID,
    deckname: "Create New",
    deckicon: "adddeck",
    persona: "empty",
  };
  const eplayer = CreateDefaultPlayer(PlayerID);
  let emptydeckvisual = CreateDeckVisual(eplayer, emptylinkdeck, createNewDeck);
  const selected = (
    <div className="isselected">
      {icons.arrowdr}SELECTED{icons.arrowdl}
    </div>
  );
  function notselected(deckid) {
    return (
      <div className="notselected">
        <button className="selectionbutton" onClick={() => selectdeck(deckid)}>
          Select
        </button>
      </div>
    );
  }
  return (
    <div id="deckchooser">
      {Decks.map((deck: decklistdefinition) => {
        const player = CreateDefaultPlayer(PlayerID);
        player.name = deck.deckname;
        return (
          <div className="verticaldeckslice">
            <div className="selected">
              {DbPlayer.selecteddeck == deck.deckid
                ? selected
                : notselected(deck.deckid)}
            </div>
            <div className="deckvis" onClick={() => gotodeck(deck.deckid)}>
              {CreateDeckVisual(player, deck, () => gotodeck(deck.deckid))}
            </div>
          </div>
        );
      })}{" "}
      <div className="verticaldeckslice">
        <div className="selected"></div>
        {emptydeckvisual}
      </div>
    </div>
  );
};

export default DeckChooser;
