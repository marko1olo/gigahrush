import fs from 'fs';
import { execSync } from 'child_process';

const markdown = fs.readFileSync('/Users/jirnyak/Mirror/gigahrush/PRCampaign/teletype_article_1.md', 'utf-8');
const lines = markdown.split('\n');

let title = "Я делаю ГИГАХРУЩ: браузерный survival horror без движка, ассетов и спокойной жизни";
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

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
}

// Safely encode title and html using encodeURIComponent (pure ASCII)
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

  const bodyEl = document.querySelector('.editorPage__text.text.editor') || document.querySelector('div[placeholder="Your post goes here..."]');
  if (bodyEl) {
    bodyEl.innerHTML = html;
    bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
    bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return 'SUCCESS_UTF8';
})();
`;

fs.writeFileSync('/tmp/teletype_fix_utf8.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/teletype_fix_utf8.js"
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/push_teletype_utf8.scpt', applescriptCode);
const res = execSync('osascript /tmp/push_teletype_utf8.scpt').toString();
console.log('Teletype UTF-8 encoding fix applied! Result:', res.trim());
