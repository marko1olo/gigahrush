import { execSync } from 'child_process';

const applescriptCode = `
tell application "Google Chrome" to activate
delay 0.3
tell application "Google Chrome"
  execute tab 16 of window 1 javascript "
    const bodyEl = document.querySelector('.editorPage__text');
    if (bodyEl) {
      bodyEl.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(bodyEl);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  "
end tell
delay 0.3
tell application "System Events"
  keystroke " "
  delay 0.2
  key code 51
end tell
`;

execSync(`osascript -e '${applescriptCode.replace(/'/g, "'\\''")}'`);
console.log('TRIGGERED_NATIVE_KEYBOARD_SAVE');
