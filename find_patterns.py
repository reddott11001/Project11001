import re

with open('js/apps/phishing.js', 'r', encoding='utf-8') as f:
    content = f.read()
    # Find all instances of '? followed by text
    matches = re.finditer(r"'(\?+)\s*([A-Z])", content)
    with open('broken_patterns.txt', 'w', encoding='utf-8') as out:
        for m in matches:
            start = max(0, m.start() - 20)
            end = min(len(content), m.end() + 20)
            out.write(f'Found: {repr(m.group())} at position {m.start()}\n')
            out.write(f'Context: {repr(content[start:end])}\n\n')

print('Results written to broken_patterns.txt')
