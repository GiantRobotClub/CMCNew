const isClient = typeof window != "undefined" && window.document;
let dbmod;
if (!isClient) {
  dbmod = await import("./db");
}

function CreateDeck(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.CreateDeck(...args);
}
function LoadJsonDeck(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.LoadJsonDeck(...args);
}

function GetDeck(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.GetDeck(...args);
}

function GetDeckList(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.GetDeckList(...args);
}
function GetDeckCards(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.GetDeckCards(...args);
}
function DbDeckCard(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.DbDeckCard(...args);
}
function CreatePlayer(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.CreatePlayer(...args);
}
function GetFullDeck(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.GetFullDeck(...args);
}
function GetOwnedCards(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.GetOwnedCards(...args);
}
function GetPlayer(...args) {
  if (isClient) {
    console.log("running on client");
    return undefined;
  }

  console.log("running on srvr");
  return dbmod.GetPlayer(...args);
}
function GetPlayerIdFromName(...args) {
  if (isClient) {
    return undefined;
  }
  return dbmod.GetPlayerIdFromName(...args);
}

export {
  CreateDeck,
  CreatePlayer,
  GetDeck,
  GetDeckCards,
  GetPlayer,
  GetOwnedCards,
  GetFullDeck,
  GetPlayerIdFromName,
  LoadJsonDeck,
  DbDeckCard,
  GetDeckList,
};
