import React, { CSSProperties } from "react";
import { blank_object } from "svelte/internal";
import { CMCCard } from "../../shared/CMCCard";

import { CardType } from "../../shared/Constants";
import icons from "./Icons";

function CMCCardVisual({ card }) {
  const cardStyle: CSSProperties = {
    width: "100px",
    height: "100px",
  };
  const cardStyleActive: CSSProperties = {
    border: "1px solid black",
    background: "white",
    color: "black",
    ...cardStyle,
  };
  const cardStyleEmpty: CSSProperties = {
    border: "1px solid white",
    background: "grey",
    ...cardStyle,
  };
  const cardObject: CMCCard = card;
  if (card.type == CardType.EMPTY) {
    return <div style={cardStyleEmpty}></div>;
  }
  return (
    <div style={cardStyleActive}>
      <div className="manaline">
        <div className="costline">
          {Object.keys(cardObject.cost).map((type) => {
            return Object.keys(cardObject.cost[type]).map((key) => {
              if (!cardObject.cost[type][key])
                return <span className="empty"></span>;
              const costkey = "cost" + key;
              const costamount = cardObject.cost[type][key];
              console.log(icons[key]);
              return (
                <span className={costkey} key={costkey}>
                  {icons[key]}
                  {costamount}
                </span>
              );
            });
          })}
        </div>

        <div className="sacline">
          {Object.keys(cardObject.sac).map((type) => {
            return Object.keys(cardObject.sac[type]).map((key) => {
              if (!cardObject.sac[type][key])
                return <span className="empty"></span>;
              const costkey = "cost" + key;
              const costamount = cardObject.sac[type][key];
              console.log(icons[key]);
              return (
                <span className={costkey} key={costkey}>
                  {icons[key]}
                  {costamount}
                </span>
              );
            });
          })}
        </div>
      </div>
      {cardObject.name}
    </div>
  );
}

export default CMCCardVisual;
