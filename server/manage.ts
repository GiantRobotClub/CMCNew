import Router from "@koa/router";
import type { PlayerID, Server, Server as ServerTypes } from "boardgame.io";
import { authenticator } from "@otplib/preset-default";
import {
  AddCompletionData,
  CreateDeck,
  CreatePlayer,
  DeleteDeck,
  GetCompletionData,
  GetDeckList,
  GetFullDeck,
  GetMats,
  GetOwnedCards,
  GetPlayer,
  GetPlayerIdFromName,
  GiveMats,
  LoadJsonDeck,
  NewEmptyDeck,
  SaveOwned,
  SetDeck,
  SetMats,
} from "./db";
import {
  DbCompletion,
  DbCraftingMat,
  DbCraftingMats,
  DbDeckCard,
  DbFullDeck,
  DbOwnedCard,
  DbPlayer,
} from "./DbTypes";
import { nanoid } from "nanoid";
import bodyParser from "koa-bodyparser";
import crafting from "../shared/data/crafting.json";
import packs from "../shared/data/packs.json";
import { TbReceiptRefund } from "react-icons/tb";
import { GetCardPrototype } from "../shared/CMCCard";
import { CardType } from "../shared/Constants";
export const Manage = new Router<any, Server.AppCtx>();
Manage.get("/mats/get/:playerid", (ctx, next) => {
  const mats: DbCraftingMats | undefined = GetMats(ctx.params.playerid);
  if (mats) {
    ctx.body = { mats: mats };
  } else {
    ctx.boy = { mats: {} };
  }
  return true;
});

function AddCard(owned: DbOwnedCard[], cardid: string, pid: string) {
  let found = false;
  for (const ownedcard of owned) {
    if (ownedcard.cardid == cardid) {
      found = true;
      ownedcard.amount = ownedcard.amount + 1;
    }
  }
  const newownedcard: DbOwnedCard = {
    cardid: cardid,
    amount: 1,
    playerid: pid,
  };
  owned.push(newownedcard);
}

Manage.get("/completions/get/:playerid/:completiontype", (ctx, next) => {
  console.dir(ctx.params);
  const completiontype = ctx.params.completiontype;
  const playerid = ctx.params.playerid;
  const completions = GetCompletionData(playerid, completiontype);
  ctx.response.body = { completions: completions };
});

Manage.get(
  "/completions/add/:playerid/:completiontype/:completionname/:info",
  (ctx, next) => {
    const completion: DbCompletion = {
      playerid: ctx.params.playerid,
      completiontype: ctx.params.completiontype,
      info: ctx.params.info,
      completionname: ctx.params.completionname,
    };
    AddCompletionData(completion);
  }
);
Manage.get("/mats/craft/:playerid/:letters", (ctx, next) => {
  const lettercode = ctx.params.letters;
  const playerid = ctx.params.playerid;
  const givenletters: string[] = [];

  const curmats = GetMats(playerid);
  if (curmats == undefined) {
    ctx.response.body = { error: "no mats found" };

    return next();
  }
  const needed = [...lettercode];
  const lettercounts = {};
  needed.map((letter) => {
    if (!lettercounts.hasOwnProperty(letter)) {
      lettercounts[letter] = 0;
    }
    lettercounts[letter] = lettercounts[letter] + 1;
  });

  // check if you have those mats
  for (const lettercount of Object.entries(lettercounts)) {
    for (const mat of curmats.mats) {
      if (mat.letter == lettercount[0]) {
        mat.amount = mat.amount - 1;
        console.log("reducing " + mat.letter + " to " + mat.amount);
        if (mat.amount < 0) {
          ctx.response.body = { error: "missing mat: " + mat.letter };
          console.error(ctx.response.body);
          return next();
        }
      }
    }
  }

  console.dir(curmats);
  // get owned cards

  const owned: DbOwnedCard[] | undefined = GetOwnedCards(playerid);
  if (!owned) {
    ctx.response.body = { error: "could not get owned" };
    return next();
  }
  const cardsgiven: string[] = [];
  let recipetype = "";
  if (crafting.crafting.hasOwnProperty(lettercode)) {
    // give the card result and return the card id

    const cardstogive = crafting.crafting[lettercode];
    const numcards = cardstogive.length;
    //remove personas you already own
    for (const ownedcard of owned) {
      if (cardstogive.includes(ownedcard.cardid)) {
        // if the card is a persona,
        if (GetCardPrototype(ownedcard.cardid).type == CardType.PERSONA) {
          cardstogive.splice(cardstogive.indexof(ownedcard.cardid));
        }
      }
    }

    for (const cardtogive of cardstogive) {
      cardsgiven.push(cardtogive);
      AddCard(owned, cardtogive, playerid);
    }

    // consolation prizes - give mats for every persona you already had.
    const nummats = numcards - cardsgiven.length;

    const letterrewardsall: string[] = [];
    Object.entries(crafting.rewardrates).forEach((entry) => {
      const [reward, amount] = entry;
      for (let i = 0; i < amount; i++) {
        letterrewardsall.push(reward);
      }
    });
    for (let i = 0; i < nummats * 2; i++) {
      givenletters.push(
        letterrewardsall[~~(Math.random() * letterrewardsall.length)]
      );
    }

    const newmats: DbCraftingMats = {
      playerid: playerid,
      mats: [],
    };

    givenletters.forEach((letter) => {
      let found: boolean = false;
      for (const mat of newmats.mats) {
        if (mat.letter == letter) {
          mat.amount = mat.amount + 1;
          found = true;
          continue;
        }
      }
      if (!found) {
        const newmat: DbCraftingMat = {
          playerid: playerid,
          letter: letter,
          amount: 1,
        };
        newmats.mats.push(newmat);
      }
    });

    //give the player their rewards
    GiveMats(newmats);

    const completiondata: DbCompletion = {
      playerid: playerid,
      completiontype: "craft",
      completionname: lettercode,
      info: cardstogive,
    };
    AddCompletionData(completiondata);
    recipetype = "R";
  } else {
    // get list of already owned personas and remove them from possible packs.
    const packsetting = JSON.parse(JSON.stringify(packs.packs.base));
    for (const ownedcard of owned) {
      if (GetCardPrototype(ownedcard.cardid).type == CardType.PERSONA) {
        if (packsetting.common.includes(ownedcard.cardid)) {
          packsetting.common.splice(
            packsetting.common.indexof(ownedcard.cardid),
            1
          );
        }
        if (packsetting.uncommon.includes(ownedcard.cardid)) {
          packsetting.uncommon.splice(
            packsetting.uncommon.indexof(ownedcard.cardid),
            1
          );
        }
        if (packsetting.rare.includes(ownedcard.cardid)) {
          packsetting.rare.splice(
            packsetting.rare.indexof(ownedcard.cardid),
            1
          );
        }
      }
    }
    // figure out pack size
    const totalnumber = lettercode.length;
    const commons = Math.floor(totalnumber / 2);
    const uncommon = totalnumber - Math.ceil(commons / 2);
    const rare = totalnumber - Math.floor(uncommon / 2) - commons;
    for (let i = 0; i < commons; i++) {
      const randomElement =
        packs.packs.base.common[
          Math.floor(Math.random() * packs.packs.base.common.length)
        ];
      AddCard(owned, randomElement, playerid);
      cardsgiven.push(randomElement);
    }
    for (let i = 0; i < uncommon; i++) {
      const randomElement =
        packs.packs.base.uncommon[
          Math.floor(Math.random() * packs.packs.base.uncommon.length)
        ];
      AddCard(owned, randomElement, playerid);
      cardsgiven.push(randomElement);
    }
    for (let i = 0; i < rare; i++) {
      const randomElement =
        packs.packs.base.rare[
          Math.floor(Math.random() * packs.packs.base.rare.length)
        ];
      AddCard(owned, randomElement, playerid);
      cardsgiven.push(randomElement);
    }
    recipetype = "P";
  }
  SetMats(curmats);
  SaveOwned(playerid, owned);
  ctx.response.body = {
    given: cardsgiven,
    recipe: lettercode,
    type: recipetype,
    letters: givenletters,
  };
});
Manage.post("/mats/give", bodyParser(), (ctx, next) => {
  let victoryinfo = ctx.request.body as {
    id: PlayerID;
    victory: { type: string; victory: boolean };
  };
  // figure out rewards
  const letterrewardsall: string[] = [];
  Object.entries(crafting.rewardrates).forEach((entry) => {
    const [reward, amount] = entry;
    for (let i = 0; i < amount; i++) {
      letterrewardsall.push(reward);
    }
  });

  const letterrewards: string[] = [];

  const cardrewards: string[] = [];
  const winamount = victoryinfo.victory.victory ? 3 : 1;
  for (let i = 0; i < winamount; i++) {
    letterrewards.push(
      letterrewardsall[~~(Math.random() * letterrewardsall.length)]
    );
  }

  // if the type is defined
  if (victoryinfo.victory.type) {
    cardrewards.push(victoryinfo.victory.type);
  }
  const newmats: DbCraftingMats = {
    playerid: victoryinfo.id,
    mats: [],
  };

  letterrewards.forEach((letter) => {
    let found: boolean = false;
    for (const mat of newmats.mats) {
      if (mat.letter == letter) {
        mat.amount = mat.amount + 1;
        found = true;
        continue;
      }
    }
    if (!found) {
      const newmat: DbCraftingMat = {
        playerid: victoryinfo.id,
        letter: letter,
        amount: 1,
      };
      newmats.mats.push(newmat);
    }
  });

  //give the player their rewards
  GiveMats(newmats);
  // return what those rewards are.
  ctx.body = { letterrewards: letterrewards, cardrewards: cardrewards };
  return true;
});

//replace the module
Manage.post("/decks/save/:deckid", bodyParser(), (ctx, next) => {
  const deckid = ctx.params.deckid;
  let deck = ctx.request.body as { deck: DbFullDeck };

  DeleteDeck(deckid);
  CreateDeck(deck.deck);
  ctx.body = { success: true };
  return true;
});
Manage.use(bodyParser());
Manage.get("/test", (ctx, next) => {
  const playerid = nanoid();
  const deckid = nanoid();
  const secret = authenticator.generateSecret();

  let starterdeck = LoadJsonDeck("debug");

  if (starterdeck === undefined) {
    console.log("couldnt load deck");
    next();
    return;
  }
  starterdeck.deck.deckid = deckid;
  starterdeck.deck.ownerid = playerid;
  const startowned: DbOwnedCard[] = [];
  starterdeck.cards.map((value: DbDeckCard, index: number) => {
    const newcard: DbOwnedCard = {
      cardid: value.cardid,
      amount: value.amount,
      playerid: "NONE",
    };
    startowned.push(newcard);
  });

  const success = CreatePlayer(
    {
      playerid: playerid,
      username: "testymastexr",
      visualname: "",
      authenticationcode: secret,
      selecteddeck: deckid,
    },
    startowned,
    starterdeck
  );
  if (success === undefined) {
    console.log("couldnt create player");
    return;
  }

  const testblob = {
    player: GetPlayer(playerid),
    deck: GetFullDeck(deckid),
    owned: GetOwnedCards(playerid),
    keyuri: authenticator.keyuri(success.playerid, "CMC", secret),
  };

  ctx.response.body = JSON.stringify(testblob);
});

Manage.get("/decks/list/:playerid", (ctx, next) => {
  const playerid = ctx.params.playerid;
  ctx.body = { playerid: playerid, decks: GetDeckList(playerid) };
});
Manage.get("/decks/get/:deckid", (ctx, next) => {
  const deckid = ctx.params.deckid;
  ctx.body = { deckid: deckid, decks: GetFullDeck(deckid) };
});
Manage.get("/decks/create/:playerid", (ctx, next) => {
  const newdeckid = nanoid();
  const newemptydeck = NewEmptyDeck(ctx.params.playerid, newdeckid);
  CreateDeck(newemptydeck);
  ctx.body = { deckid: newdeckid, deck: newemptydeck };
});
Manage.get("/player/getbyname/:name", (ctx, next) => {
  const playerid = GetPlayerIdFromName(ctx.params.name);
  ctx.body = {
    name: ctx.params.name,
    playerid: playerid,
  };
});

Manage.get("/player/getbyid/:id", (ctx, next) => {
  const player = GetPlayer(ctx.params.id);
  ctx.body = { player: player };
});

Manage.get("/player/getowned/:id", (ctx, next) => {
  const owned = GetOwnedCards(ctx.params.id);
  ctx.body = { owned: owned };
});
Manage.get("/decks/select/:playerid/:deckid", (ctx, next) => {
  console.log("Selecting deck");
  const deckid = ctx.params.deckid;
  const playerid = ctx.params.playerid;
  console.dir(ctx.params);
  // load player
  const player = GetPlayer(playerid);
  if (!player || player === undefined) {
    ctx.response.body = { error: "could not load player" };
    console.log("Selecting deck");
    return next();
  }
  // load deck
  const decks = GetDeckList(playerid);

  console.dir(decks);
  //check owner
  let found = false;
  for (const deck of decks) {
    if (deck.deckid == deckid) {
      found = true;
      break;
    }
  }

  if (!found) {
    ctx.response.body = { error: "could not authenticate deck" };
    return next();
  }

  console.log("setting to " + deckid);
  // change deck id
  SetDeck(playerid, deckid);

  player.selecteddeck = deckid;
  // return info
  ctx.request.body = {
    decks: decks,
    player: player,
  };
});
Manage.get("/player/getsession", (ctx, next) => {
  if (ctx.session === null) {
    ctx.body = { playerid: "" };
    return;
  }
  const player = ctx.session.player || undefined;
  if (player !== undefined) {
    ctx.body = { playerid: ctx.session.player.playerid };
  } else ctx.body = { playerid: "" };
});
//is it safe? I dunno
Manage.get("/player/login/:name/:authcode", (ctx, next) => {
  const playerid = GetPlayerIdFromName(ctx.params.name);
  if (playerid == "") throw "Player not found";
  const player = GetPlayer(playerid);
  if (player === undefined) throw "Player not found from ID";
  let success = authenticator.check(
    ctx.params.authcode,
    player.authenticationcode
  );
  //TODO: make this only work in dev environment
  if (ctx.params.authcode == "DEBUG") {
    success = true;
  }
  if (!success) {
    throw (
      "Invalid authenticator code " +
      ctx.params.authcode +
      " for secret " +
      player.authenticationcode
    );
  }
  if (ctx.session === null) {
    ctx.body = { success: false };
    return;
  }
  ctx.session.player = player;
  ctx.body = {
    success: success,
    player: player,
  };
});

Manage.get("/player/create/:name/:deck", (ctx, next) => {
  const playerid = nanoid();
  const deckid = nanoid();
  const secret = authenticator.generateSecret();
  const dbPlayer: DbPlayer = {
    playerid: playerid,
    username: ctx.params.name,
    visualname: ctx.params.name,
    authenticationcode: secret,
    selecteddeck: deckid,
  };

  let starterdeck = LoadJsonDeck(ctx.params.deck);

  if (starterdeck === undefined) {
    throw "couldnt load deck";
  }
  starterdeck.deck.deckid = deckid;
  starterdeck.deck.ownerid = playerid;
  const startowned: DbOwnedCard[] = [];
  starterdeck.cards.map((value: DbDeckCard, index: number) => {
    const newcard: DbOwnedCard = {
      cardid: value.cardid,
      amount: value.amount,
      playerid: "NONE",
    };
    startowned.push(newcard);
  });

  const player = CreatePlayer(dbPlayer, startowned, starterdeck);
  if (player === undefined) throw "Player was undefined";

  ctx.body = {
    player: player,
    keyuri: authenticator.keyuri(player.username, "CMC", secret),
  };
});
