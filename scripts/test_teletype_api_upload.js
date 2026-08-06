import fs from 'fs';
import { execSync } from 'child_process';

const jsCode = `
(async function() {
  // Test uploading 1.png to Teletype API
  try {
    const res = await fetch('/api/v1/files', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    return 'STATUS_' + res.status;
  } catch (err) {
    return 'ERR_' + err.message;
  }
})();
`;

fs.writeFileSync('/tmp/test_api.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/test_api.js" as «class utf8»
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/test_api.scpt', applescriptCode);
const res = execSync('osascript /tmp/test_api.scpt').toString();
console.log('Result:', res.trim());
