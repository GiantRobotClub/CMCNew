import React from "react";
import SessionHandler from "../CMCComponents/SessionHandler";
import { useParams } from "react-router-dom";
import DeckEditor from "./DeckEditor";
import DeckChooser from "./DeckChooser";
<SessionHandler />;
const DeckManager = () => {
  const { deckid } = useParams();
  console.log(deckid);
  let content = <></>;
  // are we already looking at a deck
  if (deckid) {
    content = <DeckEditor deckid={deckid} />;
  }
  //otherwise
  else {
    content = <DeckChooser />;
  }

  return <div id="deckManager">{content}</div>;
};

export default DeckManager;
