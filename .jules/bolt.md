## 2024-06-22 - Improving Test Coverage for Demos Post
**Learning:** Checking coverage using `npx c8` enables identifying missing lines easily without cluttering stdout, specifically by outputting text directly with `npx c8 --reporter=text ...`. `c8` output can be noisy, `grep` limits noise by focusing only on changed/interested files.
**Action:** Use `npx c8 --reporter=text <test_command> | grep <filename>` when inspecting coverage for specific modules.
