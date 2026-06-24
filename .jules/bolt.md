## 2024-06-22 - Revert Build Artifacts After Verification
**Learning:** `npm run build` in this repository modifies tracked files in the `dist/` directory (like `dist/index.html`), causing large diff warnings and polluting the final commit if not cleaned up.
**Action:** Always clean or revert changes to the `dist/` folder using `git reset HEAD dist/` or `git restore dist/` after running the build for verification purposes so that it does not show up in the PR diff.
