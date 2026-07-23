import re

file_path = "gigahrush-npc-intake/hosted/public/review.html"

with open(file_path, "r") as f:
    content = f.read()

# Remove escapeHtml function
content = re.sub(
    r"\s*function escapeHtml\(value\) \{\s*return String\(value \?\? ''\)\.replace\(/\[&<>\"'\]/g, ch => \(\{\s*'&': '&amp;',\s*'<': '&lt;',\s*'>': '&gt;',\s*'\"': '&quot;',\s*\"'\": '&#39;',\s*\}\)\[ch\]\);\s*\}\s*",
    "\n",
    content
)

# Replace the render loop content
old_render_loop = """
      function render(submissions) {
        list.innerHTML = '';
        for (const sub of submissions) {
          const article = document.createElement('article');
          const preview = sub.preview || {};
          article.innerHTML = `
            <div class="top">
              <strong>${escapeHtml(sub.packageId)}</strong>
              <span>${escapeHtml(sub.status)}</span>
            </div>
            <div class="muted">${escapeHtml(sub.submissionId)}</div>
            <div class="muted">contact: ${escapeHtml(sub.authorContactPrivate || 'not provided')}</div>
            <div>${escapeHtml(preview.publicLine || 'Нет публичной строки')}</div>
            <div class="muted">${escapeHtml(preview.samplePost || '')}</div>
            <div class="actions">
              <button data-download="${escapeHtml(sub.submissionId)}">ZIP</button>
              <button data-export="${escapeHtml(sub.submissionId)}">Export</button>
              <select data-status="${escapeHtml(sub.submissionId)}">
                ${['submitted', 'needs_review', 'accepted', 'rejected', 'imported'].map(status => `<option ${status === sub.status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
              </select>
              <button data-save="${escapeHtml(sub.submissionId)}">Save</button>
              <textarea data-notes="${escapeHtml(sub.submissionId)}" placeholder="moderator notes">${escapeHtml(sub.moderatorNotes || '')}</textarea>
            </div>
          `;
          list.appendChild(article);
        }
      }
"""

new_render_loop = """
      function createEl(tag, cls, text) {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (text) el.textContent = text;
        return el;
      }

      function render(submissions) {
        list.innerHTML = '';
        for (const sub of submissions) {
          const article = document.createElement('article');
          const preview = sub.preview || {};

          const top = createEl('div', 'top');
          top.appendChild(createEl('strong', '', sub.packageId));
          top.appendChild(createEl('span', '', sub.status));

          const submissionIdEl = createEl('div', 'muted', sub.submissionId);
          const contactEl = createEl('div', 'muted', `contact: ${sub.authorContactPrivate || 'not provided'}`);
          const publicLineEl = createEl('div', '', preview.publicLine || 'Нет публичной строки');
          const samplePostEl = createEl('div', 'muted', preview.samplePost || '');

          const actions = createEl('div', 'actions');

          const btnZip = createEl('button', '', 'ZIP');
          btnZip.dataset.download = sub.submissionId;

          const btnExport = createEl('button', '', 'Export');
          btnExport.dataset.export = sub.submissionId;

          const select = createEl('select');
          select.dataset.status = sub.submissionId;
          ['submitted', 'needs_review', 'accepted', 'rejected', 'imported'].forEach(status => {
            const option = createEl('option', '', status);
            if (status === sub.status) option.selected = true;
            select.appendChild(option);
          });

          const btnSave = createEl('button', '', 'Save');
          btnSave.dataset.save = sub.submissionId;

          const textarea = createEl('textarea');
          textarea.dataset.notes = sub.submissionId;
          textarea.placeholder = 'moderator notes';
          textarea.value = sub.moderatorNotes || '';

          actions.appendChild(btnZip);
          actions.appendChild(btnExport);
          actions.appendChild(select);
          actions.appendChild(btnSave);
          actions.appendChild(textarea);

          article.appendChild(top);
          article.appendChild(submissionIdEl);
          article.appendChild(contactEl);
          article.appendChild(publicLineEl);
          article.appendChild(samplePostEl);
          article.appendChild(actions);

          list.appendChild(article);
        }
      }
"""

content = content.replace(old_render_loop.strip(), new_render_loop.strip())

with open(file_path, "w") as f:
    f.write(content)
