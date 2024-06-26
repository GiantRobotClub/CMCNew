import {
  GiEvilMoon,
  GiHolyGrail,
  GiElectric,
  GiStarsStack,
  GiCauldron,
  GiHealthNormal,
  GiBroadsword,
  GiInvisible,
  GiBrickWall,
  GiTransparentSlime,
  GiSteampunkGoggles,
  GiSkeleton,
} from "react-icons/gi";
import { SlGameController } from "react-icons/sl";
import {
  AiFillCheckCircle,
  AiFillCloseCircle,
  AiFillEye,
} from "react-icons/ai";
import { FaBalanceScale, FaSkull } from "react-icons/fa";
import {
  BsFillDropletFill,
  BsFillCpuFill,
  BsFillArrowDownRightCircleFill,
  BsFillArrowDownLeftCircleFill,
  BsFillBackspaceFill,
} from "react-icons/bs";
import { TbCards, TbGrave2 } from "react-icons/tb";
import { CgCardSpades } from "react-icons/cg";
import { RiStarSFill } from "react-icons/ri";
import { RxCardStack, RxCardStackPlus } from "react-icons/rx";
import React, { ReactNode } from "react";
import reactStringReplace from "react-string-replace";
import { BiTargetLock } from "react-icons/bi";
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
  TbLetterA,
  TbLetterB,
  TbLetterC,
  TbLetterD,
  TbLetterE,
  TbLetterF,
  TbLetterS,
} from "react-icons/tb";
import { CMCCard } from "../../shared/CMCCard";
import { Ability } from "../../shared/Abilities";

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
  check: <AiFillCheckCircle />,
  x: <AiFillCloseCircle />,
  eye: <AiFillEye />,
  sword: <GiBroadsword />,
  life: <GiHealthNormal />,
  skull: <FaSkull />,
  target: <BiTargetLock />,
  stealth: <GiInvisible />,
  wall: <GiBrickWall />,
  slippery: <GiTransparentSlime />,
  vision: <GiSteampunkGoggles />,
  cpu: <BsFillCpuFill />,
  cauldron: <GiCauldron />,
  controller: <SlGameController />,
  skeleton: <GiSkeleton />,
  arrowdr: <BsFillArrowDownRightCircleFill />,
  arrowdl: <BsFillArrowDownLeftCircleFill />,

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

  speed0: <TbLetterS />,
  speed1: <TbLetterA />,
  speed2: <TbLetterB />,
  speed3: <TbLetterC />,
  speed4: <TbLetterD />,
  speed5: <TbLetterE />,
  speed6: <TbLetterF />,

  backspace: <BsFillBackspaceFill />,
};

const statscan = {
  "#amount": function (ability, card) {
    if (
      !ability ||
      !ability.hasOwnProperty("metadata") ||
      !ability.metadata.hasOwnProperty("amount")
    ) {
      return 0;
    }
    return ability.metadata.amount;
  },
  "#br": function (ability, card) {
    return <br />;
  },
};

export function scanForIcons(
  string: string,
  ability: Ability | undefined = undefined,
  card: CMCCard | undefined = undefined
): string | ReactNode[] {
  let returnstring: string | ReactNode[] = string;
  for (const icon of Object.keys(icons)) {
    const matchstring = "(" + icon + ")";
    returnstring = reactStringReplace(returnstring, matchstring, (match, i) => (
      <>{icons[match.substring(1, match.length - 1)]}</>
    ));
  }
  if (ability && card) {
    for (const stat of Object.keys(statscan)) {
      const matchstring = "(" + stat + ")";
      if (
        typeof returnstring == "string" &&
        !returnstring.includes(matchstring)
      ) {
        continue;
      }

      const amount = statscan[stat](ability, card);
      returnstring = reactStringReplace(
        returnstring,
        matchstring,
        (match, i) => <>{amount}</>
      );
    }
  }
  return returnstring;
}
