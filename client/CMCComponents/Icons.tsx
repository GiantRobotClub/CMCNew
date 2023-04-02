import { GiEvilMoon, GiHolyGrail, GiElectric } from "react-icons/gi";
import { FaBalanceScale } from "react-icons/fa";
import { BsFillDropletFill } from "react-icons/bs";
import { TbCards, TbGrave2 } from "react-icons/tb";
import { CgCardSpades } from "react-icons/cg";
import React from "react";

const icons = {
  V: <GiHolyGrail />,
  P: <GiEvilMoon />,
  A: <FaBalanceScale />,
  health: <BsFillDropletFill />,
  power: <GiElectric />,
  hand: <TbCards />,
  card: <CgCardSpades />,
  graveyard: <TbGrave2 />,
};
export default icons;
