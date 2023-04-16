import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../shared/CardmasterGame";
import { CMCBoard } from "./CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import { GetCardPrototype } from "../shared/CMCCard";
import CMCCardVisual from "./CMCComponents/Card";
import { CreateDefaultPlayer } from "../shared/Player";
import CmcCardDetailAbility from "./CMCComponents/Abilities";

const Test = () => {
  const cardids = [
    "empty",
    "debugslime",
    "debuggen",
    "debugpersona",
    "debugspell",
    "debugloc",
    "emptyloc",
    "farisin",
  ];
  const DummyPlayer = CreateDefaultPlayer("0");
  const small = (
    <div className="smallcards">
      {cardids.map((cardid) => {
        return (
          <CMCCardVisual
            card={GetCardPrototype(cardid)}
            canClick={false}
            doClick={undefined}
            activeCard={false}
            player={DummyPlayer}
            big={false}
            key={cardid}
          />
        );
      })}
    </div>
  );
  const big = (
    <div className="smallcards">
      {cardids.map((cardid) => {
        return (
          <CMCCardVisual
            card={GetCardPrototype(cardid)}
            canClick={false}
            doClick={undefined}
            activeCard={false}
            player={DummyPlayer}
            big={true}
            key={cardid}
          />
        );
      })}
    </div>
  );
  const detail = (
    <div className="smallcards">
      {cardids.map((cardid) => {
        return (
          <CMCCardVisual
            card={GetCardPrototype(cardid)}
            canClick={false}
            doClick={undefined}
            activeCard={false}
            player={DummyPlayer}
            clickability={true}
            big={true}
            detail={true}
            owner="0"
            key={cardid}
          />
        );
      })}
    </div>
  );

  return (
    <div>
      {small}
      {big}
      {detail}
    </div>
  );
};

export default Test;
