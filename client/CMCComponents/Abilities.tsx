import React, { CSSProperties } from "react";
import icons from "./Icons";
import { Ability, TriggerType } from "../../shared/Abilities";
import { CMCCard, CMCMonsterCard } from "../../shared/CMCCard";
import { CardType } from "../../shared/Constants";
import { OwnerOf } from "../../shared/LogicFunctions";
import { CMCPlayer } from "../../shared/Player";

function CmcCardDetailAbility({
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

  let innerCard = <div className="innerCard"></div>;

  let abilities = (
    <div className="abilitycontainer">
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
    innerCard = <div className="abilities">{abilities}</div>;
  }

  return <div className="abilityset">{innerCard}</div>;
}

export default CmcCardDetailAbility;
