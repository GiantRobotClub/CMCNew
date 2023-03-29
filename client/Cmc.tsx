import { Client } from "boardgame.io/react";
import { CardmasterConflict } from "../shared/CardmasterGame";
import { CMCBoard } from "./CMCComponents/Board";
const Cmc = Client({ game: CardmasterConflict, board: CMCBoard });

export default Cmc;
