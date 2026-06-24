## 2024-05-18 - Fix hardcoded security tokens
**Learning:** Hardcoded tokens can accidentally end up in the repository and should be replaced with required environment variables. Unnecessary tests output artifacts can also pollute the repo if not cleaned up.
**Action:** When fixing hardcoded tokens, fail the build script if required env vars are missing to ensure security. Additionally, ensure clean working directories by removing test output artifacts.
