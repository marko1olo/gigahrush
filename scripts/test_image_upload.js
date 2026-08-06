import fs from 'fs';
import { execSync } from 'child_process';

const img1Base64 = fs.readFileSync('/Users/jirnyak/Mirror/screens/1.png').toString('base64');

const jsCode = `
(function() {
  try {
    const base64Data = "${img1Base64}";
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const file = new File([blob], '1.png', { type: 'image/png' });

    const dt = new DataTransfer();
    dt.items.add(file);

    const input = document.querySelector('input[type=file]');
    if (!input) return 'NO_FILE_INPUT';

    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return 'FILE_DISPATCHED';
  } catch(e) {
    return 'ERROR: ' + e.toString();
  }
})();
`;

fs.writeFileSync('/tmp/test_img.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/test_img.js"
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/test_img.scpt', applescriptCode);
const res = execSync('osascript /tmp/test_img.scpt').toString();
console.log('Result:', res.trim());
