interface CMCPlayer {
  mana: {
    V: number;
    A: number;
    P: number;
  };
  health: number;
  decksize: number;
  currentDeck: number;
  currentGrave: number;
  power: number;
  name: string;
}

function CreateDefaultPlayer(): CMCPlayer {
  const player: CMCPlayer = {
    mana: {
      V: 1,
      A: 1,
      P: 1,
    },
    health: 100,
    currentDeck: 100,
    currentGrave: 0,
    decksize: 100,
    power: 0,
    name: "CARDMASTER",
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
