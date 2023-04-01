import React, { CSSProperties } from "react";
import { blank_object } from "svelte/internal";
import { CMCCard, CMCMonsterCard } from "../../shared/CMCCard";

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
  let attackLine = <div></div>;
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
  } else if (card.type == CardType.MONSTER) {
    attackLine = (
      <div>
        <div id="attack">{(cardObject as CMCMonsterCard).attack}</div>
        <div id="life">{(cardObject as CMCMonsterCard).life}</div>
      </div>
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
        <div className="nameline">{cardObject.name}</div>
        <div className="cardpic">
          <img src={cardObject.picture} />
        </div>
        <div className="attackline">{attackLine}</div>
      </div>
    </button>
  );
}

export default CMCCardVisual;
