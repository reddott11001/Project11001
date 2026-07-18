import re

path = 'js/apps/phishing.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix broken emoji patterns - be careful with string boundaries
replacements = [
    # Email subjects - add emoji inside the string
    ("subject: '? Microsoft Account", "subject: '🔒 Microsoft Account"),
    ("subject: '? Instagram Blue Check", "subject: '📷 Instagram Blue Check"),
    ("subject: '? Disney+ 1 Year", "subject: '🎬 Disney+ 1 Year"),
    ("subject: '? Pertamina: 50% Fuel", "subject: '⛽ Pertamina: 50% Fuel"),
    
    # Virus popup labels
    ("'? SPYWARE',", "🕵️ SPYWARE',"),
    ("'? SPYWARE ACTIVE", "🕵️ SPYWARE ACTIVE"),
    ("'? SPYWARE: Data stolen", "🕵️ SPYWARE: Data stolen"),
    ("'? SPYWARE: Password sto", "️ SPYWARE: Password sto"),
    ("'? ADWARE',", "📢 ADWARE',"),
    ("'? ADWARE: Malicious", "📢 ADWARE: Malicious"),
    ("'? RAT - REMOTE ACCESS',", "🕸️ RAT - REMOTE ACCESS',"),
    ("'? RAT DETECTED',", "🕸️ RAT DETECTED',"),
    ("'? RAT: Neutralized',", "️ RAT: Neutralized',"),
    ("'? ADWARE 2.0: Neutraliz", "📢 ADWARE 2.0: Neutraliz"),
    
    # Ad text
    ("' Win an iPhone", "📱 Win an iPhone"),
    
    # Popup close buttons
    ("font-size:12px;\">?</span>", "font-size:12px;\">✕</span>"),
    ("font-size:14px;\">?</span>", "font-size:14px;\">✕</span>"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed all broken emojis')
