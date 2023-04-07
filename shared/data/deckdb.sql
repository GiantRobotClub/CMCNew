
CREATE TABLE IF NOT EXISTS deck (
    deckid text PRIMARY KEY UNIQUE NOT NULL,
    ownerid text,
    deckname text,
    deckicon text,
    persona text
);

CREATE TABLE IF NOT EXISTS deck_card (
    deckid text,
    cardid text,
    amount integer,
    PRIMARY KEY(deckid, cardid)
)
;
CREATE TABLE IF NOT EXISTS owned_card (
    playerid text,
    cardid text,
    amount integer,
    PRIMARY KEY(playerid, cardid)
)
;
CREATE TABLE IF NOT EXISTS player (
    playerid text PRIMARY KEY UNIQUE NOT NULL,
    username text UNIQUE NOT NULL,
    visualname text,
    authenticationcode text,
    selecteddeck text
);