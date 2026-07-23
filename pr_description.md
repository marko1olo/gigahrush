🔒 Fix XSS vulnerability in NPC intake demos preview

🎯 **What:**
The `renderDemosPreview` function in `gigahrush-npc-intake/src/demos_preview/preview.js` was building a large HTML string via template literals and injecting it directly into the DOM using `container.innerHTML = ...`. While some fields were sanitized with a custom `escapeHtml` function, this approach is inherently error-prone and a well-known vector for Cross-Site Scripting (XSS).

⚠️ **Risk:**
If an attacker or malicious user could inject unsanitized data (or bypass `escapeHtml`) into one of the fields, they could execute arbitrary JavaScript within the context of the user's session in the browser.

🛡️ **Solution:**
Refactored the `renderDemosPreview` function to use safe DOM APIs natively (`document.createElement`, `element.textContent`, and `element.append`). This lets the browser safely handle text encoding automatically and eliminates the need to use `innerHTML`. Also removed the now unused `escapeHtml` function from `preview.js`.

Tests were run successfully with `npm run check` inside the `gigahrush-npc-intake/` directory and with `npm run check:readonly` at the project root to ensure validation flows remain fully intact.
