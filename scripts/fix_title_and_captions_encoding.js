import fs from 'fs';
import { execSync } from 'child_process';

const title = "Мы делаем ГИГАХРУЩ: браузерный survival horror без движка, ассетов и спокойной жизни";
const caption1 = "Обложка: Бетонный лабиринт ГИГАХРУЩА";
const caption2 = "Инвентарь и подготовка к вылазке (еда, вода, патроны)";
const caption3 = "Структура блока и миникарта сектора";
const caption4 = "Бой в узостях коридоров";
const caption5 = "Социальная система A-Life и общение с обитателями";
const caption6 = "Самосбор и задраенный гермозатвор";
const caption7 = "ГИГАХРУЩ: Браузерный survival horror";

const encodedTitle = encodeURIComponent(title);
const encodedCap1 = encodeURIComponent(caption1);
const encodedCap2 = encodeURIComponent(caption2);
const encodedCap3 = encodeURIComponent(caption3);
const encodedCap4 = encodeURIComponent(caption4);
const encodedCap5 = encodeURIComponent(caption5);
const encodedCap6 = encodeURIComponent(caption6);
const encodedCap7 = encodeURIComponent(caption7);

const jsCode = `
(function() {
  const title = decodeURIComponent("${encodedTitle}");
  const cap1 = decodeURIComponent("${encodedCap1}");
  const cap2 = decodeURIComponent("${encodedCap2}");
  const cap3 = decodeURIComponent("${encodedCap3}");
  const cap4 = decodeURIComponent("${encodedCap4}");
  const cap5 = decodeURIComponent("${encodedCap5}");
  const cap6 = decodeURIComponent("${encodedCap6}");
  const cap7 = decodeURIComponent("${encodedCap7}");

  // Fix Title
  const titleEl = document.querySelector('.editorPage__header_title .editor') || document.querySelector('h1');
  if (titleEl) {
    titleEl.innerText = title;
    titleEl.classList.remove('m_empty', 'm_error');
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Remove duplicate markdown title line inside body if present
  const bodyEl = document.querySelector('.editorPage__text');
  if (bodyEl) {
    const firstP = bodyEl.querySelector('p');
    if (firstP && firstP.innerText.includes('# Мы делаем')) {
      firstP.remove();
    }

    // Fix figcaptions
    const caps = bodyEl.querySelectorAll('figcaption');
    const capList = [cap1, cap2, cap3, cap4, cap5, cap6, cap7];
    caps.forEach((c, idx) => {
      if (capList[idx]) {
        c.innerText = capList[idx];
      }
    });

    bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
    bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return 'ENCODING_PERFECT_FIXED';
})();
`;

fs.writeFileSync('/tmp/fix_encoding.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/fix_encoding.js" as «class utf8»
tell application "Google Chrome"
  execute tab 15 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/fix_encoding.scpt', applescriptCode);
const res = execSync('osascript /tmp/fix_encoding.scpt').toString();
console.log('Result:', res.trim());
