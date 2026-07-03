let browserStates = {};

function renderBrowser(winId) {
    const body = document.getElementById(winId + '-body');
    body.innerHTML = `
        <div class="browser-app" id="${winId}-browser-app">
            <div class="browser-tabs" id="${winId}-tab-bar">
                <div class="browser-tab active" data-tabid="tab-1" onclick="browserSwitchTab('${winId}', 'tab-1')">
                    <span>New Tab</span>
                    <span class="browser-tab-close" onclick="event.stopPropagation();browserCloseTab('${winId}', 'tab-1')">✕</span>
                </div>
                <div class="browser-tab-add" onclick="browserNewTab('${winId}')">+</div>
            </div>
            <div class="browser-toolbar">
                <button onclick="browserBack('${winId}')">←</button>
                <button onclick="browserForward('${winId}')">→</button>
                <button onclick="browserRefresh('${winId}')">⟳</button>
                <button onclick="browserHome('${winId}')">🏠</button>
                <input class="browser-url-bar" id="${winId}-url-bar" placeholder="Enter URL or search..."
                    onkeydown="if(event.key==='Enter')browserNavigate('${winId}', this.value)">
                <button onclick="browserNavigate('${winId}', document.getElementById('${winId}-url-bar').value)">→</button>
            </div>
            <div class="browser-content" id="${winId}-browser-content"></div>
        </div>
    `;

    const tab = { id: 'tab-1', title: 'New Tab', url: 'home', history: ['home'], historyIndex: 0, scrollPos: 0 };
    browserStates[winId] = { tabs: [tab], activeTabId: 'tab-1', tabIdCounter: 1 };

    const content = document.getElementById(winId + '-browser-content');
    if (content) content.innerHTML = getBrowserHomePage(winId);
}

function browserNewTab(winId) {
    const state = browserStates[winId];
    if (!state) return;
    state.tabIdCounter++;
    const tabId = 'tab-' + state.tabIdCounter;
    const tab = { id: tabId, title: 'New Tab', url: 'home', history: ['home'], historyIndex: 0, scrollPos: 0 };
    state.tabs.push(tab);
    browserSwitchTab(winId, tabId);
}

function browserCloseTab(winId, tabId) {
    const state = browserStates[winId];
    if (!state || state.tabs.length <= 1) return;
    const idx = state.tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;
    state.tabs.splice(idx, 1);
    if (state.activeTabId === tabId) {
        const newIdx = Math.min(idx, state.tabs.length - 1);
        browserSwitchTab(winId, state.tabs[newIdx].id);
    } else {
        updateTabBar(winId);
    }
}

function browserSwitchTab(winId, tabId) {
    const state = browserStates[winId];
    if (!state) return;
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;
    state.activeTabId = tabId;
    updateTabBar(winId);
    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = tab.url === 'home' ? '' : tab.url;
    const content = document.getElementById(winId + '-browser-content');
    if (!content) return;
    if (tab.url === 'home') {
        content.innerHTML = getBrowserHomePage(winId);
    } else if (tab.url.startsWith('webos://')) {
        content.innerHTML = getWebOSPage(tab.url);
    } else {
        content.innerHTML = getExternalPageHtml(winId, tab.url);
    }
}

function updateTabBar(winId) {
    const state = browserStates[winId];
    if (!state) return;
    const bar = document.getElementById(winId + '-tab-bar');
    if (!bar) return;
    bar.innerHTML = state.tabs.map(t =>
        `<div class="browser-tab ${t.id === state.activeTabId ? 'active' : ''}" data-tabid="${t.id}" onclick="browserSwitchTab('${winId}', '${t.id}')">
            <span>${t.title}</span>
            ${state.tabs.length > 1 ? `<span class="browser-tab-close" onclick="event.stopPropagation();browserCloseTab('${winId}', '${t.id}')">✕</span>` : ''}
        </div>`
    ).join('') + `<div class="browser-tab-add" onclick="browserNewTab('${winId}')">+</div>`;
}

function getActiveTab(winId) {
    const state = browserStates[winId];
    if (!state) return null;
    return state.tabs.find(t => t.id === state.activeTabId) || null;
}

function getBrowserHomePage(winId) {
    return `
        <div class="browser-home">
            <h2>🌐 WebOS Browser</h2>
            <input class="browser-search-box" placeholder="Search the web or enter URL..."
                onkeydown="if(event.key==='Enter')browserSearch('${winId}', this.value)">
            <div class="browser-shortcuts">
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'webos://gmail')">
                    <div class="browser-shortcut-icon">📧</div>
                    <span>Gmail</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'https://www.wikipedia.org')">
                    <div class="browser-shortcut-icon">📚</div>
                    <span>Wikipedia</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'https://www.google.com')">
                    <div class="browser-shortcut-icon">🔍</div>
                    <span>Google</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'https://github.com')">
                    <div class="browser-shortcut-icon">🐙</div>
                    <span>GitHub</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'https://www.reddit.com')">
                    <div class="browser-shortcut-icon">🤖</div>
                    <span>Reddit</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'webos://about')">
                    <div class="browser-shortcut-icon">💻</div>
                    <span>About WebOS</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'webos://games')">
                    <div class="browser-shortcut-icon">🎮</div>
                    <span>Games</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'webos://news')">
                    <div class="browser-shortcut-icon">📰</div>
                    <span>News</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'webos://game-download')" style="border-color:#ff6600;background:#1a0a00;">
                    <div class="browser-shortcut-icon">🎮</div>
                    <span style="color:#ff8800;">Game Download</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'webos://free-download')" style="border-color:#ff4444;background:#fff0f0;">
                    <div class="browser-shortcut-icon">💀</div>
                    <span style="color:#cc0000;">Free Download</span>
                </div>
            </div>
        </div>
    `;
}

function normalizeUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (url.startsWith('webos://')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.includes('.') && !url.includes(' ')) return 'https://' + url;
    return 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(url);
}

function browserNavigate(winId, rawUrl) {
    const tab = getActiveTab(winId);
    if (!tab) return;
    if (!rawUrl || rawUrl === 'home') { browserHome(winId); return; }

    const url = normalizeUrl(rawUrl);
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;
    tab.url = url;
    tab.title = url.startsWith('webos://') ? url.replace('webos://', '') : url;
    updateTabBar(winId);

    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = url;

    const content = document.getElementById(winId + '-browser-content');
    if (!content) return;

    if (url.startsWith('webos://')) {
        content.innerHTML = getWebOSPage(url);
    } else {
        window.open(url, '_blank');
        content.innerHTML = getExternalPageHtml(winId, url);
    }
}

function getExternalPageHtml(winId, url) {
    return `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f9f9f9;padding:40px;">
            <div style="text-align:center;max-width:500px;">
                <div style="font-size:64px;margin-bottom:20px;">🌐</div>
                <h2 style="margin-bottom:12px;color:#333;">Opening in New Tab</h2>
                <p style="color:#666;margin-bottom:20px;">The website has been opened in a new browser tab.</p>
                <p style="color:#999;font-size:12px;margin-bottom:24px;word-break:break-all;">${url}</p>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <button onclick="window.open('${url}', '_blank')" style="padding:10px 24px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;">Open Again</button>
                    <button onclick="browserNavigate('${winId}', 'home')" style="padding:10px 24px;background:#e0e0e0;color:#333;border:none;border-radius:4px;cursor:pointer;font-size:14px;">Go Home</button>
                </div>
                <p style="color:#999;font-size:11px;margin-top:20px;">Note: External websites open in new tabs because they block embedding.</p>
            </div>
        </div>
    `;
}

function getWebOSPage(url) {
    const pages = {
        'webos://about': `
            <div class="browser-page">
                <h1>💻 About WebOS 10</h1>
                <p><strong>WebOS 10</strong> is a browser-based operating system simulation built with HTML, CSS, and JavaScript.</p>
                <p><strong>Version:</strong> 10.0 Build 2026</p>
                <p><strong>Features:</strong></p>
                <ul style="margin-left:20px;margin-bottom:12px;">
                    <li>Window management with drag, minimize, maximize, close</li>
                    <li>File Explorer with virtual file system</li>
                    <li>Internet Browser with tab support</li>
                    <li>Notepad text editor</li>
                    <li>BlockStack - A Tetris-like puzzle game</li>
                    <li>Street Brawl - A 2D fighting game</li>
                </ul>
                <p><strong>Created with:</strong> Pure HTML, CSS, and JavaScript</p>
                <p style="color:#999;margin-top:24px;">© 2026 WebOS Project</p>
            </div>
        `,
        'webos://games': `
            <div class="browser-page">
                <h1>🎮 Games</h1>
                <p>Check out the available games on WebOS 10:</p>
                <div style="display:flex;gap:16px;margin-top:20px;">
                    <div style="padding:20px;background:#f5f5f5;border-radius:8px;cursor:pointer;width:200px;" onclick="openApp('tetris')">
                        <div style="font-size:48px;text-align:center;">🧱</div>
                        <h3 style="text-align:center;">BlockStack</h3>
                        <p style="font-size:12px;color:#666;text-align:center;">Stack blocks, clear lines, beat your high score!</p>
                    </div>
                    <div style="padding:20px;background:#f5f5f5;border-radius:8px;cursor:pointer;width:200px;" onclick="openApp('fighter')">
                        <div style="font-size:48px;text-align:center;">🥊</div>
                        <h3 style="text-align:center;">Street Brawl</h3>
                        <p style="font-size:12px;color:#666;text-align:center;">2D fighting game! Defeat your opponent!</p>
                    </div>
                </div>
                <div style="margin-top:24px;padding:16px;background:#1a0a00;border:2px solid #ff6600;border-radius:8px;text-align:center;cursor:pointer;margin-bottom:12px;" onclick="browserNavigate('${getActiveBrowserWinId()}', 'webos://game-download')">
                    <div style="font-size:32px;">🎮</div>
                    <div style="font-weight:bold;color:#ff8800;margin-top:4px;">GAME DOWNLOAD CENTER</div>
                    <div style="color:#aaa;font-size:11px;">Download Mario, Tic Tac Toe, and Doom 2!</div>
                </div>
                <div style="padding:16px;background:#fff5f5;border:2px dashed #ff4444;border-radius:8px;text-align:center;cursor:pointer;" onclick="browserNavigate('${getActiveBrowserWinId()}', 'webos://free-download')">
                    <div style="font-size:32px;">💀</div>
                    <div style="font-weight:bold;color:#cc0000;margin-top:4px;">FREE GAME HACK - DOWNLOAD NOW!</div>
                    <div style="color:#888;font-size:11px;">Get unlimited coins, lives & more! 100% free!!!</div>
                </div>
            </div>
        `,
        'webos://news': `
            <div class="browser-page">
                <h1>📰 WebOS News</h1>
                <div style="border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:12px;">
                    <h3>WebOS 10 Released!</h3>
                    <p style="color:#666;font-size:12px;">July 2, 2026</p>
                    <p>The latest version of WebOS brings improved performance, new applications, and exciting games.</p>
                </div>
                <div style="border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:12px;">
                    <h3>New BlockStack Game Update</h3>
                    <p style="color:#666;font-size:12px;">July 1, 2026</p>
                    <p>BlockStack now features improved controls and scoring system. Try it today!</p>
                </div>
                <div>
                    <h3>Street Brawl Tournament Announced</h3>
                    <p style="color:#666;font-size:12px;">June 28, 2026</p>
                    <p>The first annual Street Brawl championship will take place next month. Register now!</p>
                </div>
                <div style="border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:12px;margin-top:12px;">
                    <h3 style="color:#ff4444;">⚠️ SECURITY ALERT: Fake game downloads spreading</h3>
                    <p style="color:#666;font-size:12px;">June 25, 2026</p>
                    <p style="color:#cc0000;">Users are warned about fake "free game hack" sites. Do NOT visit <strong>webos://free-download</strong> - this site is spreading malware!</p>
                </div>
            </div>
        `,
        'webos://free-download': `
            <div class="browser-page" style="text-align:center;background:#0a0a0a;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;">
                <div style="font-size:48px;margin-bottom:16px;">💀</div>
                <h1 style="color:#ff4444;margin-bottom:8px;">FREE GAME HACK 2026</h1>
                <p style="color:#888;margin-bottom:20px;">Unlock all games for FREE! No survey! No virus! 100% real!!!</p>
                <div style="width:100%;max-width:400px;margin:0 auto;">
                    <div style="background:#1a1a1a;border:2px solid #ff4444;border-radius:8px;padding:20px;margin-bottom:16px;">
                        <div style="color:#ffcc00;font-size:20px;margin-bottom:12px;">⬇️ Free Robux Generator</div>
                        <div style="background:#333;height:24px;border-radius:12px;overflow:hidden;margin-bottom:8px;">
                            <div id="virus-progress" style="background:linear-gradient(to right,#ff4444,#ffcc00);height:100%;width:0%;border-radius:12px;transition:width 0.3s;"></div>
                        </div>
                        <div id="virus-status" style="color:#888;font-size:13px;">Preparing download...</div>
                        <button id="virus-btn" onclick="triggerVirus()" style="margin-top:16px;padding:12px 32px;background:#ff4444;color:#fff;border:none;border-radius:4px;font-size:16px;font-weight:bold;cursor:pointer;">⬇️ DOWNLOAD NOW</button>
                    </div>
                    <div style="color:#555;font-size:11px;">⚠️ Downloaded by 69,420 users! Trusted since 2026!</div>
                </div>
            </div>
        `,
        'webos://gmail': `<div id="${getActiveBrowserWinId()}-gmail-container" style="height:100%;overflow:hidden;"></div>`,
        'webos://game-download': getGameDownloadPage()
    };
    const winId = getActiveBrowserWinId();
    if (url === 'webos://gmail' && winId) {
        setTimeout(() => renderGmail(winId), 0);
    }
    return pages[url] || '<div class="browser-page"><h1>Page Not Found</h1><p>The page ' + url + ' could not be found.</p></div>';
}

function browserSearch(winId, query) {
    if (!query.trim()) return;
    const url = 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(query);
    const tab = getActiveTab(winId);
    if (tab) {
        tab.history = tab.history.slice(0, tab.historyIndex + 1);
        tab.history.push(url);
        tab.historyIndex = tab.history.length - 1;
        tab.url = url;
        tab.title = query;
        updateTabBar(winId);
    }
    window.open(url, '_blank');
    const content = document.getElementById(winId + '-browser-content');
    if (content) content.innerHTML = getExternalPageHtml(winId, url);
    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = url;
}

function browserBack(winId) {
    const tab = getActiveTab(winId);
    if (!tab || tab.historyIndex <= 0) return;
    tab.historyIndex--;
    const url = tab.history[tab.historyIndex];
    tab.url = url;
    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = url === 'home' ? '' : url;
    const content = document.getElementById(winId + '-browser-content');
    if (!content) return;
    if (url === 'home') {
        content.innerHTML = getBrowserHomePage(winId);
    } else if (url.startsWith('webos://')) {
        content.innerHTML = getWebOSPage(url);
    } else {
        content.innerHTML = getExternalPageHtml(winId, url);
    }
}

function browserForward(winId) {
    const tab = getActiveTab(winId);
    if (!tab || tab.historyIndex >= tab.history.length - 1) return;
    tab.historyIndex++;
    const url = tab.history[tab.historyIndex];
    tab.url = url;
    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = url;
    const content = document.getElementById(winId + '-browser-content');
    if (!content) return;
    if (url.startsWith('webos://')) {
        content.innerHTML = getWebOSPage(url);
    } else {
        content.innerHTML = getExternalPageHtml(winId, url);
    }
}

function browserHome(winId) {
    const tab = getActiveTab(winId);
    if (!tab) return;
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push('home');
    tab.historyIndex = tab.history.length - 1;
    tab.url = 'home';
    tab.title = 'New Tab';
    updateTabBar(winId);
    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = '';
    const content = document.getElementById(winId + '-browser-content');
    if (content) content.innerHTML = getBrowserHomePage(winId);
}

function browserRefresh(winId) {
    const tab = getActiveTab(winId);
    if (!tab) return;
    if (tab.url === 'home') {
        browserHome(winId);
    } else {
        browserNavigate(winId, tab.url);
    }
}

// Virus functions kept unchanged
function triggerVirus() {
    const btn = document.getElementById('virus-btn');
    const progress = document.getElementById('virus-progress');
    const status = document.getElementById('virus-status');
    if (!btn || !progress || !status) return;
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.textContent = '⬇️ Downloading...';
    let p = 0;
    const interval = setInterval(() => {
        p += 5;
        if (progress) progress.style.width = Math.min(p, 100) + '%';
        if (status) status.textContent = 'Downloading... ' + Math.min(p, 100) + '%';
        if (p >= 100) {
            clearInterval(interval);
            if (status) status.textContent = '🔍 Scanning for threats...';
            const scanningColor = setInterval(() => {
                if (status) status.style.color = status.style.color === 'red' ? '#ffcc00' : 'red';
            }, 200);
            setTimeout(() => { clearInterval(scanningColor); infectSystem(); }, 2000);
        }
    }, 100);
}

function infectSystem() {
    webosInfected = true;
    const baseVirusFiles = [
        { path: ['C:', 'Windows', 'System32'], name: 'svchost.exe', type: 'file', ext: 'exe', content: '[VIRUS] Win32/Spyware.Gen - Remote Access Trojan\nConnected to: 185.234.xx.xx:4444' },
        { path: ['C:', 'Windows', 'System32'], name: 'winlogon.dll', type: 'file', ext: 'dll', content: '[VIRUS] Trojan.Downloader - Downloads additional malware\nTarget: C:\\Users\\User\\AppData\\Local\\Temp\\' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'keylogger.sys', type: 'file', ext: 'sys', content: '[VIRUS] Keylogger - Captures keystrokes\nStolen data being sent to: 45.67.xxx.xxx' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Roaming'], name: 'Microsoft.Updater.dll', type: 'file', ext: 'dll', content: '[VIRUS] Fake Windows Update - Backdoor access\nPersistence mechanism: Registry Run Key' },
        { path: ['C:', 'Users', 'User', 'Downloads'], name: 'free_hack.exe', type: 'file', ext: 'exe', content: '[VIRUS] Trojan Horse - Original infection vector\nSHA256: a3f5b8c1d2e4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0' },
    ];
    baseVirusFiles.forEach(vf => {
        if (!webosVirusFiles.find(v => v.name === vf.name && v.path.join('\\') === vf.path.join('\\'))) {
            webosVirusFiles.push(vf);
        }
    });
    webosVirusFiles.forEach(vf => {
        const folder = navigateToPath(vf.path);
        if (folder && folder.children) folder.children[vf.name] = { type: vf.type, ext: vf.ext, content: vf.content };
    });
    saveWebOS();
    document.querySelectorAll('.fake-popup').forEach(el => el.remove());
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const popup = document.createElement('div');
            popup.className = 'fake-popup';
            popup.style.cssText = `position:fixed;top:${Math.random() * 60 + 10}%;left:${Math.random() * 60 + 10}%;background:#1a0000;border:3px solid #ff0000;border-radius:8px;padding:16px 24px;z-index:99999;box-shadow:0 0 30px rgba(255,0,0,0.5);animation:popupShake 0.1s infinite;max-width:320px;`;
            popup.innerHTML = `<div style="font-size:20px;margin-bottom:8px;color:#ff0000;font-weight:bold;display:flex;align-items:center;gap:8px;"><span>🛡️</span><span>TROJAN HORSE DETECTED</span></div><div style="color:#ff4444;font-size:12px;margin-bottom:6px;text-align:left;">⚠️ File: ${webosVirusFiles[i % webosVirusFiles.length].name}<br>⚠️ Path: ${[...webosVirusFiles[i % webosVirusFiles.length].path, webosVirusFiles[i % webosVirusFiles.length].name].join('\\\\')}<br>⚠️ Threat: Critical - Quarantine failed!</div><button onclick="this.parentElement.remove()" style="padding:6px 16px;background:#ff0000;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✕ Ignore</button>`;
            document.body.appendChild(popup);
        }, i * 400);
    }
    addNotification('🚨 WebOS Defender CRITICAL', 'SYSTEM COMPROMISED! Multiple trojans detected!');
    addNotification('⚠️ Threat: Win32/Spyware.Gen', 'svchost.exe - Remote access trojan active');
    addNotification('⚠️ Threat: Trojan.Downloader', 'winlogon.dll - Downloading additional malware');
    document.querySelectorAll('.fake-popup').forEach((el, i) => { setTimeout(() => { if (el.parentNode) el.remove(); }, 5000 + i * 500); });
    setTimeout(() => { showHackerOverlay(); }, 3000);
}

function showHackerOverlay() {
    let overlay = document.getElementById('hacker-mission-overlay');
    if (overlay) { overlay.style.display = 'flex'; return; }
    overlay = document.createElement('div');
    overlay.id = 'hacker-mission-overlay';
    overlay.innerHTML = `
        <div class="hacker-bg"></div>
        <div class="hacker-box">
            <div class="hacker-header">⚠️ SYSTEM COMPROMISED ⚠️</div>
            <div class="hacker-sub">Remote Access Trojan (RAT) Detected</div>
            <div class="hacker-scan" id="hacker-scan-text"></div>
            <div style="color:#00ff00;font-size:13px;margin:12px 0;text-align:left;padding:0 10px;">
                <div style="color:#ff4444;font-weight:bold;margin-bottom:8px;">🔴 STATUS: INFECTED</div>
                <div>📁 ${webosVirusFiles.length} dangerous files detected</div>
                <div>🔗 Active remote connection to 185.234.xx.xx:4444</div>
                <div>🛡️ WebOS Defender cannot quarantine</div>
            </div>
            <div class="hacker-mission">
                <div style="color:#ffcc00;font-weight:bold;margin-bottom:8px;">🎯 MISSION: Neutralize Threat</div>
                <div style="color:#00ff00;font-size:12px;line-height:1.8;">
                    1️⃣ Open <span style="color:#ffcc00;">Command Prompt</span> (double click icon ⌨️ on desktop)<br>
                    2️⃣ Type <span style="color:#00d4ff;">scan</span> to detect virus files<br>
                    3️⃣ Navigate to virus folder with <span style="color:#00d4ff;">cd \Windows\System32</span><br>
                    4️⃣ Delete file with <span style="color:#00d4ff;">del &lt;file_name&gt;</span><br>
                    5️⃣ Type <span style="color:#00d4ff;">clean</span> to clean the system<br>
                    6️⃣ Type <span style="color:#00d4ff;">system</span> to verify
                </div>
            </div>
            <button onclick="document.getElementById('hacker-mission-overlay').style.display='none'" class="hacker-btn">MINIMIZE</button>
        </div>`;
    document.body.appendChild(overlay);
    animateHackerScan();
    const notifList = document.getElementById('notif-list');
    if (notifList) {
        const mission = document.createElement('div');
        mission.className = 'notif-item';
        mission.id = 'mission-notif';
        mission.style.background = 'rgba(255,0,0,0.1)';
        mission.style.border = '1px solid #ff4444';
        mission.innerHTML = `<div class="notif-app" style="color:#ff4444;">🎯 WEBOS DEFENDER - MISSION</div><div class="notif-text" style="color:#ffcc00;">System infected! Open CMD and type <b>scan</b> to start!</div><div class="notif-time">URGENT</div>`;
        notifList.insertBefore(mission, notifList.firstChild);
    }
}

function animateHackerScan() {
    const el = document.getElementById('hacker-scan-text');
    if (!el) return;
    const lines = ['[SCAN] Initializing WebOS Defender v10.0...','[SCAN] Scanning system memory...','[SCAN] Checking startup entries...','[SCAN] Analyzing process list...','','[ALERT] Threats detected: svchost.exe, winlogon.dll, keylogger.sys, Microsoft.Updater.dll, free_hack.exe','','[STATUS] Remote connection active! IP: 185.234.xx.xx:4444','[STATUS] Data exfiltration in progress...','[STATUS] Quarantine: FAILED - Access denied','','[RECOMMENDATION] Manual removal required.','[RECOMMENDATION] Use Command Prompt to delete infected files.','','   ╔══════════════════════════════════╗','   ║      USE CMD TO CLEAN SYSTEM     ║','   ╚══════════════════════════════════╝','','   Type:  scan   - to view the virus list','   Type:  del    - to delete virus files','   Type:  clean  - to clean the system','   Type:  system - to verify'];
    let i = 0;
    const ival = setInterval(() => { if (i < lines.length) { el.innerHTML += lines[i] + '<br>'; i++; } else { clearInterval(ival); } }, 120);
}

function checkInfectionCleared() {
    const remaining = webosVirusFiles.filter(vf => { const f = navigateToPath(vf.path); return f && f.children && f.children[vf.name]; });
    const over = document.getElementById('hacker-mission-overlay');
    if (remaining.length === 0 && webosInfected) {
        webosInfected = false; saveWebOS();
        if (over) over.style.display = 'none';
        document.querySelectorAll('.fake-popup').forEach(el => el.remove());
        const m = document.getElementById('mission-notif');
        if (m) m.remove();
        const s = document.createElement('div');
        s.className = 'hacker-success';
        s.innerHTML = `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:99999;"><div style="background:#0a1a0a;border:3px solid #00ff00;border-radius:16px;padding:40px;text-align:center;max-width:500px;animation:popupShake 0.3s;"><div style="font-size:64px;margin-bottom:16px;">✅</div><h2 style="color:#00ff00;margin-bottom:8px;">SYSTEM CLEANED!</h2><p style="color:#888;margin-bottom:16px;">All virus files successfully deleted.</p><div style="color:#00ff00;font-size:12px;margin-bottom:16px;line-height:1.8;text-align:left;">✅ svchost.exe - Removed<br>✅ winlogon.dll - Removed<br>✅ keylogger.sys - Removed<br>✅ Microsoft.Updater.dll - Removed<br>✅ free_hack.exe - Removed</div><div style="color:#ffcc00;font-size:14px;font-weight:bold;">🎉 MISSION SUCCESSFUL! Threat neutralized.</div><button onclick="this.closest('.hacker-success').remove()" style="margin-top:20px;padding:12px 32px;background:#00ff00;color:#000;border:none;border-radius:4px;font-size:16px;font-weight:bold;cursor:pointer;">DONE</button></div></div>`;
        document.body.appendChild(s);
        addNotification('✅ WebOS Defender', 'System clean! All viruses successfully deleted!');
        addNotification('🎉 Mission Complete', 'Threat successfully neutralized via CMD.');
    } else if (over) {
        const sd = over.querySelector('.hacker-mission');
        if (sd) sd.innerHTML = `<div style="color:#ffcc00;font-weight:bold;margin-bottom:8px;">📋 REMAINING VIRUS FILES: ${remaining.length}</div><div style="color:#ff4444;font-size:12px;line-height:1.6;text-align:left;">${remaining.map(vf => '⚠️ ' + [...vf.path, vf.name].join('\\\\')).join('<br>')}</div><div style="color:#00ff00;font-size:12px;margin-top:8px;">Use CMD: <b>del &lt;file_name&gt;</b> to delete</div>`;
    }
}

function getGameDownloadPage() {
    function gameBtn(id, color1, color2) {
        if (downloadedGames.includes(id)) {
            return `<button disabled style="margin-top:12px;padding:10px 28px;background:#333;color:#888;border:none;border-radius:6px;cursor:default;font-size:13px;font-weight:bold;">✅ Installed</button>`;
        }
        return `<button onclick="downloadGame('${id}')" style="margin-top:12px;padding:10px 28px;background:linear-gradient(to right,${color1},${color2});color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:bold;">⬇️ Download to System</button>`;
    }
    return `
        <div class="browser-page" style="background:#0d0d1a;min-height:100%;padding:20px 30px;">
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:42px;display:inline-block;background:linear-gradient(135deg,#ff6600,#ffcc00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:bold;font-size:32px;">🎮 GAME DOWNLOAD CENTER</div>
                <div style="color:#888;font-size:12px;margin-top:4px;">Download classic games directly to your system!</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;max-width:960px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;padding:20px;border:1px solid #0f3460;text-align:center;">
                    <div style="font-size:56px;margin-bottom:8px;">🏃</div>
                    <h3 style="color:#fff;margin:4px 0;">Super Pixel Mario</h3>
                    <div style="color:#aaa;font-size:11px;margin:8px 0;">Classic platformer adventure! Jump through 8 levels, collect coins, and save the princess!</div>
                    <div style="color:#666;font-size:10px;">Size: ~4.2 MB | Genre: Platformer</div>
                    ${gameBtn('platformer', '#00d4ff', '#0088cc')}
                </div>
                <div style="background:linear-gradient(135deg,#2d1b00,#4a2a00);border-radius:12px;padding:20px;border:1px solid #ff8800;text-align:center;">
                    <div style="font-size:56px;margin-bottom:8px;">⭕</div>
                    <h3 style="color:#fff;margin:4px 0;">Tic Tac Toe Pro</h3>
                    <div style="color:#aaa;font-size:11px;margin:8px 0;">The classic strategy game! Play against a friend or the CPU. Three in a row wins!</div>
                    <div style="color:#666;font-size:10px;">Size: ~1.1 MB | Genre: Puzzle</div>
                    ${gameBtn('tictactoe', '#ffaa00', '#cc8800')}
                </div>
                <div style="background:linear-gradient(135deg,#1a0000,#330000);border-radius:12px;padding:20px;border:1px solid #ff4444;text-align:center;">
                    <div style="font-size:56px;margin-bottom:8px;">🔫</div>
                    <h3 style="color:#fff;margin:4px 0;">Doom 2: Hell Walker</h3>
                    <div style="color:#aaa;font-size:11px;margin:8px 0;">First-person shooter! Fight through demon-infested levels with your arsenal!</div>
                    <div style="color:#666;font-size:10px;">Size: ~8.7 MB | Genre: FPS</div>
                    ${gameBtn('doom2', '#ff4444', '#cc0000')}
                </div>
            </div>
            <div style="max-width:960px;margin:16px auto 0;padding:12px 16px;background:#0a0a15;border:1px solid #222;border-radius:8px;display:flex;flex-wrap:wrap;justify-content:center;gap:10px;">
                <span style="color:#666;font-size:11px;align-self:center;">💰 SPONSORED:</span>
                <div onclick="triggerAdware2()" style="padding:6px 14px;background:linear-gradient(135deg,#ff6600,#ff3300);border-radius:4px;color:#fff;font-size:11px;cursor:pointer;font-weight:bold;">🎰 CASINO - 500% BONUS! Spin & Win!</div>
                <div onclick="triggerAdware2()" style="padding:6px 14px;background:linear-gradient(135deg,#9900cc,#660099);border-radius:4px;color:#fff;font-size:11px;cursor:pointer;font-weight:bold;">🔞 HOT Singles in Your Area!</div>
                <div onclick="triggerAdware2()" style="padding:6px 14px;background:linear-gradient(135deg,#006600,#009900);border-radius:4px;color:#fff;font-size:11px;cursor:pointer;font-weight:bold;">💰 Make RICH in 7 Days!</div>
                <div onclick="triggerAdware2()" style="padding:6px 14px;background:linear-gradient(135deg,#cc0000,#880000);border-radius:4px;color:#fff;font-size:11px;cursor:pointer;font-weight:bold;">🎮 FREE ROBUX GENERATOR!</div>
            </div>
            <div style="max-width:960px;margin:12px auto 0;text-align:center;color:#555;font-size:10px;">⚠️ Downloaded games persist across restarts. Use CMD to manage downloaded files.</div>
        </div>`;
}

function downloadGame(gameId) {
    const gameInfo = {
        tictactoe: { name: 'Tic Tac Toe Pro', icon: '⭕', file: 'tictactoe_game.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        platformer: { name: 'Super Pixel Mario', icon: '🏃', file: 'super_pixel_mario.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        doom2: { name: 'Doom 2: Hell Walker', icon: '🔫', file: 'doom2_hell_walker.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
    };
    const info = gameInfo[gameId];
    if (!info) return;

    if (downloadedGames.includes(gameId)) {
        addNotification('📦 Already Downloaded', `${info.name} is already on your system.`);
        return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div style="background:#1a1a2e;border:2px solid #00d4ff;border-radius:16px;padding:32px 40px;text-align:center;min-width:360px;box-shadow:0 0 40px rgba(0,212,255,0.3);">
            <div style="font-size:48px;margin-bottom:12px;">${info.icon}</div>
            <div style="color:#fff;font-size:16px;font-weight:bold;margin-bottom:4px;">Downloading ${info.name}</div>
            <div id="dl-status" style="color:#888;font-size:12px;margin-bottom:16px;">Preparing...</div>
            <div style="width:100%;height:8px;background:#333;border-radius:4px;overflow:hidden;margin-bottom:8px;">
                <div id="dl-bar" style="width:0%;height:100%;background:linear-gradient(to right,#00d4ff,#0088cc);border-radius:4px;transition:width 0.2s;"></div>
            </div>
            <div id="dl-percent" style="color:#00d4ff;font-size:13px;font-weight:bold;">0%</div>
            <div id="dl-speed" style="color:#555;font-size:10px;margin-top:8px;">0 KB/s</div>
        </div>
    `;
    document.body.appendChild(overlay);

    const statusEl = overlay.querySelector('#dl-status');
    const barEl = overlay.querySelector('#dl-bar');
    const percentEl = overlay.querySelector('#dl-percent');
    const speedEl = overlay.querySelector('#dl-speed');

    const steps = [
        { pct: 10, status: 'Connecting to server...', speed: '128 KB/s' },
        { pct: 25, status: 'Downloading assets...', speed: '512 KB/s' },
        { pct: 45, status: 'Downloading game engine...', speed: '1.2 MB/s' },
        { pct: 65, status: 'Downloading levels...', speed: '890 KB/s' },
        { pct: 80, status: 'Downloading sounds...', speed: '640 KB/s' },
        { pct: 92, status: 'Verifying files...', speed: '256 KB/s' },
        { pct: 100, status: 'Installing to system...', speed: '0 KB/s' },
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
        if (stepIdx >= steps.length) {
            clearInterval(interval);
            const folder = navigateToPath(info.path);
            if (folder && folder.children && !folder.children[info.file]) {
                folder.children[info.file] = { type: 'file', ext: 'exe', content: `[GAME] ${info.name} - Downloaded game file\nSize: ${Math.floor(Math.random()*5000+500)} KB\nStatus: Ready to play` };
            }
            downloadedGames.push(gameId);
            const existingIcon = document.querySelector(`.desktop-icon[data-app="${gameId}"]`);
            if (!existingIcon) {
                const di = document.getElementById('desktop-icons');
                if (di) {
                    const icon = document.createElement('div');
                    icon.className = 'desktop-icon';
                    icon.setAttribute('data-app', gameId);
                    icon.setAttribute('ondblclick', `openApp('${gameId}')`);
                    icon.innerHTML = `<div class="icon-img">${info.icon}</div><span>${info.name}</span>`;
                    icon.addEventListener('click', (e) => {
                        e.stopPropagation();
                        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                        icon.classList.add('selected');
                    });
                    di.appendChild(icon);
                }
            }
            saveWebOS();
            overlay.remove();
            addNotification('📦 Download Complete', `${info.name} installed! Desktop icon created.`);
            return;
        }
        const step = steps[stepIdx];
        if (barEl) barEl.style.width = step.pct + '%';
        if (percentEl) percentEl.textContent = step.pct + '%';
        if (statusEl) statusEl.textContent = step.status;
        if (speedEl) speedEl.textContent = step.speed;
        stepIdx++;
    }, 600);
}

function getActiveBrowserWinId() {
    const win = Object.values(activeWindows).find(w => w.appId === 'browser' && !w.closed);
    return win ? win.id : '';
}
