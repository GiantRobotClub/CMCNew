interface CMCPlayer {
  resources: {
    mana: {
      V: number;
      A: number;
      P: number;
    };
    health: number;
    power: number;
  };
  decksize: number;
  currentDeck: number;
  currentGrave: number;
  name: string;
  id: string;
}

function CreateDefaultPlayer(playerId: string): CMCPlayer {
  const player: CMCPlayer = {
    resources: {
      power: 0,
      health: 100,
      mana: {
        V: 1,
        A: 1,
        P: 1,
      },
    },
    currentDeck: 100,
    currentGrave: 0,
    decksize: 100,
    name: "CARDMASTER" + playerId,
    id: playerId,
  };
  return player;
}

/*


  addMana(v: number, a: number, p: number) {
    // trigger event "manaadd" with the right details

    // change mana
    this.mana.V = this.mana.V + v;
    this.mana.A = this.mana.A + a;
    this.mana.P = this.mana.P + p;
  }
  */
export { CMCPlayer, CreateDefaultPlayer };
