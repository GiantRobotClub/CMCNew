import React, { CSSProperties } from "react";
import { blank_object } from "svelte/internal";
import { CMCCard, CMCMonsterCard } from "../../shared/CMCCard";

import { CardType } from "../../shared/Constants";
import { CMCPlayer } from "../../shared/Player";
import icons from "./Icons";

function CMCCardVisual({
  card,
  canClick,
  doClick,
  activeCard = false,
  player,
  big = false,
}: {
  card: CMCCard;
  canClick: boolean;
  doClick: any;
  activeCard: boolean;
  player: CMCPlayer;
  big: boolean;
}) {
  const cardStyle: CSSProperties = {
    width: "100px",
    height: "100px",
  };
  const bigCardStyle: CSSProperties = {
    height: "150px",
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

  const noshow: CSSProperties = {
    display: "none",
  };

  const cardObject: CMCCard = card;
  let costLine = <div style={noshow}></div>;
  let attackLine = <div style={noshow}></div>;
  let sacLine = <div style={noshow}></div>;
  let playerLine = <div style={noshow}></div>;
  let playerData = <div style={noshow}></div>;
  if (card.type == CardType.EMPTY) {
    return (
      <button
        onClick={doClick}
        disabled={!canClick}
        className={
          "cardStyle " +
          (canClick ? " cardStyleClickable" : "") +
          " cardStyleEmpty" +
          (big ? " bigCardStyle" : "")
        }
      >
        <div></div>
      </button>
    );
  }
  if (card.type != CardType.PERSONA) {
    costLine = (
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
      </div>
    );
  }
  if (card.type == CardType.MONSTER || card.type == CardType.EFFECT) {
    sacLine = (
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
  if (card.type == CardType.PERSONA) {
    playerLine = <div className="playerline">{player.name}</div>;
    playerData = (
      <div className="playerdata">
        <div className="playerresources">
          {Object.keys(player.resources).map((type) => {
            return Object.keys(player.resources[type]).map((key) => {
              if (
                !player.resources[type].hasOwnProperty(key) ||
                (player.resources[type][key] <= 0 && type != "mana")
              )
                return <span className="empty"></span>;
              const costkey = "res" + key;
              const costamount = player.resources[type][key];
              return (
                <div className={costkey} key={costkey}>
                  {icons[key]}
                  {costamount}
                </div>
              );
            });
          })}
        </div>
        <div className="playerdeck">
          {icons.hand}
          {player.currentHand} {icons.card}
          {player.currentDeck}
          {icons.graveyard} {player.currentGrave}
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={doClick}
      disabled={!canClick}
      className={
        "cardStyle " +
        " cardStyleActive" +
        (canClick ? " cardStyleClickable" : "") +
        (activeCard ? " cardStyleClicked" : "") +
        (big ? " bigCardStyle" : "")
      }
    >
      <div>
        {costLine}
        {sacLine}
        {playerLine}
        <div className="nameline">{cardObject.name}</div>
        <div className="cardpic">
          <img src={cardObject.picture} />
        </div>
        {attackLine}
        {playerData}
      </div>
    </button>
  );
}

export default CMCCardVisual;
