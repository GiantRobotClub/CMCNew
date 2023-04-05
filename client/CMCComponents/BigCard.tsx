import React, { CSSProperties } from "react";
import icons from "./Icons";
import { Ability, TriggerType } from "../../shared/Abilities";
import { CMCCard, CMCMonsterCard } from "../../shared/CMCCard";
import { CardType } from "../../shared/Constants";
import { OwnerOf } from "../../shared/LogicFunctions";
import { CMCPlayer } from "../../shared/Player";

function CmcCardDetails({
  card,
  doClick,
  playerId,
  ownerId,
  clickability,
}: {
  card: CMCCard;
  doClick: any;
  playerId: string;
  ownerId: string;
  clickability: boolean;
}) {
  const noshow: CSSProperties = {
    display: "none",
  };

  function handleAbilityClick(ability: Ability) {
    console.log("Handling abiulity click");
    doClick(ability);
  }

  const cardObject: CMCCard = card;
  let costLine = <div style={noshow}></div>;
  let attackLine = <div style={noshow}></div>;
  let sacLine = <div style={noshow}></div>;

  let innerCard = <div></div>;

  costLine = (
    <div className="manaline">
      <div className="costline">
        {Object.keys(cardObject.cost).map((type) => {
          return Object.keys(cardObject.cost[type]).map((key) => {
            if (!cardObject.cost[type][key])
              return (
                <span
                  className="empty"
                  key={type + key + cardObject.guid}
                ></span>
              );
            const costkey = "cost" + key;
            const costamount = cardObject.cost[type][key];
            return (
              <span className={costkey} key={costkey + cardObject.guid}>
                {icons[key]}
                {costamount}
              </span>
            );
          });
        })}
      </div>
    </div>
  );
  if (card.type == CardType.MONSTER || card.type == CardType.EFFECT) {
    sacLine = (
      <div className="sacline">
        {Object.keys(cardObject.sac).map((type) => {
          return Object.keys(cardObject.sac[type]).map((key) => {
            if (!cardObject.sac[type][key])
              return (
                <span
                  className="empty"
                  key={type + key + cardObject.guid}
                ></span>
              );
            const costkey = "cost" + key;
            const costamount = cardObject.sac[type][key];
            return (
              <span className={costkey} key={costkey + cardObject.guid}>
                {icons[key]}
                {costamount}
              </span>
            );
          });
        })}
      </div>
    );
  }

  if (card.type == CardType.MONSTER) {
    attackLine = (
      <div className="attackline">
        <div id="attack">{(cardObject as CMCMonsterCard).attack}</div>
        <div id="life">{(cardObject as CMCMonsterCard).life}</div>
      </div>
    );
  }

  let abilities = (
    <div>
      {cardObject.abilities.map((ability, index) => {
        const showbutton =
          clickability &&
          (ability.triggerType == TriggerType.ACTIVATED ||
            ability.triggerType == TriggerType.ACTIVATED_TARGETED);
        return (
          <div
            className="ability"
            key={cardObject.guid + ability.abilityName + index}
          >
            <div className="abilityName">{ability.abilityName}</div>

            <div
              className={"abilityText" + showbutton ? " abilityHasButton" : ""}
            >
              {showbutton ? ability.abilityCostText + ":" : ""}

              {ability.abilityText}
            </div>
            {ownerId == playerId && showbutton ? (
              <button
                onClick={() => handleAbilityClick(ability)}
                id={index.toString()}
                className="activateAbility"
              >
                Do!
              </button>
            ) : (
              ""
            )}
          </div>
        );
      })}
    </div>
  );

  if (card.type != CardType.EMPTY) {
    innerCard = (
      <div>
        {costLine}
        {sacLine}
        <div className="nameline">{cardObject.name}</div>
        <div className="cardpic">
          <img src={cardObject.picture} />
        </div>
        <div className="textbox">{cardObject.cardtext}</div>

        {abilities}

        {attackLine}
      </div>
    );
  }

  const carddetail = (
    <div className={card.type != CardType.EMPTY ? "frontDetail" : "backDetail"}>
      {innerCard}
    </div>
  );

  return <div className="detailCard">{carddetail}</div>;
}

export default CmcCardDetails;
