import os, re

# Check specific lines with html_question issues
files_to_check = [
    ('js/apps/phishing.js', [106, 323, 382]),
]

for path, lines_to_check in files_to_check:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        file_lines = content.split('\n')
    
    print(f"\n{path}:")
    for line_num in lines_to_check:
        if line_num <= len(file_lines):
            line = file_lines[line_num - 1]
            # Show context
            start = max(0, line_num - 2)
            end = min(len(file_lines), line_num + 1)
            print(f"\nLine {line_num}:")
            for i in range(start, end):
                marker = ">>>" if i == line_num - 1 else "   "
                print(f"{marker} {i+1}: {file_lines[i][:100]}")
