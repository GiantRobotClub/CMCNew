import { Client } from "boardgame.io/react";
import React from "react";
import { CardmasterConflict } from "../shared/CardmasterGame";
import { CMCBoard } from "./CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import { CMCCard, GetCardPrototype } from "../shared/CMCCard";
import CMCCardVisual from "./CMCComponents/Card";
import { CreateDefaultPlayer } from "../shared/Player";
import { prototypes } from "../shared/data/cards.json";

const Test = () => {
  const DummyPlayer = CreateDefaultPlayer("0");
  const cards = prototypes;
  const big = (
    <div className="smallcards">
      {Object.entries(cards).map(([cardid, card]) => {
        return (
          <CMCCardVisual
            card={card as CMCCard}
            canClick={false}
            doClick={undefined}
            activeCard={false}
            player={DummyPlayer}
            big={true}
          />
        );
      })}
    </div>
  );

  return <div>{big}</div>;
};

export default Test;
