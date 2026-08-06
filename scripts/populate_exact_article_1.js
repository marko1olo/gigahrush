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

  // Screenshot placeholders
  if (trimmed.startsWith('📷 **[СКРИНШОТ №1')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote" style="background:#f0f4f8; padding:12px 16px; border-radius:8px; margin:20px 0; border-left:4px solid #007aff; font-size:15px;"><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №1 — Обложка: Бетонный лабиринт ГИГАХРУЩА]</b><br><span style="opacity:0.8; font-size:13px;">• Перетащи сюда файл <b>1.png</b> из папки <code>/Users/jirnyak/Mirror/screens</code></span></div>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №2')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote" style="background:#f0f4f8; padding:12px 16px; border-radius:8px; margin:20px 0; border-left:4px solid #007aff; font-size:15px;"><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №2 — Инвентарь и подготовка к вылазке]</b><br><span style="opacity:0.8; font-size:13px;">• Перетащи сюда файл <b>2.png</b> из папки <code>/Users/jirnyak/Mirror/screens</code></span></div>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №3')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote" style="background:#f0f4f8; padding:12px 16px; border-radius:8px; margin:20px 0; border-left:4px solid #007aff; font-size:15px;"><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №3 — Структура блока и миникарта сектора]</b><br><span style="opacity:0.8; font-size:13px;">• Перетащи сюда файл <b>3.png</b> из папки <code>/Users/jirnyak/Mirror/screens</code></span></div>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №4')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote" style="background:#f0f4f8; padding:12px 16px; border-radius:8px; margin:20px 0; border-left:4px solid #007aff; font-size:15px;"><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №4 — Бой в узостях коридоров]</b><br><span style="opacity:0.8; font-size:13px;">• Перетащи сюда файл <b>4.png</b> из папки <code>/Users/jirnyak/Mirror/screens</code></span></div>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №5')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote" style="background:#f0f4f8; padding:12px 16px; border-radius:8px; margin:20px 0; border-left:4px solid #007aff; font-size:15px;"><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №5 — Социальная система A-Life]</b><br><span style="opacity:0.8; font-size:13px;">• Перетащи сюда файл <b>5.png</b> из папки <code>/Users/jirnyak/Mirror/screens</code></span></div>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №6')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote" style="background:#f0f4f8; padding:12px 16px; border-radius:8px; margin:20px 0; border-left:4px solid #007aff; font-size:15px;"><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №6 — Самосбор и задраенный гермозатвор]</b><br><span style="opacity:0.8; font-size:13px;">• Перетащи сюда файл <b>6.png</b> из папки <code>/Users/jirnyak/Mirror/screens</code></span></div>`;
    continue;
  }
  if (trimmed.startsWith('📷 **[СКРИНШОТ №7')) {
    if (inList) { html += '</ul></div>'; inList = false; }
    html += `<div class="editor m_line m_quote" style="background:#f0f4f8; padding:12px 16px; border-radius:8px; margin:20px 0; border-left:4px solid #007aff; font-size:15px;"><b>📷 [МЕСТО ДЛЯ СКРИНШОТА №7 — ГИГАХРУЩ: Браузерный survival horror]</b><br><span style="opacity:0.8; font-size:13px;">• Перетащи сюда файл <b>7.png</b> из папки <code>/Users/jirnyak/Mirror/screens</code></span></div>`;
    continue;
  }

  // Skip sub-bullet notes under screenshot placeholders
  if (trimmed.startsWith('* Вид от первого') || trimmed.startsWith('* Экран инвентаря') || trimmed.startsWith('* План карты') || trimmed.startsWith('* Кадр встречи') || trimmed.startsWith('* Взаимодействие') || trimmed.startsWith('* Задраенная') || trimmed.startsWith('* Кадр игрового')) {
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
  }
  return 'EXACT_ARTICLE_1_POPULATED_SUCCESS';
})();
`;

fs.writeFileSync('/tmp/populate_exact.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/populate_exact.js" as «class utf8»
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/populate_exact.scpt', applescriptCode);
const res = execSync('osascript /tmp/populate_exact.scpt').toString();
console.log('Result:', res.trim());
