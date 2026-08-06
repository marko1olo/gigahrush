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
    if (inList) { html += '</ul>'; inList = false; }
    continue;
  }

  // Screenshot placeholders
  if (trimmed.startsWith('📷 **[СКРИНШОТ №1')) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<blockquote><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №1 — Обложка: Бетонный лабиринт ГИГАХРУЩА]</b><br><i>(Перетащи сюда файл 1.png из папки /Users/jirnyak/Mirror/screens)</i></blockquote>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №2')) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<blockquote><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №2 — Инвентарь и подготовка]</b><br><i>(Перетащи сюда файл 2.png из папки /Users/jirnyak/Mirror/screens)</i></blockquote>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №3')) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<blockquote><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №3 — Структура блока и миникарта]</b><br><i>(Перетащи сюда файл 3.png из папки /Users/jirnyak/Mirror/screens)</i></blockquote>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №4')) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<blockquote><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №4 — Бой в узостях коридоров]</b><br><i>(Перетащи сюда файл 4.png из папки /Users/jirnyak/Mirror/screens)</i></blockquote>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №5')) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<blockquote><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №5 — Социальная система A-Life]</b><br><i>(Перетащи сюда файл 5.png из папки /Users/jirnyak/Mirror/screens)</i></blockquote>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №6')) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<blockquote><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №6 — Самосбор и задраенный гермозатвор]</b><br><i>(Перетащи сюда файл 6.png из папки /Users/jirnyak/Mirror/screens)</i></blockquote>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №7')) {
    if (inList) { html += '</ul>'; inList = false; }
    html += `<blockquote><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №7 — ГИГАХРУЩ: Survival horror]</b><br><i>(Перетащи сюда файл 7.png из папки /Users/jirnyak/Mirror/screens)</i></blockquote>`;
    continue;
  }

  if (trimmed.startsWith('* Вид от первого') || trimmed.startsWith('* Экран инвентаря') || trimmed.startsWith('* План карты') || trimmed.startsWith('* Кадр встречи') || trimmed.startsWith('* Взаимодействие') || trimmed.startsWith('* Задраенная') || trimmed.startsWith('* Кадр игрового')) {
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
    if (inList) { html += '</ul></div>'; inList = false; }
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
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const bodyEl = document.querySelector('.editorPage__text');
  if (bodyEl) {
    bodyEl.focus();

    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(bodyEl);
    sel.removeAllRanges();
    sel.addRange(range);

    const ok = document.execCommand('insertHTML', false, html);
    
    bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
    bodyEl.dispatchEvent(new Event('change', { bubbles: true }));

    return 'DYNAMIC_TAB_POPULATED_' + ok;
  }
  return 'NO_BODY';
})();
`;

fs.writeFileSync('/tmp/dynamic_populate.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/dynamic_populate.js" as «class utf8»
tell application "Google Chrome"
  activate
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "teletype.in/@tenevik_games/editor" then
        execute t javascript jsCode
      end if
    end repeat
  end repeat
end tell
`;

fs.writeFileSync('/tmp/dynamic_populate.scpt', applescriptCode);
const res = execSync('osascript /tmp/dynamic_populate.scpt').toString();
console.log('Result:', res.trim());
