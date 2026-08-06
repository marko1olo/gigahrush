import fs from 'fs';
import { execSync } from 'child_process';

const jsCode = `
(async function() {
  const bodyEl = document.querySelector('.editorPage__text');
  if (!bodyEl) return 'NO_BODY';

  // Check if Teletype editor handles File paste
  const fileInput = document.querySelector('input[type=file]');
  return JSON.stringify({
    hasFileInput: !!fileInput,
    fileInputClass: fileInput ? fileInput.className : null,
    bodyEditable: bodyEl.isContentEditable
  });
})();
`;

fs.writeFileSync('/tmp/test_file_paste.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/test_file_paste.js" as «class utf8»
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/test_file_paste.scpt', applescriptCode);
const res = execSync('osascript /tmp/test_file_paste.scpt').toString();
console.log('Result:', res.trim());
