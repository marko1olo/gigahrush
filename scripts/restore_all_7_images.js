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

const title = "Мы делаем ГИГАХРУЩ: браузерный survival horror без движка, ассетов и спокойной жизни";
const cap1 = "Обложка: Бетонный лабиринт ГИГАХРУЩА";
const cap2 = "Инвентарь и подготовка к вылазке (еда, вода, патроны)";
const cap3 = "Структура блока и миникарта сектора";
const cap4 = "Бой в узостях коридоров";
const cap5 = "Социальная система A-Life и общение с обитателями";
const cap6 = "Самосбор и задраенный гермозатвор";
const cap7 = "ГИГАХРУЩ: Браузерный survival horror";

const encodedTitle = encodeURIComponent(title);
const encodedCap1 = encodeURIComponent(cap1);
const encodedCap2 = encodeURIComponent(cap2);
const encodedCap3 = encodeURIComponent(cap3);
const encodedCap4 = encodeURIComponent(cap4);
const encodedCap5 = encodeURIComponent(cap5);
const encodedCap6 = encodeURIComponent(cap6);
const encodedCap7 = encodeURIComponent(cap7);

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

  const img1 = "${img1}";
  const img2 = "${img2}";
  const img3 = "${img3}";
  const img4 = "${img4}";
  const img5 = "${img5}";
  const img6 = "${img6}";
  const img7 = "${img7}";

  // Fix Title
  const titleEl = document.querySelector('.editorPage__header_title .editor') || document.querySelector('h1');
  if (titleEl) {
    titleEl.innerText = title;
    titleEl.classList.remove('m_empty', 'm_error');
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function makeFig(b64, caption) {
    const div = document.createElement('div');
    div.className = 'editor m_line m_figure';
    div.style.cssText = 'margin: 24px 0; text-align: center;';
    div.innerHTML = '<figure style="margin:0;"><img src="data:image/png;base64,' + b64 + '" style="max-width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" /><figcaption style="font-size:14px; opacity:0.75; margin-top:8px; display:block; text-align:center;">' + caption + '</figcaption></figure>';
    return div;
  }

  const bodyEl = document.querySelector('.editorPage__text');
  if (!bodyEl) return 'NO_BODY';

  // Remove existing figures if any
  const existingFigs = bodyEl.querySelectorAll('.m_figure, figure');
  existingFigs.forEach(f => f.remove());

  const children = Array.from(bodyEl.children);

  for (let el of children) {
    const txt = el.innerText || '';

    if (txt.includes('Zero runtime dependencies')) {
      el.after(makeFig(img1, cap1));
    } else if (txt.includes('Идеальный сценарий')) {
      el.after(makeFig(img2, cap2));
    } else if (txt.includes('сущностями и событиями')) {
      el.after(makeFig(img3, cap3));
    } else if (txt.includes('дистанцию, туман, вспышки и опасность')) {
      el.after(makeFig(img4, cap4));
    } else if (txt.includes('социальной математике')) {
      el.after(makeFig(img5, cap5));
    } else if (txt.includes('не успевшие укрыться NPC погибают')) {
      el.after(makeFig(img6, cap6));
    } else if (txt.includes('Локальные сохранения')) {
      el.after(makeFig(img7, cap7));
    }
  }

  bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
  bodyEl.dispatchEvent(new Event('change', { bubbles: true }));

  return 'RESTORED_ALL_7_IMAGES_SUCCESS';
})();
`;

fs.writeFileSync('/tmp/restore_imgs.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/restore_imgs.js" as «class utf8»
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/restore_imgs.scpt', applescriptCode);
const res = execSync('osascript /tmp/restore_imgs.scpt').toString();
console.log('Result:', res.trim());
