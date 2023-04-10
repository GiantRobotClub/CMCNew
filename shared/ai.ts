import { Ctx } from "boardgame.io";
import { CMCCard } from "./CMCCard";
import { Stages, ClickType, CardType } from "./Constants";
import { CanClickCard } from "./LogicFunctions";
import { GetActiveStage, GetActivePlayer } from "./Util";

const ai = {
  enumerate: (G, ctx) => {
    let moves: any[] = [];

    if (GetActiveStage(ctx) != Stages.resolve) {
      if (!G.activeAbility && !G.activeCard) {
        moves.push({ move: "passStage" });
      }
    } else {
      moves.push({ move: "passTurn" });
    }

    if (G.lastAbilityStack.length < G.abilityStack.length) {
      moves.push({ move: "cancel", args: [GetActivePlayer(ctx)] });
    }
    if (GetActiveStage(ctx) == Stages.play) {
      let hand: CMCCard[] = G.players[GetActivePlayer(ctx)].hand;
      if (!G.activeCard) {
        hand.forEach((crd, idx) => {
          if (CanClickCard(crd, GetActivePlayer(ctx), ClickType.HAND, ctx, G)) {
            moves.push({
              move: "playCardFromHand",
              args: [
                G.players[GetActivePlayer(ctx)].hand[idx],
                GetActivePlayer(ctx),
              ],
            });
          }
        });
      }
    } else if (
      [
        Stages.pickAbilityTarget,
        Stages.pickCombatDefense,
        Stages.pickCombatTarget,
        Stages.pickSlot,
      ].includes(GetActiveStage(ctx))
    ) {
      moves.push({ move: "cancel", args: [GetActivePlayer(ctx)] });
    }
    for (const slotplayer in G.slots) {
      if (
        CanClickCard(
          G.playerData[slotplayer].persona,
          GetActivePlayer(ctx),
          ClickType.PERSONA,
          ctx,
          G
        )
      ) {
        moves.push({
          move: "pickEntity",
          args: [G.playerData[slotplayer].persona, GetActivePlayer(ctx)],
        });
      }
      for (const subplayer in G.slots[slotplayer]) {
        for (const [index, card] of G.slots[slotplayer][subplayer].entries()) {
          if (
            CanClickCard(
              card,
              GetActivePlayer(ctx),
              subplayer == "effects" ? ClickType.EFFECT : ClickType.MONSTER,
              ctx,
              G
            )
          ) {
            moves.push({
              move: card.type == CardType.EMPTY ? "chooseSlot" : "pickEntity",
              args: [
                G.slots[slotplayer][subplayer][index],
                GetActivePlayer(ctx),
              ],
            });
          }
        }
      }
    }

    if (moves.length == 0) {
      moves.push({ move: "passTurn" });
      moves.push({ move: "cancel", args: [GetActivePlayer(ctx)] });
    }
    return moves;
  },
};

export default ai;
