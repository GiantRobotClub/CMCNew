import React, { CSSProperties } from "react";
import { blank_object } from "svelte/internal";
import { CMCCard } from "../../shared/CMCCard";

import { GiEvilMoon, GiHolyGrail } from "react-icons/gi";
import { FaBalanceScale } from "react-icons/fa";
import { CardType } from "../../shared/Constants";

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
          <>
            <span className="mana_venerated">
              <>
                <GiHolyGrail />

                {cardObject.cost.mana.V}
              </>
            </span>

            <span className="mana_anodyne">
              <>
                <FaBalanceScale />
                {cardObject.cost.mana.A}
              </>
            </span>

            <span className="mana_profane">
              <>
                <GiEvilMoon />
                {cardObject.cost.mana.P}
              </>
            </span>
          </>
        </div>

        <div className="sacline">
          <>
            <span className="mana_venerated">
              <>
                <GiHolyGrail />

                {cardObject.sac.mana.V}
              </>
            </span>

            <span className="mana_anodyne">
              <>
                <FaBalanceScale />
                {cardObject.sac.mana.A}
              </>
            </span>

            <span className="mana_profane">
              <>
                <GiEvilMoon />
                {cardObject.sac.mana.P}
              </>
            </span>
          </>
        </div>
      </div>
      {cardObject.name}
    </div>
  );
}

export default CMCCardVisual;
