## 2023-10-27 - Security Fix Unrelated Changes
**Learning:** During test runs I inadvertently updated lookup hints and lockfiles which dirtied the git staging area. Submitting unrelated code and lockfile changes alongside a security fix is a blocking error that pollutes PRs.
**Action:** Always run `git status` and `git diff --cached` before requesting code review to ensure only targeted, relevant files are staged.
