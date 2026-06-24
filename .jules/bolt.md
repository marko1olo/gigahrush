## 2026-06-22 - Fix Timing Attack in Auth Token Comparison
**Learning:** Node.js Web Crypto API timingSafeEqual requires buffers. Writing a custom bitwise `timingSafeStringEqual` is a valid fallback to mitigate string guessing attacks synchronously.
**Action:** Always test native standard libraries when proposing a security fix to verify availability and behaviour in a given environment. Be careful when proposing synchronous fallback solutions.
