import re

with open('src/main.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to extract the three sections.
# 1. Alive loop
# 2. Dead loop
# 3. Render frame
