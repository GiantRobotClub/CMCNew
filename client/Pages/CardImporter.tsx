import csv from "csvtojson";
import React from "react";
import {
  CMCCard,
  CMCEffectCard,
  CMCLocationCard,
  CMCMonsterCard,
  CMCPersonaCard,
  CMCSpellCard,
  CreateBasicCard,
  CreatePersonaCard,
} from "../../shared/CMCCard";
import { Alignment } from "../../shared/Constants";
import { CardType } from "../../shared/Constants";

const result = {};

const Importer = () => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const ref2 = React.useRef<HTMLDivElement>(null);
  const ref3 = React.useRef<HTMLTextAreaElement>(null);
  function convert(text: string) {
    csv({})
      .fromString(text.split(",").join("-").split("\t").join(","))
      .then((csvRows) => {
        const cards: string[] = csvRows.map((record) => {
          const newCard = CreateBasicCard();

          newCard.name = record.name;
          newCard.alignment = record.alignment.toUpperCase() as Alignment;

          newCard.cost = {
            mana: { V: record.costv, A: record.costa, P: record.costp },
          };
          newCard.sac = {
            mana: { V: record.sacv, A: record.saca, P: record.sacp },
          };
          const type = record.type.toUpperCase();
          newCard.cardtext = record.description;

          newCard.type = type;
          newCard.picture = "placeholder.jpg";
          if (type == CardType.MONSTER) {
            const newnewcard: CMCMonsterCard = {
              ...newCard,
              attack: record.attack,
              life: record.life,
              dizzy: true,
              destroyed: false,
              status: {},
            };

            result[record.cardid] = newnewcard;
            return JSON.stringify(newnewcard);
          } else if (type == CardType.EFFECT) {
            const newnewcard: CMCEffectCard = {
              ...newCard,
              dizzy: true,
              destroyed: false,
              status: {},
            };
            result[record.cardid] = newnewcard;
            return JSON.stringify(newnewcard);
          } else if (type == CardType.SPELL) {
            const newnewcard: CMCSpellCard = {
              ...newCard,
            };
            result[record.cardid] = newnewcard;
            return JSON.stringify(newnewcard);
          } else if (type == CardType.LOCATION) {
            const newnewcard: CMCLocationCard = {
              ...newCard,
              owner: "0",
            };
            result[record.cardid] = newnewcard;
            return JSON.stringify(newnewcard);
          } else if (type == CardType.PERSONA) {
            const newnewcard: CMCPersonaCard = {
              ...CreatePersonaCard(""),
              ...newCard,
            };
            result[record.cardid] = newnewcard;
            return JSON.stringify(newnewcard);
          }
          result[record.cardid] = newCard;
          return JSON.stringify(newCard);
        });
        if (ref2.current && ref3.current) {
          const resultstring = JSON.stringify(result, undefined, 4);
          ref2.current.innerText = resultstring;
          const copyable = resultstring.slice(1, -1);
          ref3.current.value = copyable;
        }
      });
  }

  return (
    <div className="importer">
      <textarea className="inputtext" id="inputtext" ref={ref}></textarea>

      <button
        className="convertnow"
        onClick={() => {
          if (ref.current) convert(ref.current.value);
        }}
      >
        Convert
      </button>
      <textarea className="outputtext" id="outputtext" ref={ref3}></textarea>
      <div className="result" ref={ref2}></div>
    </div>
  );
};

export default Importer;
