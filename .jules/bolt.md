## 2024-06-22 - Code Health: Refactoring duplicated code
**Learning:** Refactoring duplicated code into a single, well-named helper function improves readability and makes explicit design decisions much clearer. When an inline check is repeated across multiple functions, replacing it with a helper makes future changes to that check's logic much safer and more robust.
**Action:** Always scan the file for other instances of duplicated logic when fixing a specific line, and extract them into a centralized helper function to improve maintainability.
