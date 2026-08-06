import fs from 'fs';
import { execSync } from 'child_process';

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

  // Screenshot placeholders (clean figure without 10MB base64)
  if (trimmed === 'IMG_PLACEHOLDER_1') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote"><b>[СКРИНШОТ №1: Обложка — Бетонный лабиринт ГИГАХРУЩА]</b></div>`;
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_2') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote"><b>[СКРИНШОТ №2: Инвентарь и подготовка к вылазке]</b></div>`;
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_3') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote"><b>[СКРИНШОТ №3: Структура блока и миникарта сектора]</b></div>`;
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_4') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote"><b>[СКРИНШОТ №4: Бой в узостях коридоров]</b></div>`;
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_5') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote"><b>[СКРИНШОТ №5: Социальная система A-Life и общение с обитателями]</b></div>`;
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_6') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote"><b>[СКРИНШОТ №6: Самосбор и задраенный гермозатвор]</b></div>`;
    continue;
  }
  if (trimmed === 'IMG_PLACEHOLDER_7') {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote"><b>[СКРИНШОТ №7: ГИГАХРУЩ: Браузерный survival horror]</b></div>`;
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

  const titleEl = document.querySelector('.editorPage__header_title .editor') || document.querySelector('h1');
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
  }
  return 'CLEAN_PUBLISH_TEST_READY';
})();
`;

fs.writeFileSync('/tmp/clean_publish_test.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/clean_publish_test.js"
tell application "Google Chrome"
  execute tab 15 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/clean_publish_test.scpt', applescriptCode);
const res = execSync('osascript /tmp/clean_publish_test.scpt').toString();
console.log('Result:', res.trim());
