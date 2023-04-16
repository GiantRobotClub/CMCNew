import React from "react";
import { CMCPlayer } from "../shared/Player";
import CMCCardVisual from "./CMCComponents/Card";
import { GetCardPrototype } from "../shared/CMCCard";
import { icons } from "./CMCComponents/Icons";

export interface decklistdefinition {
  deckid: string;
  ownerid: string;
  deckicon: string;
  persona: string;
  deckname: string;
}

export function CreateDeckVisual(
  player: CMCPlayer,
  deck: decklistdefinition,
  gotodeck: any
) {
  let deckvisual = (
    <div className="deckvisual" key={deck.deckid}>
      <div className="personacard">
        <CMCCardVisual
          card={GetCardPrototype(deck.persona)}
          big={true}
          canClick={true}
          doClick={() => {
            gotodeck;
          }}
          activeCard={false}
          player={player}
          showplayer={false}
        />
      </div>
      <div className="deckicon">{icons[deck.deckicon]}</div>
    </div>
  );
  return deckvisual;
}
