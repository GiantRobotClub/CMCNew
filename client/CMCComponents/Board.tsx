import React, { CSSProperties } from "react";
import CMCCardVisual from "./Card";
import { CMCGameState } from "../../shared/CardmasterGame";
import type { BoardProps } from "boardgame.io/react";
import { CanClickCard } from "../../shared/LogicFunctions";
import { CardType, ClickType } from "../../shared/Constants";
import { CMCCard } from "../../shared/CMCCard";
interface CMCProps extends BoardProps<CMCGameState> {
  // Additional custom properties for your component
}

export function CMCBoard(props: CMCProps) {
  const state: CMCGameState = props.G;

  const endTurn = () => props.moves.passTurn();
  const endStage = () => props.moves.passStage();
  const cancel = () => props.moves.cancel();
  const clickCard = (card: CMCCard) => {
    if (card.type == CardType.EMPTY) {
      props.moves.chooseSlot(card, you);
    } else if (
      card.type == CardType.MONSTER ||
      card.type == CardType.EFFECT ||
      card.type == CardType.PERSONA
    ) {
      props.moves.pickEntity(card, you);
    }
  };
  const clickCardFromHand = (card: CMCCard) => {
    props.moves.playCardFromHand(card, you);
  };

  const flexStyle: CSSProperties = {
    display: "flex",
  };
  let currentPlayer = props.ctx.currentPlayer;
  let you = currentPlayer;
  if (props.isMultiplayer && props.playerID != null) {
    you = props.playerID;
  }
  let activePlayer = currentPlayer;

  you = activePlayer;

  let otherPlayer = you == "0" ? "1" : "0";

  if (props.ctx.activePlayers) {
    if ("0" in props.ctx.activePlayers) {
      activePlayer = "0";
    } else {
      activePlayer = "1";
    }
  }

  return (
    <div>
      <div className="debug">
        stage:{" "}
        {props.ctx.activePlayers
          ? props.ctx.activePlayers[props.ctx.currentPlayer]
          : ""}
        <br />
        player: {props.ctx.currentPlayer}
        <br />
      </div>
      <div className="cmcBoard">
        <div className="playerBox">
          <div className="playerCardBox">
            <CMCCardVisual
              big={true}
              activeCard={false}
              player={props.G.playerData[otherPlayer]}
              card={props.G.playerData[otherPlayer].persona}
              doClick={() => clickCard(props.G.playerData[otherPlayer].persona)}
              canClick={CanClickCard(
                props.G.playerData[otherPlayer].persona,
                you,
                ClickType.PERSONA,
                props.ctx,
                props.G
              )}
              key={"player" + otherPlayer}
            />
          </div>
          <div className="playerCardBox">
            <CMCCardVisual
              big={true}
              activeCard={false}
              player={props.G.playerData[you]}
              card={props.G.playerData[you].persona}
              doClick={() => clickCard(props.G.playerData[you].persona)}
              canClick={CanClickCard(
                props.G.playerData[you].persona,
                you,
                ClickType.PERSONA,
                props.ctx,
                props.G
              )}
              key={"player" + you}
            />
          </div>
        </div>
        <div className="cardRow">
          <div style={flexStyle}>
            {state.slots[otherPlayer].monsters.map(
              (card: CMCCard, index: number) => (
                <CMCCardVisual
                  big={false}
                  activeCard={false}
                  player={props.G.playerData[otherPlayer]}
                  card={card}
                  doClick={() => clickCard(card)}
                  canClick={CanClickCard(
                    card,
                    you,
                    ClickType.MONSTER,
                    props.ctx,
                    props.G
                  )}
                  key={"0m" + index}
                />
              )
            )}
          </div>
          <div style={flexStyle}>
            {state.slots[otherPlayer].effects.map(
              (card: CMCCard, index: number) => (
                <CMCCardVisual
                  big={false}
                  activeCard={false}
                  player={props.G.playerData[otherPlayer]}
                  card={card}
                  doClick={() => clickCard(card)}
                  key={"0e" + index}
                  canClick={CanClickCard(
                    card,
                    you,
                    ClickType.EFFECT,
                    props.ctx,
                    props.G
                  )}
                />
              )
            )}
          </div>
          <div style={flexStyle}>
            {state.slots[you].effects.map((card: CMCCard, index: number) => (
              <CMCCardVisual
                big={false}
                activeCard={false}
                player={props.G.playerData[you]}
                card={card}
                doClick={() => clickCard(card)}
                key={"1e" + index}
                canClick={CanClickCard(
                  card,
                  you,
                  ClickType.EFFECT,
                  props.ctx,
                  props.G
                )}
              />
            ))}
          </div>
          <div style={flexStyle}>
            {state.slots[you].monsters.map((card: CMCCard, index: number) => (
              <CMCCardVisual
                big={false}
                activeCard={false}
                player={props.G.playerData[you]}
                card={card}
                doClick={() => clickCard(card)}
                key={"1m" + index}
                canClick={CanClickCard(
                  card,
                  you,
                  ClickType.MONSTER,
                  props.ctx,
                  props.G
                )}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        {!props.isMultiplayer || activePlayer == you ? (
          <div>
            <button onClick={() => endTurn()}>END</button>
            <button onClick={() => endStage()}>NEXT</button>
            <button onClick={() => cancel()}>CANCEL</button>
          </div>
        ) : (
          ""
        )}
      </div>
      <div className="handcontainer">
        <div className="hand" style={flexStyle}>
          {state.players[props.ctx.currentPlayer].hand.map(
            (card: CMCCard, index: number) => (
              <CMCCardVisual
                big={false}
                player={props.G.playerData[you]}
                card={card}
                activeCard={
                  props.G.activeCard ? props.G.activeCard == card : false
                }
                key={props.ctx.currentPlayer + "h" + index + "test"}
                doClick={() => clickCardFromHand(card)}
                canClick={CanClickCard(
                  card,
                  you,
                  ClickType.HAND,
                  props.ctx,
                  props.G
                )}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
