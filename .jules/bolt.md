## 2024-05-18 - Fix XSS in Review Panel
**Learning:** Raw DOM injection via innerHTML is a common vector for XSS vulnerabilities, especially when interpolating values from API responses directly into HTML templates.
**Action:** Always ensure dynamic data interpolated into innerHTML is properly sanitized using an `escapeHtml` function, or use safer alternatives like `textContent` where applicable.
