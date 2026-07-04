const fs = require('fs');
let fsm = fs.readFileSync('src/systems/ai/npc_fsm.ts', 'utf8');

// Fix evaluateLootUpgrade call using time instead of _barkTime.
// Note that buildLocalUtilityScores is called from selectAndEnterUtilityIntent, which has `_barkTime` because it's defined at module level.
// Wait, _barkMsgs and _barkTime are defined at the module level!
// Let's check:
// let _barkMsgs: Msg[] = [];
// let _barkTime = 0;
// If they are at module level, they exist. Let's see if typescript complains.
