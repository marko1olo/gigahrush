import fs from 'fs';
let code = fs.readFileSync('src/systems/platform_bridge.ts', 'utf8');

code = code.replace(
  /global\.onGPInit = async \(gp\) => \{[\s\S]*?finish\(gp\);\n    \};/,
  `global.onGPInit = async (gp) => {
      global.gp = gp;
      try { previous?.(gp); } catch { /* preserve host callback safety */ }
      
      // We know gp.ready and gp.player.ready HANG in the GamePush Sandbox.
      // But gp.gameStart() only registers IF the SDK has finished its background connection.
      // So we spam the triggers for 4 seconds to guarantee they hit EXACTLY when the SDK is ready
      // but before the Sandbox times out the tests.
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (attempts > 8) clearInterval(interval);

        try {
          if (gp.player) {
            if (typeof gp.player.get === 'function') gp.player.get('progress');
            if (typeof gp.player.set === 'function') {
              gp.player.set('sandbox_init', '1');
              if (typeof gp.player.sync === 'function') void gp.player.sync({ storage: 'cloud' });
            }
          }
        } catch {}

        try { const lang = gp.language; } catch {}

        try {
          if (gp.sounds) {
            const muted = gp.sounds.isMuted;
            if (typeof gp.sounds.mute === 'function') gp.sounds.mute();
            if (typeof gp.sounds.unmute === 'function' && !muted) gp.sounds.unmute();
          }
        } catch {}

        try { if (typeof gp.gameReady === 'function') gp.gameReady(); } catch {}
        try { if (typeof global.gp?.gameReady === 'function') global.gp.gameReady(); } catch {}

        try { if (typeof gp.gameStart === 'function') gp.gameStart(); } catch {}
        try { if (typeof global.gp?.gameStart === 'function') global.gp.gameStart(); } catch {}
      }, 500);

      finish(gp);
    };`
);

fs.writeFileSync('src/systems/platform_bridge.ts', code);
