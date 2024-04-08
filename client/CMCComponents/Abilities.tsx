import React, { CSSProperties, ReactNodeArray } from "react";
import { icons, scanForIcons } from "./Icons";
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
        if (ability.hide) {
          return "";
        }
        const showbutton =
          clickability &&
          (ability.triggerType == TriggerType.ACTIVATED ||
            ability.triggerType == TriggerType.ACTIVATED_TARGETED);

        let costitems: string | ReactNodeArray = "";
        let textitems: string | ReactNodeArray = "";
        if (ability.abilityCostText) {
          costitems = scanForIcons(
            ability.abilityCostText,
            ability,
            cardObject
          );
          console.dir(ability.abilityCostText, costitems);
        }
        if (ability.abilityText) {
          textitems = scanForIcons(ability.abilityText, ability, cardObject);
        }
        let speedbox = <></>;
        if (ability.speed !== undefined) {
          speedbox = (
            <div className={"speedbox speed" + ability.speed}>
              {icons["speed" + ability.speed]}
            </div>
          );
        }
        return (
          <div
            className="ability"
            key={cardObject.guid + ability.abilityName + index}
          >
            {speedbox}
            <div className="abilityDesc">
              <div className="abilityName">{ability.abilityName}</div>

              <div
                className={
                  "abilityText " + (showbutton ? " abilityHasButton" : "")
                }
              >
                {
                  <span className="abilityCostText">
                    {ability.abilityCostText && costitems
                      ? Array.isArray(costitems)
                        ? costitems.map((item, index) => {
                            return <span key={index}>{item}</span>;
                          })
                        : costitems
                      : ""}
                    {ability.abilityCostText ? ":" : ""}
                  </span>
                }
                <span className="abilityActiveText">
                  {ability.abilityText && textitems
                    ? Array.isArray(textitems)
                      ? textitems.map((item) => {
                          return <span key={item}>{item}</span>;
                        })
                      : textitems
                    : ""}
                </span>
              </div>
            </div>
            {ownerId == playerId && showbutton ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  console.dir("ability clicked: ", ability);
                  handleAbilityClick(ability);
                }}
                key={index.toString()}
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
