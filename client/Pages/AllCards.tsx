import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../../shared/CardmasterGame";
import { CMCBoard } from "../CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import { CMCCard, GetCardPrototype } from "../../shared/CMCCard";
import CMCCardVisual from "../CMCComponents/Card";
import { CreateDefaultPlayer } from "../../shared/Player";
import { prototypes } from "../../shared/data/cards.json";

const Test = () => {
  const DummyPlayer = CreateDefaultPlayer("0");
  const cards = prototypes;
  const big = (
    <div className="smallcards" style={{ display: "flex", flexWrap: "wrap" }}>
      {Object.entries(cards).map(([cardid, card]) => {
        return (
          <CMCCardVisual
            key={cardid}
            card={card as CMCCard}
            canClick={false}
            doClick={undefined}
            activeCard={false}
            player={DummyPlayer}
            big={true}
            detail={true}
          />
        );
      })}
    </div>
  );
  const medium = (
    <div className="smallcards" style={{ display: "flex", flexWrap: "wrap" }}>
      {Object.entries(cards).map(([cardid, card]) => {
        return (
          <CMCCardVisual
            key={cardid}
            card={card as CMCCard}
            canClick={false}
            doClick={undefined}
            activeCard={false}
            player={DummyPlayer}
            big={true}
            detail={false}
          />
        );
      })}
    </div>
  );
  const small = (
    <div className="smallcards" style={{ display: "flex", flexWrap: "wrap" }}>
      {Object.entries(cards).map(([cardid, card]) => {
        return (
          <CMCCardVisual
            key={cardid}
            card={card as CMCCard}
            canClick={false}
            doClick={undefined}
            activeCard={false}
            player={DummyPlayer}
            big={false}
            detail={false}
          />
        );
      })}
    </div>
  );

  return (
    <div style={{ display: "flex" }}>
      <div>{big}</div>
      <div>{medium}</div>
      <div>{small}</div>
    </div>
  );
};

export default Test;
