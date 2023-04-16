import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CMCCardVisual from "./CMCComponents/Card";
import {
  CMCPersonaCard,
  CreateBasicCard,
  GetCardPrototype,
} from "../shared/CMCCard";
import { CMCPlayer, CreateDefaultPlayer } from "../shared/Player";
import { icons } from "./CMCComponents/Icons";
import "./editor.css";
import { CreateDeckVisual, decklistdefinition } from "./DeckVisual";

const DeckChooser = () => {
  const nav = useNavigate();
  const decklist: decklistdefinition[] = [];
  const [PlayerID, setPlayerID] = useState("");
  const [isLoading, setisLoading] = useState(true);
  const [Decks, setDecks] = useState(decklist);
  const [fetchflag, setfetchflag] = useState(true);
  function gotodeck(deckid: string) {
    if (deckid == "create") {
      fetch("/api/manage/decks/create/" + PlayerID).then(() => {
        setfetchflag(!fetchflag);
      });
    } else {
      nav("/decks/" + deckid);
    }
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

          fetch("/api/manage/decks/list/" + data.playerid)
            .then((response) => response.json())
            .then((data) => {
              if (data.playerid != data.playerid) {
                // error
                console.log("Data is wrong");
                console.dir(data);
                nav("/");
              }
              setDecks(data.decks);
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

  return (
    <div id="deckchooser">
      {Decks.map((deck: decklistdefinition) => {
        console.dir(deck);
        const player = CreateDefaultPlayer(PlayerID);
        player.name = deck.deckname;
        return CreateDeckVisual(player, deck, () => gotodeck(deck.deckid));
      })}
      {emptydeckvisual}
    </div>
  );
};

export default DeckChooser;
