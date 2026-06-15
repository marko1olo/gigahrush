import fs from 'fs';
let code = fs.readFileSync('src/systems/platform_bridge.ts', 'utf8');

code = code.replace(
  `    // Wait for SDK to be internally ready before sending gameStart so GamePush registers it
    if (gp.ready) {
      try { await gp.ready; } catch {}
    }

    if (!gamePushReadySent) {`,
  `    if (!gamePushReadySent) {`
);

fs.writeFileSync('src/systems/platform_bridge.ts', code);
