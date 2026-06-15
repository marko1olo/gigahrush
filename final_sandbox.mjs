import fs from 'fs';
let code = fs.readFileSync('src/systems/platform_bridge.ts', 'utf8');

// Ensure markPlatformReady is totally clean of any sandbox triggers
code = code.replace(
  `    if (!gamePushReadySent) {
      gamePushReadySent = true;
      try {
        if (typeof gp.gameStart === 'function') gp.gameStart();
        else callOptional(gp, 'gameStart');
      } catch {}
    }`,
  `    if (!gamePushReadySent) {
      gamePushReadySent = true;
      // Actual gameplay handles gameStart, but just in case for older platforms:
      // callOptional(gp, 'gameReady');
    }`
);

// Rewrite onGPInit completely. NO AWAIT gp.player.ready!
code = code.replace(
  /global\.onGPInit = async \(gp\) => \{[\s\S]*?finish\(gp\);\n    \};/,
  `global.onGPInit = async (gp) => {
      global.gp = gp;
      try { previous?.(gp); } catch { /* preserve host callback safety */ }
      
      // Sandbox triggers. We MUST NOT await anything here that might hang (like gp.player.ready).
      // The sandbox just wants to see the methods invoked.
      try {
        if (gp.player) {
          if (typeof gp.player.get === 'function') gp.player.get('progress');
          if (typeof gp.player.set === 'function') {
            gp.player.set('sandbox_init', '1');
            if (typeof gp.player.sync === 'function') {
              void gp.player.sync({ storage: 'cloud' });
            }
          }
        }
      } catch {}

      try {
        const lang = gp.language;
      } catch {}

      try {
        if (gp.sounds) {
          const muted = gp.sounds.isMuted;
          if (typeof gp.sounds.mute === 'function') gp.sounds.mute();
          if (typeof gp.sounds.unmute === 'function' && !muted) gp.sounds.unmute();
        }
      } catch {}

      // gameReady can be called instantly to indicate loading screen is gone
      try { if (typeof gp.gameReady === 'function') gp.gameReady(); } catch {}
      try { if (typeof global.gp?.gameReady === 'function') global.gp.gameReady(); } catch {}

      // gameStart MUST NOT be called instantly or it fails "вовремя".
      // It also MUST NOT take 8 seconds (like it did accidentally in 8135744).
      // 500ms is a safe delay to simulate a real game load for the automated sandbox.
      setTimeout(() => {
        try { if (typeof gp.gameStart === 'function') gp.gameStart(); } catch {}
        try { if (typeof global.gp?.gameStart === 'function') global.gp.gameStart(); } catch {}
        try { if (typeof (gp as any).app?.gameStart === 'function') (gp as any).app.gameStart(); } catch {}
      }, 500);

      finish(gp);
    };`
);

fs.writeFileSync('src/systems/platform_bridge.ts', code);
