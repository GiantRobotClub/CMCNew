import React, { CSSProperties } from "react";
import { blank_object } from "svelte/internal";
import {
  CMCCard,
  CMCEntityCard,
  CMCMonsterCard,
  CMCPersonaCard,
  GetModifiedStatCard,
} from "../../shared/CMCCard";

import { Alignment, CardType } from "../../shared/Constants";
import { CMCPlayer } from "../../shared/Player";
import { icons } from "./Icons";
import { GiBroadsword, GiHealthNormal } from "react-icons/gi";
import CmcCardDetailAbility from "./Abilities";
import { CMCGameState } from "../../shared/CardmasterGame";
import { Ctx } from "boardgame.io";
function CMCCardVisual({
  card,
  canClick,
  doClick,
  activeCard = false,
  player,
  big = false,
  clickability = false,
  detail = false,
  lookingplayer,
  owner,
  showplayer = true,
  hover = undefined,
  G = undefined,
  ctx = undefined,
}: {
  card: CMCCard;
  canClick: boolean;
  doClick: any;
  activeCard: boolean;
  player: CMCPlayer;
  big: boolean;
  clickability?: boolean;
  detail?: boolean;
  lookingplayer?: string;
  owner?: string;
  showplayer?: boolean;
  hover?: any;
  G?: CMCGameState;
  ctx?: Ctx;
}) {
  const isDetail: boolean = detail ?? false;
  const showabilitybutton: boolean = clickability ?? false;
  const noshow: CSSProperties = {
    display: "none",
  };
  const cardalignment = card.alignment;

  let alignstyle = "color-none";
  switch (card.alignment) {
    case Alignment.ANODYNE:
      alignstyle = "color-anodyne";
      break;
    case Alignment.PROFANE:
      alignstyle = "color-profane";
      break;
    case Alignment.VENERATED:
      alignstyle = "color-venerated";
      break;
    case Alignment.VAP:
      alignstyle = "color-venerated-anodyne-profane";
      break;
    case Alignment.VA:
      alignstyle = "color-venerated-anodyne";
      break;
    case Alignment.AP:
      alignstyle = "color-anodyne-profane";
      break;
    case Alignment.PV:
      alignstyle = "color-profane-venerated";
      break;
  }
  function hoverOnCard(card: CMCCard | undefined) {
    if (hover !== undefined) hover(card);
  }
  const cardObject: CMCCard = GetModifiedStatCard(card, G, ctx);
  let costLine = <div style={noshow}></div>;
  let attackLine = <div style={noshow}></div>;
  let sacLine = <div style={noshow}></div>;
  let playerLine = <div style={noshow}></div>;
  let playerData = <div style={noshow}></div>;
  let cardtypestyle = "type-empty";

  let summontext = "";
  let genericsubtype = "";
  switch (card.type) {
    case CardType.EFFECT:
      cardtypestyle = "type-effect";
      summontext = "Construct";
      genericsubtype = "effect";
      break;
    case CardType.MONSTER:
      cardtypestyle = "type-monster";
      summontext = "Summon";
      genericsubtype = "monster";
      break;
    case CardType.SPELL:
      cardtypestyle = "type-spell";
      summontext = "Cast";
      genericsubtype = "spell";
      break;
    case CardType.PERSONA:
      cardtypestyle = "type-persona";
      summontext = "Embody";
      genericsubtype = "Persona";
      break;
    case CardType.LOCATION:
      cardtypestyle = "type-location";
      summontext = "Move to";
      genericsubtype = "location";
      break;
    case CardType.DUMMY:
      cardtypestyle = "type-dummy";
      break;
  }
  if (card.type == CardType.EMPTY) {
    return (
      <button
        key={cardObject.guid}
        onClick={doClick}
        disabled={!canClick}
        className={
          "cardStyle " +
          (canClick ? " cardStyleClickable" : "") +
          " cardStyleEmpty" +
          (big ? " bigCardStyle" : " littlecard") +
          (isDetail ? " detailCard " : "")
        }
      >
        <div></div>
      </button>
    );
  }
  if (card.type != CardType.PERSONA) {
    costLine = (
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
    );
  }
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
    const monsterCard = cardObject as CMCMonsterCard;
    attackLine = (
      <div className="attackline">
        <div className="attack">
          {icons.sword}
          {Number(monsterCard.attack) + (monsterCard.temporaryAttack ?? 0)}
        </div>
        <div className="life">
          {icons.life}
          <span className="curlife">
            {Number(monsterCard.life) + (monsterCard.temporaryLife ?? 0)}
          </span>
        </div>
      </div>
    );
  }
  if (card.type == CardType.PERSONA) {
    playerLine = (
      <div className="playerline">
        <div className="playername">{player.name}</div>
      </div>
    );
    if (detail) {
      const personacard = cardObject as CMCPersonaCard;
      playerData = (
        <div className="playerdata">
          <div className="resourcebox">
            <div className="resourceheader">start:</div>
            <div className="playerresources">
              {Object.keys(personacard.startingResource).map((type) => {
                return Object.keys(personacard.startingResource[type]).map(
                  (key) => {
                    if (
                      !personacard.startingResource[type].hasOwnProperty(key) ||
                      (personacard.startingResource[type][key] <= 0 &&
                        type != "mana")
                    )
                      return (
                        <span
                          className="empty"
                          key={type + key + cardObject.guid}
                        ></span>
                      );
                    const costkey = "res" + key;
                    const costamount = personacard.startingResource[type][key];
                    return (
                      <div className={costkey} key={costkey + cardObject.guid}>
                        {icons[key]}
                        {costamount}
                      </div>
                    );
                  }
                );
              })}
              <div className="player-hand-count">
                {icons.hand}
                {personacard.startingHand}/{personacard.maxHand}
              </div>
            </div>
          </div>
          <div className="spacer"></div>
          <div className="resourcebox">
            <div className="resourceheader">turn:</div>
            <div className="playerresources">
              {Object.keys(personacard.resourcePerTurn).map((type) => {
                return Object.keys(personacard.startingResource[type]).map(
                  (key) => {
                    if (
                      !personacard.resourcePerTurn[type].hasOwnProperty(key) ||
                      (personacard.resourcePerTurn[type][key] <= 0 &&
                        type != "mana")
                    )
                      return (
                        <span
                          className="empty"
                          key={type + key + cardObject.guid}
                        ></span>
                      );
                    const costkey = "res" + key;
                    const costamount = personacard.resourcePerTurn[type][key];
                    return (
                      <div className={costkey} key={costkey + cardObject.guid}>
                        {icons[key]}
                        {costamount}
                      </div>
                    );
                  }
                );
              })}
              <div className="player-hand-count">
                {icons.hand}
                {personacard.drawPerTurn}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      playerData = (
        <div className="playerdata">
          <div className="playerresources">
            {Object.keys(player.resources).map((type) => {
              return Object.keys(player.resources[type]).map((key) => {
                if (
                  !player.resources[type].hasOwnProperty(key) ||
                  (player.resources[type][key] <= 0 && type != "mana")
                )
                  return (
                    <span
                      className="empty"
                      key={type + key + cardObject.guid}
                    ></span>
                  );
                const costkey = "res" + key;
                const costamount = player.resources[type][key];
                return (
                  <div className={costkey} key={costkey + cardObject.guid}>
                    {icons[key]}
                    {costamount}
                  </div>
                );
              });
            })}
          </div>
          <div className="playerdeck">
            <div className="player-hand-count">
              {icons.hand}
              {player.currentHand}/{player.persona.maxHand}
            </div>{" "}
            <div className="player-deck-count"> {icons.card}</div>
            {player.currentDeck}
            <div className="player-graveyard-count">
              {icons.graveyard} {player.currentGrave}
            </div>
          </div>
        </div>
      );
    }
  }
  const dizzyhtml = (
    <div
      className={
        "dizzy" +
        ((card.type == CardType.EFFECT || card.type == CardType.MONSTER) &&
        (card as CMCEntityCard).dizzy
          ? " dizzyvis"
          : " dizzyunvis")
      }
    >
      {icons["dizzytop"]}
    </div>
  );
  let middle = (
    <div className="card">
      <div className="manaline">
        {costLine}
        {sacLine}
      </div>
      {playerLine}
      <div className="nameline">
        <div className="cardname">{cardObject.name}</div>
      </div>
      <div className="cardpic">
        <img src={"/assets/cards/" + cardObject.picture} />
      </div>
      {isDetail ? (
        <div className="cardsubtype">
          <label>{summontext}</label>
          <div className="subtype">{card.subtype || genericsubtype}</div>
        </div>
      ) : (
        ""
      )}
      <div className="cardbox">
        <div className="cardtext">{card.cardtext}</div>
      </div>
      {isDetail ? (
        <div className="abilities">
          <CmcCardDetailAbility
            key="detailcard"
            card={card}
            playerId={lookingplayer ?? ""}
            clickability={showabilitybutton}
            ownerId={owner ?? ""}
            doClick={doClick}
          />
        </div>
      ) : (
        ""
      )}
      <div className="bottomline">{attackLine}</div>
      {showplayer ? playerData : <></>}
    </div>
  );
  if (detail) {
    return (
      <div
        key={cardObject.guid}
        onClick={doClick}
        className={
          "cardStyle " +
          alignstyle +
          " cardStyleActive" +
          (canClick ? " cardStyleClickable" : "") +
          (activeCard ? " cardStyleClicked" : "") +
          (big ? " bigCardStyle" : " littlecard") +
          " " +
          (isDetail ? " detailCard " : "") +
          cardtypestyle
        }
      >
        {middle}
        {dizzyhtml}
      </div>
    );
  } else
    return (
      <button
        key={cardObject.guid}
        onClick={doClick}
        disabled={!canClick}
        onMouseOver={() => hoverOnCard(cardObject)}
        onMouseOut={() => hoverOnCard(undefined)}
        className={
          "cardStyle " +
          alignstyle +
          " cardStyleActive" +
          (canClick ? " cardStyleClickable" : "") +
          (activeCard ? " cardStyleClicked" : "") +
          (big ? " bigCardStyle" : " littlecard") +
          " " +
          (isDetail ? " detailCard " : "") +
          cardtypestyle
        }
      >
        {middle}
        {dizzyhtml}
      </button>
    );
}

export default CMCCardVisual;
