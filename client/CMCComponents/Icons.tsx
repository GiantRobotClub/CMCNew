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
import React from "react";
import reactStringReplace from "react-string-replace";

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
};
export function scanForIcons(string: string): string | React.ReactNodeArray {
  let returnstring: string | React.ReactNodeArray = string;
  for (const icon of Object.keys(icons)) {
    const matchstring = "(" + icon + ")";
    returnstring = reactStringReplace(returnstring, matchstring, (match, i) => (
      <>{icons[match.substring(1, match.length - 1)]}</>
    ));
    console.log(returnstring);
  }
  return returnstring;
}
