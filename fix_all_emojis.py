import os

# Fix all broken emojis in phishing.js
path = 'js/apps/phishing.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # Worm popup
    ("font-size:18px;\"></span>", "font-size:18px;\"></span>"),
    ("?\"</span>", "\"</span>"),
    (" OPEN", "🔗 OPEN"),
    ("' WORM REPLICATION", "'🐛 WORM REPLICATION"),
    
    # Spyware
    ("🕵️ SPYWARE'", "🕵️ SPYWARE'"),
    ("🕵️ SPYWARE ACTIVE", "️ SPYWARE ACTIVE"),
    ("️ SPYWARE: Data stolen", "️ SPYWARE: Data stolen"),
    ("🕵️ SPYWARE: Password stolen", "🕵️ SPYWARE: Password stolen"),
    
    # Adware
    ("' ADWARE'", "'📢 ADWARE'"),
    ("' ADWARE: Malicious ads active", "'📢 ADWARE: Malicious ads active"),
    ("' Win an iPhone", "'📱 Win an iPhone"),
    ("font-size:20px;\"></span>", "font-size:20px;\"></span>"),
    
    # RAT
    ("🕸️ RAT - REMOTE ACCESS", "🕸️ RAT - REMOTE ACCESS"),
    ("🕸️ RAT DETECTED", "🕸️ RAT DETECTED"),
    ("🕸️ RAT: Neutralized", "🕸️ RAT: Neutralized"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed all broken emojis in phishing.js')
