import fs from 'fs';
import { execSync } from 'child_process';

const img1Base64 = fs.readFileSync('/Users/jirnyak/Mirror/screens/1.png').toString('base64');

const jsCode = `
(function() {
  const bodyEl = document.querySelector('.editorPage__text.text.editor') || document.querySelector('div[placeholder="Your post goes here..."]');
  if (!bodyEl) return 'NO_BODY_EL';

  const imgHtml = '<figure class="editorMedia"><img src="data:image/png;base64,${img1Base64}" style="max-width:100%; border-radius:8px;" /><figcaption>Обложка статьи: Бетонный коридор ГИГАХРУЩА</figcaption></figure>';
  bodyEl.innerHTML = imgHtml + bodyEl.innerHTML;
  bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
  bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
  return 'BASE64_IMAGE_INSERTED';
})();
`;

fs.writeFileSync('/tmp/test_base64_img.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/test_base64_img.js"
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/test_base64_img.scpt', applescriptCode);
const res = execSync('osascript /tmp/test_base64_scpt.scpt || osascript /tmp/test_base64_img.scpt').toString();
console.log('Result:', res.trim());
