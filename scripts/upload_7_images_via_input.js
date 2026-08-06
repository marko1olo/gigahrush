import fs from 'fs';
import { execSync } from 'child_process';

const screensDir = '/Users/jirnyak/Mirror/screens';

const img1 = fs.readFileSync(`${screensDir}/1.png`).toString('base64');
const img2 = fs.readFileSync(`${screensDir}/2.png`).toString('base64');
const img3 = fs.readFileSync(`${screensDir}/3.png`).toString('base64');
const img4 = fs.readFileSync(`${screensDir}/4.png`).toString('base64');
const img5 = fs.readFileSync(`${screensDir}/5.png`).toString('base64');
const img6 = fs.readFileSync(`${screensDir}/6.png`).toString('base64');
const img7 = fs.readFileSync(`${screensDir}/7.png`).toString('base64');

const jsCode = `
(async function() {
  const fileInput = document.querySelector('input[type=file]');
  if (!fileInput) return 'NO_FILE_INPUT';

  const b64s = ["${img1}", "${img2}", "${img3}", "${img4}", "${img5}", "${img6}", "${img7}"];
  const filenames = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png'];

  const dt = new DataTransfer();

  for (let i = 0; i < b64s.length; i++) {
    const res = await fetch('data:image/png;base64,' + b64s[i]);
    const blob = await res.blob();
    const file = new File([blob], filenames[i], { type: 'image/png' });
    dt.items.add(file);
  }

  fileInput.files = dt.files;
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));

  return 'UPLOAD_TRIGGERED_SUCCESS';
})();
`;

fs.writeFileSync('/tmp/upload_files.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/upload_files.js" as «class utf8»
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/upload_files.scpt', applescriptCode);
const res = execSync('osascript /tmp/upload_files.scpt').toString();
console.log('Result:', res.trim());
