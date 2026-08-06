import fs from 'fs';
import { execSync } from 'child_process';

const screensDir = '/Users/jirnyak/Mirror/screens';

const markdown = fs.readFileSync('/Users/jirnyak/Mirror/gigahrush/PRCampaign/teletype_article_1.md', 'utf-8');
const lines = markdown.split('\n');

let title = "Мы делаем ГИГАХРУЩ: браузерный survival horror без движка, ассетов и спокойной жизни";
if (lines[0].startsWith('# ')) {
  title = lines[0].replace(/^#\s+/, '').trim();
}

const bodyLines = lines.slice(1);
let textContent = '';

for (let line of bodyLines) {
  let trimmed = line.trim();

  if (!trimmed) {
    textContent += '\n\n';
    continue;
  }

  if (trimmed === 'IMG_PLACEHOLDER_1') { textContent += '\n[Обложка: Бетонный лабиринт ГИГАХРУЩА]\n'; continue; }
  if (trimmed === 'IMG_PLACEHOLDER_2') { textContent += '\n[Инвентарь и подготовка к вылазке]\n'; continue; }
  if (trimmed === 'IMG_PLACEHOLDER_3') { textContent += '\n[Структура блока и миникарта сектора]\n'; continue; }
  if (trimmed === 'IMG_PLACEHOLDER_4') { textContent += '\n[Бой в узостях коридоров]\n'; continue; }
  if (trimmed === 'IMG_PLACEHOLDER_5') { textContent += '\n[Социальная система A-Life]\n'; continue; }
  if (trimmed === 'IMG_PLACEHOLDER_6') { textContent += '\n[Самосбор и задраенный гермозатвор]\n'; continue; }
  if (trimmed === 'IMG_PLACEHOLDER_7') { textContent += '\n[ГИГАХРУЩ: Браузерный survival horror]\n'; continue; }

  textContent += trimmed + '\n';
}

fs.writeFileSync('/tmp/clipboard_article.txt', textContent);
execSync('cat /tmp/clipboard_article.txt | pbcopy');

const encodedTitle = encodeURIComponent(title);

const jsCode = `
(function() {
  const title = decodeURIComponent("${encodedTitle}");
  const titleEl = document.querySelector('.editorPage__header_title .editor') || document.querySelector('h1');
  if (titleEl) {
    titleEl.innerText = title;
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const bodyEl = document.querySelector('.editorPage__text');
  if (bodyEl) {
    bodyEl.focus();
    const range = document.createRange();
    range.selectNodeContents(bodyEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  return 'FOCUSED';
})();
`;

fs.writeFileSync('/tmp/native_focus.js', jsCode);

// Step 1: Focus Chrome & Editor
execSync(`osascript -e 'tell application "Google Chrome" to activate'`);
execSync(`osascript -e 'tell application "Google Chrome" to execute tab 16 of window 1 javascript (read POSIX file "/tmp/native_focus.js")'`);

// Step 2: Simulate OS Native Cmd+A, Delete, Cmd+V
const pasteScript = `
tell application "Google Chrome" to activate
delay 0.2
tell application "System Events"
  keystroke "a" using {command down}
  delay 0.1
  key code 51
  delay 0.1
  keystroke "v" using {command down}
end tell
`;

fs.writeFileSync('/tmp/native_paste.scpt', pasteScript);
const res = execSync('osascript /tmp/native_paste.scpt').toString();
console.log('Native OS Paste completed! Result:', res.trim());
