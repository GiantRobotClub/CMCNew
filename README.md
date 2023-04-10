# CMCNew

Cardmaster Conflict will return

uses:
http://www.boardgame.io
Node/React

npm install should give you it working

todo:

- there is a bug that occurs during the play phase where the client and master get desynched when using spells. i've seen it happen a lot when doing cpuvscpu matches to test. The master thinks they are in the combat phase and the client thinkts they are in play, getting the cpu stuck. For whatever reason though -you- can click next and if it gets in there at the right time it works, but the cpu cant do it. I dont know if this would only happen with cpus or also with players.
- deck management
- card defs
- art
- stat modifiers
- card ability functions (discard)
- possibly allow more than one ability func per ability for chaining.
- possibly allow more than one target for ability (ie, multiple pickTargetForAbility stages in a row, and an array of target data)
- fix the logic for using abilities in other phases than play
- animations
- chat
- allow 'challenging' instead of just waiting for people
- proper lobby
-
