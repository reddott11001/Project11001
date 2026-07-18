import os, re

# Find all broken emoji patterns
results = {}
for root, dirs, files in os.walk('js'):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            for i, line in enumerate(lines, 1):
                # Find patterns like >? followed by text (broken emojis)
                matches = re.finditer(r'>(\?{1,3})\s*([A-Z])', line)
                for m in matches:
                    key = path + ':' + str(i)
                    if key not in results:
                        results[key] = []
                    results[key].append(m.group(0).strip())

with open('broken_emojis.txt', 'w', encoding='utf-8') as out:
    for k, v in sorted(results.items()):
        out.write(f'{k}: {v}\n')

print(f'Found {len(results)} lines with broken emojis')
print('Results written to broken_emojis.txt')
