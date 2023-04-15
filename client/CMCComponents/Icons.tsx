import {
  GiEvilMoon,
  GiHolyGrail,
  GiElectric,
  GiStarsStack,
} from "react-icons/gi";
import { FaBalanceScale } from "react-icons/fa";
import { BsFillDropletFill } from "react-icons/bs";
import { TbCards, TbGrave2 } from "react-icons/tb";
import { CgCardSpades } from "react-icons/cg";
import { RiStarSFill } from "react-icons/ri";
import { RxCardStack, RxCardStackPlus } from "react-icons/rx";
import React from "react";
import reactStringReplace from "react-string-replace";

import {
  TbSquareRoundedLetterA,
  TbSquareRoundedLetterB,
  TbSquareRoundedLetterC,
  TbSquareRoundedLetterD,
  TbSquareRoundedLetterE,
  TbSquareRoundedLetterF,
  TbSquareRoundedLetterG,
  TbSquareRoundedLetterH,
  TbSquareRoundedLetterI,
  TbSquareRoundedLetterJ,
  TbSquareRoundedLetterK,
  TbSquareRoundedLetterL,
  TbSquareRoundedLetterM,
  TbSquareRoundedLetterN,
  TbSquareRoundedLetterO,
  TbSquareRoundedLetterP,
  TbSquareRoundedLetterQ,
  TbSquareRoundedLetterR,
  TbSquareRoundedLetterS,
  TbSquareRoundedLetterT,
  TbSquareRoundedLetterU,
  TbSquareRoundedLetterV,
  TbSquareRoundedLetterW,
  TbSquareRoundedLetterX,
  TbSquareRoundedLetterY,
  TbSquareRoundedLetterZ,
} from "react-icons/tb";

export const icons = {
  V: <GiHolyGrail />,
  P: <GiEvilMoon />,
  A: <FaBalanceScale />,
  health: <BsFillDropletFill />,
  power: <GiElectric />,
  hand: <TbCards />,
  card: <CgCardSpades />,
  graveyard: <TbGrave2 />,
  dizzytop: <GiStarsStack />,
  dizzy: <RiStarSFill />,
  default: <RxCardStack />,
  adddeck: <RxCardStackPlus />,

  lettera: <TbSquareRoundedLetterA />,
  letterb: <TbSquareRoundedLetterB />,
  letterc: <TbSquareRoundedLetterC />,
  letterd: <TbSquareRoundedLetterD />,
  lettere: <TbSquareRoundedLetterE />,
  letterf: <TbSquareRoundedLetterF />,
  letterg: <TbSquareRoundedLetterG />,
  letterh: <TbSquareRoundedLetterH />,
  letteri: <TbSquareRoundedLetterI />,
  letterj: <TbSquareRoundedLetterJ />,
  letterk: <TbSquareRoundedLetterK />,
  letterl: <TbSquareRoundedLetterL />,
  letterm: <TbSquareRoundedLetterM />,
  lettern: <TbSquareRoundedLetterN />,
  lettero: <TbSquareRoundedLetterO />,
  letterp: <TbSquareRoundedLetterP />,
  letterq: <TbSquareRoundedLetterQ />,
  letterr: <TbSquareRoundedLetterR />,
  letters: <TbSquareRoundedLetterS />,
  lettert: <TbSquareRoundedLetterT />,
  letteru: <TbSquareRoundedLetterU />,
  letterv: <TbSquareRoundedLetterV />,
  letterw: <TbSquareRoundedLetterW />,
  letterx: <TbSquareRoundedLetterX />,
  lettery: <TbSquareRoundedLetterY />,
  letterz: <TbSquareRoundedLetterZ />,
};

export function scanForIcons(string: string): string | React.ReactNodeArray {
  let returnstring: string | React.ReactNodeArray = string;
  for (const icon of Object.keys(icons)) {
    const matchstring = "(" + icon + ")";
    returnstring = reactStringReplace(returnstring, matchstring, (match, i) => (
      <>{icons[match.substring(1, match.length - 1)]}</>
    ));
  }
  return returnstring;
}
