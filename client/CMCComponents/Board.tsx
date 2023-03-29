import React, { CSSProperties } from "react";
import CMCCardVisual from "./Card";
import { CMCGameState } from "../../shared/CardmasterGame";
import type { BoardProps } from "boardgame.io/react";
interface CMCProps extends BoardProps<CMCGameState> {
  // Additional custom properties for your component
}

export function CMCBoard(props: CMCProps) {
  const state: CMCGameState = props.G;

  const flexStyle: CSSProperties = {
    display: "flex",
  };
  return (
    <div>
      <div style={flexStyle}>
        {state.slots[0].monsters.map((card) => (
          <CMCCardVisual card={card} />
        ))}
      </div>
      <div style={flexStyle}>
        {state.slots[0].effects.map((card) => (
          <CMCCardVisual card={card} />
        ))}
      </div>
      <div style={flexStyle}>
        {state.slots[1].effects.map((card) => (
          <CMCCardVisual card={card} />
        ))}
      </div>
      <div style={flexStyle}>
        {state.slots[1].monsters.map((card) => (
          <CMCCardVisual card={card} />
        ))}
      </div>
    </div>
  );
}
