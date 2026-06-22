## 2024-05-18 - Avoid polluting the working directory with debug output
**Learning:** Redirecting command outputs to `output.txt` inside the project folder triggered persistent 'diff size is unusually large' warnings, even if the file itself isn't massive.
**Action:** Always save temporary files (e.g., debug logs, shell outputs) to `/tmp/` instead of the project directory.

## 2024-05-18 - Modifying source files vs generated files
**Learning:** Running `npm run build` alters files inside `/dist`, such as `index.html`.
**Action:** When working on performance optimization or source code updates, revert changes to build directories (`dist/`) before committing or running further tests so they don't clutter the diffs or result in large diff warnings.
