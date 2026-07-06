🧹 [code health improvement] Refactor pointInRect to take UiRect or {x, y, w, h} object

🎯 **What:** Refactored `pointInRect` to accept an object parameter (matching the `UiRect` interface with `x`, `y`, `w`, and `h` properties) rather than a list of six individual positional arguments.
💡 **Why:** Reduces parameter count from 6 to 3, making the function signature cleaner and reducing the chance of passing positional arguments in the wrong order. It also allows direct passing of `UiRect` objects (e.g., `layout.close`) which previously had to be spread out into individual arguments.
✅ **Verification:** Ran `npm run typecheck` and `npm run test:unit`. All 1722 unit tests passed. Ensured no regressions in UI logic.
✨ **Result:** Improved codebase maintainability by using clearer struct-style parameter passing instead of excessively long positional argument lists.
