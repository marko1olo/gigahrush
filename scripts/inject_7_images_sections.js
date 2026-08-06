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
(function() {
  const img1 = "${img1}";
  const img2 = "${img2}";
  const img3 = "${img3}";
  const img4 = "${img4}";
  const img5 = "${img5}";
  const img6 = "${img6}";
  const img7 = "${img7}";

  function makeFig(b64, caption) {
    const f = document.createElement('figure');
    f.style.cssText = 'margin: 24px 0; text-align: center;';
    f.innerHTML = '<img src="data:image/png;base64,' + b64 + '" style="max-width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" /><figcaption style="font-size:14px; opacity:0.75; margin-top:8px; display:block;">' + caption + '</figcaption>';
    return f;
  }

  const bodyEl = document.querySelector('.editorPage__text');
  if (!bodyEl) return 'NO_BODY';

  const children = Array.from(bodyEl.children);

  for (let el of children) {
    const txt = el.innerText || '';

    if (txt.includes('Zero runtime dependencies')) {
      el.after(makeFig(img1, 'Обложка: Бетонный лабиринт ГИГАХРУЩА'));
    } else if (txt.includes('Идеальный сценарий')) {
      el.after(makeFig(img2, 'Инвентарь и подготовка к вылазке (еда, вода, патроны)'));
    } else if (txt.includes('сущностями и событиями')) {
      el.after(makeFig(img3, 'Структура блока и миникарта сектора'));
    } else if (txt.includes('дистанцию, туман, вспышки и опасность')) {
      el.after(makeFig(img4, 'Бой в узостях коридоров'));
    } else if (txt.includes('социальной математике')) {
      el.after(makeFig(img5, 'Социальная система A-Life и общение с обитателями'));
    } else if (txt.includes('не успевшие укрыться NPC погибают')) {
      el.after(makeFig(img6, 'Самосбор и задраенный гермозатвор'));
    } else if (txt.includes('Локальные сохранения')) {
      el.after(makeFig(img7, 'ГИГАХРУЩ: Браузерный survival horror'));
    }
  }

  bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
  bodyEl.dispatchEvent(new Event('change', { bubbles: true }));

  return 'INJECTED_ALL_7_IMAGES';
})();
`;

fs.writeFileSync('/tmp/inject_imgs.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/inject_imgs.js"
tell application "Google Chrome"
  execute tab 15 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/inject_imgs.scpt', applescriptCode);
const res = execSync('osascript /tmp/inject_imgs.scpt').toString();
console.log('Result:', res.trim());
