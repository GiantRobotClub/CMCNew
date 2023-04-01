import React, { CSSProperties } from "react";
import { blank_object } from "svelte/internal";
import { CMCCard } from "../../shared/CMCCard";

import { CardType } from "../../shared/Constants";
import icons from "./Icons";

function CMCCardVisual({ card, canClick, doClick, activeCard = false }) {
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

  const cardStyleClickable: CSSProperties = {
    boxShadow: "inset 0 0 5pt 5pt green",
  };

  const cardStyleClicked: CSSProperties = {
    boxShadow: "inset 0 0 5pt 5pt red",
  };
  const cardObject: CMCCard = card;
  if (card.type == CardType.EMPTY) {
    return (
      <button
        onClick={doClick}
        disabled={!canClick}
        style={Object.assign(
          canClick ? cardStyleClickable : cardStyle,
          cardStyleEmpty
        )}
      >
        <div></div>
      </button>
    );
  }
  return (
    <button
      onClick={doClick}
      disabled={!canClick}
      style={Object.assign(
        activeCard
          ? cardStyleClicked
          : canClick
          ? cardStyleClickable
          : cardStyle,
        cardStyleActive
      )}
    >
      <div>
        <div className="manaline">
          <div className="costline">
            {Object.keys(cardObject.cost).map((type) => {
              return Object.keys(cardObject.cost[type]).map((key) => {
                if (!cardObject.cost[type][key])
                  return <span className="empty"></span>;
                const costkey = "cost" + key;
                const costamount = cardObject.cost[type][key];
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
        act: {activeCard ? "yes" : "no"}
      </div>
    </button>
  );
}

export default CMCCardVisual;
