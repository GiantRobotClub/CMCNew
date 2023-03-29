import React, { CSSProperties } from "react";
import CMCCardVisual from "./Card";
import { CMCGameState } from "../../shared/CardmasterGame";
import type { BoardProps } from "boardgame.io/react";
import { claim_text } from "svelte/internal";
interface CMCProps extends BoardProps<CMCGameState> {
  // Additional custom properties for your component
}

export function CMCBoard(props: CMCProps) {
  const state: CMCGameState = props.G;

  const endTurn = () => props.moves.passTurn();
  const endStage = () => props.moves.passStage();

  const flexStyle: CSSProperties = {
    display: "flex",
  };
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
      <div style={{ display: "flex", height: "410px", width: "600px" }}>
        <div style={{ height: "100%", background: "green", width: "100px" }}>
          player info
          <div style={{ height: "50%", width: "100px" }}>
            {JSON.stringify(props.G.player[0])}
          </div>
          <div style={{ height: "50%" }}>
            {JSON.stringify(props.G.player[1])}
          </div>
        </div>
        <div style={{ height: "100px" }}>
          <div style={flexStyle}>
            {state.slots[0].monsters.map((card, index) => (
              <CMCCardVisual card={card} key={"0m" + index} />
            ))}
          </div>
          <div style={flexStyle}>
            {state.slots[0].effects.map((card, index) => (
              <CMCCardVisual card={card} key={"0e" + index} />
            ))}
          </div>
          <div style={flexStyle}>
            {state.slots[1].effects.map((card, index) => (
              <CMCCardVisual card={card} key={"1e" + index} />
            ))}
          </div>
          <div style={flexStyle}>
            {state.slots[1].monsters.map((card, index) => (
              <CMCCardVisual card={card} key={"1m" + index} />
            ))}
          </div>
        </div>
      </div>
      <div>
        <button onClick={() => endTurn()}>END</button>
        <button onClick={() => endStage()}>NEXT</button>
      </div>
      <div className="handcontainer">
        <div className="hand" style={flexStyle}>
          {state.players[props.ctx.currentPlayer].hand.map((card, index) => (
            <CMCCardVisual
              card={card}
              key={props.ctx.currentPlayer + "h" + index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
