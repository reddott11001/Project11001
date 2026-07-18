import os, re

# Comprehensive scan for broken emoji patterns
patterns = [
    # Question marks that should be emojis
    (r"'(\?+)\s*([A-Z])", "Question mark before uppercase"),
    (r">\?(\s|<)", "Question mark in HTML"),
    (r"\">\?</", "Question mark in closing tag"),
    # Standalone variation selector
    r"\ufe0f(?![\u200d\u20e3])",
    # Broken emoji sequences
    r"[\U0001f300-\U0001f9ff]\ufe0f\ufe0f",
]

results = {}
for root, dirs, files in os.walk('js'):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            
            file_issues = []
            for i, line in enumerate(lines, 1):
                # Check for question mark patterns
                matches = re.finditer(r"'(\?+)\s*([A-Z])", line)
                for m in matches:
                    file_issues.append((i, 'broken_emoji', m.group()))
                
                # Check for >? patterns in HTML
                matches = re.finditer(r">\?(\s|<|/)", line)
                for m in matches:
                    file_issues.append((i, 'html_question', m.group()))
                
                # Check for standalone variation selector
                if re.search(r"\ufe0f(?![\u200d\u20e3])", line):
                    # Check if it's not part of a valid emoji
                    if not re.search(r"[\U0001f300-\U0001f9ff]\ufe0f", line):
                        file_issues.append((i, 'standalone_vs', 'found'))
            
            if file_issues:
                results[path] = file_issues

with open('emoji_scan_results.txt', 'w', encoding='utf-8') as out:
    for path, issues in sorted(results.items()):
        out.write(f"\n{path}:\n")
        for line_num, issue_type, detail in issues:
            out.write(f"  Line {line_num}: {issue_type} - {detail}\n")

print(f"Scanned {sum(len(files) for _, _, files in os.walk('js') if any(f.endswith('.js') for f in files))} JS files")
print(f"Found issues in {len(results)} files")
print("Results written to emoji_scan_results.txt")
