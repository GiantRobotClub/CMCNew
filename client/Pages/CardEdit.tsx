import { Client } from "boardgame.io/react";
import React, { useState } from "react";
import { CardmasterConflict } from "../../shared/CardmasterGame";
import { CMCBoard } from "../CMCComponents/Board";
import { Local } from "boardgame.io/multiplayer";
import Select from "react-select";
import prototypes from "../../shared/data/cards.json";
import JSONInput from "react-json-editor-ajrm";
import locale from "react-json-editor-ajrm/locale/en";

import {
  CMCCard,
  CreateBasicCard,
  GetCardPrototype,
  LoadCardPrototype,
} from "../../shared/CMCCard";
import CMCCardVisual from "../CMCComponents/Card";
import { CreateDefaultPlayer } from "../../shared/Player";
import CmcCardDetailAbility from "../CMCComponents/Abilities";
import { JSONEditor } from "react-json-editor-viewer";

const Test = () => {
  const [cardData, setCardData] = useState(GetCardPrototype("empty"));
  const [allPrototypes, setAllPrototypes] = useState(prototypes.prototypes);
  Object.entries(allPrototypes).forEach(([key, entry]) => {
    allPrototypes[key].guid = key;
  });
  function onJsonChange(data) {
    const card = LoadCardPrototype(data.json) as CMCCard;
    if (!card) {
      GetCardPrototype("empty");
    } else {
      setCardData(card);
      const allPrototypesNew = allPrototypes;
      allPrototypesNew[card.guid] = card;
      setAllPrototypes(allPrototypesNew);
    }
  }
  function onAllJsonChange(data) {
    setAllPrototypes(JSON.parse(data.json));
  }
  function handleOnChange(target) {
    const card = allPrototypes[target.value];

    setCardData(card);
  }
  const DummyPlayer = CreateDefaultPlayer("0");
  const small = (
    <div className="smallcards">
      <CMCCardVisual
        card={LoadCardPrototype(cardData)}
        canClick={false}
        doClick={undefined}
        activeCard={false}
        player={DummyPlayer}
        big={false}
      />
    </div>
  );
  const big = (
    <div className="bigcards">
      <CMCCardVisual
        card={LoadCardPrototype(cardData)}
        canClick={false}
        doClick={undefined}
        activeCard={false}
        player={DummyPlayer}
        big={true}
      />
    </div>
  );
  const detail = (
    <div className="superbig">
      <CMCCardVisual
        card={LoadCardPrototype(cardData)}
        canClick={false}
        doClick={undefined}
        activeCard={false}
        player={DummyPlayer}
        clickability={true}
        big={true}
        detail={true}
        owner="0"
      />
    </div>
  );

  const wheeldata = Object.entries(prototypes.prototypes).map(
    ([cardid, value]) => {
      const cardname = value.name;
      return { value: cardid, label: cardname };
    }
  );
  const dropdown = (
    <div className="wheel">
      <Select
        //@ts-ignore
        options={wheeldata}
        defaultInputValue="empty"
        defaultMenuIsOpen={true}
        defaultValue="empty"
        className="wheelcontrol"
        isMulti={false}
        onChange={handleOnChange}
      />
    </div>
  );

  return (
    <div className="editor">
      <div className="cards">
        {small}
        {big}
        {detail}
        {dropdown}
      </div>
      <div className="texteditor">
        <JSONInput
          id="leftjson"
          placeholder={cardData}
          value={allPrototypes}
          locale={locale}
          height="100vh"
          onChange={onJsonChange}
          onBlur={onJsonChange}
        />
      </div>
      <div className="texteditor">
        <JSONInput
          id="rightjson"
          placeholder={allPrototypes}
          value={allPrototypes}
          locale={locale}
          height="100vh"
          onChange={onAllJsonChange}
          onBlur={onAllJsonChange}
        />
      </div>
    </div>
  );
};

export default Test;
