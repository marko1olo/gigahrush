import fs from 'fs';
let code = fs.readFileSync('src/systems/platform_bridge.ts', 'utf8');

// Fix waitForGamePushReady to not wait for gp.player.ready to prevent 8s timeout
code = code.replace(
  /if \(gp\.player\?\.ready\) promises\.push\(gp\.player\.ready\);\s*if \(promises\.length === 0\) return;\s*await Promise\.race\(\[\s*Promise\.all\(promises\),\s*new Promise\(\(_, reject\) => setTimeout\(\(\) => reject\(new Error\('GP timeout'\)\), 8000\)\)\s*\]\);/g,
  `// gp.player.ready hangs in GamePush Sandbox, blocking initialization.
    // Do not wait for it here, otherwise markPlatformReady is called too late and fails the "вовремя" test.
    if (promises.length === 0) return;
    await Promise.race([
      Promise.all(promises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('GP timeout')), 2000))
    ]);`
);

// Fix markPlatformReady so await gp.player.ready does not block gp.gameStart
code = code.replace(
  `      try {
        if (gp.player) {
          if (gp.player.ready) await gp.player.ready;
          if (typeof (gp.player as any).fetch === 'function') await (gp.player as any).fetch();
          if (typeof gp.player.get === 'function') gp.player.get('progress');
          if (typeof gp.player.set === 'function') {
            gp.player.set('sandbox_init', '1');
            if (typeof gp.player.sync === 'function') {
              await gp.player.sync({ storage: 'cloud' });
            }
          }
        }
      } catch {}`,
  `      // Run player init asynchronously so it doesn't block gp.gameStart()
      void (async () => {
        try {
          if (gp.player) {
            if (gp.player.ready) await gp.player.ready;
            if (typeof (gp.player as any).fetch === 'function') await (gp.player as any).fetch();
            if (typeof gp.player.get === 'function') gp.player.get('progress');
            if (typeof gp.player.set === 'function') {
              gp.player.set('sandbox_init', '1');
              if (typeof gp.player.sync === 'function') {
                await gp.player.sync({ storage: 'cloud' });
              }
            }
          }
        } catch {}
      })();`
);

fs.writeFileSync('src/systems/platform_bridge.ts', code);
