import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DbDeck,
  DbDeckCard,
  DbFullDeck,
  DbOwnedCard,
} from "../../server/DbTypes";
import CMCCardVisual from "../CMCComponents/Card";
import { CMCCard, GetCardPrototype } from "../../shared/CMCCard";
import { CreateDefaultPlayer } from "../../shared/Player";
import { CardType } from "../../shared/Constants";

import { icons } from "../CMCComponents/Icons";

const DeckEditor = ({ deckid }: { deckid: string }) => {
  const emptydbdeck: DbDeck = {
    deckicon: "",
    ownerid: "",
    persona: "",
    deckname: "",
    deckid: "",
  };
  const emptydbfulldeck: DbFullDeck = {
    deck: emptydbdeck,
    cards: [],
  };

  const ownedcard: DbOwnedCard = {
    playerid: "",
    cardid: "",
    amount: 0,
  };

  const handletextchange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDeck = JSON.parse(JSON.stringify(FullDeck));
    newDeck.deck.deckname = event.target.value;
    setFullDeck(newDeck);
  };

  const emptyownedcards: DbOwnedCard[] = [];
  const [PlayerID, setPlayerID] = useState("");
  const [FullDeck, setFullDeck] = useState(emptydbfulldeck);
  const [OwnedCards, setOwnedCards] = useState(emptyownedcards);
  const [Loading, setLoading] = useState(true);
  const clickSymbol = (icon: string) => {
    const newDeck = JSON.parse(JSON.stringify(FullDeck));
    newDeck.deck.deckicon = icon;
    setFullDeck(newDeck);
  };

  const nav = useNavigate();
  const savedeck = () => {
    console.log("Saving deck");
    // save deck
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deck: FullDeck }),
    };
    fetch("/api/manage/decks/save/" + FullDeck.deck.deckid, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success) {
          // nav back to decks
          nav("/decks");
        } else {
          console.error("Couldnt save deck");
        }
      });
  };
  const selectpersona = (cardid: string) => {
    const newdeck = JSON.parse(JSON.stringify(FullDeck));
    newdeck.deck.persona = cardid;
    setFullDeck(newdeck);
  };
  const subDeck = (cardid: string) => {
    const newOwned = JSON.parse(JSON.stringify(OwnedCards));
    let index = -1;
    for (const owned of newOwned) {
      if (owned.cardid == cardid) {
        index = newOwned.indexOf(owned);
        break;
      }
    }
    if (index == -1) {
      const newcard: DbOwnedCard = {
        playerid: PlayerID,
        cardid: cardid,
        amount: 1,
      };
      newOwned.push(newcard);
    } else {
      newOwned[index].amount = newOwned[index].amount + 1;
    }
    let remove = false;
    let newDeck = JSON.parse(JSON.stringify(FullDeck)) as DbFullDeck;
    for (const deckcard of newDeck.cards) {
      if (deckcard.cardid == cardid) {
        const index = newDeck.cards.indexOf(deckcard);
        newDeck.cards[index].amount = newDeck.cards[index].amount - 1;
        if (newDeck.cards[index].amount == 0) {
          remove = true;
        }
        break;
      }
    }
    if (remove) {
      newDeck.cards = newDeck.cards.filter((card) => card.cardid != cardid);
    }
    console.dir(newDeck);
    setOwnedCards(newOwned);
    setFullDeck(newDeck);
  };
  const fixCounts = (deck: DbFullDeck, owned: DbOwnedCard[]) => {
    for (const card of deck.cards) {
      for (const owncard of owned) {
        if (owncard.cardid == card.cardid) {
          // fix numbers
          if (owncard.amount < card.amount) {
            console.log("Too many of " + card.cardid);
            card.amount = owncard.amount;
          }
          owncard.amount = owncard.amount - card.amount;
        }
      }
    }
    owned = owned.filter((card) => card.amount > 0);
    deck.cards = deck.cards.filter((card) => card.amount > 0);
    setFullDeck(deck);
    setOwnedCards(owned);
  };
  const addDeck = (cardid: string) => {
    const newDeck = JSON.parse(JSON.stringify(FullDeck));
    let index = -1;
    for (const card of newDeck.cards) {
      if (card.cardid == cardid) {
        index = newDeck.cards.indexOf(card);
        break;
      }
    }

    if (index == -1) {
      const newcard: DbDeckCard = {
        deckid: newDeck.deck.deckid,
        cardid: cardid,
        amount: 1,
      };
      newDeck.cards.push(newcard);
    } else {
      newDeck.cards[index].amount = newDeck.cards[index].amount + 1;
    }
    setFullDeck(newDeck);
    let newOwned = JSON.parse(JSON.stringify(OwnedCards)) as DbOwnedCard[];
    let remove = false;
    for (const owned of newOwned) {
      if (owned.cardid == cardid) {
        const index = newOwned.indexOf(owned);
        newOwned[index].amount = newOwned[index].amount - 1;
        if (newOwned[index].amount == 0) {
          remove = true;
        }
        break;
      }
    }
    if (remove) {
      newOwned = newOwned.filter((card) => card.cardid != cardid);
    }
    setOwnedCards(newOwned);
  };
  useEffect(() => {
    if (FullDeck == emptydbfulldeck) {
      fetch("/api/manage/decks/get/" + deckid)
        .then((response) => response.json())
        .then((data) => {
          console.dir(data);
          const fulldeck = data.decks as DbFullDeck;
          setPlayerID(fulldeck.deck.ownerid);
          setFullDeck(fulldeck);
          fetch("/api/manage/player/getowned/" + fulldeck.deck.ownerid)
            .then((response) => response.json())
            .then((data) => {
              const owneddeck = data.owned as DbOwnedCard[];
              setOwnedCards(owneddeck);
              fixCounts(fulldeck, owneddeck);
              setLoading(false);
            });
        });
    }
  }, [FullDeck]);
  const personas = OwnedCards.filter(
    (card) => GetCardPrototype(card.cardid).type == CardType.PERSONA
  );
  const others = OwnedCards.filter(
    (card) => GetCardPrototype(card.cardid).type != CardType.PERSONA
  );
  const player = CreateDefaultPlayer(PlayerID);
  player.name = FullDeck.deck.deckname;
  const Genericplayer = CreateDefaultPlayer(PlayerID);
  Genericplayer.name = "";
  if (Loading) {
    return <div className="loading">Loading</div>;
  } else {
    return (
      <div id="deckEditor">
        <div className="symbolpicker">
          {Object.keys(icons).map((icon) => {
            return (
              <button
                className="picksymbol"
                onClick={() => {
                  clickSymbol(icon);
                }}
              >
                {icons[icon]}
              </button>
            );
          })}
        </div>
        <div className="personapicker">
          <div className="deckname">
            <input
              type="text"
              name="deckname"
              onChange={handletextchange}
              value={FullDeck.deck.deckname}
            />
            <button
              onClick={() => {
                savedeck();
              }}
            >
              SAVE
            </button>
          </div>
          <div className="currentpersona">
            <div className="currentpersonabox">
              <CMCCardVisual
                card={GetCardPrototype(FullDeck.deck.persona)}
                big={true}
                canClick={true}
                doClick={() => {}}
                activeCard={false}
                player={player}
                showplayer={false}
              />
              <div className="deckicon">{icons[FullDeck.deck.deckicon]}</div>
            </div>
          </div>
          <div className="ownedpersonalist">
            {personas.map((deckcard) => {
              return (
                <div className="deckcardvisual">
                  <CMCCardVisual
                    card={GetCardPrototype(deckcard.cardid)}
                    big={true}
                    canClick={true}
                    doClick={() => {
                      selectpersona(deckcard.cardid);
                    }}
                    activeCard={false}
                    player={Genericplayer}
                    showplayer={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="cardpicker">
          <div className="currentdeck">
            {FullDeck.cards.map((deckcard) => {
              return (
                <div className="deckcardvisual">
                  <CMCCardVisual
                    card={GetCardPrototype(deckcard.cardid)}
                    big={true}
                    canClick={true}
                    doClick={() => {
                      subDeck(deckcard.cardid);
                    }}
                    activeCard={false}
                    player={player}
                    showplayer={false}
                  />
                  <div className="amount"> x{deckcard.amount}</div>
                </div>
              );
            })}
          </div>
          <div className="ownedcards">
            {others.map((ownedcard) => {
              return (
                <div className="ownedcardvisual">
                  <CMCCardVisual
                    card={GetCardPrototype(ownedcard.cardid)}
                    big={true}
                    canClick={true}
                    doClick={() => {
                      addDeck(ownedcard.cardid);
                    }}
                    activeCard={false}
                    player={player}
                    showplayer={false}
                  />
                  <div className="amount"> x{ownedcard.amount}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
};

export default DeckEditor;
