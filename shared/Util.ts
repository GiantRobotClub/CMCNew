import { Ctx } from "boardgame.io";
import { Stages } from "./Constants";

export function OtherPlayer(player: string) {
  return player === "1" ? "0" : "1";
}

export function GetActivePlayer(ctx: Ctx): string {
  if (ctx.activePlayers) {
    const players = ["0", "1"];
    for (const player of players) {
      if (player in ctx.activePlayers) {
        return player;
      }
    }
  }
  return "";
}

export function GetActiveStage(ctx: Ctx): Stages {
  const stage = ctx.activePlayers
    ? ctx.activePlayers[GetActivePlayer(ctx)]
    : Stages.error;

  return Stages[stage];
}

export default { GetActiveStage, GetActivePlayer, OtherPlayer };
