import { AiEnumerate, Ctx } from "boardgame.io";
import { CMCCard } from "./CMCCard";
import { Stages, ClickType, CardType } from "./Constants";
import {
  AllCards,
  CanClickCard,
  OwnerOf,
  PlayerAddResource,
} from "./LogicFunctions";
import { GetActiveStage, GetActivePlayer } from "./Util";
import { CMCGameState } from "./CardmasterGame";
import { StagesDefiniton } from "./Moves";
import { Stage } from "boardgame.io/src/core/turn-order";
import { CanActivateAbility, TriggerType } from "./Abilities";

interface moveshape {
  move: string;
  args?: any[];
}

function isSmart(
  card: CMCCard,
  stage: Stages,
  G: CMCGameState,
  playerID: string
) {
  switch (stage) {
    case Stages.sacrifice:
      {
        const totalmana =
          parseInt(G.playerData[playerID].resources.mana.A) +
          parseInt(G.playerData[playerID].resources.mana.V) +
          parseInt(G.playerData[playerID].resources.mana.P);
        if (totalmana > 2) {
          return false;
        }
      }
      return true;
  }

  return true;
}

function AllowedMoveVariants(
  G: CMCGameState,
  ctx: Ctx,
  playerid: string,
  movename: string,
  curmoves: moveshape[]
) {
  const stage = GetActiveStage(ctx);
  const activeplayer = GetActivePlayer(ctx);

  const moves: moveshape[] = [];

  function addmove(args: any[]) {
    const newmove: moveshape = {
      move: movename,
      args: args,
    };
    moves.push(newmove);
  }

  switch (movename) {
    case "playCardFromHand": {
      // if one of your cards in your hand is playable, do it here
      for (const card of G.players[activeplayer].hand) {
        if (!card) continue;
        if (OwnerOf(card, G) == activeplayer) {
          if (CanClickCard(card, activeplayer, ClickType.HAND, ctx, G)) {
            addmove([card, activeplayer]);
          }
        }
      }
      break;
    }
    case "activateAbility": {
      // if one of your entities has an activated ability, trigger from here
      for (const card of AllCards(G).field) {
        if (OwnerOf(card, G) == activeplayer) {
          for (const ability of card.abilities) {
            if (
              [TriggerType.ACTIVATED, TriggerType.ACTIVATED_TARGETED].includes(
                ability.triggerType
              )
            ) {
              if (CanActivateAbility(card, ability, G, ctx)) {
                addmove([card, ability, activeplayer]);
              }
            }
          }
        }
      }
      break;
    }

    case "pickEntity": {
      // go through all entities and check if you can click
      for (const card of AllCards(G).allinplay) {
        if (card.type == CardType.PERSONA) {
          console.log("target of persona ", card);
        }
        if (card.type != CardType.EMPTY) {
          if (card.type == CardType.MONSTER) {
            if (CanClickCard(card, activeplayer, ClickType.MONSTER, ctx, G)) {
              if (isSmart(card, stage, G, playerid))
                addmove([card, activeplayer]);
            }
          }
          if (card.type == CardType.EFFECT) {
            if (CanClickCard(card, activeplayer, ClickType.EFFECT, ctx, G)) {
              if (isSmart(card, stage, G, playerid))
                addmove([card, activeplayer]);
            }
          }
          if (card.type == CardType.PERSONA) {
            console.log("A");
            if (CanClickCard(card, activeplayer, ClickType.PERSONA, ctx, G)) {
              console.log("B");
              if (isSmart(card, stage, G, playerid)) {
                console.log("C");
                addmove([card, activeplayer]);
              }
            }
          }
        }
      }
      break;
    }
    case "chooseSlot": {
      // go through all slots and check fi you can click
      for (const card of AllCards(G).effects) {
        if (OwnerOf(card, G) == activeplayer) {
          if (card.type == CardType.EMPTY) {
            if (CanClickCard(card, activeplayer, ClickType.EFFECT, ctx, G)) {
              addmove([card, activeplayer]);
            }
          }
        }
      }
      for (const card of AllCards(G).monsters) {
        if (OwnerOf(card, G) == activeplayer) {
          if (card.type == CardType.EMPTY) {
            if (CanClickCard(card, activeplayer, ClickType.MONSTER, ctx, G)) {
              addmove([card, activeplayer]);
            }
          }
        }
      }
      break;
    }
    case "cancel": {
      // if there's nothing else you can do, cancel
      if (curmoves.length == 0) {
        addmove([activeplayer]);
      }
      break;
    }
    case "passTurn": {
      // you can always pass turn if it's available.
      addmove([]);
      break;
    }
    case "passStage": {
      // you can always pass stage if it's legal
      addmove([]);
      break;
    }
  }
  return moves as moveshape[];
}
const ai = {
  enumerate: (G: CMCGameState, ctx: Ctx, playerid: string) => {
    let moves: moveshape[] = [];
    console.log("CTX", ctx);
    const stage = GetActiveStage(ctx);
    const activeplayer = GetActivePlayer(ctx);

    if (activeplayer != playerid) {
      console.error("You are not active anyway");
    }
    console.log("Stages Definition", StagesDefiniton, stage);
    if (StagesDefiniton.hasOwnProperty(stage)) {
      console.log("stage", stage);
      const stagedef = StagesDefiniton[stage];
      if (stagedef.hasOwnProperty("moves")) {
        const movelist = stagedef["moves"];
        console.log("movelist", movelist);
        const allowedmoves = Object.keys(movelist);
        // check if each possible move is allowed.
        for (const movename of allowedmoves) {
          const variants = AllowedMoveVariants(
            G,
            ctx,
            playerid,
            movename,
            moves
          );
          moves.push(...variants);
        }
      }
    }
    console.log("move variants: ", moves);
    return moves;
  },
};

export default ai;
