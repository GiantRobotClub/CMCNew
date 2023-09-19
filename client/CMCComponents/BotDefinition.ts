import { CMCGameState } from "../../shared/CardmasterGame";
import { CardType, Stages } from "../../shared/Constants";
import { GetActiveStage, OtherPlayer } from "../../shared/Util";
import CardmasterConflict from "../../shared/CardmasterGame";
/*
 * Copied and modiifed from MCTSBot
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
import "setimmediate";
import { Bot, BotAction } from "boardgame.io/dist/esm/ai";
import { CreateGameReducer } from "boardgame.io/internal";
import type { Game, PlayerID, Ctx, State, Reducer } from "boardgame.io";
import { moveSyntheticComments } from "typescript";

export interface Node {
  /** Game state at this node. */
  state: State;
  /** Parent of the node. */
  parent?: Node;
  /** Move used to get to this node. */
  parentAction?: BotAction;
  /** Unexplored actions. */
  actions: BotAction[];
  /** Current objectives. */
  objectives: Objectives | Objectives[];
  /** Children of the node. */
  children: Node[];
  /** Number of simulations that pass through this node. */
  visits: number;
  /** Number of wins for this node. */
  value: number;
}

interface Objective {
  evaluate: (
    PrevG: CMCGameState,
    G: CMCGameState,
    MoveName: string,
    ctx: Ctx
  ) => number;
}

type Objectives = Record<string, Objective>;

/**
 * The number of iterations to run before yielding to
 * the JS event loop (in async mode).
 */
const CHUNK_SIZE = 25;

const Config = {
  depth: 5,
  iterations: 3,
};

function objectivefactoryattack(PlayerID: string): Objective {
  const objectiveattack: Objective = {
    evaluate: (
      PrevG: CMCGameState,
      G: CMCGameState,
      moveName: string,
      ctx: Ctx
    ) => {
      console.log("Checking ", moveName, GetActiveStage(ctx));
      if (GetActiveStage(ctx) == Stages.combat && moveName == "pickEntity")
        return 100;
      else if (
        GetActiveStage(ctx) == Stages.pickCombatTarget &&
        moveName == "pickEntity"
      )
        return 100;
      else if (
        GetActiveStage(ctx) == Stages.pickCombatTarget &&
        moveName == "cancel"
      ) {
        return -100;
      } else return 0;
    },
  };
  return objectiveattack;
}
function objectivefactoryhealth(PlayerID: string): Objective {
  const objectivehealth: Objective = {
    evaluate: (
      PrevG: CMCGameState,
      G: CMCGameState,
      moveName: string,
      ctx: Ctx
    ) => {
      if (!G.playerData || !PrevG.playerData) {
        return 0;
      }
      if (
        GetActiveStage(ctx) == Stages.respond ||
        GetActiveStage(ctx) == Stages.defense
      ) {
        return 0;
      }
      let playerID = PlayerID;
      let otherPlayer = OtherPlayer(playerID);

      // compare your health values

      const yourhealth =
        G.playerData[playerID].resources.intrinsic.health -
        PrevG.playerData[playerID].resources.intrinsic.health;
      const opphealth =
        PrevG.playerData[otherPlayer].resources.intrinsic.health -
        G.playerData[otherPlayer].resources.intrinsic.health;

      return yourhealth + opphealth;
    },
  };
  return objectivehealth;
}

function objectivefactorycancel(PlayerID: string): Objective {
  const objectivedontcancel: Objective = {
    evaluate: (
      PrevG: CMCGameState,
      G: CMCGameState,
      moveName: string,
      ctx: Ctx
    ) => {
      console.log("Move name: ", moveName);
      if (moveName == "cancel") {
        return -10000;
      }
      return 0;
    },
  };
  return objectivedontcancel;
}
function objectivefactorymonster(PlayerID: string): Objective {
  const monstercount: Objective = {
    evaluate: (
      PrevG: CMCGameState,
      G: CMCGameState,
      moveName: String,
      ctx: Ctx
    ) => {
      let playerID = PlayerID;
      let otherPlayer = OtherPlayer(playerID);
      let monstercount = 0;
      let oldmonstercount = 0;
      let oppmonstercount = 0;
      let oldoppmonstercount = 0;

      for (const card of G.slots[playerID].monsters) {
        if (card.type != CardType.EMPTY) {
          monstercount++;
        }
      }
      for (const card of PrevG.slots[playerID].monsters) {
        if (card.type != CardType.EMPTY) {
          oldmonstercount++;
        }
      }
      for (const card of G.slots[otherPlayer].monsters) {
        if (card.type != CardType.EMPTY) {
          oppmonstercount++;
        }
      }
      for (const card of PrevG.slots[otherPlayer].monsters) {
        if (card.type != CardType.EMPTY) {
          oldoppmonstercount++;
        }
      }
      let score =
        (monstercount - oldmonstercount) * 2 -
        (oppmonstercount - oldoppmonstercount);

      console.log("Calculated monster score ", score);
      return (
        (monstercount - oldmonstercount) * 2 -
        (oppmonstercount - oldoppmonstercount)
      );
    },
  };
  return monstercount;
}
export function objectivesfunc(
  G: any,
  ctx: Ctx,
  playerID?: PlayerID
): Objectives {
  const obs: Objectives = {
    health: objectivefactoryhealth(playerID),
    monster: objectivefactorymonster(playerID),
    cancel: objectivefactorycancel(playerID),
    attack: objectivefactoryattack(playerID),
  };
  return obs;
}

/**
 * Bot that uses Monte-Carlo Tree Search to find promising moves.
 */
export class CMCGameBot extends Bot {
  private objectives: (G: any, ctx: Ctx, playerID: PlayerID) => Objectives;
  private iterationCallback: (data: {
    iterationCounter: number;
    numIterations: number;
    metadata: Node;
  }) => void;
  private reducer: Reducer;
  iterations: number | ((G: any, ctx: Ctx, playerID?: PlayerID) => number);
  playoutDepth?: number | ((G: any, ctx: Ctx, playerID?: PlayerID) => number);

  constructor({
    enumerate,
    seed,
    game,
    iterations = Config.iterations,
    playoutDepth = Config.depth,
    iterationCallback,
  }: {
    enumerate: Game["ai"]["enumerate"];
    seed?: string | number;
    game: Game;
    iterations?: number | ((G: any, ctx: Ctx, playerID?: PlayerID) => number);
    playoutDepth?: number | ((G: any, ctx: Ctx, playerID?: PlayerID) => number);
    iterationCallback?: (data: {
      iterationCounter: number;
      numIterations: number;
      metadata: Node;
    }) => void;
  }) {
    super({ enumerate, seed });
    this.objectives = objectivesfunc;
    this.iterationCallback = iterationCallback || (() => {});
    this.reducer = CreateGameReducer({ game });
    this.iterations = iterations;
    this.playoutDepth = playoutDepth;

    this.addOpt({
      key: "async",
      initial: false,
    });

    this.addOpt({
      key: "iterations",
      initial: typeof iterations === "number" ? iterations : 1000,
      range: { min: 1, max: 2000 },
    });

    this.addOpt({
      key: "playoutDepth",
      initial: typeof playoutDepth === "number" ? playoutDepth : 50,
      range: { min: 1, max: 100 },
    });
  }

  private createNode({
    state,
    parentAction,
    parent,
    playerID,
  }: {
    state: State;
    parentAction?: BotAction;
    parent?: Node;
    playerID?: PlayerID;
  }): Node {
    const { G, ctx } = state;

    let actions: BotAction[] = [];
    let objectives: Objectives | Objectives[] = [];

    if (playerID !== undefined) {
      actions = this.enumerate(G, ctx, playerID);
      objectives = this.objectives(G, ctx, playerID);
    } else if (ctx.activePlayers) {
      for (const playerID in ctx.activePlayers) {
        actions.push(...this.enumerate(G, ctx, playerID));
        objectives.push(this.objectives(G, ctx, playerID));
      }
    } else {
      actions = this.enumerate(G, ctx, ctx.currentPlayer);
      objectives = this.objectives(G, ctx, ctx.currentPlayer);
    }
    console.log("actions", actions);

    return {
      state,
      parent,
      parentAction,
      actions,
      objectives,
      children: [],
      visits: 0,
      value: 0,
    };
  }

  private select(node: Node) {
    // This node has unvisited children.
    if (node.actions.length > 0) {
      return node;
    }

    // This is a terminal node.
    if (node.children.length === 0) {
      return node;
    }

    let selectedChild = null;
    let best = 0;

    for (const child of node.children) {
      const childVisits = child.visits + Number.EPSILON;
      const uct =
        child.value / childVisits +
        Math.sqrt((2 * Math.log(node.visits)) / childVisits);
      if (selectedChild == null || uct >= best) {
        best = uct;
        selectedChild = child;
      }
    }

    return this.select(selectedChild);
  }

  private expand(node: Node) {
    const actions = node.actions;

    if (actions.length === 0 || node.state.ctx.gameover !== undefined) {
      return node;
    }

    const id = this.random(actions.length);
    const action = actions[id];
    node.actions.splice(id, 1);
    const childState = this.reducer(node.state, action);
    const childNode = this.createNode({
      state: childState,
      parentAction: action,
      parent: node,
    });
    node.children.push(childNode);
    return childNode;
  }

  playout({ state, parent, parentAction }: Node) {
    let playoutDepth = this.getOpt("playoutDepth");
    if (typeof this.playoutDepth === "function") {
      playoutDepth = this.playoutDepth(state.G, state.ctx);
    }

    for (let i = 0; i < playoutDepth && state.ctx.gameover === undefined; i++) {
      const { G, ctx } = state;
      let playerID = ctx.currentPlayer;
      if (ctx.activePlayers) {
        playerID = Object.keys(ctx.activePlayers)[0];
      }
      const moves = this.enumerate(G, ctx, playerID);

      // Check if any objectives are met.
      const objectives = this.objectives(G, ctx, playerID);
      const score = Object.keys(objectives).reduce((score, key) => {
        const objective = objectives[key];
        let parentnode = parent;
        if (!parent) {
          return score;
        } else {
          let moveName = "";
          if (parentAction && "move" in parentAction) {
            moveName = parentAction.move.type;
          }
          if (parentAction && "payload" in parentAction) {
            moveName = parentAction.payload.type;
          }
          let evalscore = objective.evaluate(
            parent?.state.G,
            state.G,
            moveName,
            ctx
          );
          console.log("Objective score ", key, evalscore);
          return score > evalscore ? score : evalscore;
        }
      }, 0);

      // If so, stop and return the score.
      if (score > 0) {
        return { score };
      }

      if (!moves || moves.length === 0) {
        return undefined;
      }

      const id = this.random(moves.length);
      const childState = this.reducer(state, moves[id]);
      state = childState;
    }

    return state.ctx.gameover;
  }

  private backpropagate(
    node: Node,
    result: { score?: number; draw?: boolean; winner?: PlayerID } = {}
  ) {
    node.visits++;

    if (result.score !== undefined) {
      if (node.value < result.score) {
        node.value = result.score;
      }
    }

    if (result.draw === true) {
      node.value += 0.5;
    }

    if (
      node.parentAction &&
      result.winner === node.parentAction.payload.playerID
    ) {
      node.value += 1000;
    }

    if (node.parent) {
      this.backpropagate(node.parent, result);
    }
  }

  play(
    state: State,
    playerID: PlayerID
  ): Promise<{ action: BotAction; metadata: Node }> {
    const root = this.createNode({ state, playerID });

    let numIterations = this.getOpt("iterations");
    if (typeof this.iterations === "function") {
      numIterations = this.iterations(state.G, state.ctx);
    }
    const getResult = () => {
      let selectedChild: Node | null = null;
      for (const child of root.children) {
        if (selectedChild == null || child.visits > selectedChild.visits) {
          selectedChild = child;
        }
      }

      const action = selectedChild && selectedChild.parentAction;
      const metadata = root;
      return { action, metadata };
    };

    return new Promise((resolve) => {
      const iteration = () => {
        for (
          let i = 0;
          i < CHUNK_SIZE && this.iterationCounter < numIterations;
          i++
        ) {
          const leaf = this.select(root);
          const child = this.expand(leaf);
          const result = this.playout(child);
          this.backpropagate(child, result);
          this.iterationCounter++;
        }
        this.iterationCallback({
          iterationCounter: this.iterationCounter,
          numIterations,
          metadata: root,
        });
      };

      this.iterationCounter = 0;

      if (this.getOpt("async")) {
        const asyncIteration = () => {
          if (this.iterationCounter < numIterations) {
            iteration();
            setImmediate(asyncIteration);
          } else {
            resolve(getResult());
          }
        };
        asyncIteration();
      } else {
        while (this.iterationCounter < numIterations) {
          iteration();
        }
        resolve(getResult());
      }
    });
  }
}
