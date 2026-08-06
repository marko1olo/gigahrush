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

const markdown = fs.readFileSync('/Users/jirnyak/Mirror/gigahrush/PRCampaign/teletype_article_1.md', 'utf-8');
const lines = markdown.split('\n');

let title = "Мы делаем ГИГАХРУЩ: браузерный survival horror без движка, ассетов и спокойной жизни";
if (lines[0].startsWith('# ')) {
  title = lines[0].replace(/^#\s+/, '').trim();
}

const bodyLines = lines.slice(1);
let html = '';
let inList = false;

for (let line of bodyLines) {
  let trimmed = line.trim();

  if (!trimmed) {
    if (inList) { html += '</ul>'; inList = false; }
    continue;
  }

  if (trimmed === 'IMG_PLACEHOLDER_1') {
    if (inList) { html += '</ul>'; inList = false; }
    html += makeImageHtml(img1, 'Обложка: Бетонный лабиринт ГИГАХРУЩА');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_2') {
    if (inList) { html += '</ul>'; inList = false; }
    html += makeImageHtml(img2, 'Инвентарь и подготовка к вылазке (еда, вода, патроны)');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_3') {
    if (inList) { html += '</ul>'; inList = false; }
    html += makeImageHtml(img3, 'Структура блока и миникарта сектора');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_4') {
    if (inList) { html += '</ul>'; inList = false; }
    html += makeImageHtml(img4, 'Бой в узостях коридоров');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_5') {
    if (inList) { html += '</ul>'; inList = false; }
    html += makeImageHtml(img5, 'Социальная система A-Life и общение с обитателями');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_6') {
    if (inList) { html += '</ul>'; inList = false; }
    html += makeImageHtml(img6, 'Самосбор и задраенный гермозатвор');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_7') {
    if (inList) { html += '</ul>'; inList = false; }
    html += makeImageHtml(img7, 'ГИГАХРУЩ: Браузерный survival horror');
    continue;
  }

  if (trimmed === '---' || trimmed === '***') {
    if (inList) { html += '</ul>'; inList = false; }
    html += '<hr>';
    continue;
  }

  if (trimmed.startsWith('## ')) {
    if (inList) { html += '</ul>'; inList = false; }
    const text = trimmed.replace(/^##\s+/, '');
    html += `<h2><b>${formatInline(text)}</b></h2>`;
    continue;
  }
  if (trimmed.startsWith('### ')) {
    if (inList) { html += '</ul>'; inList = false; }
    const text = trimmed.replace(/^###\s+/, '');
    html += `<h3><b>${formatInline(text)}</b></h3>`;
    continue;
  }

  if (trimmed.startsWith('> ')) {
    if (inList) { html += '</ul>'; inList = false; }
    const text = trimmed.replace(/^>\s+/, '');
    html += `<blockquote>${formatInline(text)}</blockquote>`;
    continue;
  }

  if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
    if (!inList) { html += '<ul>'; inList = true; }
    const text = trimmed.replace(/^[\*\-]\s+/, '');
    html += `<li>${formatInline(text)}</li>`;
    continue;
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${formatInline(trimmed)}</p>`;
    continue;
  }

  if (inList) { html += '</ul>'; inList = false; }
  html += `<p>${formatInline(trimmed)}</p>`;
}

if (inList) { html += '</ul>'; }

function makeImageHtml(base64, caption) {
  return `<figure style="margin: 24px 0; text-align: center;"><img src="data:image/png;base64,${base64}" style="max-width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" /><figcaption style="font-size:14px; opacity:0.75; margin-top:8px;">${caption}</figcaption></figure>`;
}

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
}

const encodedTitle = encodeURIComponent(title);
const encodedHtml = encodeURIComponent(html);

const jsCode = `
(function() {
  const title = decodeURIComponent("${encodedTitle}");
  const html = decodeURIComponent("${encodedHtml}");

  const titleEl = document.querySelector('.editorPage__header_title .editor') || document.querySelector('div[placeholder="Title of the post"]') || document.querySelector('h1');
  if (titleEl) {
    titleEl.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, title);
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const bodyEl = document.querySelector('.editorPage__text.text.editor') || document.querySelector('div[placeholder="Your post goes here..."]');
  if (bodyEl) {
    bodyEl.focus();
    document.execCommand('selectAll', false, null);
    
    // Paste using paste event or insertHTML so ProseMirror updates state
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer()
    });
    pasteEvent.clipboardData.setData('text/html', html);
    pasteEvent.clipboardData.setData('text/plain', html.replace(/<[^>]+>/g, ''));
    
    bodyEl.dispatchEvent(pasteEvent);
    
    // Fallback if paste event not handled by editor
    if (!bodyEl.innerText || bodyEl.innerText.length < 50) {
      document.execCommand('insertHTML', false, html);
    }

    bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
    bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Also trigger keyup / keydown to mark dirty in Vue
    bodyEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    bodyEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
  }
  return 'PROSEMIRROR_PASTE_SUCCESS';
})();
`;

fs.writeFileSync('/tmp/prosemirror_paste.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/prosemirror_paste.js"
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/prosemirror_paste.scpt', applescriptCode);
const res = execSync('osascript /tmp/prosemirror_paste.scpt').toString();
console.log('Result:', res.trim());
