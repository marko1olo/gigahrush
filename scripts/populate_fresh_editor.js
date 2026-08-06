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
    if (inList) { html += '</ul></div>'; inList = false; }
    continue;
  }

  if (trimmed === 'IMG_PLACEHOLDER_1') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += makeImageHtml(img1, 'Обложка: Бетонный лабиринт ГИГАХРУЩА');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_2') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += makeImageHtml(img2, 'Инвентарь и подготовка к вылазке (еда, вода, патроны)');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_3') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += makeImageHtml(img3, 'Структура блока и миникарта сектора');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_4') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += makeImageHtml(img4, 'Бой в узостях коридоров');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_5') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += makeImageHtml(img5, 'Социальная система A-Life и общение с обитателями');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_6') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += makeImageHtml(img6, 'Самосбор и задраенный гермозатвор');
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_7') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += makeImageHtml(img7, 'ГИГАХРУЩ: Браузерный survival horror');
    continue;
  }

  if (trimmed === '---' || trimmed === '***') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += '<div class="editor m_line m_hr"><hr></div>';
    continue;
  }

  if (trimmed.startsWith('## ')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    const text = trimmed.replace(/^##\s+/, '');
    html += `<div class="editor m_line m_h2"><b>${formatInline(text)}</b></div>`;
    continue;
  }
  if (trimmed.startsWith('### ')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    const text = trimmed.replace(/^###\s+/, '');
    html += `<div class="editor m_line m_h3"><b>${formatInline(text)}</b></div>`;
    continue;
  }

  if (trimmed.startsWith('> ')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    const text = trimmed.replace(/^>\s+/, '');
    html += `<div class="editor m_line m_quote">${formatInline(text)}</div>`;
    continue;
  }

  if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
    if (!inList) { html += '<div class="editor m_line m_ul"><ul>'; inList = true; }
    const text = trimmed.replace(/^[\*\-]\s+/, '');
    html += `<li>${formatInline(text)}</li>`;
    continue;
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line">${formatInline(trimmed)}</div>`;
    continue;
  }

  if (inList) { html += '</ul></div>'; inList = false; }
  html += `<div class="editor m_line">${formatInline(trimmed)}</div>`;
}

if (inList) { html += '</ul></div>'; }

function makeImageHtml(base64, caption) {
  return `<div class="editor m_line m_figure" style="margin: 24px 0; text-align: center;"><figure style="margin:0;"><img src="data:image/png;base64,${base64}" style="max-width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" /><figcaption style="font-size:14px; opacity:0.75; margin-top:8px;">${caption}</figcaption></figure></div>`;
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
    titleEl.innerText = title;
    titleEl.classList.remove('m_empty', 'm_error');
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const bodyEl = document.querySelector('.editorPage__text');
  if (bodyEl) {
    bodyEl.innerHTML = html;
    bodyEl.classList.remove('m_empty', 'm_error');
    bodyEl.removeAttribute('placeholder');

    bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
    bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
    bodyEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    bodyEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
  }
  return 'POPULATED_FRESH_EDITOR';
})();
`;

fs.writeFileSync('/tmp/populate_fresh.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/populate_fresh.js"
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/populate_fresh.scpt', applescriptCode);
const res = execSync('osascript /tmp/populate_fresh.scpt').toString();
console.log('Result:', res.trim());
