import base64
import os
from AppKit import NSPasteboard, NSPasteboardTypeHTML, NSPasteboardTypeString

screens_dir = '/Users/jirnyak/Mirror/screens'

# Read images
with open(f'{screens_dir}/1.png', 'rb') as f: img1 = base64.b64encode(f.read()).decode('utf-8')
with open(f'{screens_dir}/2.png', 'rb') as f: img2 = base64.b64encode(f.read()).decode('utf-8')
with open(f'{screens_dir}/3.png', 'rb') as f: img3 = base64.b64encode(f.read()).decode('utf-8')
with open(f'{screens_dir}/4.png', 'rb') as f: img4 = base64.b64encode(f.read()).decode('utf-8')
with open(f'{screens_dir}/5.png', 'rb') as f: img5 = base64.b64encode(f.read()).decode('utf-8')
with open(f'{screens_dir}/6.png', 'rb') as f: img6 = base64.b64encode(f.read()).decode('utf-8')
with open(f'{screens_dir}/7.png', 'rb') as f: img7 = base64.b64encode(f.read()).decode('utf-8')

with open('/Users/jirnyak/Mirror/gigahrush/PRCampaign/teletype_article_1.md', 'r', encoding='utf-8') as f:
    markdown = f.read()

lines = markdown.split('\n')
body_lines = lines[1:]

html = ""
in_list = False

def format_inline(str_val):
    return str_val.replace('**', '<b>').replace('**', '</b>').replace('*', '<i>').replace('*', '</i>')

def make_img(b64, caption):
    return f'<figure><img src="data:image/png;base64,{b64}" style="max-width:100%; border-radius:8px;" /><figcaption>{caption}</figcaption></figure><br>'

for line in body_lines:
    trimmed = line.strip()
    if not trimmed:
        if in_list:
            html += '</ul>'
            in_list = False
        continue
    
    if trimmed == 'IMG_PLACEHOLDER_1':
        if in_list: html += '</ul>'; in_list = False
        html += make_img(img1, 'Обложка: Бетонный лабиринт ГИГАХРУЩА')
        continue
    if trimmed == 'IMG_PLACEHOLDER_2':
        if in_list: html += '</ul>'; in_list = False
        html += make_img(img2, 'Инвентарь и подготовка к вылазке (еда, вода, патроны)')
        continue
    if trimmed == 'IMG_PLACEHOLDER_3':
        if in_list: html += '</ul>'; in_list = False
        html += make_img(img3, 'Структура блока и миникарта сектора')
        continue
    if trimmed == 'IMG_PLACEHOLDER_4':
        if in_list: html += '</ul>'; in_list = False
        html += make_img(img4, 'Бой в узостях коридоров')
        continue
    if trimmed == 'IMG_PLACEHOLDER_5':
        if in_list: html += '</ul>'; in_list = False
        html += make_img(img5, 'Социальная система A-Life и общение с обитателями')
        continue
    if trimmed == 'IMG_PLACEHOLDER_6':
        if in_list: html += '</ul>'; in_list = False
        html += make_img(img6, 'Самосбор и задраенный гермозатвор')
        continue
    if trimmed == 'IMG_PLACEHOLDER_7':
        if in_list: html += '</ul>'; in_list = False
        html += make_img(img7, 'ГИГАХРУЩ: Браузерный survival horror')
        continue

    if trimmed == '---' or trimmed == '***':
        if in_list: html += '</ul>'; in_list = false
        html += '<hr><br>'
        continue

    if trimmed.startswith('## '):
        if in_list: html += '</ul>'; in_list = False
        html += f'<h2><b>{format_inline(trimmed[3:])}</b></h2>'
        continue

    if trimmed.startswith('### '):
        if in_list: html += '</ul>'; in_list = False
        html += f'<h3><b>{format_inline(trimmed[4:])}</b></h3>'
        continue

    if trimmed.startswith('> '):
        if in_list: html += '</ul>'; in_list = False
        html += f'<blockquote>{format_inline(trimmed[2:])}</blockquote>'
        continue

    if trimmed.startswith('* ') or trimmed.startswith('- '):
        if not in_list:
            html += '<ul>'
            in_list = True
        html += f'<li>{format_inline(trimmed[2:])}</li>'
        continue

    if in_list:
        html += '</ul>'
        in_list = False

    html += f'<p>{format_inline(trimmed)}</p>'

if in_list:
    html += '</ul>'

# Set to macOS pasteboard
pb = NSPasteboard.generalPasteboard()
pb.clearContents()
pb.setString_forType_(html, NSPasteboardTypeHTML)
pb.setString_forType_(html, NSPasteboardTypeString)

print("SUCCESS_CLIPBOARD_READY")
