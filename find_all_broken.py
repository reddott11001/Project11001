import os, re

# Find all broken emoji patterns across all JS files
results = {}
for root, dirs, files in os.walk('js'):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Find patterns like '? followed by uppercase letter
            matches = re.finditer(r"'(\?+)\s*([A-Z])", content)
            for m in matches:
                start = max(0, m.start() - 30)
                end = min(len(content), m.end() + 30)
                context = content[start:end].replace('\n', ' ')
                line_num = content[:m.start()].count('\n') + 1
                key = f'{path}:{line_num}'
                if key not in results:
                    results[key] = []
                results[key].append(f'{m.group()} -> {context}')

with open('all_broken_emojis.txt', 'w', encoding='utf-8') as out:
    for k, v in sorted(results.items()):
        out.write(f'{k}:\n')
        for item in v:
            out.write(f'  {item}\n')
        out.write('\n')

print(f'Found {len(results)} lines with broken emojis')
print('Results written to all_broken_emojis.txt')
