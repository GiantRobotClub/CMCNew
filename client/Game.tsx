import { Client } from "boardgame.io/react";
import { TicTacToe } from "../shared/Game";
import { TicTacToeBoard } from "./Board";

const Game = Client({ game: TicTacToe, board: TicTacToeBoard });

export default Game;
