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

const jsCode = `
(function() {
  const title = ${JSON.stringify(title)};
  const img1 = "${img1}";
  const img2 = "${img2}";
  const img3 = "${img3}";
  const img4 = "${img4}";
  const img5 = "${img5}";
  const img6 = "${img6}";
  const img7 = "${img7}";

  function makeImageHtml(b64, caption) {
    return '<figure style="margin:24px 0; text-align:center;"><img src="data:image/png;base64,' + b64 + '" style="max-width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" /><figcaption style="font-size:14px; opacity:0.75; margin-top:8px; display:block;">' + caption + '</figcaption></figure>';
  }

  function formatInline(str) {
    return str
      .replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>')
      .replace(/\\*(.*?)\\*/g, '<i>$1</i>')
      .replace(/\\[(.*?)\\]\\((.*?)\\)/g, '<a href="$2" target="_blank">$1</a>');
  }

  // Title
  const titleEl = document.querySelector('.editorPage__header_title .editor') || document.querySelector('h1');
  if (titleEl) {
    titleEl.innerText = title;
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const bodyEl = document.querySelector('.editorPage__text');
  if (!bodyEl) return 'NO_BODY';

  const paragraphs = Array.from(bodyEl.querySelectorAll('p, div, blockquote, h2, h3'));
  let newHtml = '';
  let inList = false;

  for (let p of paragraphs) {
    let text = p.innerText.trim();

    if (!text) continue;

    if (text.startsWith('# Мы делаем ГИГАХРУЩ')) continue;

    // Screenshot replacements
    if (text.includes('СКРИНШОТ') && (text.includes('1') || text.includes('ОБЛОЖКА'))) {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += makeImageHtml(img1, 'Обложка: Бетонный лабиринт ГИГАХРУЩА');
      continue;
    }
    if (text.includes('СКРИНШОТ') && (text.includes('2') || text.includes('ИНВЕНТАРЬ'))) {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += makeImageHtml(img2, 'Инвентарь и подготовка к вылазке (еда, вода, патроны)');
      continue;
    }
    if (text.includes('СКРИНШОТ') && (text.includes('3') || text.includes('КАРТА'))) {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += makeImageHtml(img3, 'Структура блока и миникарта сектора');
      continue;
    }
    if (text.includes('СКРИНШОТ') && (text.includes('4') || text.includes('БОЙ'))) {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += makeImageHtml(img4, 'Бой в узостях коридоров');
      continue;
    }
    if (text.includes('СКРИНШОТ') && (text.includes('5') || text.includes('ДИАЛОГ') || text.includes('A-Life'))) {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += makeImageHtml(img5, 'Социальная система A-Life и общение с обитателями');
      continue;
    }
    if (text.includes('СКРИНШОТ') && (text.includes('6') || text.includes('САМОСБОР'))) {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += makeImageHtml(img6, 'Самосбор и задраенный гермозатвор');
      continue;
    }
    if (text.includes('СКРИНШОТ') && (text.includes('7') || text.includes('ФИНАЛЬНЫЙ'))) {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += makeImageHtml(img7, 'ГИГАХРУЩ: Браузерный survival horror');
      continue;
    }

    if (text === '---' || text === '***') {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += '<hr><br>';
      continue;
    }

    if (text.startsWith('## ') || p.tagName === 'H2') {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += '<h2><b>' + formatInline(text.replace(/^##\\s+/, '')) + '</b></h2>';
      continue;
    }

    if (text.startsWith('### ') || p.tagName === 'H3') {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += '<h3><b>' + formatInline(text.replace(/^###\\s+/, '')) + '</b></h3>';
      continue;
    }

    if (text.startsWith('> ') || p.tagName === 'BLOCKQUOTE') {
      if (inList) { newHtml += '</ul>'; inList = false; }
      newHtml += '<blockquote>' + formatInline(text.replace(/^>\\s+/, '')) + '</blockquote>';
      continue;
    }

    if (text.startsWith('* ') || text.startsWith('- ')) {
      if (!inList) { newHtml += '<ul>'; inList = true; }
      newHtml += '<li>' + formatInline(text.replace(/^[\\*\\-]\\s+/, '')) + '</li>';
      continue;
    }

    if (inList) {
      newHtml += '</ul>';
      inList = false;
    }

    newHtml += '<p>' + formatInline(text) + '</p>';
  }

  if (inList) { newHtml += '</ul>'; }

  // Append image 7 before end if not inserted
  if (!newHtml.includes('img')) {
    newHtml += makeImageHtml(img1, 'Обложка: Бетонный лабиринт ГИГАХРУЩА');
  }

  bodyEl.innerHTML = newHtml;

  bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
  bodyEl.dispatchEvent(new Event('change', { bubbles: true }));

  return 'FORMATTED_DOM_WITH_ALL_IMAGES';
})();
`;

fs.writeFileSync('/tmp/format_dom.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/format_dom.js"
tell application "Google Chrome"
  execute tab 15 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/format_dom.scpt', applescriptCode);
const res = execSync('osascript /tmp/format_dom.scpt').toString();
console.log('Result:', res.trim());
