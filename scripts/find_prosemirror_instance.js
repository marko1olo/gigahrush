import fs from 'fs';
import { execSync } from 'child_process';

const jsCode = `
(function() {
  const el = document.querySelector('.editorPage__text');
  if (!el) return 'NO_EL';

  const keys = Object.keys(el);
  const pmKeys = keys.filter(k => k.toLowerCase().includes('pm') || k.toLowerCase().includes('editor') || k.toLowerCase().includes('vue'));

  return JSON.stringify({
    allKeys: keys,
    pmKeys: pmKeys
  });
})();
`;

fs.writeFileSync('/tmp/find_pm.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/find_pm.js" as «class utf8»
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/find_pm.scpt', applescriptCode);
const res = execSync('osascript /tmp/find_pm.scpt').toString();
console.log('Result:', res.trim());
