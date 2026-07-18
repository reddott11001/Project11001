import os

# Fix all broken emoji patterns in phishing.js
path = 'js/apps/phishing.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Email subject emojis
replacements = [
    # Microsoft - lock
    ("'? Microsoft Account", "\U0001f512 Microsoft Account"),
    # Instagram - camera
    ("'? Instagram Blue Check", "\U0001f4f7 Instagram Blue Check"),
    # Disney - film
    ("'? Disney+ 1 Year", "\U0001f3ac Disney+ 1 Year"),
    # Pertamina - fuel pump
    ("'? Pertamina: 50% Fuel", "\u26fd Pertamina: 50% Fuel"),
    
    # Virus popup labels
    ("'? SPYWARE", "\U0001f575\ufe0f SPYWARE"),
    ("'? RAT - REMOTE ACCESS", "\U0001f578\ufe0f RAT - REMOTE ACCESS"),
    ("'? RAT DETECTED", "\U0001f578\ufe0f RAT DETECTED"),
    ("'? RAT: Neutralized", "\U0001f578\ufe0f RAT: Neutralized"),
    ("'? ADWARE 2.0: Neutraliz", "\U0001f4e2 ADWARE 2.0: Neutraliz"),
    
    # Notification labels
    ("'? SPYWARE ACTIVE", "\U0001f575\ufe0f SPYWARE ACTIVE"),
    ("'? SPYWARE: Data stolen", "\U0001f575\ufe0f SPYWARE: Data stolen"),
    ("'? SPYWARE: Password sto", "\U0001f575\ufe0f SPYWARE: Password sto"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed email subject and notification emojis')
