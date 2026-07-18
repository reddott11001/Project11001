let browserStates = {};
let activeMiners = [];
let minerLagStyle = null;
let minerIdCounter = 0;
let tabContentCache = {};

const minerTypes = [
    { id: 'bitcoin', name: 'Bitcoin Miner', icon: '⛏️', color: '#ff9900', bg: '#1a1a00', cpu: 25, symbol: 'BTC', rate: 0.000001 },
    { id: 'ethereum', name: 'Ethereum Miner', icon: '💎', color: '#8a6dff', bg: '#0d0020', cpu: 22, symbol: 'ETH', rate: 0.00001 },
    { id: 'monero', name: 'Monero Miner', icon: '🔒', color: '#00cc99', bg: '#001a0d', cpu: 28, symbol: 'XMR', rate: 0.001 },
    { id: 'litecoin', name: 'Litecoin Miner', icon: '⚡', color: '#c0c0c0', bg: '#1a1a1a', cpu: 20, symbol: 'LTC', rate: 0.0005 },
    { id: 'dogecoin', name: 'Dogecoin Miner', icon: '🐕', color: '#ffcc00', bg: '#1a1a00', cpu: 18, symbol: 'DOGE', rate: 10 },
];

function renderBrowser(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
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
                <button onclick="browserHome('${winId}')"></button>
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
    
    // Add cleanup function to remove cache when window is closed
    if (typeof activeWindows !== 'undefined' && activeWindows[winId]) {
        activeWindows[winId].cleanup = function() {
            // Clean up all tab content cache for this window
            Object.keys(tabContentCache).forEach(key => {
                if (key.startsWith(winId + '-')) {
                    delete tabContentCache[key];
                }
            });
            delete browserStates[winId];
        };
    }
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
    
    // Clean up cache for closed tab
    delete tabContentCache[winId + '-' + tabId];
    
    if (state.activeTabId === tabId) {
        const newIdx = Math.min(idx, state.tabs.length - 1);
        browserSwitchTab(winId, state.tabs[newIdx].id);
    } else {
        updateTabBar(winId);
    }
}

function browserSwitchTab(winId, tabId) {
    stopFreakyPopups();
    
    const state = browserStates[winId];
    if (!state) return;
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    // Save current tab content before switching
    const currentTab = state.tabs.find(t => t.id === state.activeTabId);
    if (currentTab) {
        const content = document.getElementById(winId + '-browser-content');
        if (content) {
            tabContentCache[winId + '-' + currentTab.id] = content.innerHTML;
            // Save scroll position
            currentTab.scrollPos = content.scrollTop;
        }
    }
    
    state.activeTabId = tabId;
    updateTabBar(winId);
    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = tab.url === 'home' ? '' : tab.url;
    const content = document.getElementById(winId + '-browser-content');
    if (!content) return;
    
    // Try to restore from cache first
    const cachedContent = tabContentCache[winId + '-' + tabId];
    if (cachedContent) {
        content.innerHTML = cachedContent;
        // Restore scroll position
        setTimeout(() => {
            content.scrollTop = tab.scrollPos || 0;
        }, 0);
    } else {
        // Generate fresh content
        if (tab.url === 'home') {
            content.innerHTML = getBrowserHomePage(winId);
        } else if (tab.url.startsWith('webos://')) {
            content.innerHTML = getWebOSPage(tab.url);
        } else {
            content.innerHTML = getExternalPageHtml(winId, tab.url);
        }
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
    const noWifiBanner = (typeof wifiConnected !== 'undefined' && !wifiConnected) ? `
        <div style="background:#3a1a1a;border:1px solid #ff4444;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:24px;">📵</span>
            <div style="flex:1;">
                <div style="color:#ff6666;font-size:13px;font-weight:500;">No internet connection</div>
                <div style="color:#aa6666;font-size:11px;">Connect to WiFi to browse the web</div>
            </div>
            <button onclick="toggleWifiPanel()" style="padding:6px 14px;background:#0078d4;color:#fff;border:none;border-radius:4px;font-size:11px;cursor:pointer;">Connect</button>
        </div>
    ` : '';
    
    return `
        <div class="browser-home">
            ${noWifiBanner}
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
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'webos://malware-guide')" style="border-color:#ff6600;background:#1a0a00;">
                    <div class="browser-shortcut-icon">🛡️</div>
                    <span style="color:#ff8800;">Malware Guide</span>
                </div>
                <div class="browser-shortcut" onclick="browserNavigate('${winId}', 'webos://nomoreransom')" style="border-color:#1a3a8a;background:#f0f4ff;">
                    <div class="browser-shortcut-icon">🔒</div>
                    <span style="color:#1a3a8a;">No More Ransom</span>
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

function browserNavigate(winId, rawUrl, skipLag) {
    stopFreakyPopups();
    if (typeof window.cryptoScamInterval !== 'undefined') {
        clearInterval(window.cryptoScamInterval);
    }
    
    if (!skipLag && isSystemLagging()) {
        const key = winId + '-' + rawUrl;
        if (lagPendingNavs.includes(key)) return;
        lagPendingNavs.push(key);
        const content = document.getElementById(winId + '-browser-content');
        if (content) {
            content.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a2e;color:#ffcc00;font-family:monospace;font-size:14px;">
                <div style="text-align:center;">
                    <div style="font-size:48px;margin-bottom:16px;animation:spin 1s linear infinite;">⏳</div>
                    <div>WebOS is not responding...</div>
                </div>
            </div>`;
        }
        setTimeout(() => {
            lagPendingNavs = lagPendingNavs.filter(k => k !== key);
            browserNavigate(winId, rawUrl, true);
        }, 3000 + Math.floor(Math.random() * 2000));
        return;
    }

    const tab = getActiveTab(winId);
    if (!tab) return;
    if (!rawUrl || rawUrl === 'home') { browserHome(winId); return; }

    const url = normalizeUrl(rawUrl);
    
    if (!url.startsWith('webos://') && typeof wifiConnected !== 'undefined' && !wifiConnected) {
        tab.history = tab.history.slice(0, tab.historyIndex + 1);
        tab.history.push(url);
        tab.historyIndex = tab.history.length - 1;
        tab.url = url;
        tab.title = url;
        updateTabBar(winId);
        const urlBar = document.getElementById(winId + '-url-bar');
        if (urlBar) urlBar.value = url;
        const content = document.getElementById(winId + '-browser-content');
        if (content) {
            content.innerHTML = getNoInternetPage(winId);
            setTimeout(() => {
                if (typeof renderDinoGame === 'function') {
                    renderDinoGame(winId);
                }
            }, 100);
        }
        return;
    }
    
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;
    tab.url = url;
    tab.title = url.startsWith('webos://') ? url.replace('webos://', '') : url;
    updateTabBar(winId);

    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = url;

    // Clear cache for this tab when navigating to new URL
    delete tabContentCache[winId + '-' + tab.id];

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
        'webos://game-download': getGameDownloadPage(),
        'webos://malware-guide': getMalwareGuidePage(),
        'webos://crypto-scam': getCryptoScamPage(),
        'webos://casino-scam': getCasinoScamPage(),
        'webos://adult-scam': getAdultScamPage(),
        'webos://live-cam-scam': getLiveCamScamPage(),
        'webos://xxx-videos': getXxxVideosPage(),
        'webos://male-scam': getMaleScamPage(),
        'webos://prize-scam': getPrizeScamPage(),
        'webos://robux-scam': getRobuxScamPage(),
        'webos://work-scam': getWorkScamPage(),
        'webos://deals-scam': getDealsScamPage(),
        'webos://health-scam': getHealthScamPage(),
        'webos://bitcoin-motherfuckers': getBitcoinMotherfuckersPage(),
        'webos://nomoreransom': getNoMoreRansomPage()
    };
    const winId = getActiveBrowserWinId();
    if (url === 'webos://gmail' && winId) {
        setTimeout(() => renderGmail(winId), 0);
    }
    return pages[url] || '<div class="browser-page"><h1>Page Not Found</h1><p>The page ' + url + ' could not be found.</p></div>';
}

function browserSearch(winId, query, skipLag) {
    if (!query.trim()) return;

    if (!skipLag && isSystemLagging()) {
        const key = winId + '-search-' + query;
        if (lagPendingNavs.includes(key)) return;
        lagPendingNavs.push(key);
        const content = document.getElementById(winId + '-browser-content');
        if (content) {
            content.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a2e;color:#ffcc00;font-family:monospace;font-size:14px;">
                <div style="text-align:center;">
                    <div style="font-size:48px;margin-bottom:16px;animation:spin 1s linear infinite;">⏳</div>
                    <div>WebOS is not responding...</div>
                </div>
            </div>`;
        }
        setTimeout(() => {
            lagPendingNavs = lagPendingNavs.filter(k => k !== key);
            browserSearch(winId, query, true);
        }, 3000 + Math.floor(Math.random() * 2000));
        return;
    }

    if (typeof wifiConnected !== 'undefined' && !wifiConnected) {
        const content = document.getElementById(winId + '-browser-content');
        if (content) {
            content.innerHTML = getNoInternetPage(winId);
            setTimeout(() => {
                if (typeof renderDinoGame === 'function') {
                    renderDinoGame(winId);
                }
            }, 100);
        }
        return;
    }
    
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
    stopFreakyPopups();
    
    const tab = getActiveTab(winId);
    if (!tab || tab.historyIndex <= 0) return;
    tab.historyIndex--;
    const url = tab.history[tab.historyIndex];
    tab.url = url;
    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = url === 'home' ? '' : url;
    const content = document.getElementById(winId + '-browser-content');
    if (!content) return;
    
    // Clear cache when going back
    delete tabContentCache[winId + '-' + tab.id];
    
    if (url === 'home') {
        content.innerHTML = getBrowserHomePage(winId);
    } else if (url.startsWith('webos://')) {
        content.innerHTML = getWebOSPage(url);
    } else {
        content.innerHTML = getExternalPageHtml(winId, url);
    }
}

function browserForward(winId) {
    stopFreakyPopups();
    
    const tab = getActiveTab(winId);
    if (!tab || tab.historyIndex >= tab.history.length - 1) return;
    tab.historyIndex++;
    const url = tab.history[tab.historyIndex];
    tab.url = url;
    const urlBar = document.getElementById(winId + '-url-bar');
    if (urlBar) urlBar.value = url;
    const content = document.getElementById(winId + '-browser-content');
    if (!content) return;
    
    // Clear cache when going forward
    delete tabContentCache[winId + '-' + tab.id];
    
    if (url.startsWith('webos://')) {
        content.innerHTML = getWebOSPage(url);
    } else {
        content.innerHTML = getExternalPageHtml(winId, url);
    }
}

function browserHome(winId) {
    stopFreakyPopups();
    
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
    if (content) {
        // Clear cache when going home
        delete tabContentCache[winId + '-' + tab.id];
        content.innerHTML = getBrowserHomePage(winId);
    }
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
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'svchost.exe', type: 'file', ext: 'exe', content: '[VIRUS] Win32/Spyware.Gen - Remote Access Trojan\nConnected to: 185.234.xx.xx:4444' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'], name: 'winlogon.dll', type: 'file', ext: 'dll', content: '[VIRUS] Trojan.Downloader - Downloads additional malware\nTarget: C:\\Users\\User\\AppData\\Local\\Temp\\' },
        { path: ['C:', 'Users', 'User', 'AppData', 'LocalLow', 'Sun', 'Java', 'tmp'], name: 'keylogger.sys', type: 'file', ext: 'sys', content: '[VIRUS] Keylogger - Captures keystrokes\nStolen data being sent to: 45.67.xxx.xxx' },
        { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'Microsoft.Updater.dll', type: 'file', ext: 'dll', content: '[VIRUS] Fake Windows Update - Backdoor access\nPersistence mechanism: Registry Run Key' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu'], name: 'free_hack.exe', type: 'file', ext: 'exe', content: '[VIRUS] Trojan Horse - Original infection vector\nSHA256: a3f5b8c1d2e4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0' },
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
                    2️⃣ Type <span style="color:#00d4ff;">scan</span> to detect virus file names<br>
                    3️⃣ Type <span style="color:#00d4ff;">locate</span> to reveal hiding locations<br>
                    4️⃣ Navigate to virus folder with <span style="color:#00d4ff;">cd &lt;path&gt;</span><br>
                    5️⃣ Delete file with <span style="color:#00d4ff;">del &lt;file_name&gt;</span><br>
                    6️⃣ Type <span style="color:#00d4ff;">clean</span> to clean the system
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
    const lines = ['[SCAN] Initializing WebOS Defender v10.0...','[SCAN] Scanning system memory...','[SCAN] Checking startup entries...','[SCAN] Analyzing process list...','','[ALERT] Threats detected: svchost.exe, winlogon.dll, keylogger.sys, Microsoft.Updater.dll, free_hack.exe','','[STATUS] Remote connection active! IP: 185.234.xx.xx:4444','[STATUS] Data exfiltration in progress...','[STATUS] Quarantine: FAILED - Access denied','','[WARNING] Virus files are hidden in deep system paths!','','[RECOMMENDATION] Manual removal required.','[RECOMMENDATION] Use Command Prompt to locate and delete infected files.','','   ╔══════════════════════════════════╗','   ║      USE CMD TO CLEAN SYSTEM     ║','   ╚══════════════════════════════════╝','','   Type:  scan   - to view the virus names','   Type:  locate - to reveal hiding paths','   Type:  cd     - to navigate to folder','   Type:  del    - to delete virus files','   Type:  clean  - to clean the system'];
    let i = 0;
    const ival = setInterval(() => { if (i < lines.length) { el.innerHTML += lines[i] + '<br>'; i++; } else { clearInterval(ival); } }, 120);
}

function checkInfectionCleared() {
    const remaining = webosVirusFiles.filter(vf => { const f = navigateToPath(vf.path); return f && f.children && f.children[vf.name]; });
    const over = document.getElementById('hacker-mission-overlay');
    const coreFolder = navigateToPath(['C:', 'Windows', 'System32', 'drivers']);
    const coreGone = !coreFolder || !coreFolder.children || !coreFolder.children['gotfucked.sys'];
    const ransomActive = typeof ransomwareState !== 'undefined' && ransomwareState.infected;
    
    if (coreGone && ransomActive) {
        ransomwareState.infected = false;
        ransomwareState.timerStart = null;
        if (ransomwareState.timerInterval) { clearInterval(ransomwareState.timerInterval); ransomwareState.timerInterval = null; }
        if (ransomwareState.popupEl) { ransomwareState.popupEl.remove(); ransomwareState.popupEl = null; }
        const popupById = document.getElementById('ransomware-popup');
        if (popupById) popupById.remove();
        if (typeof unlockDesktopIcons === 'function') unlockDesktopIcons();
        saveWebOS();
    }
    
    if (remaining.length === 0 && !ransomActive && webosInfected) {
        webosInfected = false; saveWebOS();
        if (over) over.style.display = 'none';
        document.querySelectorAll('.fake-popup').forEach(el => el.remove());
        const m = document.getElementById('mission-notif');
        if (m) m.remove();
        if (typeof ransomwareState !== 'undefined' && ransomwareState.popupEl) {
            ransomwareState.popupEl.remove();
            ransomwareState.popupEl = null;
        }
        if (typeof ransomwareState !== 'undefined' && ransomwareState.timerInterval) {
            clearInterval(ransomwareState.timerInterval);
            ransomwareState.timerInterval = null;
        }
        ransomwareState.infected = false;
        ransomwareState.timerStart = null;
        saveWebOS();
        const s = document.createElement('div');
        s.className = 'hacker-success';
        s.innerHTML = `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:99999;"><div style="background:#0a1a0a;border:3px solid #00ff00;border-radius:16px;padding:40px;text-align:center;max-width:500px;animation:popupShake 0.3s;"><div style="font-size:64px;margin-bottom:16px;">✅</div><h2 style="color:#00ff00;margin-bottom:8px;">SYSTEM CLEANED!</h2><p style="color:#888;margin-bottom:16px;">All threats successfully removed from the system.</p><div style="color:#00ff00;font-size:12px;margin-bottom:16px;line-height:1.8;text-align:left;">✅ All virus files - Deleted<br>✅ GotFucked Ransomware - Removed<br>✅ Persistence mechanisms - Destroyed<br>✅ Miner backdoors - Removed</div><div style="color:#ffcc00;font-size:14px;font-weight:bold;">🎉 MISSION SUCCESSFUL! Threat neutralized.</div><button onclick="this.closest('.hacker-success').remove()" style="margin-top:20px;padding:12px 32px;background:#00ff00;color:#000;border:none;border-radius:4px;font-size:16px;font-weight:bold;cursor:pointer;">DONE</button></div></div>`;
        document.body.appendChild(s);
        addNotification('✅ WebOS Defender', 'System clean! All viruses successfully deleted!');
        addNotification('🎉 Mission Complete', 'GotFucked Ransomware fully removed via CMD.');
    } else if (over) {
        const sd = over.querySelector('.hacker-mission');
        if (sd) sd.innerHTML = `<div style="color:#ffcc00;font-weight:bold;margin-bottom:8px;">📋 REMAINING VIRUS FILES: ${remaining.length}</div><div style="color:#ff4444;font-size:12px;line-height:1.6;text-align:left;">${remaining.map(vf => '⚠️ ' + vf.name).join('<br>')}</div><div style="color:#00ff00;font-size:12px;margin-top:8px;">Use CMD: <b>locate</b> to find paths, then <b>cd</b> + <b>del</b></div>`;
    }
}

function getGameDownloadPage() {
    function gameBtn(id, color1, color2) {
        if (downloadedGames.includes(id)) {
            return `<button disabled style="margin-top:10px;padding:8px 20px;background:#333;color:#888;border:none;border-radius:6px;cursor:default;font-size:12px;font-weight:bold;">✅ Installed</button>`;
        }
        return `<button onclick="downloadGame('${id}')" style="margin-top:10px;padding:8px 20px;background:linear-gradient(to right,${color1},${color2});color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;">⬇️ Download</button>`;
    }

    // ── CSS ───────────────────────────────────────────────────────────────────
    const CSS = `<style>
    @keyframes adpulse{0%,100%{opacity:1;box-shadow:0 0 20px 5px var(--ac);}50%{opacity:.85;box-shadow:0 0 6px 1px var(--ac);}}
    @keyframes adshake{0%,100%{transform:rotate(-1.5deg);}50%{transform:rotate(1.5deg);}}
    @keyframes adbounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
    @keyframes adflash{0%,49%{opacity:1;}50%,100%{opacity:.45;}}
    @keyframes marqueetxt{0%{transform:translateX(100vw);}100%{transform:translateX(-200%);}}
    @keyframes bgshift{0%{background-position:0% 50%;}100%{background-position:300% 50%;}}

    /* Layout wrapper — takes browser-content height, locks top/bottom, scrolls middle */
    .gdl-wrap{display:flex;flex-direction:column;height:100%;overflow:hidden;background:#0a0a14;font-family:sans-serif;position:absolute;top:0;left:0;right:0;bottom:0;}

    /* Horizontal banners */
    .gdl-top,.gdl-bot{flex-shrink:0;overflow:hidden;cursor:pointer;display:flex;align-items:center;white-space:nowrap;}
    .gdl-top{height:52px;background:linear-gradient(90deg,#ff0000,#ff6600,#ffff00,#ff0066,#ff0000);background-size:400% 100%;animation:bgshift 2s linear infinite;border-bottom:3px solid #fff200;}
    .gdl-bot{height:48px;background:linear-gradient(90deg,#0033ff,#9900ff,#ff0066,#00ccff,#0033ff);background-size:400% 100%;animation:bgshift 2.5s linear infinite reverse;border-top:3px solid #00ffee;}
    .gdl-marquee{display:inline-block;padding-left:100%;animation:marqueetxt 35s linear infinite;font-weight:900;font-size:14px;color:#fff;text-shadow:1px 1px 0 #000,-1px 1px 0 #000;letter-spacing:1.5px;}
    .gdl-marquee2{animation-duration:30s;animation-direction:reverse;}

    /* Middle row */
    .gdl-mid{flex:1;display:flex;overflow:hidden;}
    .gdl-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:14px;}

    /* Vertical side banners — 9:16 */
    .gdl-side{width:130px;flex-shrink:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:8px;padding:6px 4px;background:#0a0a14;}
    .ad9x16{width:122px;aspect-ratio:9/16;border-radius:10px;overflow:hidden;cursor:pointer;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;flex-shrink:0;}
    .ad9x16:hover{transform:scale(1.03);z-index:10;}
    .ad9x16 .ad-img{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
    .ad9x16 .ad-over{position:relative;z-index:2;width:100%;padding:8px 6px;display:flex;flex-direction:column;align-items:center;}
    .ad9x16 .ad-title{font-weight:900;font-size:10px;line-height:1.25;color:#fff;text-shadow:1px 1px 4px #000;}
    .ad9x16 .ad-cta{display:inline-block;margin-top:5px;padding:4px 10px;border-radius:20px;font-size:9px;font-weight:900;letter-spacing:.5px;color:#000;cursor:pointer;}
    .ad9x16 .censored-bar{width:90%;height:12px;background:#000;border-radius:2px;margin:3px 0;}

    /* Game grid */
    .game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;}
    .game-card{background:linear-gradient(135deg,#111,#1a1a2e);border-radius:10px;padding:14px;border:1px solid #333;text-align:center;transition:border-color .2s;}
    .game-card:hover{border-color:#666;}
    </style>`;

    // ── HORIZONTAL BANNERS ────────────────────────────────────────────────────
    const topBanner = `
    <div class="gdl-top" onclick="openScamPage('CONGRATULATIONS visitor number 1000000 you won grand prize claim now')">
        <div class="gdl-marquee">
            🎉🎉 CONGRATULATIONS!! YOU ARE THE 1,000,000TH VISITOR!! CLICK TO CLAIM FREE ROBUX + iPHONE 16!! LIMITED TIME!! ⚠️ DO NOT CLOSE THIS PAGE!! 🎉🎉
            &nbsp;&nbsp;&nbsp;&nbsp;
            😱 HOT SINGLES IN YOUR AREA WANT TO MEET YOU TONIGHT! CLICK NOW!! 🔥🔥
            &nbsp;&nbsp;&nbsp;&nbsp;
            💊 LOSE 30KG IN 3 DAYS WITH THIS ONE WEIRD TRICK!! DOCTORS HATE IT!! BUY NOW!! 💊
            &nbsp;&nbsp;&nbsp;&nbsp;
            🚀 ELON MUSK REVEALS SECRET CRYPTO THAT WILL x10000 YOUR MONEY!! INVEST $1 NOW!! 🚀
            &nbsp;&nbsp;&nbsp;&nbsp;
            ⚠️ VIRUS DETECTED ON YOUR PC!! CLICK TO REMOVE NOW!! ⚠️
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
    </div>`;

    const botBanner = `
    <div class="gdl-bot" onclick="openScamPage('free robux v-bucks generator no verification claim now 2024')">
        <div class="gdl-marquee gdl-marquee2">
            🔞 BEAUTIFUL MILFS NEAR YOU ARE LONELY!! FREE CHAT TONIGHT!! TAP PHOTO!! 😏
            &nbsp;&nbsp;&nbsp;&nbsp;
            💸 WORK FROM HOME $9999/DAY!! NO CAPITAL!! NO EXPERIENCE!! REGISTER FOR FREE!! 💸
            &nbsp;&nbsp;&nbsp;&nbsp;
            🎰 ONLINE CASINO JACKPOT!! 1000% BONUS!! DEPOSIT $1 GET $1000!! CLAIM NOW!! 🎰
            &nbsp;&nbsp;&nbsp;&nbsp;
            🍆 THIS MAN DID THIS TRICK AND THE RESULTS SHOCKED ALL DOCTORS!! CLICK!! 😳
            &nbsp;&nbsp;&nbsp;&nbsp;
            🆓 FREE UNLIMITED ROBUX & V-BUCKS!! NO SURVEY!! CLICK THE LINK BELOW!! 🆓
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
    </div>`;

    // ── LEFT SIDE ADS (9:16, freaky CSS art) ─────────────────────────────────
    const leftAds = `
    <div class="gdl-side">

        <!-- Ad 1: Hot Singles -->
        <div class="ad9x16" onclick="openScamPage('hot singles near you swipe right adult dating meet tonight')"
             style="background:linear-gradient(180deg,#1a0010 0%,#4d0035 40%,#ff0066 100%);border:2px solid #ff0066;--ac:#ff0066;animation:adpulse 2s infinite;">
            <div class="ad-img">
                <!-- CSS art: silhouette woman -->
                <div style="position:relative;width:80px;height:120px;">
                    <!-- head -->
                    <div style="width:32px;height:32px;border-radius:50%;background:radial-gradient(circle,#ffcc99,#e8956d);margin:0 auto;"></div>
                    <!-- hair -->
                    <div style="width:40px;height:20px;border-radius:50% 50% 0 0;background:#220011;margin:-6px auto 0;"></div>
                    <!-- body -->
                    <div style="width:46px;height:60px;border-radius:30% 30% 20% 20%;background:linear-gradient(180deg,#ff0066,#cc0044);margin:2px auto 0;"></div>
                    <!-- legs -->
                    <div style="display:flex;justify-content:center;gap:4px;margin-top:2px;">
                        <div style="width:14px;height:30px;border-radius:0 0 6px 6px;background:#cc0044;"></div>
                        <div style="width:14px;height:30px;border-radius:0 0 6px 6px;background:#cc0044;"></div>
                    </div>
                    <!-- blur censor overlay -->
                    <div style="position:absolute;inset:0;backdrop-filter:blur(3px);background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;border-radius:6px;">
                        <div style="background:#000;color:#ff0066;font-size:8px;font-weight:900;padding:2px 8px;border-radius:3px;border:1px solid #ff0066;">🔞 18+</div>
                    </div>
                </div>
            </div>
            <div class="ad-over" style="background:linear-gradient(0deg,rgba(0,0,0,.85) 0%,transparent 100%);">
                <div class="ad-title">HOT SINGLES<br>1KM FROM YOU!!<br>FREE CHAT 🔥</div>
                <div class="ad-cta" style="background:#ff0066;color:#fff;">SWIPE NOW →</div>
            </div>
        </div>

        <!-- Ad 2: Doctor Weird Trick -->
        <div class="ad9x16" onclick="openScamPage('doctors hate this woman weird trick lose weight fast')"
             style="background:linear-gradient(180deg,#001a00 0%,#004400 50%,#00cc44 100%);border:2px solid #00ff66;--ac:#00ff66;animation:adshake 1s infinite;">
            <div class="ad-img">
                <!-- CSS art: doctor shocked -->
                <div style="position:relative;text-align:center;padding-top:10px;">
                    <div style="font-size:52px;line-height:1;">👨‍⚕️</div>
                    <div style="font-size:28px;margin-top:-10px;">😱</div>
                    <!-- red X overlay -->
                    <div style="position:absolute;top:5px;right:5px;width:24px;height:24px;border-radius:50%;background:#ff0000;color:#fff;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;">✕</div>
                    <div style="margin-top:6px;font-size:9px;font-weight:900;color:#ff4444;text-transform:uppercase;line-height:1.2;">DOCTORS<br>HATE THIS!!</div>
                </div>
            </div>
            <div class="ad-over" style="background:linear-gradient(0deg,rgba(0,0,0,.88) 0%,transparent 100%);">
                <div class="ad-title">LOSE 30KG<br>IN 3 DAYS!!<br>NO EXERCISE 💊</div>
                <div class="ad-cta" style="background:#00ff66;color:#000;">SEE TRICK →</div>
            </div>
        </div>

        <!-- Ad 3: 18+ Video -->
        <div class="ad9x16" onclick="openScamPage('18+ hot video leaked celebrity viral adult content click')"
             style="background:#0d0010;border:2px solid #cc00ff;--ac:#cc00ff;animation:adflash .8s infinite;">
            <div class="ad-img">
                <!-- fake video thumbnail -->
                <div style="width:90px;height:100px;background:linear-gradient(135deg,#1a001a,#330033);border-radius:6px;position:relative;display:flex;align-items:center;justify-content:center;border:1px solid #cc00ff;">
                    <div style="font-size:38px;">🍑</div>
                    <!-- play button overlay -->
                    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);border-radius:6px;">
                        <div style="width:30px;height:30px;border-radius:50%;background:rgba(255,0,200,.85);display:flex;align-items:center;justify-content:center;font-size:14px;padding-left:3px;">▶</div>
                    </div>
                    <!-- age badge -->
                    <div style="position:absolute;top:4px;right:4px;background:#ff0000;color:#fff;font-size:7px;font-weight:900;padding:1px 4px;border-radius:2px;">18+</div>
                </div>
                <div style="font-size:8px;color:#cc00ff;font-weight:700;">● LIVE NOW</div>
            </div>
            <div class="ad-over" style="background:linear-gradient(0deg,rgba(0,0,0,.9) 0%,transparent 100%);">
                <div class="censored-bar"></div>
                <div class="ad-title">HIDDEN VIRAL<br>VIDEO!!<br>CLICK TO WATCH 👀</div>
                <div class="ad-cta" style="background:#cc00ff;color:#fff;">WATCH →</div>
            </div>
        </div>

    </div>`;

    // ── RIGHT SIDE ADS (9:16, freaky CSS art) ────────────────────────────────
    const rightAds = `
    <div class="gdl-side">

        <!-- Ad 1: Crypto Lambo -->
        <div class="ad9x16" onclick="openScamPage('crypto bitcoin x1000 profit elon musk invest retire early')"
             style="background:linear-gradient(180deg,#110a00 0%,#3d2a00 40%,#ffaa00 100%);border:2px solid #ffcc00;--ac:#ffcc00;animation:adpulse 1.8s infinite;">
            <div class="ad-img" style="flex-direction:column;align-items:center;padding-top:8px;">
                <!-- CSS art: crypto bro with lambo -->
                <div style="font-size:44px;line-height:1;">🤑</div>
                <div style="font-size:32px;margin-top:-6px;">🏎️</div>
                <div style="font-size:28px;margin-top:-4px;">₿💎</div>
                <!-- rising graph -->
                <div style="width:80px;height:28px;position:relative;margin-top:4px;">
                    <svg width="80" height="28" viewBox="0 0 80 28">
                        <polyline points="0,26 20,20 40,14 55,8 70,3 80,1" stroke="#00ff88" stroke-width="2.5" fill="none"/>
                        <circle cx="80" cy="1" r="3" fill="#00ff88"/>
                    </svg>
                </div>
            </div>
            <div class="ad-over" style="background:linear-gradient(0deg,rgba(0,0,0,.88) 0%,transparent 100%);">
                <div class="ad-title">CRYPTO x10000!!<br>ELON BUYS THIS!!<br>$1 → $10,000!! 🚀</div>
                <div class="ad-cta" style="background:#ffcc00;color:#000;">INVEST NOW →</div>
            </div>
        </div>

        <!-- Ad 2: Enhancement -->
        <div class="ad9x16" onclick="openScamPage('male enhancement doctors dont want you know increase size naturally pill')"
             style="background:linear-gradient(180deg,#0d0022 0%,#330066 50%,#9900ff 100%);border:2px solid #ff00ff;--ac:#ff00ff;animation:adpulse 2.4s infinite;">
            <div class="ad-img" style="flex-direction:column;padding-top:10px;gap:4px;">
                <div style="font-size:50px;">😳</div>
                <!-- measuring tape CSS -->
                <div style="background:linear-gradient(90deg,#ffcc00,#ffaa00);border-radius:4px;padding:3px 12px;font-size:10px;font-weight:900;color:#000;border:1px solid #000;">
                    📏 +6 inches
                </div>
                <div style="font-size:10px;color:#ff66ff;font-weight:900;margin-top:4px;">BEFORE → AFTER</div>
                <!-- before/after bars -->
                <div style="display:flex;gap:6px;align-items:flex-end;height:40px;">
                    <div style="width:18px;height:20px;background:#ff4444;border-radius:2px 2px 0 0;"></div>
                    <div style="width:18px;height:40px;background:#00ff88;border-radius:2px 2px 0 0;"></div>
                </div>
            </div>
            <div class="ad-over" style="background:linear-gradient(0deg,rgba(0,0,0,.9) 0%,transparent 100%);">
                <div class="censored-bar"></div>
                <div class="ad-title">DOCTORS DON'T WANT<br>YOU TO KNOW THIS!!<br>RESULTS IN 7 DAYS 🍆</div>
                <div class="ad-cta" style="background:#ff00ff;color:#fff;">CHECK NOW →</div>
            </div>
        </div>

        <!-- Ad 3: Casino Jackpot -->
        <div class="ad9x16" onclick="openScamPage('casino jackpot 500% bonus deposit slots win big real money')"
             style="background:linear-gradient(180deg,#0d0020 0%,#200040 50%,#6600cc 100%);border:2px solid #9900ff;--ac:#9900ff;animation:adshake 1.4s infinite;">
            <div class="ad-img" style="flex-direction:column;padding-top:6px;gap:3px;">
                <div style="font-size:48px;line-height:1;">🎰</div>
                <!-- slot symbols -->
                <div style="display:flex;gap:2px;background:#111;border:1px solid #9900ff;border-radius:4px;padding:4px;">
                    <div style="width:26px;height:26px;background:#1a001a;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:16px;">7️⃣</div>
                    <div style="width:26px;height:26px;background:#1a001a;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:16px;">7️⃣</div>
                    <div style="width:26px;height:26px;background:#1a001a;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:16px;">7️⃣</div>
                </div>
                <div style="font-size:11px;font-weight:900;color:#ffcc00;animation:adflash .5s infinite;">JACKPOT!! 💰</div>
                <div style="font-size:18px;font-weight:900;color:#00ff88;">$500,000</div>
            </div>
            <div class="ad-over" style="background:linear-gradient(0deg,rgba(0,0,0,.88) 0%,transparent 100%);">
                <div class="ad-title">500% BONUS!!<br>DEPOSIT $1<br>GET $5000!! 🎰</div>
                <div class="ad-cta" style="background:#ffcc00;color:#000;">SPIN NOW →</div>
            </div>
        </div>

    </div>`;

    // Only start freaky popups if we're actually on the game download page
    setTimeout(() => {
        const winId = getActiveBrowserWinId();
        if (winId) {
            const tab = getActiveTab(winId);
            if (tab && tab.url === 'webos://game-download') {
                startFreakyPopups();
            }
        }
    }, 100);

    return `${CSS}
    <div class="gdl-wrap">
        ${topBanner}
        <div class="gdl-mid">
            ${leftAds}
            <div class="gdl-scroll">
                <div style="text-align:center;margin-bottom:16px;">
                    <div style="background:linear-gradient(135deg,#ff6600,#ffcc00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;font-size:26px;">🎮 GAME DOWNLOAD CENTER</div>
                    <div style="color:#666;font-size:11px;margin-top:3px;">Download classic games directly to your system!</div>
                </div>
                <div class="game-grid">
                    <div class="game-card"><div style="font-size:44px;">🏃</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Super Pixel Mario</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Classic platformer! 8 levels, coins, princess!</div><div style="color:#555;font-size:9px;">~4.2 MB · Platformer</div>${gameBtn('platformer','#00d4ff','#0088cc')}</div>
                    <div class="game-card"><div style="font-size:44px;">⭕</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Tic Tac Toe Pro</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Classic strategy! vs CPU or friend.</div><div style="color:#555;font-size:9px;">~1.1 MB · Puzzle</div>${gameBtn('tictactoe','#ffaa00','#cc8800')}</div>
                    <div class="game-card"><div style="font-size:44px;">🔫</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Doom 2: Hell Walker</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">FPS! Fight demon-infested levels!</div><div style="color:#555;font-size:9px;">~8.7 MB · FPS</div>${gameBtn('doom2','#ff4444','#cc0000')}</div>
                    <div class="game-card"><div style="font-size:44px;">🐍</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Snake (eat apple)</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Power-ups, enemies, skins, leaderboard</div><div style="color:#555;font-size:9px;">~2.0 MB · Arcade</div>${gameBtn('snake','#00ff00','#00cc00')}</div>
                    <div class="game-card"><div style="font-size:44px;">🐦</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Flappy Bird (endless)</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Gravity, obstacles, weather, achievements</div><div style="color:#555;font-size:9px;">~1.8 MB · Endless</div>${gameBtn('flappy','#00ccff','#0099cc')}</div>
                    <div class="game-card"><div style="font-size:44px;">🧱</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Breakout (Arkanoid)</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Lasers, multi-ball, boss, special bricks</div><div style="color:#555;font-size:9px;">~2.3 MB · Action</div>${gameBtn('breakout','#ff00ff','#cc00cc')}</div>
                    <div class="game-card"><div style="font-size:44px;">👾</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Space Invaders</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Upgrades, shields, bosses, combos</div><div style="color:#555;font-size:9px;">~2.1 MB · Shooter</div>${gameBtn('invaders','#4444ff','#2222cc')}</div>
                    <div class="game-card"><div style="font-size:44px;">🔢</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">2048</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Undo, glide animations, 5x5 mode</div><div style="color:#555;font-size:9px;">~1.5 MB · Puzzle</div>${gameBtn('game2048','#ffcc00','#cca300')}</div>
                    <div class="game-card"><div style="font-size:44px;">💣</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Minesweeper</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Timer, difficulties, statistics</div><div style="color:#555;font-size:9px;">~1.3 MB · Puzzle</div>${gameBtn('minesweeper','#aaaaaa','#888888')}</div>
                    <div class="game-card"><div style="font-size:44px;">🟡</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Pac-Man</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Unique ghosts, power pellets, pathfinding AI</div><div style="color:#555;font-size:9px;">~2.8 MB · Arcade</div>${gameBtn('pacman','#ffff00','#cccc00')}</div>
                    <div class="game-card"><div style="font-size:44px;">🏓</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Pong</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Multiplayer, effects, power-ups</div><div style="color:#555;font-size:9px;">~0.9 MB · Sport</div>${gameBtn('pong','#ffffff','#cccccc')}</div>
                    <div class="game-card"><div style="font-size:44px;">👽</div><h3 style="color:#fff;margin:3px 0;font-size:13px;">Doodle Jump</h3><div style="color:#aaa;font-size:10px;margin:5px 0;">Enemies, springs, jetpacks, skins</div><div style="color:#555;font-size:9px;">~1.6 MB · Endless</div>${gameBtn('doodle','#99ff00','#77cc00')}</div>
                </div>
                <div style="margin-top:12px;padding:10px;background:#0a0a15;border:1px solid #1a1a2e;border-radius:8px;text-align:center;">
                    <span style="color:#555;font-size:10px;">💰 SPONSORED: </span>
                    <span onclick="openScamPage('casino 500% bonus deposit')" style="padding:3px 8px;background:linear-gradient(135deg,#ff6600,#ff3300);border-radius:4px;color:#fff;font-size:10px;cursor:pointer;font-weight:bold;margin:0 3px;">🎰 CASINO</span>
                    <span onclick="openScamPage('hot singles near you')" style="padding:3px 8px;background:linear-gradient(135deg,#9900cc,#660099);border-radius:4px;color:#fff;font-size:10px;cursor:pointer;font-weight:bold;margin:0 3px;">🔞 HOT SINGLES</span>
                    <span onclick="openScamPage('make $5000 per day work from home')" style="padding:3px 8px;background:linear-gradient(135deg,#006600,#009900);border-radius:4px;color:#fff;font-size:10px;cursor:pointer;font-weight:bold;margin:0 3px;">💰 GET RICH</span>
                </div>
                <div style="margin-top:8px;text-align:center;color:#444;font-size:9px;">⚠️ Downloaded games persist across restarts.</div>
            </div>
            ${rightAds}
        </div>
        ${botBanner}
    </div>`;
}


let freakyPopupInterval = null;

const minerPersistenceFiles = [
    { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'miner_core.sys', ext: 'sys', content: '[VIRUS] Miner Core Driver - manages mining threads\nPID: 6842\nStatus: Running' },
    { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'miner_cfg.cfg', ext: 'cfg', content: '[VIRUS] Miner Config - pool and wallet settings\nAuto-restart: Enabled\nInterval: 7-20s' },
    { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'miner_inject.dll', ext: 'dll', content: '[VIRUS] Windows Persistence Injector - DLL injection for miner survival\nInjected: svchost.exe' },
    { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'miner_worker.exe', ext: 'exe', content: '[VIRUS] Miner Worker Process - child process\nThreads: 4\nMemory: 64MB' }
];

function minerPersistenceExists() {
    return minerPersistenceFiles.some(f => {
        const folder = navigateToPath(f.path);
        return folder && folder.children && folder.children[f.name];
    });
}

function addMinerPersistenceFiles() {
    minerPersistenceFiles.forEach(f => {
        if (!webosVirusFiles.find(v => v.name === f.name && v.path.join('\\') === f.path.join('\\'))) {
            webosVirusFiles.push({ path: f.path, name: f.name, type: 'file', ext: f.ext, content: f.content });
        }
        const folder = navigateToPath(f.path);
        if (folder && folder.children && !folder.children[f.name]) {
            folder.children[f.name] = { type: 'file', ext: f.ext, content: f.content };
        }
    });
    webosInfected = true;
}

let minerRespawnTimers = {};

function spawnMiner(minerTypeId, isRespawn) {
    const type = minerTypes.find(m => m.id === minerTypeId) || minerTypes[Math.floor(Math.random() * minerTypes.length)];
    const miner = {
        id: 'miner_' + (++minerIdCounter),
        typeId: type.id,
        name: type.name,
        icon: type.icon,
        color: type.color,
        bg: type.bg,
        cpu: type.cpu,
        symbol: type.symbol,
        rate: type.rate,
        mined: 0,
        interval: null,
        popupEl: null,
        hashElId: 'miner-hash-' + (minerIdCounter),
        filesCreated: isRespawn ? true : false
    };

    if (!isRespawn) {
        addMinerPersistenceFiles();
        addNotification('⛏️ ' + type.name + ' MINER', 'Cryptocurrency miner installed! CPU: ' + type.cpu + '%');
        saveWebOS();
    }

    const popup = document.createElement('div');
    popup.id = 'miner-popup-' + miner.id;
    popup.style.cssText = `
        position:fixed;top:${30 + activeMiners.length * 8}%;left:${20 + activeMiners.length * 8}%;
        background:${type.bg};border:2px solid ${type.color};border-radius:12px;padding:16px 22px;
        z-index:99999;text-align:center;box-shadow:0 0 40px ${type.color}44,0 8px 32px #000;
        max-width:300px;animation:popupShake 0.15s infinite;
    `;
    popup.innerHTML = `
        <div style="font-size:36px;margin-bottom:8px;animation:spin 2s linear infinite;">${type.icon}</div>
        <div style="font-size:14px;color:${type.color};font-weight:bold;margin-bottom:6px;">${type.name} DETECTED!</div>
        <div style="font-size:11px;color:#aaa;margin-bottom:4px;line-height:1.3;">CPU hijacked for ${type.symbol} mining</div>
        <div style="margin-top:8px;width:100%;height:4px;background:#333;border-radius:2px;overflow:hidden;">
            <div style="width:100%;height:100%;background:${type.color};animation:minerPulse 0.4s infinite;"></div>
        </div>
        <div style="margin-top:6px;font-size:9px;color:${type.color};font-family:monospace;" id="${miner.hashElId}">Mining: 0 ${type.symbol}</div>
    `;
    document.body.appendChild(popup);

    miner.popupEl = popup;

    const intervalTime = Math.max(30, 80 - activeMiners.length * 8);
    miner.interval = setInterval(() => {
        const el = document.getElementById(miner.hashElId);
        if (el) {
            miner.mined += type.rate * (0.5 + Math.random());
            el.textContent = 'Mining: ' + miner.mined.toFixed(type.symbol === 'DOGE' ? 2 : 8) + ' ' + type.symbol;
        }

        const allElements = document.querySelectorAll('*');
        for (let i = 0; i < Math.min(600 / (1 + activeMiners.length * 0.3), 500); i++) {
            const idx = i % allElements.length;
            if (allElements[idx]) {
                const r = allElements[idx].getBoundingClientRect();
            }
        }
        const data = [];
        const arrSize = Math.floor(400 / (1 + activeMiners.length * 0.2));
        for (let i = 0; i < arrSize; i++) {
            data.push({ hash: Math.random().toString(36).substring(2), nonce: Math.floor(Math.random() * 1000000), value: Math.random() * 100 });
        }
        data.sort((a, b) => b.value - a.value);
        let hashResult = '';
        for (let i = 0; i < 100; i++) {
            hashResult += Math.random().toString(36).substring(2);
        }
    }, intervalTime);

    activeMiners.push(miner);

    setTimeout(() => {
        if (popup.parentNode) {
            popup.style.transition = 'opacity 0.8s';
            popup.style.opacity = '0';
            setTimeout(() => { if (popup.parentNode) popup.remove(); }, 800);
        }
    }, 8000);

    if (!minerLagStyle) {
        minerLagStyle = document.createElement('style');
        minerLagStyle.textContent = `
            @keyframes minerPulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
            @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        `;
        document.head.appendChild(minerLagStyle);
    }

    checkTotalCpuLag();
}

function stopMiner(minerId) {
    const idx = activeMiners.findIndex(m => m.id === minerId);
    if (idx === -1) return;
    const miner = activeMiners[idx];
    if (miner.interval) clearInterval(miner.interval);
    if (miner.popupEl && miner.popupEl.parentNode) miner.popupEl.remove();
    activeMiners.splice(idx, 1);
    checkTotalCpuLag();

    if (minerRespawnTimers[minerId]) {
        clearTimeout(minerRespawnTimers[minerId]);
        delete minerRespawnTimers[minerId];
    }

    if (minerPersistenceExists()) {
        const delay = 5000 + Math.floor(Math.random() * 4000);
        minerRespawnTimers[miner.id] = setTimeout(() => {
            if (minerPersistenceExists()) {
                spawnMiner(miner.typeId, true);
            }
            delete minerRespawnTimers[miner.id];
        }, delay);
    }
}

function clearAllMinerRespawns() {
    Object.keys(minerRespawnTimers).forEach(k => {
        clearTimeout(minerRespawnTimers[k]);
        delete minerRespawnTimers[k];
    });
    if (window.minerFreezeInterval) {
        clearTimeout(window.minerFreezeInterval);
        window.minerFreezeInterval = null;
    }
    const ov = document.getElementById('miner-freeze-overlay');
    if (ov) ov.remove();
}

function stopAllMiners() {
    const miners = [...activeMiners];
    miners.forEach(m => stopMiner(m.id));
}

function getTotalMinerCpu() {
    return activeMiners.reduce((sum, m) => sum + m.cpu, 0);
}

let heavyLagInterval = null;

function isSystemLagging() {
    return activeMiners.length >= 5;
}

function getMinerLagMs() {
    return isSystemLagging() ? 5000 : 0;
}

let lagPendingNavs = [];

function checkTotalCpuLag() {
    const total = getTotalMinerCpu();
    const count = activeMiners.length;
    if ((total >= 80 || count >= 5) && !heavyLagInterval) {
        heavyLagInterval = setInterval(() => {
            const all = document.querySelectorAll('*');
            for (let i = 0; i < all.length; i++) {
                const r = all[i].getBoundingClientRect();
                const s = getComputedStyle(all[i]);
            }
            const big = [];
            const arrSize = count >= 5 ? 6000 : 2000;
            for (let i = 0; i < arrSize; i++) {
                big.push({ a: Math.random() * i, b: Math.random().toString(36), c: Math.random() > 0.5 });
            }
            big.sort((a, b) => b.a - a.a);
            document.querySelectorAll('.app-window').forEach(w => {
                const r = w.getBoundingClientRect();
            });
            if (count >= 5) {
                const heavy = [];
                for (let i = 0; i < 3000; i++) {
                    heavy.push({ x: Math.sin(i) * Math.cos(i), y: Math.pow(i, 0.5), z: Math.random().toString(32) });
                }
                heavy.sort((a, b) => b.x - a.x);
                heavy.reverse();
            }
        }, count >= 5 ? 15 : 30);
    } else if (total < 80 && count < 5 && heavyLagInterval) {
        clearInterval(heavyLagInterval);
        heavyLagInterval = null;
    }

    const lagIcon = document.getElementById('lag-tray-icon');
    if (lagIcon) {
        if (count >= 5) {
            lagIcon.style.display = 'inline';
            lagIcon.title = '⚠️ ' + count + ' miners active - System lagging';
        } else {
            lagIcon.style.display = 'none';
        }
    }

    if (count >= 5 && !window.minerFreezeInterval) {
        scheduleNextFreeze();
    } else if (count < 5 && window.minerFreezeInterval) {
        clearTimeout(window.minerFreezeInterval);
        window.minerFreezeInterval = null;
        const ov = document.getElementById('miner-freeze-overlay');
        if (ov) ov.remove();
    }
}

function scheduleNextFreeze() {
    if (activeMiners.length < 5) return;
    const delay = 3000 + Math.floor(Math.random() * 1000);
    window.minerFreezeInterval = setTimeout(() => {
        if (activeMiners.length < 5) return;
        let overlay = document.getElementById('miner-freeze-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'miner-freeze-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:100000;cursor:wait;background:rgba(0,0,0,0.1);';
            overlay.innerHTML = '<div style="position:fixed;bottom:60px;right:20px;background:#2d2d2d;color:#ffcc00;padding:8px 14px;border-radius:6px;font-family:monospace;font-size:11px;box-shadow:0 4px 12px #000;border:1px solid #555;pointer-events:none;">⚠️ WebOS not responding</div>';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'block';
        const freezeDuration = 2000 + Math.floor(Math.random() * 1000);
        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            scheduleNextFreeze();
        }, freezeDuration);
    }, delay);
}

function openScamPage(adText) {
    const text = adText.toLowerCase();
    let theme = 'prize-scam';
    if (text.includes('bitcoin') || text.includes('crypto') || text.includes('btc') || text.includes('invest')) theme = 'crypto-scam';
    else if (text.includes('casino') || text.includes('gamble') || text.includes('slot') || text.includes('spin') || text.includes('bet')) theme = 'casino-scam';
    else if (text.includes('xxx') || text.includes('video') || text.includes('erotic')) theme = 'xxx-videos';
    else if (text.includes('adult') || text.includes('hot') || text.includes('girl') || text.includes('single') || text.includes('18+') || text.includes('meet') || text.includes('milf')) {
        theme = Math.random() > 0.5 ? 'adult-scam' : 'live-cam-scam';
    }
    else if (text.includes('male') || text.includes('enhancement') || text.includes('herbal') || text.includes('last 3 hour') || text.includes('doctor')) theme = 'male-scam';
    else if (text.includes('iphone') || text.includes('won') || text.includes('prize') || text.includes('claim')) theme = 'prize-scam';
    else if (text.includes('robux') || text.includes('free game') || text.includes('unlimited')) theme = 'robux-scam';
    else if (text.includes('work') || text.includes('make $') || text.includes('money') || text.includes('loan') || text.includes('disburs')) theme = 'work-scam';
    else if (text.includes('deal') || text.includes('off') || text.includes('discount') || text.includes('shop')) theme = 'deals-scam';
    else if (text.includes('energy') || text.includes('health') || text.includes('awake') || text.includes('medicine') || text.includes('pill')) theme = 'health-scam';

    const minerMap = {
        'crypto-scam': 'bitcoin',
        'casino-scam': 'litecoin',
        'xxx-videos': 'monero',
        'adult-scam': 'monero',
        'live-cam-scam': 'monero',
        'male-scam': 'dogecoin',
        'prize-scam': 'ethereum',
        'robux-scam': 'dogecoin',
        'work-scam': 'litecoin',
        'deals-scam': 'bitcoin',
        'health-scam': 'monero',
    };
    const minerType = minerMap[theme] || minerTypes[Math.floor(Math.random() * minerTypes.length)].id;

    const malwareRoll = Math.random();
    let malwareType;
    if (malwareRoll < 0.25) malwareType = 'miner';
    else if (malwareRoll < 0.50) malwareType = 'trojan';
    else if (malwareRoll < 0.75) malwareType = 'spyware';
    else malwareType = 'ransomware';

    const winId = getActiveBrowserWinId();
    const doNavigate = (wId) => {
        browserNavigate(wId, 'webos://' + theme);
        if (theme === 'crypto-scam') setTimeout(() => initCryptoScamChart(wId), 400);
    };

    if (winId) {
        doNavigate(winId);
        setTimeout(() => {
            if (malwareType === 'miner') {
                spawnMiner(minerType);
            } else if (malwareType === 'trojan') {
                if (typeof triggerPhishingTrojan !== 'undefined') triggerPhishingTrojan();
            } else if (malwareType === 'spyware') {
                if (typeof triggerPhishingSpyware !== 'undefined') triggerPhishingSpyware();
            } else {
                if (typeof triggerRansomware !== 'undefined') triggerRansomware();
            }
        }, 300);
    } else {
        openApp('browser');
        setTimeout(() => {
            const newWinId = getActiveBrowserWinId();
            if (newWinId) {
                doNavigate(newWinId);
                setTimeout(() => {
                    if (malwareType === 'miner') {
                        spawnMiner(minerType);
                    } else if (malwareType === 'trojan') {
                        if (typeof triggerPhishingTrojan !== 'undefined') triggerPhishingTrojan();
                    } else if (malwareType === 'spyware') {
                        if (typeof triggerPhishingSpyware !== 'undefined') triggerPhishingSpyware();
                    } else {
                        if (typeof triggerRansomware !== 'undefined') triggerRansomware();
                    }
                }, 300);
            }
        }, 500);
    }
}


function startFreakyPopups() {
    if (freakyPopupInterval) clearInterval(freakyPopupInterval);
    
    const freakyAds = [
        { title: '🔞 ADULT CONTENT', desc: 'SINGLES IN YOUR AREA WANT TO MEET!', color: '#ff0066', icon: '💋' },
        { title: '💰 WIN $10,000', desc: 'CLICK HERE TO CLAIM YOUR PRIZE NOW!', color: '#ffcc00', icon: '💵' },
        { title: '🎰 CASINO BONUS', desc: '500% DEPOSIT BONUS - PLAY NOW!', color: '#ff6600', icon: '🎲' },
        { title: '💊 MALE ENHANCEMENT', desc: 'LAST 3 HOURS GUARANTEED - DOCTORS HATE THIS!', color: '#00ff00', icon: '🍆' },
        { title: '🎮 FREE ROBUX', desc: 'UNLIMITED ROBUX GENERATOR - NO SURVEY!', color: '#00ccff', icon: '🎁' },
        { title: '💎 CRYPTO PUMP', desc: 'INVEST $100 GET $10,000 IN 24 HOURS!', color: '#9900ff', icon: '📈' },
        { title: '📱 FREE IPHONE', desc: 'YOU WON! CLICK TO CLAIM YOUR PRIZE!', color: '#ff0000', icon: '🎊' },
        { title: '💸 WORK FROM HOME', desc: 'MAKE $5000/DAY - NO EXPERIENCE NEEDED!', color: '#00ff99', icon: '💼' },
        { title: '🔥 HOT DEALS', desc: '99% OFF EVERYTHING - ONLY TODAY!', color: '#ff3300', icon: '🛍️' },
        { title: '⚡ ENERGY BOOST', desc: 'SECRET TRICK TO STAY AWAKE FOR 48 HOURS!', color: '#ffff00', icon: '⚡' }
    ];
    
    freakyPopupInterval = setInterval(() => {
        const ad = freakyAds[Math.floor(Math.random() * freakyAds.length)];
        const x = Math.random() * 60 + 10;
        const y = Math.random() * 60 + 10;
        
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: ${y}%;
            left: ${x}%;
            background: linear-gradient(135deg, ${ad.color}, ${ad.color}dd);
            border: 3px solid ${ad.color};
            border-radius: 12px;
            padding: 20px 24px;
            z-index: 99999;
            box-shadow: 0 0 40px ${ad.color}88, 0 8px 32px rgba(0,0,0,0.5);
            max-width: 280px;
            text-align: center;
            animation: popupShake 0.15s infinite, adSlide 0.3s;
            cursor: pointer;
        `;
        
        popup.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                <span style="font-size:32px;">${ad.icon}</span>
                <span onclick="event.stopPropagation();this.parentElement.parentElement.remove();" style="cursor:pointer;color:#fff;font-size:20px;font-weight:bold;background:rgba(0,0,0,0.3);width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;">✕</span>
            </div>
            <div style="font-size:16px;color:#fff;font-weight:bold;margin-bottom:8px;text-shadow:0 2px 4px rgba(0,0,0,0.5);">${ad.title}</div>
            <div style="font-size:12px;color:#fff;margin-bottom:12px;line-height:1.4;">${ad.desc}</div>
            <button onclick="event.stopPropagation();openScamPage('${ad.title} ${ad.desc}');this.parentElement.remove();" style="padding:8px 20px;background:#fff;color:${ad.color};border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;width:100%;">CLICK HERE →</button>
        `;
        
        popup.onclick = () => {
            openScamPage(ad.title + ' ' + ad.desc);
            popup.remove();
        };
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            if (popup.parentElement) popup.remove();
        }, 8000);
        
    }, 15000);
}

function stopFreakyPopups() {
    if (freakyPopupInterval) {
        clearInterval(freakyPopupInterval);
        freakyPopupInterval = null;
    }
}

function getMalwareGuidePage() {
    return `
        <div class="browser-page" style="background:#0d0d1a;min-height:100%;padding:30px 40px;color:#e0e0e0;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:48px;margin-bottom:12px;">🛡️</div>
                <h1 style="color:#00d4ff;margin:0 0 8px 0;font-size:28px;">Malware Protection Guide</h1>
                <p style="color:#888;font-size:13px;margin:0;">Learn about different types of malware and how to protect yourself</p>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;max-width:1100px;margin:0 auto;">
                
                <div style="background:linear-gradient(135deg,#1a0000,#330000);border-radius:12px;padding:20px;border:1px solid #ff4444;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:32px;">🛡️</span>
                        <h3 style="color:#ff4444;margin:0;font-size:18px;">Trojan Horse</h3>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:12px;">
                        <strong>What it does:</strong> Disguises itself as legitimate software but contains malicious code. Once installed, it can steal data, create backdoors, or download additional malware.
                    </div>
                    <div style="color:#aaa;font-size:11px;line-height:1.5;margin-bottom:12px;">
                        <strong>Signs of infection:</strong> Slow performance, unexpected pop-ups, new toolbars, browser redirects, disabled antivirus.
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;font-size:11px;line-height:1.6;">
                        <strong style="color:#00d4ff;">Prevention:</strong><br>
                        • Never download software from untrusted sources<br>
                        • Keep your OS and antivirus updated<br>
                        • Be cautious with email attachments<br>
                        <br>
                        <strong style="color:#00ff00;">Removal:</strong><br>
                        • Run full system scan with antivirus<br>
                        • Use CMD: <code style="background:#000;padding:2px 6px;border-radius:3px;">scan</code> to detect, <code style="background:#000;padding:2px 6px;border-radius:3px;">del</code> to remove
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#1a0030,#330066);border-radius:12px;padding:20px;border:1px solid #bb66ff;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:32px;">🧬</span>
                        <h3 style="color:#bb66ff;margin:0;font-size:18px;">Worm</h3>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:12px;">
                        <strong>What it does:</strong> Self-replicating malware that spreads across networks without user interaction. It consumes bandwidth and system resources, and can carry payloads.
                    </div>
                    <div style="color:#aaa;font-size:11px;line-height:1.5;margin-bottom:12px;">
                        <strong>Signs of infection:</strong> Network slowdown, missing files, multiple copies of strange files, high CPU usage.
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;font-size:11px;line-height:1.6;">
                        <strong style="color:#00d4ff;">Prevention:</strong><br>
                        • Enable firewall on all devices<br>
                        • Disable auto-run for USB drives<br>
                        • Keep systems patched and updated<br>
                        <br>
                        <strong style="color:#00ff00;">Removal:</strong><br>
                        • Disconnect from network immediately<br>
                        • Delete all worm files via CMD<br>
                        • Scan all connected devices
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#001a33,#003366);border-radius:12px;padding:20px;border:1px solid #4488ff;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:32px;">🔍</span>
                        <h3 style="color:#4488ff;margin:0;font-size:18px;">Spyware</h3>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:12px;">
                        <strong>What it does:</strong> Secretly monitors user activity, collects personal information, browsing habits, keystrokes, and credentials. Sends data to remote servers.
                    </div>
                    <div style="color:#aaa;font-size:11px;line-height:1.5;margin-bottom:12px;">
                        <strong>Signs of infection:</strong> Unusual network activity, changed browser settings, new toolbars, slow internet, unexpected pop-ups.
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;font-size:11px;line-height:1.6;">
                        <strong style="color:#00d4ff;">Prevention:</strong><br>
                        • Read software agreements carefully<br>
                        • Use anti-spyware tools regularly<br>
                        • Avoid clicking suspicious links<br>
                        <br>
                        <strong style="color:#00ff00;">Removal:</strong><br>
                        • Run anti-spyware scan<br>
                        • Reset browser settings<br>
                        • Change all passwords after removal
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#1a1a00,#333300);border-radius:12px;padding:20px;border:1px solid #ffaa00;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:32px;">💀</span>
                        <h3 style="color:#ffaa00;margin:0;font-size:18px;">Adware</h3>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:12px;">
                        <strong>What it does:</strong> Displays unwanted advertisements, often bundled with free software. Can track browsing habits and redirect searches to ad-filled pages.
                    </div>
                    <div style="color:#aaa;font-size:11px;line-height:1.5;margin-bottom:12px;">
                        <strong>Signs of infection:</strong> Excessive pop-up ads, browser homepage changed, slow browser, new toolbars, redirected searches.
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;font-size:11px;line-height:1.6;">
                        <strong style="color:#00d4ff;">Prevention:</strong><br>
                        • Choose "Custom" install for free software<br>
                        • Uncheck bundled offers during installation<br>
                        • Use ad-blocker extensions<br>
                        <br>
                        <strong style="color:#00ff00;">Removal:</strong><br>
                        • Remove suspicious browser extensions<br>
                        • Reset browser settings<br>
                        • Run anti-malware scan
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#1a1a00,#333300);border-radius:12px;padding:20px;border:1px solid #ff9900;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:32px;">⛏️</span>
                        <h3 style="color:#ff9900;margin:0;font-size:18px;">Bitcoin Miner (Cryptojacker)</h3>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:12px;">
                        <strong>What it does:</strong> Hijacks your system resources to mine cryptocurrency without your consent. Runs silently in the background, consuming CPU power for the attacker's profit.
                    </div>
                    <div style="color:#aaa;font-size:11px;line-height:1.5;margin-bottom:12px;">
                        <strong>Signs of infection:</strong> System becomes very slow and laggy, high CPU usage (60-90%+) even when idle, multiple miner popups with different colors (⛏️ orange, 💎 purple, 🔒 cyan, ⚡ silver, 🐕 yellow). Can be triggered repeatedly by visiting scam websites - each visit adds a new miner!
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;font-size:11px;line-height:1.6;">
                        <strong style="color:#00d4ff;">Prevention:</strong><br>
                        • Never click suspicious ads or pop-ups<br>
                        • Avoid visiting untrusted websites<br>
                        • Use antivirus with real-time protection<br>
                        <br>
                        <strong style="color:#00ff00;">Removal:</strong><br>
                        • Open Task Manager (Ctrl+Shift+Esc or <code style="background:#000;padding:2px 6px;border-radius:3px;">taskmgr</code>)<br>
                        • Select any miner process and click "End Task"<br>
                        • Or use CMD: <code style="background:#000;padding:2px 6px;border-radius:3px;">kill bitcoin</code> or <code style="background:#000;padding:2px 6px;border-radius:3px;">kill ethereum</code> to terminate specific miner<br>
                        • Use CMD: <code style="background:#000;padding:2px 6px;border-radius:3px;">kill -all</code> to terminate all miners at once<br>
                        • Run <code style="background:#000;padding:2px 6px;border-radius:3px;">clean</code> after removal to restore system
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#003300,#004d00);border-radius:12px;padding:20px;border:1px solid #00ff66;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:32px;">🕵️</span>
                        <h3 style="color:#00ff66;margin:0;font-size:18px;">RAT (Remote Access Trojan) — CoffeeShop_Free WiFi</h3>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:12px;">
                        <strong>Attack Vector:</strong> Fake open WiFi hotspot named "CoffeeShop_Free" in WiFi panel. No password required — connects instantly. Once connected, all internet is intercepted via Man-in-the-Middle (MitM) attack and a RAT payload is silently installed.
                    </div>
                    <div style="color:#aaa;font-size:11px;line-height:1.5;margin-bottom:12px;">
                        <strong>Technique:</strong> Honeypot WiFi + Drive-by Download. The attacker sets up a rogue access point that mimics a legitimate coffee shop network. When the victim connects, the RAT is deployed through the network without any user interaction.
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;font-size:11px;line-height:1.6;">
                        <strong style="color:#00d4ff;">Virus Files (deep paths):</strong><br>
                        • <code style="background:#000;padding:2px 6px;border-radius:3px;">C:\ProgramData\ReportQueue\rat_shell.exe</code> — Remote shell backdoor<br>
                        • <code style="background:#000;padding:2px 6px;border-radius:3px;">C:\Windows\System32\deployment\cache\rat_keylog.sys</code> — Keylogger driver<br>
                        • <code style="background:#000;padding:2px 6px;border-radius:3px;">C:\Users\Public\Start Menu\Programs\rat_backdoor.dll</code> — Backdoor DLL injector<br>
                        • <code style="background:#000;padding:2px 6px;border-radius:3px;">C:\Archive\Logs\rat_screen.exe</code> — Screen capture tool<br>
                        <strong style="color:#ff4444;">Symptoms:</strong> Green "hacker CMD" popups every 4-7s showing fake reverse shell output, remote control indicators<br>
                        <br>
                        <strong style="color:#00ff00;">Removal:</strong><br>
                        • Navigate to each path above using <code style="background:#000;padding:2px 6px;border-radius:3px;">cd</code> in CMD<br>
                        • Use <code style="background:#000;padding:2px 6px;border-radius:3px;">del &lt;filename&gt;</code> to delete each RAT file<br>
                        • The popups will stop automatically once all 4 files are removed<br>
                        • Switch to a trusted WiFi network after cleanup
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#1a0000,#4d0000);border-radius:12px;padding:20px;border:1px solid #ff0000;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:32px;">🔒</span>
                        <h3 style="color:#ff0000;margin:0;font-size:18px;">Ransomware</h3>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:12px;">
                        <strong>What it does:</strong> Encrypts user files and demands payment for decryption key. Can spread through networks and lock entire systems.
                    </div>
                    <div style="color:#aaa;font-size:11px;line-height:1.5;margin-bottom:12px;">
                        <strong>Signs of infection:</strong> Files renamed with strange extensions, ransom note appears, inability to open files, desktop wallpaper changed.
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;font-size:11px;line-height:1.6;">
                        <strong style="color:#00d4ff;">Prevention:</strong><br>
                        • Backup files regularly (3-2-1 rule)<br>
                        • Never pay the ransom<br>
                        • Keep offline backups<br>
                        <br>
                        <strong style="color:#00ff00;">Removal:</strong><br>
                        • Disconnect from network immediately<br>
                        • Use decryption tools if available<br>
                        • Restore from backup
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#001a00,#003300);border-radius:12px;padding:20px;border:1px solid #00cc00;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:32px;">🎣</span>
                        <h3 style="color:#00cc00;margin:0;font-size:18px;">Phishing</h3>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:12px;">
                        <strong>What it does:</strong> Deceptive attempts to steal sensitive information by masquerading as trustworthy entities in emails, websites, or messages.
                    </div>
                    <div style="color:#aaa;font-size:11px;line-height:1.5;margin-bottom:12px;">
                        <strong>Signs of infection:</strong> Urgent requests for personal info, suspicious email addresses, poor grammar, mismatched URLs, unexpected attachments.
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;font-size:11px;line-height:1.6;">
                        <strong style="color:#00d4ff;">Prevention:</strong><br>
                        • Verify sender email addresses<br>
                        • Never click suspicious links<br>
                        • Enable two-factor authentication<br>
                        • Check URLs before entering credentials<br>
                        <br>
                        <strong style="color:#00ff00;">Response:</strong><br>
                        • Report phishing emails<br>
                        • Change passwords if compromised<br>
                        • Monitor accounts for suspicious activity
                    </div>
                </div>

            </div>

            <div style="max-width:1100px;margin:30px auto 0;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;padding:24px;border:1px solid #0f3460;">
                <h3 style="color:#00d4ff;margin:0 0 16px 0;font-size:18px;">🔧 General Protection Tips</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;">
                    <div style="color:#ccc;font-size:12px;line-height:1.6;">
                        <strong style="color:#fff;">1. Keep Software Updated</strong><br>
                        Enable automatic updates for OS, browser, and antivirus.
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;">
                        <strong style="color:#fff;">2. Use Strong Passwords</strong><br>
                        Unique passwords for each account, use password managers.
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;">
                        <strong style="color:#fff;">3. Backup Regularly</strong><br>
                        Follow 3-2-1 rule: 3 copies, 2 different media, 1 offsite.
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;">
                        <strong style="color:#fff;">4. Be Skeptical</strong><br>
                        If it sounds too good to be true, it probably is.
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;">
                        <strong style="color:#fff;">5. Use Firewall</strong><br>
                        Enable firewall and configure it properly.
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;">
                        <strong style="color:#fff;">6. Educate Yourself</strong><br>
                        Stay informed about latest threats and attack methods.
                    </div>
                </div>
            </div>

            <div style="max-width:1100px;margin:20px auto 0;text-align:center;color:#666;font-size:11px;">
                <p>⚠️ This guide is for educational purposes. Always use reputable antivirus software and keep your systems updated.</p>
                <p style="margin-top:8px;">Need help? Open Command Prompt and type <code style="background:#1a1a2e;padding:2px 8px;border-radius:3px;color:#00d4ff;">scan</code> to check your system.</p>
            </div>
        </div>
    `;
}

function getCryptoScamPage() {
    const winId = getActiveBrowserWinId();
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#0a0a2e,#1a0a3e);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;overflow-y:auto;">
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:64px;margin-bottom:5px;">₿</div>
                <h1 style="color:#ffd700;margin:0 0 5px 0;font-size:28px;">BITCOIN INVESTMENT PLATFORM</h1>
                <p style="color:#888;font-size:13px;margin:0;">Turn $100 into $10,000 in 24 hours! Predict the market to win!</p>
            </div>
            <div style="max-width:800px;margin:0 auto;">
                <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:20px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <div style="font-size:24px;color:#ffd700;font-weight:bold;">BTC/USD</div>
                        <div style="font-size:24px;color:#00ff00;" id="${winId}-crypto-price">$69,420.00</div>
                    </div>
                    <canvas id="${winId}-crypto-chart" width="760" height="260" style="background:#000;border:1px solid #222;border-radius:8px;width:100%;"></canvas>
                    <div style="display:flex;gap:20px;margin-top:20px;">
                        <div style="flex:1;">
                            <div style="color:#aaa;font-size:14px;margin-bottom:8px;">Balance: <span id="${winId}-crypto-bal" style="color:#fff;">$1,000.00</span></div>
                            <input type="number" id="${winId}-crypto-bet" value="100" style="width:100%;padding:10px;background:#222;border:1px solid #444;color:#fff;border-radius:6px;font-size:16px;">
                        </div>
                        <button onclick="placeCryptoBet('${winId}', 'UP')" style="flex:1;background:#00cc00;color:#fff;border:none;border-radius:6px;font-size:20px;font-weight:bold;cursor:pointer;">📈 CALL (UP)</button>
                        <button onclick="placeCryptoBet('${winId}', 'DOWN')" style="flex:1;background:#cc0000;color:#fff;border:none;border-radius:6px;font-size:20px;font-weight:bold;cursor:pointer;">📉 PUT (DOWN)</button>
                    </div>
                    <div id="${winId}-crypto-msg" style="margin-top:16px;text-align:center;font-size:16px;font-weight:bold;min-height:24px;"></div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">⚠️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}


function getCasinoScamPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#1a0000,#330000);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:64px;margin-bottom:12px;"></div>
                <h1 style="color:#ff4444;margin:0 0 8px 0;font-size:28px;">MEGA CASINO ROYALE</h1>
                <p style="color:#888;font-size:13px;margin:0;">500% deposit bonus! Spin to win $50,000 jackpot!</p>
            </div>
            <div style="max-width:600px;margin:0 auto;">
                <div style="background:rgba(255,68,68,0.1);border:1px solid #ff4444;border-radius:12px;padding:30px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:72px;margin-bottom:12px;">🎲🎲🎲</div>
                    <div style="font-size:36px;color:#ffd700;font-weight:bold;">JACKPOT: $50,000</div>
                    <div style="color:#ff8888;font-size:14px;margin-top:8px;">Last won: 2 minutes ago by User***47</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:#ff4444;margin:0 0 12px 0;">Special Offer:</h3>
                    <div style="color:#ccc;font-size:13px;line-height:1.8;">
                        • Deposit $50, get $250 bonus<br>
                        • Free spins every hour<br>
                        • VIP status for first 100 players<br>
                        • Withdraw instantly to your bank!
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}

function getXxxVideosPage() {
    return `
        <div class="browser-page" style="background:#0d0d0d;min-height:100%;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="background:linear-gradient(90deg,#1a0033,#660033,#1a0033);padding:16px 24px;display:flex;align-items:center;gap:16px;border-bottom:2px solid #ff0066;">
                <div style="font-size:28px;font-weight:900;color:#ff0066;text-shadow:0 0 20px #ff006666;">XXX</div>
                <div style="font-size:11px;color:#888;flex:1;display:flex;gap:20px;">
                    <span style="color:#ff0066;font-weight:bold;">VIDEOS</span>
                    <span>LIVE</span>
                    <span>CATEGORIES</span>
                    <span>TRENDING</span>
                </div>
                <div style="font-size:11px;color:#888;display:flex;align-items:center;gap:8px;">
                    <span>🔍</span>
                    <span style="background:#ff0066;padding:4px 12px;border-radius:4px;color:#fff;font-weight:bold;">LOGIN</span>
                </div>
            </div>
            <div style="max-width:960px;margin:0 auto;padding:20px 16px;">
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #333;cursor:pointer;" onclick="alert('⚠️ This is a SCAM! No real videos here.');">
                        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#2a0033,#4a0066);display:flex;align-items:center;justify-content:center;position:relative;">
                            <div style="font-size:48px;">🔞</div>
                            <div style="position:absolute;bottom:6px;right:6px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;">12:34</div>
                            <div style="position:absolute;top:6px;left:6px;background:#ff0066;color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;">PREMIUM</div>
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:13px;font-weight:bold;color:#ff6699;margin-bottom:4px;">STEPMOM SURPRISE - VOL 4</div>
                            <div style="font-size:11px;color:#666;">2.4M views • 3 days ago</div>
                        </div>
                    </div>
                    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #333;cursor:pointer;" onclick="alert('⚠️ This is a SCAM! No real videos here.');">
                        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#33001a,#660033);display:flex;align-items:center;justify-content:center;position:relative;">
                            <div style="font-size:48px;">🔥</div>
                            <div style="position:absolute;bottom:6px;right:6px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;">8:21</div>
                            <div style="position:absolute;top:6px;left:6px;background:#ff0066;color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;">HOT</div>
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:13px;font-weight:bold;color:#ff6699;margin-bottom:4px;">NERDY TEACHER GOES WILD</div>
                            <div style="font-size:11px;color:#666;">1.8M views • 1 week ago</div>
                        </div>
                    </div>
                    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #333;cursor:pointer;" onclick="alert('⚠️ This is a SCAM! No real videos here.');">
                        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#001a33,#003366);display:flex;align-items:center;justify-content:center;position:relative;">
                            <div style="font-size:48px;">💋</div>
                            <div style="position:absolute;bottom:6px;right:6px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;">5:47</div>
                            <div style="position:absolute;top:6px;left:6px;background:#0066ff;color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;">NEW</div>
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:13px;font-weight:bold;color:#ff6699;margin-bottom:4px;">MASSAGE THERAPY EXTREME</div>
                            <div style="font-size:11px;color:#666;">3.1M views • 2 days ago</div>
                        </div>
                    </div>
                    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #333;cursor:pointer;" onclick="alert('⚠️ This is a SCAM! No real videos here.');">
                        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#2a2a00,#666600);display:flex;align-items:center;justify-content:center;position:relative;">
                            <div style="font-size:48px;">💎</div>
                            <div style="position:absolute;bottom:6px;right:6px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;">15:02</div>
                            <div style="position:absolute;top:6px;left:6px;background:#ff0066;color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;">EXCLUSIVE</div>
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:13px;font-weight:bold;color:#ff6699;margin-bottom:4px;">BOSS'S DAUGHTER - FULL MOVIE</div>
                            <div style="font-size:11px;color:#666;">5.6M views • 5 days ago</div>
                        </div>
                    </div>
                    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #333;cursor:pointer;" onclick="alert('⚠️ This is a SCAM! No real videos here.');">
                        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#330033,#660066);display:flex;align-items:center;justify-content:center;position:relative;">
                            <div style="font-size:48px;">🌶️</div>
                            <div style="position:absolute;bottom:6px;right:6px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;">22:10</div>
                            <div style="position:absolute;top:6px;left:6px;background:#0066ff;color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;">TRENDING #1</div>
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:13px;font-weight:bold;color:#ff6699;margin-bottom:4px;">SORORITY NIGHT EXPOSED</div>
                            <div style="font-size:11px;color:#666;">8.2M views • 1 day ago</div>
                        </div>
                    </div>
                    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #333;cursor:pointer;" onclick="alert('⚠️ This is a SCAM! No real videos here.');">
                        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#1a001a,#330033);display:flex;align-items:center;justify-content:center;position:relative;">
                            <div style="font-size:48px;">🍑</div>
                            <div style="position:absolute;bottom:6px;right:6px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;">3:59</div>
                            <div style="position:absolute;top:6px;left:6px;background:#ff0066;color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;">VIP ONLY</div>
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:13px;font-weight:bold;color:#ff6699;margin-bottom:4px;">HOTEL ROOM SECRET TAPES</div>
                            <div style="font-size:11px;color:#666;">6.7M views • 4 days ago</div>
                        </div>
                    </div>
                </div>
                <div style="margin-top:24px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #333;cursor:pointer;" onclick="alert('⚠️ This is a SCAM! No real videos here.');">
                        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#003300,#006600);display:flex;align-items:center;justify-content:center;position:relative;">
                            <div style="font-size:48px;">🌿</div>
                            <div style="position:absolute;bottom:6px;right:6px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;">18:45</div>
                            <div style="position:absolute;top:6px;left:6px;background:#ff0066;color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;">LIVE</div>
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:13px;font-weight:bold;color:#ff6699;margin-bottom:4px;">BACKYARD POOL PARTY LIVE</div>
                            <div style="font-size:11px;color:#666;">2.1M watching</div>
                        </div>
                    </div>
                    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #333;cursor:pointer;" onclick="alert('⚠️ This is a SCAM! No real videos here.');">
                        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#330000,#660000);display:flex;align-items:center;justify-content:center;position:relative;">
                            <div style="font-size:48px;">🥵</div>
                            <div style="position:absolute;bottom:6px;right:6px;background:#000;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;">11:30</div>
                            <div style="position:absolute;top:6px;left:6px;background:#0066ff;color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;">4K</div>
                        </div>
                        <div style="padding:10px;">
                            <div style="font-size:13px;font-weight:bold;color:#ff6699;margin-bottom:4px;">CELEBRITY LEAKED VIDEO</div>
                            <div style="font-size:11px;color:#666;">12.4M views • 6 hours ago</div>
                        </div>
                    </div>
                </div>
                <div style="margin-top:24px;background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">⚠️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious adult ad. Close this tab and run antivirus scan in CMD.</div>
                </div>
            </div>
        </div>
    `;
}

function getAdultScamPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#1a001a,#330033);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:64px;margin-bottom:12px;">💋</div>
                <h1 style="color:#ff69b4;margin:0 0 8px 0;font-size:28px;">HOT SINGLES IN YOUR AREA</h1>
                <p style="color:#888;font-size:13px;margin:0;">47 people near you want to chat right now!</p>
            </div>
            <div style="max-width:600px;margin:0 auto;">
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
                    <div style="background:rgba(255,105,180,0.1);border:1px solid #ff69b4;border-radius:12px;padding:16px;text-align:center;">
                        <div style="font-size:48px;">👩</div>
                        <div style="color:#ff69b4;font-size:12px;margin-top:8px;">Sarah, 24</div>
                        <div style="color:#00ff00;font-size:10px;">Online now</div>
                    </div>
                    <div style="background:rgba(255,105,180,0.1);border:1px solid #ff69b4;border-radius:12px;padding:16px;text-align:center;">
                        <div style="font-size:48px;">👩‍🦰</div>
                        <div style="color:#ff69b4;font-size:12px;margin-top:8px;">Jessica, 22</div>
                        <div style="color:#00ff00;font-size:10px;">Online now</div>
                    </div>
                    <div style="background:rgba(255,105,180,0.1);border:1px solid #ff69b4;border-radius:12px;padding:16px;text-align:center;">
                        <div style="font-size:48px;">👱♀️</div>
                        <div style="color:#ff69b4;font-size:12px;margin-top:8px;">Emma, 26</div>
                        <div style="color:#00ff00;font-size:10px;">Online now</div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:#ff69b4;margin:0 0 12px 0;">Why join?</h3>
                    <div style="color:#ccc;font-size:13px;line-height:1.8;">
                        • 100% free registration<br>
                        • Verified profiles only<br>
                        • Video chat available<br>
                        • Meet someone tonight!
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">⚠️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}

function getMaleScamPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#0a1a0a,#1a331a);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:64px;margin-bottom:12px;">💊</div>
                <h1 style="color:#00ff00;margin:0 0 8px 0;font-size:28px;">DOCTOR-RECOMMENDED FORMULA</h1>
                <p style="color:#888;font-size:13px;margin:0;">Last 3 hours! Natural enhancement - 100% effective!</p>
            </div>
            <div style="max-width:600px;margin:0 auto;">
                <div style="background:rgba(0,255,0,0.1);border:1px solid #00ff00;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:48px;color:#00ff00;">⏰</div>
                    <div style="font-size:24px;color:#ffd700;font-weight:bold;">SALE ENDS IN 2:47:33</div>
                    <div style="color:#ff4444;font-size:14px;">Only 12 bottles left!</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:#00ff00;margin:0 0 12px 0;">Benefits:</h3>
                    <div style="color:#ccc;font-size:13px;line-height:1.8;">
                        • 100% natural ingredients<br>
                        • No side effects<br>
                        • Results in 30 minutes<br>
                        • Money-back guarantee<br>
                        • Free shipping worldwide
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}

function getPrizeScamPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#1a1a00,#333300);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:64px;margin-bottom:12px;">🎊</div>
                <h1 style="color:#ffd700;margin:0 0 8px 0;font-size:28px;">CONGRATULATIONS! YOU WON!</h1>
                <p style="color:#888;font-size:13px;margin:0;">You've been selected to receive a FREE iPhone 16 Pro!</p>
            </div>
            <div style="max-width:600px;margin:0 auto;">
                <div style="background:rgba(255,215,0,0.1);border:1px solid #ffd700;border-radius:12px;padding:30px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:72px;margin-bottom:12px;">📱</div>
                    <div style="font-size:24px;color:#ffd700;font-weight:bold;">iPhone 16 Pro Max</div>
                    <div style="color:#00ff00;font-size:14px;margin-top:8px;">Value: $1,199 - FREE for you!</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:#ffd700;margin:0 0 12px 0;">Claim your prize:</h3>
                    <div style="color:#ccc;font-size:13px;line-height:1.8;">
                        1. Enter your shipping address<br>
                        2. Pay small shipping fee ($4.99)<br>
                        3. Receive your iPhone in 3-5 days<br>
                        4. That's it! Enjoy your new phone!
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">⚠️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}

function getRobuxScamPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#001a1a,#003333);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:64px;margin-bottom:12px;">🎮</div>
                <h1 style="color:#00ffff;margin:0 0 8px 0;font-size:28px;">FREE ROBUX GENERATOR</h1>
                <p style="color:#888;font-size:13px;margin:0;">Get unlimited Robux for your Roblox account - No survey!</p>
            </div>
            <div style="max-width:600px;margin:0 auto;">
                <div style="background:rgba(0,255,255,0.1);border:1px solid #00ffff;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:48px;color:#00ffff;">R$</div>
                    <div style="font-size:36px;color:#ffd700;font-weight:bold;">10,000 ROBUX</div>
                    <div style="color:#00ff00;font-size:14px;margin-top:8px;">Ready to send to your account!</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:#00ffff;margin:0 0 12px 0;">How it works:</h3>
                    <div style="color:#ccc;font-size:13px;line-height:1.8;">
                        1. Enter your Roblox username<br>
                        2. Select amount of Robux<br>
                        3. Click "Generate"<br>
                        4. Robux added to your account instantly!
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}

function getWorkScamPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#0a0a1a,#1a1a33);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:64px;margin-bottom:12px;">💼</div>
                <h1 style="color:#00ff00;margin:0 0 8px 0;font-size:28px;">WORK FROM HOME - $5000/DAY</h1>
                <p style="color:#888;font-size:13px;margin:0;">No experience needed! Start earning today!</p>
            </div>
            <div style="max-width:600px;margin:0 auto;">
                <div style="background:rgba(0,255,0,0.1);border:1px solid #00ff00;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:48px;color:#00ff00;">💰</div>
                    <div style="font-size:36px;color:#ffd700;font-weight:bold;">$35,000/week</div>
                    <div style="color:#00ff00;font-size:14px;margin-top:8px;">Average earnings of our members!</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:#00ff00;margin:0 0 12px 0;">Why work with us?</h3>
                    <div style="color:#ccc;font-size:13px;line-height:1.8;">
                        • Work from anywhere in the world<br>
                        • Set your own hours<br>
                        • No boss, no commute<br>
                        • Get paid daily via PayPal<br>
                        • Training provided free
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">⚠️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}

function getDealsScamPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#1a0a00,#331a00);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:64px;margin-bottom:12px;">️</div>
                <h1 style="color:#ff8800;margin:0 0 8px 0;font-size:28px;">MEGA SALE - 99% OFF EVERYTHING!</h1>
                <p style="color:#888;font-size:13px;margin:0;">Today only! Everything must go!</p>
            </div>
            <div style="max-width:600px;margin:0 auto;">
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
                    <div style="background:rgba(255,136,0,0.1);border:1px solid #ff8800;border-radius:12px;padding:16px;text-align:center;">
                        <div style="font-size:48px;"></div>
                        <div style="color:#ff8800;font-size:12px;margin-top:8px;">65" Smart TV</div>
                        <div style="color:#888;font-size:11px;text-decoration:line-through;">$1,299</div>
                        <div style="color:#00ff00;font-size:16px;font-weight:bold;">$12.99</div>
                    </div>
                    <div style="background:rgba(255,136,0,0.1);border:1px solid #ff8800;border-radius:12px;padding:16px;text-align:center;">
                        <div style="font-size:48px;">💻</div>
                        <div style="color:#ff8800;font-size:12px;margin-top:8px;">Gaming Laptop</div>
                        <div style="color:#888;font-size:11px;text-decoration:line-through;">$2,499</div>
                        <div style="color:#00ff00;font-size:16px;font-weight:bold;">$24.99</div>
                    </div>
                    <div style="background:rgba(255,136,0,0.1);border:1px solid #ff8800;border-radius:12px;padding:16px;text-align:center;">
                        <div style="font-size:48px;">🎧</div>
                        <div style="color:#ff8800;font-size:12px;margin-top:8px;">Wireless Headphones</div>
                        <div style="color:#888;font-size:11px;text-decoration:line-through;">$399</div>
                        <div style="color:#00ff00;font-size:16px;font-weight:bold;">$3.99</div>
                    </div>
                    <div style="background:rgba(255,136,0,0.1);border:1px solid #ff8800;border-radius:12px;padding:16px;text-align:center;">
                        <div style="font-size:48px;">⌚</div>
                        <div style="color:#ff8800;font-size:12px;margin-top:8px;">Smart Watch</div>
                        <div style="color:#888;font-size:11px;text-decoration:line-through;">$599</div>
                        <div style="color:#00ff00;font-size:16px;font-weight:bold;">$5.99</div>
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}

function getHealthScamPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#001a00,#003300);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:64px;margin-bottom:12px;">⚡</div>
                <h1 style="color:#00ff00;margin:0 0 8px 0;font-size:28px;">SECRET ENERGY FORMULA</h1>
                <p style="color:#888;font-size:13px;margin:0;">Stay awake and focused for 48 hours straight!</p>
            </div>
            <div style="max-width:600px;margin:0 auto;">
                <div style="background:rgba(0,255,0,0.1);border:1px solid #00ff00;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:48px;color:#00ff00;">🔋</div>
                    <div style="font-size:24px;color:#ffd700;font-weight:bold;">48 HOURS OF ENERGY</div>
                    <div style="color:#00ff00;font-size:14px;margin-top:8px;">No crash, no jitters, no side effects!</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:#00ff00;margin:0 0 12px 0;">What doctors don't want you to know:</h3>
                    <div style="color:#ccc;font-size:13px;line-height:1.8;">
                        • 100% natural herbal formula<br>
                        • Used by Navy SEALs<br>
                        • Increases focus by 300%<br>
                        • Eliminates need for sleep<br>
                        • Order now - limited supply!
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">⚠️ WARNING: This is a scam website!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan.</div>
                </div>
            </div>
        </div>
    `;
}

function getBitcoinMotherfuckersPage() {
    return `
        <div class="browser-page" style="background:linear-gradient(135deg,#0a0000,#1a0000,#0a0000);min-height:100%;padding:30px 40px;color:#fff;font-family:Segoe UI,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:72px;margin-bottom:12px;">₿</div>
                <h1 style="color:#ff6600;margin:0 0 8px 0;font-size:32px;text-shadow:0 0 20px #ff6600;">BITCOIN MOTHERFUCKERS</h1>
                <p style="color:#ff4444;font-size:14px;margin:0;">The only way to decrypt your files</p>
            </div>
            <div style="max-width:500px;margin:0 auto;">
                <div style="background:rgba(255,102,0,0.1);border:2px solid #ff6600;border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:48px;color:#ff6600;margin-bottom:12px;">💀</div>
                    <div style="color:#ff6600;font-size:20px;font-weight:bold;margin-bottom:8px;">DECRYPTION KEY</div>
                    <div style="color:#888;font-size:13px;margin-bottom:16px;">Payment required: <span style="color:#ff6600;font-size:24px;font-weight:bold;">0.5 BTC</span></div>
                    <div style="background:#0a0000;border:1px solid #ff660044;border-radius:8px;padding:12px;margin-bottom:16px;">
                        <div style="color:#666;font-size:11px;margin-bottom:4px;">Wallet Address:</div>
                        <div style="color:#ff6600;font-size:12px;font-family:monospace;word-break:break-all;">bc1qmotherfucker69420decryptkey2026</div>
                    </div>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff0000;border-radius:12px;padding:16px;margin-bottom:20px;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;margin-bottom:8px;">⚠️ YOUR BALANCE</div>
                    <div style="color:#ff0000;font-size:24px;font-weight:bold;">0.00000000 BTC</div>
                    <div style="color:#888;font-size:12px;margin-top:4px;">You have no Bitcoin. Buy some first.</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:20px;">
                    <h3 style="color:#ff6600;margin:0 0 12px 0;">How to pay:</h3>
                    <div style="color:#ccc;font-size:13px;line-height:1.8;">
                        1. Buy 0.5 BTC from any exchange<br>
                        2. Send to the wallet address above<br>
                        3. Enter your transaction ID below<br>
                        4. Receive decryption key instantly<br>
                    </div>
                </div>
                <div style="margin-bottom:16px;">
                    <input type="text" placeholder="Enter BTC transaction ID..." style="width:100%;padding:12px 16px;background:#0a0000;border:1px solid #ff660044;border-radius:8px;color:#fff;font-size:13px;text-align:center;outline:none;margin-bottom:8px;">
                    <button onclick="alert('Payment verification failed. You need 0.5 BTC to proceed.')" style="width:100%;padding:12px;background:linear-gradient(to right,#ff6600,#ff3300);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">VERIFY PAYMENT</button>
                </div>
                <div style="background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;">
                    <div style="color:#ff4444;font-size:14px;font-weight:bold;">⚠️ WARNING: This is a ransomware payment page!</div>
                    <div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious ad. Close this tab and run antivirus scan in CMD.</div>
                </div>
            </div>
        </div>
    `;
}

function downloadGame(gameId) {
    const gameInfo = {
        tictactoe: { name: 'Tic Tac Toe Pro', icon: '⭕', file: 'tictactoe_game.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        platformer: { name: 'Super Pixel Mario', icon: '🏃', file: 'super_pixel_mario.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        doom2: { name: 'Doom 2: Hell Walker', icon: '🔫', file: 'doom2_hell_walker.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        snake: { name: 'Snake (eat apple)', icon: '🐍', file: 'snake.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        flappy: { name: 'Flappy Bird (endless)', icon: '🐦', file: 'flappy_bird.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        breakout: { name: 'Breakout (Arkanoid)', icon: '🧱', file: 'breakout.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        invaders: { name: 'Space Invaders', icon: '👾', file: 'space_invaders.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        game2048: { name: '2048', icon: '🔢', file: 'game2048.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        minesweeper: { name: 'Minesweeper', icon: '💣', file: 'minesweeper.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        pacman: { name: 'Pac-Man', icon: '🟡', file: 'pacman.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        pong: { name: 'Pong', icon: '🏓', file: 'pong.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
        doodle: { name: 'Doodle Jump', icon: '👽', file: 'doodle_jump.exe', path: ['C:', 'Users', 'User', 'Downloads'] },
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
                        if (typeof iconDragState !== 'undefined' && iconDragState.hasMoved) {
                            iconDragState.hasMoved = false;
                            return;
                        }
                        e.stopPropagation();
                        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                        icon.classList.add('selected');
                    });
                    icon.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                        icon.classList.add('selected');
                        const canDelete = typeof isBuiltInApp !== 'undefined' ? !isBuiltInApp(gameId) : true;
                        if (typeof showIconContextMenu !== 'undefined') showIconContextMenu(e.clientX, e.clientY, gameId, canDelete);
                    });
                    if (typeof handleIconMouseDown !== 'undefined') {
                        icon.addEventListener('mousedown', handleIconMouseDown);
                    }
                    di.appendChild(icon);
                    
                    // Temporarily move icon off-screen so it's not counted in occupied cells
                    icon.style.left = '-1000px';
                    icon.style.top = '-1000px';
                    
                    // Column-first layout: 7 icons per column, then wrap to next column
                    const MAX_ROWS = 7;
                    const builtInCount = 7;
                    const gameIndex = typeof downloadedGames !== 'undefined' ? downloadedGames.indexOf(gameId) : 0;
                    const totalIdx = builtInCount + (gameIndex >= 0 ? gameIndex : 0);
                    const col = Math.floor(totalIdx / MAX_ROWS);
                    const row = totalIdx % MAX_ROWS;
                    const pos = typeof getCellPosition !== 'undefined' ? getCellPosition(col, row) : { left: 10, top: 10 + row * 100 };
                    
                    if (typeof findNearestEmptyCell !== 'undefined' && typeof getCellPosition !== 'undefined' && typeof clampToBounds !== 'undefined') {
                        const cell = findNearestEmptyCell(pos.left, pos.top, null);
                        const finalPos = getCellPosition(cell.col, cell.row);
                        const clampedPos = clampToBounds(finalPos.left, finalPos.top);
                        icon.style.left = clampedPos.left + 'px';
                        icon.style.top = clampedPos.top + 'px';
                        if (typeof iconPositions !== 'undefined') {
                            iconPositions[gameId] = clampedPos;
                        }
                    } else {
                        icon.style.left = pos.left + 'px';
                        icon.style.top = pos.top + 'px';
                        if (typeof iconPositions !== 'undefined') {
                            iconPositions[gameId] = pos;
                        }
                    }
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



// ── CRYPTO SCAM CHART ENGINE ───────────────────────────────────────────────

window.cryptoScamData = { price: 69420.00, history: [], balance: 1000, activeBet: null };
(function() {
    for (var i = 0; i < 40; i++) window.cryptoScamData.history.push(69420.00);
})();

function initCryptoScamChart(winId) {
    var canvas = document.getElementById(winId + '-crypto-chart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (window.cryptoScamInterval) clearInterval(window.cryptoScamInterval);
    // reset data
    window.cryptoScamData = { price: 69420.00, history: [], balance: 1000, activeBet: null };
    for (var j = 0; j < 40; j++) window.cryptoScamData.history.push(69420.00);

    window.cryptoScamInterval = setInterval(function() {
        var d = window.cryptoScamData;
        var change = (Math.random() - 0.5) * 600;
        if (d.activeBet) {
            // Slightly rigged against the player
            change = d.activeBet.dir === 'UP' ? (Math.random() * -700 + 280) : (Math.random() * 700 - 280);
        }
        d.price += change;
        if (d.price < 100) d.price = 100;
        d.history.push(d.price);
        d.history.shift();

        var priceEl = document.getElementById(winId + '-crypto-price');
        if (priceEl) {
            priceEl.innerText = '$' + d.price.toFixed(2);
            priceEl.style.color = change >= 0 ? '#00ff66' : '#ff4444';
        }

        // Draw chart
        canvas.width = canvas.offsetWidth || 760;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var g = 0; g < 10; g++) {
            ctx.moveTo(0, g * (canvas.height / 9));
            ctx.lineTo(canvas.width, g * (canvas.height / 9));
        }
        ctx.stroke();

        // Price line
        var minP = Math.min.apply(null, d.history) - 300;
        var maxP = Math.max.apply(null, d.history) + 300;
        var range = maxP - minP || 1;

        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        d.history.forEach(function(p, i) {
            var x = (i / 39) * canvas.width;
            var y = canvas.height - ((p - minP) / range) * canvas.height;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill under line
        var lastX = canvas.width;
        var lastY = canvas.height - ((d.history[39] - minP) / range) * canvas.height;
        ctx.lineTo(lastX, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fillStyle = 'rgba(0,255,170,0.07)';
        ctx.fill();

        // Active bet overlay
        if (d.activeBet) {
            var entryY = canvas.height - ((d.activeBet.entryPrice - minP) / range) * canvas.height;
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = d.activeBet.dir === 'UP' ? '#00cc00' : '#cc0000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, entryY);
            ctx.lineTo(canvas.width, entryY);
            ctx.stroke();
            ctx.setLineDash([]);

            d.activeBet.timeLeft--;
            var msgEl = document.getElementById(winId + '-crypto-msg');
            if (msgEl) {
                msgEl.innerText = 'Trade open \u2022 ' + d.activeBet.dir + ' \u2022 ' + d.activeBet.timeLeft + 's remaining \u2022 Entry: $' + d.activeBet.entryPrice.toFixed(2);
                msgEl.style.color = '#ffd700';
            }
            if (d.activeBet.timeLeft <= 0) {
                var won = (d.activeBet.dir === 'UP' && d.price > d.activeBet.entryPrice) ||
                           (d.activeBet.dir === 'DOWN' && d.price < d.activeBet.entryPrice);
                if (won) {
                    d.balance += d.activeBet.amount * 1.85;
                    if (msgEl) { msgEl.innerText = 'YOU WON! +$' + (d.activeBet.amount * 1.85).toFixed(2) + ' \ud83c\udf89'; msgEl.style.color = '#00ff66'; }
                } else {
                    if (msgEl) { msgEl.innerText = 'YOU LOST! -$' + d.activeBet.amount.toFixed(2) + ' \ud83d\ude2d'; msgEl.style.color = '#ff4444'; }
                }
                d.activeBet = null;
                var balEl = document.getElementById(winId + '-crypto-bal');
                if (balEl) balEl.innerText = '$' + d.balance.toFixed(2);
                if (d.balance <= 0) {
                    setTimeout(function() {
                        alert('You are BROKE! Deposit more Bitcoin to keep trading! Send 0.5 BTC to bc1qscam...');
                    }, 800);
                }
            }
        }
    }, 900);
}

function placeCryptoBet(winId, dir) {
    var d = window.cryptoScamData;
    if (d.activeBet) { alert('A trade is already open! Wait for it to close.'); return; }
    var input = document.getElementById(winId + '-crypto-bet');
    var amount = parseFloat(input ? input.value : 100);
    if (isNaN(amount) || amount <= 0) amount = 100;
    if (amount > d.balance) amount = d.balance;
    if (d.balance <= 0) { alert('Insufficient balance! Please deposit more Bitcoin.'); return; }
    d.balance -= amount;
    var balEl = document.getElementById(winId + '-crypto-bal');
    if (balEl) balEl.innerText = '$' + d.balance.toFixed(2);
    d.activeBet = { dir: dir, amount: amount, entryPrice: d.price, timeLeft: 10 };
    var msgEl = document.getElementById(winId + '-crypto-msg');
    if (msgEl) { msgEl.innerText = 'Trade placed: ' + dir + ' $' + amount.toFixed(2); msgEl.style.color = '#fff'; }
}

// ── LIVE CAM SCAM PAGE ─────────────────────────────────────────────────────

function getLiveCamScamPage() {
    return '<div class="browser-page" style="background:#111;min-height:100%;color:#fff;font-family:sans-serif;overflow-y:auto;">' +
    '<div style="background:linear-gradient(90deg,#8b0000,#e6005c,#8b0000);padding:15px 25px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #ff3385;">' +
        '<div style="font-size:26px;font-weight:900;letter-spacing:2px;color:#fff;text-shadow:0 0 20px #ff3385;">&#127909; CAMGIRLS LIVE</div>' +
        '<div style="display:flex;gap:20px;font-weight:bold;font-size:13px;">' +
            '<span style="color:#fff;cursor:pointer;">TOP MODELS</span>' +
            '<span style="color:#ffb3d1;cursor:pointer;">&#9679; LIVE NOW</span>' +
            '<span style="color:#ffb3d1;cursor:pointer;">VR CAMS</span>' +
        '</div>' +
        '<div style="background:#fff;color:#e6005c;font-weight:900;font-size:11px;padding:5px 14px;border-radius:20px;cursor:pointer;">JOIN FREE</div>' +
    '</div>' +
    '<div style="background:#1a0010;padding:12px 20px;display:flex;align-items:center;gap:20px;border-bottom:1px solid #2a0020;">' +
        '<span style="background:#ff0000;color:#fff;font-size:10px;font-weight:bold;padding:3px 10px;border-radius:12px;animation:adflash 1s infinite;">&#9679; LIVE</span>' +
        '<span style="color:#ff3385;font-size:14px;font-weight:bold;">1,492 Models Online</span>' +
        '<span style="color:#888;font-size:12px;">| 39,201 users watching |</span>' +
        '<span style="color:#ffd700;font-size:12px;">&#128293; FREE TOKENS for new members!</span>' +
    '</div>' +
    '<div style="padding:25px;">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;">' +
            _camCard('&#128111;&#8205;&#9792;&#65039;', 'linear-gradient(135deg,#400,#804)', '4,281', 'Amber_Wilde99', '&#128166;', 'Private show available! Tip 50 tokens to go private ~', '#ff3385', false) +
            _camCard('&#128105;&#8205;&#127979;', 'linear-gradient(135deg,#003,#048)', '8,912', 'CollegeGirlXO', '&#128218;', 'Shh... roommate is asleep. Make me loud for tokens &#128520;', '#ff3385', false) +
            _camCard('&#128120;', 'linear-gradient(135deg,#300,#800)', '15,204', 'MistressRoxanne', '&#128081;', 'Obey me! VIP dungeon is open. Dominant show tonight.', '#ffd700', true) +
            _camCard('&#127811;', 'linear-gradient(135deg,#004,#006)', '6,471', 'CuteBunny_LIVE', '&#128048;', 'First time here! Be gentle... or don\'t &#128521; tip goals!', '#ff3385', false) +
            _camCard('&#127758;', 'linear-gradient(135deg,#220033,#440066)', '22,089', 'ExoticMilfQueen', '&#128139;', 'Experienced goddess. Showershow in 10 min! Rush NOW!', '#ff66cc', true) +
            _camCard('&#128134;', 'linear-gradient(135deg,#330000,#660000)', '3,190', 'RedheadDevil666', '&#128293;', 'NO LIMITS show! Spinning the wheel every 100 tokens!', '#ff4444', false) +
        '</div>' +
        '<div style="margin-top:40px;background:rgba(255,0,0,0.1);border:1px solid #ff4444;border-radius:12px;padding:16px;text-align:center;max-width:700px;margin-left:auto;margin-right:auto;">' +
            '<div style="color:#ff4444;font-size:14px;font-weight:bold;">&#9888;&#65039; WARNING: This is a SCAM website simulation!</div>' +
            '<div style="color:#888;font-size:12px;margin-top:8px;">You clicked a malicious adult ad. Do NOT enter your credit card. Close this tab and run antivirus.</div>' +
        '</div>' +
    '</div>' +
    '</div>';
}

function _camCard(emoji, bg, viewers, name, badge, bio, nameColor, isVip) {
    var border = isVip ? '2px solid #ffd700' : '1px solid #333';
    var shadow = isVip ? 'box-shadow:0 0 20px #ffd70044;' : '';
    return '<div style="border:' + border + ';border-radius:12px;overflow:hidden;background:#000;cursor:pointer;' + shadow + 'transition:transform .15s;" onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'" onclick="alert(\'Age Verification Required! Enter credit card to confirm you are 18+ (SCAM - DO NOT ENTER)\');">' +
        '<div style="position:relative;aspect-ratio:4/3;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:64px;">' +
            emoji +
            '<div style="position:absolute;top:10px;left:10px;background:#ff0000;color:#fff;font-size:10px;font-weight:bold;padding:3px 10px;border-radius:12px;display:flex;align-items:center;gap:5px;">' +
                '<div style="width:6px;height:6px;background:#fff;border-radius:50%;animation:adflash 0.8s infinite;"></div> LIVE' +
            '</div>' +
            (isVip ? '<div style="position:absolute;top:10px;right:10px;background:#ffd700;color:#000;font-size:10px;font-weight:bold;padding:3px 10px;border-radius:3px;">VIP ONLY</div>' : '') +
            '<div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;padding:3px 9px;border-radius:12px;">&#128065;&#65039; ' + viewers + '</div>' +
        '</div>' +
        '<div style="padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
                '<div style="font-weight:bold;font-size:15px;color:' + nameColor + ';">' + name + '</div>' +
                '<div style="font-size:18px;">' + badge + '</div>' +
                '<div style="margin-left:auto;width:9px;height:9px;background:#00ff66;border-radius:50%;box-shadow:0 0 6px #00ff66;"></div>' +
            '</div>' +
            '<div style="color:#999;font-size:11px;line-height:1.4;">' + bio + '</div>' +
            '<div style="margin-top:10px;display:flex;gap:8px;">' +
                '<div style="flex:1;background:#e6005c;color:#fff;font-size:11px;font-weight:bold;padding:7px;border-radius:6px;text-align:center;cursor:pointer;">SEND TIP &#128166;</div>' +
                '<div style="flex:1;background:#222;color:#fff;font-size:11px;font-weight:bold;padding:7px;border-radius:6px;text-align:center;cursor:pointer;">PRIVATE SHOW</div>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function getNoMoreRansomPage() {
    return `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;min-height:100%;display:flex;background:#fff;">
            <div style="width:35%;background:linear-gradient(135deg,#1a3a8a 0%,#2a4a9a 50%,#1a3a8a 100%);color:#fff;padding:40px 30px;position:relative;min-height:100vh;">
                <div style="margin-bottom:60px;">
                    <div style="display:flex;align-items:center;gap:12px;font-size:20px;font-weight:bold;">
                        <span style="font-size:28px;"></span>
                        <span>&lt;/&gt; NO MORE RANSOM</span>
                    </div>
                </div>
                
                <div style="margin-bottom:40px;">
                    <h1 style="font-size:32px;font-weight:900;margin-bottom:8px;color:#ffcc00;">NEED HELP</h1>
                    <h2 style="font-size:24px;font-weight:700;margin-bottom:20px;line-height:1.3;">
                        unlocking your<br>
                        digital life<br>
                        without paying<br>
                        your attackers*?
                    </h2>
                    
                    <div style="display:flex;gap:16px;margin-bottom:40px;">
                        <button onclick="alert('This is a simulation. In real cases, NEVER pay the ransom!')" style="padding:14px 32px;background:#66ccff;color:#1a3a8a;border:none;border-radius:30px;font-size:16px;font-weight:bold;cursor:pointer;">YES</button>
                        <button onclick="alert('Correct! Never pay ransomware!')" style="padding:14px 32px;background:#66ccff;color:#1a3a8a;border:none;border-radius:30px;font-size:16px;font-weight:bold;cursor:pointer;">NO</button>
                    </div>
                    
                    <p style="font-size:11px;line-height:1.5;color:#ccc;">
                        At this time, not all types of ransomware have a solution. Keep checking this website as new keys and applications are continuously added when available.
                    </p>
                </div>
                
                <div style="position:absolute;bottom:40px;left:30px;right:30px;">
                    <div style="background:rgba(255,255,255,0.1);padding:16px;border-radius:8px;font-size:10px;line-height:1.5;">
                        <strong>⚠️ DISCLAIMER:</strong> This is a simulation of the No More Ransom website for educational purposes. The real website can be accessed at nomoreransom.org
                    </div>
                </div>
            </div>
            
            <div style="flex:1;padding:0;">
                <div style="display:flex;justify-content:flex-end;padding:20px 30px;gap:20px;align-items:center;border-bottom:1px solid #eee;">
                    <a href="#" style="color:#1a3a8a;text-decoration:none;font-size:14px;">Partners</a>
                    <a href="#" style="color:#1a3a8a;text-decoration:none;font-size:14px;">About the Project</a>
                    <div style="background:#1a3a8a;color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;cursor:pointer;">English ▼</div>
                </div>
                
                <div style="padding:30px;">
                    <div style="display:flex;gap:8px;margin-bottom:40px;flex-wrap:wrap;">
                        <button onclick="showNMRSection('home')" style="padding:10px 20px;background:#d4af37;color:#fff;border:none;border-radius:20px;font-size:14px;font-weight:bold;cursor:pointer;">Home</button>
                        <button onclick="showNMRSection('crypto')" style="padding:10px 20px;background:#fff;color:#1a3a8a;border:1px solid #1a3a8a;border-radius:20px;font-size:14px;cursor:pointer;">Crypto Sheriff</button>
                        <button onclick="showNMRSection('faq')" style="padding:10px 20px;background:#fff;color:#1a3a8a;border:1px solid #1a3a8a;border-radius:20px;font-size:14px;cursor:pointer;">Ransomware: Q&A</button>
                        <button onclick="showNMRSection('prevention')" style="padding:10px 20px;background:#fff;color:#1a3a8a;border:1px solid #1a3a8a;border-radius:20px;font-size:14px;cursor:pointer;">Prevention Advice</button>
                        <button onclick="showNMRSection('tools')" style="padding:10px 20px;background:#fff;color:#1a3a8a;border:1px solid #1a3a8a;border-radius:20px;font-size:14px;cursor:pointer;">Decryption Tools</button>
                        <button onclick="showNMRSection('report')" style="padding:10px 20px;background:#fff;color:#1a3a8a;border:1px solid #1a3a8a;border-radius:20px;font-size:14px;cursor:pointer;">Report Crime</button>
                    </div>
                    
                    <div id="nmr-content-home" class="nmr-section">
                        <div style="display:flex;gap:40px;align-items:center;margin-bottom:40px;">
                            <div style="flex:1;">
                                <div style="background:#f5f5f5;border:2px solid #d4af37;border-radius:12px;padding:40px;text-align:center;">
                                    <div style="font-size:120px;margin-bottom:20px;">🔒</div>
                                    <div style="color:#d4af37;font-size:14px;">Illustration: Keyboard with security lock</div>
                                </div>
                            </div>
                            <div style="flex:1;">
                                <div style="background:#f0f0f0;padding:24px;border-radius:12px;">
                                    <p style="font-size:14px;line-height:1.6;color:#333;margin-bottom:16px;">
                                        Ransomware is malware that locks your computer and mobile devices or encrypts your electronic files. When this happens, you cannot access your data unless you pay the ransom.
                                    </p>
                                    <p style="font-size:16px;font-weight:900;color:#1a3a8a;line-height:1.4;">
                                        However, this cannot be guaranteed and you should never pay!
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:40px;">
                            <div style="background:#1a3a8a;color:#fff;padding:24px;border-radius:12px;text-align:center;cursor:pointer;" onclick="showNMRSection('tools')">
                                <div style="font-size:48px;margin-bottom:12px;">🔓</div>
                                <h3 style="font-size:16px;margin-bottom:8px;">Decryption Tools</h3>
                                <p style="font-size:12px;color:#ccc;">Find free decryption tools for ransomware</p>
                            </div>
                            <div style="background:#1a3a8a;color:#fff;padding:24px;border-radius:12px;text-align:center;cursor:pointer;" onclick="showNMRSection('prevention')">
                                <div style="font-size:48px;margin-bottom:12px;">️</div>
                                <h3 style="font-size:16px;margin-bottom:8px;">Prevention</h3>
                                <p style="font-size:12px;color:#ccc;">Protect yourself from ransomware</p>
                            </div>
                            <div style="background:#1a3a8a;color:#fff;padding:24px;border-radius:12px;text-align:center;cursor:pointer;" onclick="showNMRSection('report')">
                                <div style="font-size:48px;margin-bottom:12px;">🚨</div>
                                <h3 style="font-size:16px;margin-bottom:8px;">Report</h3>
                                <p style="font-size:12px;color:#ccc;">Report ransomware attacks</p>
                            </div>
                        </div>
                    </div>
                    
                    <div id="nmr-content-crypto" class="nmr-section" style="display:none;">
                        <h2 style="color:#1a3a8a;margin-bottom:20px;"> Crypto Sheriff</h2>
                        <p style="font-size:14px;line-height:1.6;color:#333;margin-bottom:20px;">
                            Crypto Sheriff is a service that allows you to upload ransomware samples for identification. Expert teams will analyze the files and inform you if a decryption tool is available.
                        </p>
                        <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin-bottom:20px;">
                            <h3 style="color:#1a3a8a;margin-bottom:12px;">How It Works:</h3>
                            <ol style="margin-left:20px;font-size:14px;line-height:1.8;color:#333;">
                                <li>Upload encrypted files or ransom notes</li>
                                <li>Expert teams will analyze the samples</li>
                                <li>You will be notified if a decryption tool is available</li>
                                <li>Download the free decryption tool if available</li>
                            </ol>
                        </div>
                        <button onclick="alert('This is a simulation. In real cases, visit nomoreransom.org')" style="padding:12px 24px;background:#d4af37;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:bold;cursor:pointer;">Upload Sample (Simulation)</button>
                    </div>
                    
                    <div id="nmr-content-faq" class="nmr-section" style="display:none;">
                        <h2 style="color:#1a3a8a;margin-bottom:20px;">❓ Ransomware: Questions & Answers</h2>
                        <div style="margin-bottom:20px;">
                            <h3 style="color:#1a3a8a;margin-bottom:8px;">What is ransomware?</h3>
                            <p style="font-size:14px;line-height:1.6;color:#333;">Ransomware is a type of malware that locks your device or encrypts your files, then demands a ransom to restore access.</p>
                        </div>
                        <div style="margin-bottom:20px;">
                            <h3 style="color:#1a3a8a;margin-bottom:8px;">Should I pay the ransom?</h3>
                            <p style="font-size:14px;line-height:1.6;color:#333;"><strong>NO!</strong> There is no guarantee that you will get your files back after paying. Additionally, payment funds criminal activities.</p>
                        </div>
                        <div style="margin-bottom:20px;">
                            <h3 style="color:#1a3a8a;margin-bottom:8px;">How do I remove ransomware?</h3>
                            <p style="font-size:14px;line-height:1.6;color:#333;">Use free decryption tools from No More Ransom, or reinstall your system from a clean backup.</p>
                        </div>
                        <div style="margin-bottom:20px;">
                            <h3 style="color:#1a3a8a;margin-bottom:8px;">How do I prevent ransomware?</h3>
                            <p style="font-size:14px;line-height:1.6;color:#333;">Back up data regularly, update software, use antivirus, and don't click suspicious links or attachments.</p>
                        </div>
                    </div>
                    
                    <div id="nmr-content-prevention" class="nmr-section" style="display:none;">
                        <h2 style="color:#1a3a8a;margin-bottom:20px;">🛡️ Prevention Advice</h2>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;">
                            <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
                                <h3 style="color:#1a3a8a;margin-bottom:12px;"> Backup Data</h3>
                                <p style="font-size:13px;line-height:1.6;color:#333;">Back up your files regularly to a separate location (cloud or external hard drive). Ensure backups are not connected to your computer when not in use.</p>
                            </div>
                            <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
                                <h3 style="color:#1a3a8a;margin-bottom:12px;">🔄 Update Software</h3>
                                <p style="font-size:13px;line-height:1.6;color:#333;">Always update your operating system and applications. Updates often include security patches for known vulnerabilities.</p>
                            </div>
                            <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
                                <h3 style="color:#1a3a8a;margin-bottom:12px;">🛡️ Use Antivirus</h3>
                                <p style="font-size:13px;line-height:1.6;color:#333;">Install and update antivirus/anti-malware software. Perform regular scans.</p>
                            </div>
                            <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
                                <h3 style="color:#1a3a8a;margin-bottom:12px;">⚠️ Be Careful with Email</h3>
                                <p style="font-size:13px;line-height:1.6;color:#333;">Don't open attachments or click links from unknown senders. Beware of emails requesting personal information.</p>
                            </div>
                            <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
                                <h3 style="color:#1a3a8a;margin-bottom:12px;">🔒 Use Firewall</h3>
                                <p style="font-size:13px;line-height:1.6;color:#333;">Enable firewall to block unauthorized access to your computer.</p>
                            </div>
                            <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
                                <h3 style="color:#1a3a8a;margin-bottom:12px;">‍💻 User Education</h3>
                                <p style="font-size:13px;line-height:1.6;color:#333;">Learn how to recognize cyber threats. Share knowledge with family and colleagues.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div id="nmr-content-tools" class="nmr-section" style="display:none;">
                        <h2 style="color:#1a3a8a;margin-bottom:20px;"> Decryption Tools</h2>
                        <p style="font-size:14px;line-height:1.6;color:#333;margin-bottom:20px;">
                            Here are some free decryption tools available for specific types of ransomware:
                        </p>
                        <div style="display:grid;gap:16px;">
                            <div style="background:#f5f5f5;padding:16px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <h3 style="color:#1a3a8a;margin-bottom:4px;">💀 GotFucked Decryptor</h3>
                                    <p style="font-size:12px;color:#666;">For GotFucked Ransomware v2.0 — Unlocks all files, apps & folders</p>
                                </div>
                                <button onclick="if(typeof downloadDecryptor==='function'){downloadDecryptor();}else{alert('Download function not available.');}" style="padding:8px 16px;background:#1a3a8a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Download</button>
                            </div>
                            <div style="background:#f5f5f5;padding:16px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <h3 style="color:#1a3a8a;margin-bottom:4px;">TeslaCrypt Decryptor</h3>
                                    <p style="font-size:12px;color:#666;">For TeslaCrypt v3.0+ ransomware</p>
                                </div>
                                <button onclick="alert('Simulation download - this is not a real tool')" style="padding:8px 16px;background:#1a3a8a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Download</button>
                            </div>
                            <div style="background:#f5f5f5;padding:16px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <h3 style="color:#1a3a8a;margin-bottom:4px;">RannohDecryptor</h3>
                                    <p style="font-size:12px;color:#666;">For Rannoh and Rakhni ransomware</p>
                                </div>
                                <button onclick="alert('Simulation download - this is not a real tool')" style="padding:8px 16px;background:#1a3a8a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Download</button>
                            </div>
                            <div style="background:#f5f5f5;padding:16px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <h3 style="color:#1a3a8a;margin-bottom:4px;">CoinVault Decryptor</h3>
                                    <p style="font-size:12px;color:#666;">For CoinVault and BitCryptor ransomware</p>
                                </div>
                                <button onclick="alert('Simulation download - this is not a real tool')" style="padding:8px 16px;background:#1a3a8a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Download</button>
                            </div>
                            <div style="background:#f5f5f5;padding:16px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <h3 style="color:#1a3a8a;margin-bottom:4px;">WildFire Decryptor</h3>
                                    <p style="font-size:12px;color:#666;">For WildFire ransomware</p>
                                </div>
                                <button onclick="alert('Simulation download - this is not a real tool')" style="padding:8px 16px;background:#1a3a8a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Download</button>
                            </div>
                        </div>
                        <div style="margin-top:20px;padding:16px;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;">
                            <p style="font-size:13px;color:#856404;"><strong>️ Note:</strong> Not all ransomware has decryption tools. If no tool is available, you may need to consider reinstalling your system from a clean backup.</p>
                        </div>
                    </div>
                    
                    <div id="nmr-content-report" class="nmr-section" style="display:none;">
                        <h2 style="color:#1a3a8a;margin-bottom:20px;">🚨 Report Crime</h2>
                        <p style="font-size:14px;line-height:1.6;color:#333;margin-bottom:20px;">
                            If you become a victim of ransomware, report it to local authorities. This helps law enforcement track and stop cybercriminals.
                        </p>
                        <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin-bottom:20px;">
                            <h3 style="color:#1a3a8a;margin-bottom:12px;">Information to Report:</h3>
                            <ul style="margin-left:20px;font-size:14px;line-height:1.8;color:#333;">
                                <li>Type of ransomware (if known)</li>
                                <li>Ransom note</li>
                                <li>Encrypted files (samples)</li>
                                <li>Attacker's email or contact information</li>
                                <li>Cryptocurrency wallet address for payment</li>
                                <li>Time and method of infection</li>
                            </ul>
                        </div>
                        <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
                            <h3 style="color:#1a3a8a;margin-bottom:12px;">Authorities to Contact:</h3>
                            <ul style="margin-left:20px;font-size:14px;line-height:1.8;color:#333;">
                                <li><strong>Indonesia:</strong> Bareskrim Polri - patrolisiber.id</li>
                                <li><strong>International:</strong> INTERPOL - interpol.int</li>
                                <li><strong>Europe:</strong> Europol - europol.europa.eu</li>
                                <li><strong>USA:</strong> FBI IC3 - ic3.gov</li>
                            </ul>
                        </div>
                        <button onclick="alert('This is a simulation. In real cases, contact local authorities.')" style="margin-top:20px;padding:12px 24px;background:#d4af37;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:bold;cursor:pointer;">Report Now (Simulation)</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showNMRSection(sectionName) {
    document.querySelectorAll('.nmr-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById('nmr-content-' + sectionName);
    if (target) target.style.display = 'block';
}
