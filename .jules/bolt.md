## 2024-06-22 - Testing Error Handling on Global Constructors
**Learning:** To test `catch` blocks involving native globals that don't typically throw (like `URLSearchParams`), you can temporarily override the constructor on `globalThis` to throw an error intentionally.
**Action:** Always wrap the mock override in a `try...finally` block and restore the original global constructor to ensure test isolation and avoid breaking other tests.
