let settingsState = {
    currentCategory: 'home',
    timeFormat: '24h',
    language: 'English',
    fontSize: 'medium',
    highContrast: false,
    darkMode: true,
    notifications: true,
    firewall: true,
    antivirus: true,
    autoUpdate: true,
    lastUpdateCheck: null,
    updateProgress: 0,
    checkingUpdate: false,
    updateComplete: false,
    updateVersion: '1.6.0',
};

function loadSettingsState() {
    try {
        const saved = localStorage.getItem('webos_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(settingsState, parsed);
        }
    } catch (e) {}
}

function saveSettingsState() {
    try {
        localStorage.setItem('webos_settings', JSON.stringify(settingsState));
    } catch (e) {}
}

function renderSettings(winId) {
    loadSettingsState();
    const body = document.getElementById(winId + '-body');
    body.innerHTML = `
        <div class="settings-app" style="height:100%;display:flex;background:#202020;color:#fff;font-family:Segoe UI,sans-serif;">
            <div class="settings-sidebar" style="width:260px;background:#1a1a1a;border-right:1px solid #333;display:flex;flex-direction:column;overflow-y:auto;flex-shrink:0;">
                <div style="padding:20px 16px 12px;">
                    <div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:4px;">⚙️ Settings</div>
                </div>
                <div class="settings-nav-list" style="flex:1;padding:0 8px;">
                    <div class="settings-nav-item ${settingsState.currentCategory === 'home' ? 'active' : ''}" onclick="settingsNavigate('${winId}','home')">
                        <span class="settings-nav-icon"></span><span>Home</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'system' ? 'active' : ''}" onclick="settingsNavigate('${winId}','system')">
                        <span class="settings-nav-icon">🖥️</span><span>System</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'bluetooth' ? 'active' : ''}" onclick="settingsNavigate('${winId}','bluetooth')">
                        <span class="settings-nav-icon"></span><span>Bluetooth & devices</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'network' ? 'active' : ''}" onclick="settingsNavigate('${winId}','network')">
                        <span class="settings-nav-icon">📶</span><span>Network & internet</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'personalization' ? 'active' : ''}" onclick="settingsNavigate('${winId}','personalization')">
                        <span class="settings-nav-icon">🎨</span><span>Personalization</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'apps' ? 'active' : ''}" onclick="settingsNavigate('${winId}','apps')">
                        <span class="settings-nav-icon"></span><span>Apps</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'accounts' ? 'active' : ''}" onclick="settingsNavigate('${winId}','accounts')">
                        <span class="settings-nav-icon">👤</span><span>Accounts</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'time' ? 'active' : ''}" onclick="settingsNavigate('${winId}','time')">
                        <span class="settings-nav-icon">🕐</span><span>Time & language</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'gaming' ? 'active' : ''}" onclick="settingsNavigate('${winId}','gaming')">
                        <span class="settings-nav-icon"></span><span>Gaming</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'accessibility' ? 'active' : ''}" onclick="settingsNavigate('${winId}','accessibility')">
                        <span class="settings-nav-icon">♿</span><span>Accessibility</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'privacy' ? 'active' : ''}" onclick="settingsNavigate('${winId}','privacy')">
                        <span class="settings-nav-icon">🔒</span><span>Privacy & security</span>
                    </div>
                    <div class="settings-nav-item ${settingsState.currentCategory === 'update' ? 'active' : ''}" onclick="settingsNavigate('${winId}','update')">
                        <span class="settings-nav-icon">🔄</span><span>Windows Update</span>
                    </div>
                </div>
            </div>
            <div class="settings-content" id="${winId}-settings-content" style="flex:1;overflow-y:auto;padding:30px 36px;">
            </div>
        </div>
    `;
    settingsRenderContent(winId);
}

function settingsNavigate(winId, category) {
    settingsState.currentCategory = category;
    saveSettingsState();
    document.querySelectorAll(`#${winId}-body .settings-nav-item`).forEach(el => el.classList.remove('active'));
    const items = document.querySelectorAll(`#${winId}-body .settings-nav-item`);
    const categories = ['home','system','bluetooth','network','personalization','apps','accounts','time','gaming','accessibility','privacy','update'];
    const idx = categories.indexOf(category);
    if (idx >= 0 && items[idx]) items[idx].classList.add('active');
    settingsRenderContent(winId);
}

function settingsRenderContent(winId) {
    const content = document.getElementById(winId + '-settings-content');
    if (!content) return;
    const cat = settingsState.currentCategory;
    const renderers = {
        home: settingsRenderHome,
        system: settingsRenderSystem,
        bluetooth: settingsRenderBluetooth,
        network: settingsRenderNetwork,
        personalization: settingsRenderPersonalization,
        apps: settingsRenderApps,
        accounts: settingsRenderAccounts,
        time: settingsRenderTime,
        gaming: settingsRenderGaming,
        accessibility: settingsRenderAccessibility,
        privacy: settingsRenderPrivacy,
        update: settingsRenderUpdate,
    };
    const renderer = renderers[cat] || settingsRenderHome;
    content.innerHTML = renderer(winId);
    if (cat === 'update' && settingsState.checkingUpdate) {
        settingsStartUpdateCheck(winId);
    }
}

function settingsToggle(winId, key, callback) {
    settingsState[key] = !settingsState[key];
    saveSettingsState();
    settingsRenderContent(winId);
    if (callback) callback();
}

function settingsRenderHome(winId) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const totalApps = 12 + (typeof downloadedGames !== 'undefined' ? downloadedGames.length : 0);
    const totalMiners = typeof activeMiners !== 'undefined' ? activeMiners.length : 0;
    const infected = typeof webosInfected !== 'undefined' ? webosInfected : false;
    const virusCount = typeof webosVirusFiles !== 'undefined' ? webosVirusFiles.length : 0;
    const cpuUsage = typeof getTotalMinerCpu === 'function' ? getTotalMinerCpu() : 0;

    return `
        <div>
            <h1 style="font-size:28px;font-weight:600;margin:0 0 6px 0;color:#fff;">Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, User</h1>
            <p style="color:#888;font-size:13px;margin:0 0 24px 0;">${dateStr} · ${timeStr}</p>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:28px;">
                <div style="background:#2a2a2a;border-radius:12px;padding:20px;border:1px solid #3a3a3a;">
                    <div style="font-size:11px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">System</div>
                    <div style="font-size:24px;font-weight:600;color:#fff;">WebOS 10</div>
                    <div style="font-size:12px;color:#666;margin-top:4px;">Version 1.5.0</div>
                </div>
                <div style="background:#2a2a2a;border-radius:12px;padding:20px;border:1px solid #3a3a3a;">
                    <div style="font-size:11px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Apps Installed</div>
                    <div style="font-size:24px;font-weight:600;color:#fff;">${totalApps}</div>
                    <div style="font-size:12px;color:#666;margin-top:4px;">applications</div>
                </div>
                <div style="background:#2a2a2a;border-radius:12px;padding:20px;border:1px solid #3a3a3a;">
                    <div style="font-size:11px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">CPU Usage</div>
                    <div style="font-size:24px;font-weight:600;color:${cpuUsage > 50 ? '#ff4444' : '#4ec9b0'};">${cpuUsage}%</div>
                    <div style="font-size:12px;color:#666;margin-top:4px;">${totalMiners > 0 ? totalMiners + ' miner(s) active' : 'No miners'}</div>
                </div>
                <div style="background:#2a2a2a;border-radius:12px;padding:20px;border:1px solid ${infected ? '#ff4444' : '#4ec9b0'};">
                    <div style="font-size:11px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Security</div>
                    <div style="font-size:24px;font-weight:600;color:${infected ? '#ff4444' : '#4ec9b0'};">${infected ? '️ Infected' : '✅ Protected'}</div>
                    <div style="font-size:12px;color:#666;margin-top:4px;">${virusCount} threat(s) detected</div>
                </div>
            </div>

            <h2 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 12px 0;">Quick Settings</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
                <div class="settings-quick-card" onclick="settingsNavigate('${winId}','network')">
                    <span class="settings-quick-icon">📶</span>
                    <div>
                        <div style="font-weight:600;font-size:13px;">Network & internet</div>
                        <div style="font-size:11px;color:#888;">WiFi: ${typeof wifiConnected !== 'undefined' && wifiConnected ? 'Connected' : 'Disconnected'}</div>
                    </div>
                </div>
                <div class="settings-quick-card" onclick="settingsNavigate('${winId}','personalization')">
                    <span class="settings-quick-icon">🎨</span>
                    <div>
                        <div style="font-weight:600;font-size:13px;">Personalization</div>
                        <div style="font-size:11px;color:#888;">Wallpaper & theme</div>
                    </div>
                </div>
                <div class="settings-quick-card" onclick="settingsNavigate('${winId}','privacy')">
                    <span class="settings-quick-icon">🔒</span>
                    <div>
                        <div style="font-weight:600;font-size:13px;">Privacy & security</div>
                        <div style="font-size:11px;color:#888;">Virus scan & firewall</div>
                    </div>
                </div>
                <div class="settings-quick-card" onclick="settingsNavigate('${winId}','update')">
                    <span class="settings-quick-icon">🔄</span>
                    <div>
                        <div style="font-weight:600;font-size:13px;">Windows Update</div>
                        <div style="font-size:11px;color:#888;">${settingsState.lastUpdateCheck ? 'Last checked: ' + settingsState.lastUpdateCheck : 'Check for updates'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function settingsRenderSystem(winId) {
    const cpuUsage = typeof getTotalMinerCpu === 'function' ? getTotalMinerCpu() : 0;
    const totalMiners = typeof activeMiners !== 'undefined' ? activeMiners.length : 0;
    const infected = typeof webosInfected !== 'undefined' ? webosInfected : false;
    const virusCount = typeof webosVirusFiles !== 'undefined' ? webosVirusFiles.length : 0;
    const downloadedCount = typeof downloadedGames !== 'undefined' ? downloadedGames.length : 0;

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">🖥️ System</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">About</h3>
                <div class="settings-info-row"><span class="settings-info-label">Device name</span><span>WebOS-PC</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Processor</span><span>Virtual CPU @ 3.6 GHz</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Installed RAM</span><span>8.00 GB (Virtual)</span></div>
                <div class="settings-info-row"><span class="settings-info-label">System type</span><span>WebOS 10, 64-bit</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Edition</span><span>WebOS 10 Pro</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Version</span><span>1.5.0</span></div>
                <div class="settings-info-row"><span class="settings-info-label">OS build</span><span>19045.3803</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">System Status</h3>
                <div class="settings-info-row">
                    <span class="settings-info-label">CPU Usage</span>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:120px;height:6px;background:#333;border-radius:3px;overflow:hidden;">
                            <div style="height:100%;width:${cpuUsage}%;background:${cpuUsage > 50 ? '#ff4444' : '#4ec9b0'};border-radius:3px;transition:width 0.5s;"></div>
                        </div>
                        <span style="color:${cpuUsage > 50 ? '#ff4444' : '#4ec9b0'};font-weight:600;">${cpuUsage}%</span>
                    </div>
                </div>
                <div class="settings-info-row"><span class="settings-info-label">Active Miners</span><span style="color:${totalMiners > 0 ? '#ff4444' : '#4ec9b0'};">${totalMiners}</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Threats Detected</span><span style="color:${infected ? '#ff4444' : '#4ec9b0'};">${virusCount}</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Downloaded Games</span><span>${downloadedCount}</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Display</h3>
                <div class="settings-info-row"><span class="settings-info-label">Resolution</span><span>1920 × 1080</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Scale</span><span>100%</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Orientation</span><span>Landscape</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Storage</h3>
                <div class="settings-info-row"><span class="settings-info-label">Virtual Disk (C:)</span><span>256 GB (Virtual)</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Used</span><span>${(12 + downloadedCount * 5).toFixed(1)} GB</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Free</span><span>${(244 - downloadedCount * 5).toFixed(1)} GB</span></div>
            </div>
        </div>
    `;
}

function settingsRenderBluetooth(winId) {
    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">🔵 Bluetooth & devices</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Bluetooth</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Bluetooth</div>
                        <div style="font-size:11px;color:#888;">Discoverable as "WebOS-PC"</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" disabled>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
                <div style="color:#888;font-size:12px;padding:12px 0;">No Bluetooth adapter detected in virtual environment.</div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Paired Devices</h3>
                <div style="color:#888;font-size:12px;padding:12px 0;">No devices paired. Bluetooth is not available in WebOS.</div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Mouse</h3>
                <div class="settings-info-row"><span class="settings-info-label">Primary button</span><span>Left</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Scroll lines</span><span>3</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Cursor speed</span><span>Medium</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Keyboard</h3>
                <div class="settings-info-row"><span class="settings-info-label">Layout</span><span>US QWERTY</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Repeat delay</span><span>Medium</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Repeat rate</span><span>Fast</span></div>
            </div>
        </div>
    `;
}

function settingsRenderNetwork(winId) {
    const isConnected = typeof wifiConnected !== 'undefined' ? wifiConnected : true;
    const networkName = typeof wifiNetworkName !== 'undefined' ? wifiNetworkName : 'Home Wifi 1';
    const networks = typeof wifiNetworks !== 'undefined' ? wifiNetworks : [
        { name: 'Home Wifi 1', secured: true },
        { name: 'Neighbor_WiFi_5G', secured: true },
        { name: 'CoffeeShop_Free', secured: false },
        { name: 'Campus_Edu', secured: true },
        { name: 'FiberNet_5G_Plus', secured: true },
    ];

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">📶 Network & internet</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">WiFi</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">WiFi</div>
                        <div style="font-size:11px;color:#888;">${isConnected ? 'Connected to ' + networkName : 'Disconnected'}</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" ${isConnected ? 'checked' : ''} onchange="settingsToggleWifi('${winId}')">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Available Networks</h3>
                ${networks.map(net => `
                    <div class="settings-network-item ${net.name === networkName && isConnected ? 'connected' : ''}">
                        <div style="display:flex;align-items:center;gap:10px;flex:1;">
                            <span style="font-size:18px;">📶</span>
                            <div>
                                <div style="font-weight:600;font-size:13px;">${net.name}</div>
                                <div style="font-size:11px;color:#888;">${net.secured ? '🔒 Secured' : ' Open'} ${net.name === networkName && isConnected ? '· Connected' : ''}</div>
                            </div>
                        </div>
                        ${net.name !== networkName || !isConnected ? `<button class="settings-connect-btn" onclick="settingsConnectWifi('${winId}','${net.name}')">Connect</button>` : '<span style="color:#4ec9b0;font-size:12px;font-weight:600;">Connected</span>'}
                    </div>
                `).join('')}
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Network Status</h3>
                <div class="settings-info-row"><span class="settings-info-label">Status</span><span style="color:${isConnected ? '#4ec9b0' : '#ff4444'};">${isConnected ? 'Connected' : 'Disconnected'}</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Network</span><span>${networkName}</span></div>
                <div class="settings-info-row"><span class="settings-info-label">IP Address</span><span>${isConnected ? '192.168.1.' + Math.floor(Math.random() * 254 + 1) : 'N/A'}</span></div>
                <div class="settings-info-row"><span class="settings-info-label">DNS</span><span>${isConnected ? '8.8.8.8' : 'N/A'}</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">️ Security Warning</h3>
                <div style="background:#2a1a00;border:1px solid #ff9900;border-radius:8px;padding:14px;font-size:12px;color:#ffcc00;line-height:1.6;">
                    <strong>CoffeeShop_Free</strong> is a known rogue WiFi hotspot. Connecting to it will install a <strong>Remote Access Trojan (RAT)</strong> on your system. Avoid connecting to unknown open networks.
                </div>
            </div>
        </div>
    `;
}

function settingsToggleWifi(winId) {
    if (typeof toggleWifiConnection === 'function') {
        toggleWifiConnection();
    }
    settingsRenderContent(winId);
}

function settingsConnectWifi(winId, networkName) {
    if (typeof connectToNetwork === 'function') {
        connectToNetwork(networkName);
    }
    settingsRenderContent(winId);
}

function settingsRenderPersonalization(winId) {
    const wallpaperNames = ['Ocean Blue', 'Forest Green', 'Purple Gradient', 'Dark Navy', 'Midnight', 'Carbon Black'];
    const currentWp = typeof currentWallpaper !== 'undefined' ? currentWallpaper : 0;

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">🎨 Personalization</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Background</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
                    ${wallpapers.map((wp, i) => `
                        <div class="settings-wallpaper-option ${i === currentWp ? 'selected' : ''}" onclick="settingsSetWallpaper('${winId}',${i})" style="background:${wp};border-radius:8px;height:90px;cursor:pointer;border:3px solid ${i === currentWp ? '#0078d4' : 'transparent'};position:relative;transition:border-color 0.2s;">
                            ${i === currentWp ? '<div style="position:absolute;top:6px;right:6px;background:#0078d4;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;">✓</div>' : ''}
                            <div style="position:absolute;bottom:6px;left:8px;font-size:11px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.8);">${wallpaperNames[i]}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Colors</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Dark mode</div>
                        <div style="font-size:11px;color:#888;">Use dark theme for windows and apps</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" ${settingsState.darkMode ? 'checked' : ''} onchange="settingsToggle('${winId}','darkMode')">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Theme</h3>
                <div style="display:flex;gap:12px;">
                    <div class="settings-theme-option ${settingsState.darkMode ? 'selected' : ''}" onclick="settingsSetTheme('${winId}',true)" style="background:#1a1a1a;border:3px solid ${settingsState.darkMode ? '#0078d4' : '#555'};border-radius:8px;padding:16px;cursor:pointer;text-align:center;flex:1;">
                        <div style="font-size:24px;margin-bottom:6px;">🌙</div>
                        <div style="font-size:12px;color:#fff;">Dark</div>
                    </div>
                    <div class="settings-theme-option ${!settingsState.darkMode ? 'selected' : ''}" onclick="settingsSetTheme('${winId}',false)" style="background:#f0f0f0;border:3px solid ${!settingsState.darkMode ? '#0078d4' : '#555'};border-radius:8px;padding:16px;cursor:pointer;text-align:center;flex:1;">
                        <div style="font-size:24px;margin-bottom:6px;">☀️</div>
                        <div style="font-size:12px;color:#333;">Light</div>
                    </div>
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Taskbar</h3>
                <div class="settings-info-row"><span class="settings-info-label">Taskbar alignment</span><span>Left</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Taskbar size</span><span>Default (48px)</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Show seconds in clock</span><span>Off</span></div>
            </div>
        </div>
    `;
}

function settingsSetWallpaper(winId, index) {
    if (typeof currentWallpaper !== 'undefined' && typeof wallpapers !== 'undefined') {
        currentWallpaper = index;
        document.getElementById('desktop').style.background = wallpapers[currentWallpaper];
        saveWebOS();
    }
    settingsRenderContent(winId);
}

function settingsSetTheme(winId, dark) {
    settingsState.darkMode = dark;
    saveSettingsState();
    settingsRenderContent(winId);
}

function settingsRenderApps(winId) {
    const allApps = [
        { name: 'File Explorer', icon: '', size: '12.4 MB', publisher: 'WebOS' },
        { name: 'Browser', icon: '', size: '28.1 MB', publisher: 'WebOS' },
        { name: 'Notepad', icon: '📝', size: '4.2 MB', publisher: 'WebOS' },
        { name: 'Calculator', icon: '🔢', size: '6.8 MB', publisher: 'WebOS' },
        { name: 'Paint', icon: '🎨', size: '15.3 MB', publisher: 'WebOS' },
        { name: 'Command Prompt', icon: '⌨️', size: '2.1 MB', publisher: 'WebOS' },
        { name: 'Task Manager', icon: '', size: '8.7 MB', publisher: 'WebOS' },
        { name: 'BlockStack (Tetris)', icon: '🧱', size: '18.5 MB', publisher: 'WebOS Games' },
        { name: 'Street Brawl', icon: '🥊', size: '32.1 MB', publisher: 'WebOS Games' },
        { name: 'Tic Tac Toe Pro', icon: '⭕', size: '3.4 MB', publisher: 'WebOS Games' },
        { name: 'Super Pixel Mario', icon: '🏃', size: '24.7 MB', publisher: 'WebOS Games' },
        { name: 'Doom 2: Hell Walker', icon: '🔫', size: '45.2 MB', publisher: 'WebOS Games' },
    ];

    const downloadedList = typeof downloadedGames !== 'undefined' ? downloadedGames : [];

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;"> Apps</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Installed Apps (${allApps.length})</h3>
                <div style="max-height:400px;overflow-y:auto;">
                    ${allApps.map(app => `
                        <div class="settings-app-item">
                            <div style="display:flex;align-items:center;gap:12px;flex:1;">
                                <span style="font-size:22px;">${app.icon}</span>
                                <div>
                                    <div style="font-weight:600;font-size:13px;">${app.name}</div>
                                    <div style="font-size:11px;color:#888;">${app.publisher} · ${app.size}</div>
                                </div>
                            </div>
                            <span style="font-size:11px;color:#888;">System app</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${downloadedList.length > 0 ? `
            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Downloaded Games (${downloadedList.length})</h3>
                ${downloadedList.map(g => `
                    <div class="settings-app-item">
                        <div style="display:flex;align-items:center;gap:12px;flex:1;">
                            <span style="font-size:22px;">🎮</span>
                            <div>
                                <div style="font-weight:600;font-size:13px;">${g}</div>
                                <div style="font-size:11px;color:#888;">User download</div>
                            </div>
                        </div>
                        <span style="font-size:11px;color:#4ec9b0;">Installed</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Default Apps</h3>
                <div class="settings-info-row"><span class="settings-info-label">Web browser</span><span>WebOS Browser</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Text editor</span><span>Notepad</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Image viewer</span><span>WebOS Image Viewer</span></div>
                <div class="settings-info-row"><span class="settings-info-label">File manager</span><span>File Explorer</span></div>
            </div>
        </div>
    `;
}

function settingsRenderAccounts(winId) {
    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">👤 Accounts</h1>

            <div class="settings-section">
                <div style="display:flex;align-items:center;gap:16px;padding:16px;background:#2a2a2a;border-radius:12px;border:1px solid #3a3a3a;margin-bottom:20px;">
                    <div style="width:64px;height:64px;background:#0078d4;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;">👤</div>
                    <div>
                        <div style="font-size:18px;font-weight:600;color:#fff;">User</div>
                        <div style="font-size:12px;color:#888;">Local Account · Administrator</div>
                        <div style="font-size:11px;color:#666;margin-top:2px;">user@webos.local</div>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Account Settings</h3>
                <div class="settings-info-row"><span class="settings-info-label">Username</span><span>User</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Account type</span><span>Administrator</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Sign-in method</span><span>Local account</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Password</span><span>••••••••</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Other Users</h3>
                <div style="color:#888;font-size:12px;padding:12px 0;">No other users on this device.</div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Family & other users</h3>
                <div style="color:#888;font-size:12px;padding:12px 0;">Family features are not available in WebOS.</div>
            </div>
        </div>
    `;
}

function settingsRenderTime(winId) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const is24h = settingsState.timeFormat === '24h';
    const lang = settingsState.language;

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">🕐 Time & language</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Date & Time</h3>
                <div class="settings-info-row"><span class="settings-info-label">Current time</span><span style="font-size:16px;font-weight:600;color:#0078d4;">${timeStr}</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Current date</span><span>${dateStr}</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Time zone</span><span>(UTC) Coordinated Universal Time</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Set time automatically</span><span style="color:#4ec9b0;">On</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Set time zone automatically</span><span style="color:#4ec9b0;">On</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Time Format</h3>
                <div style="display:flex;gap:12px;">
                    <div class="settings-theme-option ${is24h ? 'selected' : ''}" onclick="settingsSetTimeFormat('${winId}','24h')" style="background:#2a2a2a;border:3px solid ${is24h ? '#0078d4' : '#555'};border-radius:8px;padding:16px;cursor:pointer;text-align:center;flex:1;">
                        <div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:4px;">14:30</div>
                        <div style="font-size:11px;color:#888;">24-hour</div>
                    </div>
                    <div class="settings-theme-option ${!is24h ? 'selected' : ''}" onclick="settingsSetTimeFormat('${winId}','12h')" style="background:#2a2a2a;border:3px solid ${!is24h ? '#0078d4' : '#555'};border-radius:8px;padding:16px;cursor:pointer;text-align:center;flex:1;">
                        <div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:4px;">2:30 PM</div>
                        <div style="font-size:11px;color:#888;">12-hour</div>
                    </div>
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Language</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">
                    ${['English','Spanish','French','German','Japanese','Chinese','Korean','Portuguese'].map(l => `
                        <div class="settings-lang-option ${lang === l ? 'selected' : ''}" onclick="settingsSetLanguage('${winId}','${l}')" style="background:#2a2a2a;border:2px solid ${lang === l ? '#0078d4' : '#555'};border-radius:8px;padding:12px;cursor:pointer;text-align:center;font-size:13px;color:#fff;transition:border-color 0.2s;">
                            ${l}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Regional Format</h3>
                <div class="settings-info-row"><span class="settings-info-label">Country/Region</span><span>United States</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Regional format</span><span>English (United States)</span></div>
                <div class="settings-info-row"><span class="settings-info-label">First day of week</span><span>Sunday</span></div>
            </div>
        </div>
    `;
}

function settingsSetTimeFormat(winId, format) {
    settingsState.timeFormat = format;
    saveSettingsState();
    settingsRenderContent(winId);
}

function settingsSetLanguage(winId, lang) {
    settingsState.language = lang;
    saveSettingsState();
    settingsRenderContent(winId);
}

function settingsRenderGaming(winId) {
    const games = [
        { name: 'BlockStack (Tetris)', icon: '', status: 'Installed' },
        { name: 'Street Brawl', icon: '', status: 'Installed' },
        { name: 'Tic Tac Toe Pro', icon: '⭕', status: 'Installed' },
        { name: 'Super Pixel Mario', icon: '', status: 'Installed' },
        { name: 'Doom 2: Hell Walker', icon: '🔫', status: 'Installed' },
    ];
    const downloadedList = typeof downloadedGames !== 'undefined' ? downloadedGames : [];
    downloadedList.forEach(g => {
        if (!games.find(x => x.name === g)) {
            games.push({ name: g, icon: '🎮', status: 'Downloaded' });
        }
    });

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">🎮 Gaming</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Game Mode</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Game Mode</div>
                        <div style="font-size:11px;color:#888;">Optimize system for gaming performance</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" checked disabled>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Xbox Game Bar</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Xbox Game Bar</div>
                        <div style="font-size:11px;color:#888;">Record game clips and screenshots</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" disabled>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Installed Games (${games.length})</h3>
                ${games.map(game => `
                    <div class="settings-app-item">
                        <div style="display:flex;align-items:center;gap:12px;flex:1;">
                            <span style="font-size:22px;">${game.icon}</span>
                            <div>
                                <div style="font-weight:600;font-size:13px;">${game.name}</div>
                                <div style="font-size:11px;color:#888;">${game.status}</div>
                            </div>
                        </div>
                        <button class="settings-play-btn" onclick="settingsLaunchGame('${game.name}')">Play</button>
                    </div>
                `).join('')}
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Captures</h3>
                <div class="settings-info-row"><span class="settings-info-label">Save captures to</span><span>C:\\Users\\User\\Videos\\Captures</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Background recording</span><span>Off</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Audio quality</span><span>128 kbps</span></div>
            </div>
        </div>
    `;
}

function settingsLaunchGame(gameName) {
    const gameMap = {
        'BlockStack (Tetris)': 'tetris',
        'Street Brawl': 'fighter',
        'Tic Tac Toe Pro': 'tictactoe',
        'Super Pixel Mario': 'platformer',
        'Doom 2: Hell Walker': 'doom2',
    };
    const appId = gameMap[gameName] || gameName.toLowerCase().replace(/\s+/g, '-');
    openApp(appId);
}

function settingsRenderAccessibility(winId) {
    const fontSize = settingsState.fontSize;
    const highContrast = settingsState.highContrast;

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">♿ Accessibility</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Text Size</h3>
                <div style="display:flex;gap:12px;">
                    ${['small','medium','large','extra-large'].map(size => `
                        <div class="settings-theme-option ${fontSize === size ? 'selected' : ''}" onclick="settingsSetFontSize('${winId}','${size}')" style="background:#2a2a2a;border:3px solid ${fontSize === size ? '#0078d4' : '#555'};border-radius:8px;padding:14px;cursor:pointer;text-align:center;flex:1;">
                            <div style="font-size:${size === 'small' ? '11px' : size === 'medium' ? '13px' : size === 'large' ? '16px' : '20px'};font-weight:600;color:#fff;margin-bottom:4px;">Aa</div>
                            <div style="font-size:10px;color:#888;text-transform:capitalize;">${size.replace('-',' ')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Visual Effects</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">High contrast</div>
                        <div style="font-size:11px;color:#888;">Increase contrast for better visibility</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" ${highContrast ? 'checked' : ''} onchange="settingsToggle('${winId}','highContrast')">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Transparency effects</div>
                        <div style="font-size:11px;color:#888;">Enable window transparency</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" checked disabled>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Animation effects</div>
                        <div style="font-size:11px;color:#888;">Enable window animations</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" checked disabled>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Mouse</h3>
                <div class="settings-info-row"><span class="settings-info-label">Cursor size</span><span>Default</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Cursor color</span><span>White</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Mouse keys</span><span>Off</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Keyboard</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Sticky keys</div>
                        <div style="font-size:11px;color:#888;">Press modifier keys one at a time</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" disabled>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Filter keys</div>
                        <div style="font-size:11px;color:#888;">Ignore brief or repeated keystrokes</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" disabled>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    `;
}

function settingsSetFontSize(winId, size) {
    settingsState.fontSize = size;
    saveSettingsState();
    settingsRenderContent(winId);
}

function settingsRenderPrivacy(winId) {
    const notifications = settingsState.notifications;
    const firewall = settingsState.firewall;
    const antivirus = settingsState.antivirus;
    const infected = typeof webosInfected !== 'undefined' ? webosInfected : false;
    const virusCount = typeof webosVirusFiles !== 'undefined' ? webosVirusFiles.length : 0;

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">🔒 Privacy & security</h1>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Windows Security</h3>
                <div style="display:flex;align-items:center;gap:16px;padding:16px;background:${infected ? '#2a1a00' : '#1a2a1a'};border-radius:12px;border:1px solid ${infected ? '#ff9900' : '#4ec9b0'};margin-bottom:16px;">
                    <div style="font-size:36px;">${infected ? '⚠️' : '️'}</div>
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:14px;color:${infected ? '#ff9900' : '#4ec9b0'};">${infected ? 'Threats Detected!' : 'No threats found'}</div>
                        <div style="font-size:12px;color:#888;">${virusCount} threat(s) · Last scan: ${settingsState.lastUpdateCheck || 'Never'}</div>
                    </div>
                    <button class="settings-scan-btn" onclick="settingsRunScan('${winId}')">Quick Scan</button>
                </div>
            </div>

            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Firewall & network protection</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Firewall</div>
                        <div style="font-size:11px;color:#888;">Block unauthorized network access</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" ${firewall ? 'checked' : ''} onchange="settingsToggle('${winId}','firewall')">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-info-row"><span class="settings-info-label">Status</span><span style="color:${firewall ? '#4ec9b0' : '#ff4444'};">${firewall ? 'Active' : 'Disabled'}</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Virus & threat protection</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Real-time protection</div>
                        <div style="font-size:11px;color:#888;">Scan files and programs in real time</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" ${antivirus ? 'checked' : ''} onchange="settingsToggle('${winId}','antivirus')">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-info-row"><span class="settings-info-label">Status</span><span style="color:${antivirus ? '#4ec9b0' : '#ff4444'};">${antivirus ? 'Active' : 'Disabled'}</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Threats found</span><span style="color:${virusCount > 0 ? '#ff4444' : '#4ec9b0'};">${virusCount}</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Notifications</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Notifications</div>
                        <div style="font-size:11px;color:#888;">Show system notifications</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" ${notifications ? 'checked' : ''} onchange="settingsToggle('${winId}','notifications')">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">App permissions</h3>
                <div class="settings-info-row"><span class="settings-info-label">Location</span><span style="color:#ff4444;">Blocked</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Camera</span><span style="color:#ff4444;">Blocked</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Microphone</span><span style="color:#ff4444;">Blocked</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Notifications</span><span style="color:#4ec9b0;">Allowed</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Diagnostics & feedback</h3>
                <div class="settings-info-row"><span class="settings-info-label">Diagnostic data</span><span>Required only</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Inking & typing</span><span>Off</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Tailored experiences</span><span>Off</span></div>
            </div>
        </div>
    `;
}

function settingsRunScan(winId) {
    const content = document.getElementById(winId + '-settings-content');
    if (!content) return;

    content.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
            <div style="font-size:64px;margin-bottom:16px;animation:spin 2s linear infinite;">🔍</div>
            <h2 style="font-size:20px;font-weight:600;color:#fff;margin:0 0 8px 0;">Scanning your system...</h2>
            <p style="color:#888;font-size:13px;margin:0;">Checking for threats and vulnerabilities</p>
            <div style="width:300px;height:6px;background:#333;border-radius:3px;margin:24px auto 0;overflow:hidden;">
                <div id="${winId}-scan-progress" style="height:100%;width:0%;background:#0078d4;border-radius:3px;transition:width 0.3s;"></div>
            </div>
            <div id="${winId}-scan-status" style="color:#888;font-size:12px;margin-top:12px;">Initializing scan...</div>
        </div>
    `;

    let progress = 0;
    const stages = [
        { at: 10, text: 'Scanning system files...' },
        { at: 30, text: 'Checking registry entries...' },
        { at: 50, text: 'Analyzing running processes...' },
        { at: 70, text: 'Scanning network connections...' },
        { at: 90, text: 'Checking startup items...' },
        { at: 100, text: 'Scan complete!' },
    ];

    const interval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress > 100) progress = 100;

        const bar = document.getElementById(winId + '-scan-progress');
        const status = document.getElementById(winId + '-scan-status');
        if (bar) bar.style.width = progress + '%';

        for (const stage of stages) {
            if (progress >= stage.at && status) {
                status.textContent = stage.text;
            }
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                settingsShowScanResults(winId);
            }, 800);
        }
    }, 200);
}

function settingsShowScanResults(winId) {
    const infected = typeof webosInfected !== 'undefined' ? webosInfected : false;
    const virusCount = typeof webosVirusFiles !== 'undefined' ? webosVirusFiles.length : 0;
    const content = document.getElementById(winId + '-settings-content');
    if (!content) return;

    const now = new Date();
    settingsState.lastUpdateCheck = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    saveSettingsState();

    content.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
            <div style="font-size:64px;margin-bottom:16px;">${infected ? '⚠️' : '✅'}</div>
            <h2 style="font-size:20px;font-weight:600;color:#fff;margin:0 0 8px 0;">${infected ? 'Threats Found!' : 'No threats found'}</h2>
            <p style="color:#888;font-size:13px;margin:0 0 24px 0;">Scan completed at ${settingsState.lastUpdateCheck}</p>

            <div style="background:#2a2a2a;border-radius:12px;padding:20px;max-width:400px;margin:0 auto;text-align:left;">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #3a3a3a;">
                    <span style="color:#888;font-size:12px;">Threats detected</span>
                    <span style="color:${virusCount > 0 ? '#ff4444' : '#4ec9b0'};font-weight:600;font-size:12px;">${virusCount}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #3a3a3a;">
                    <span style="color:#888;font-size:12px;">Files scanned</span>
                    <span style="color:#fff;font-weight:600;font-size:12px;">${Math.floor(Math.random() * 5000 + 10000)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #3a3a3a;">
                    <span style="color:#888;font-size:12px;">Scan duration</span>
                    <span style="color:#fff;font-weight:600;font-size:12px;">${Math.floor(Math.random() * 10 + 5)}s</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;">
                    <span style="color:#888;font-size:12px;">Last full scan</span>
                    <span style="color:#fff;font-weight:600;font-size:12px;">${settingsState.lastUpdateCheck}</span>
                </div>
            </div>

            ${infected ? `
            <div style="margin-top:20px;padding:14px;background:#2a1a00;border:1px solid #ff9900;border-radius:8px;max-width:400px;margin-left:auto;margin-right:auto;">
                <div style="color:#ffcc00;font-size:13px;font-weight:600;margin-bottom:6px;">️ Action Required</div>
                <div style="color:#ccc;font-size:12px;">Open Command Prompt and run <code style="background:#000;padding:2px 6px;border-radius:3px;color:#00d4ff;">scan</code> to view threats, then <code style="background:#000;padding:2px 6px;border-radius:3px;color:#00d4ff;">clean</code> to remove them.</div>
            </div>
            ` : `
            <div style="margin-top:20px;padding:14px;background:#1a2a1a;border:1px solid #4ec9b0;border-radius:8px;max-width:400px;margin-left:auto;margin-right:auto;">
                <div style="color:#4ec9b0;font-size:13px;font-weight:600;">✅ Your device is protected</div>
            </div>
            `}

            <button class="settings-scan-btn" style="margin-top:20px;" onclick="settingsNavigate('${winId}','privacy')">Back to Privacy</button>
        </div>
    `;
}

function settingsRenderUpdate(winId) {
    const lastCheck = settingsState.lastUpdateCheck || 'Never';
    const isChecking = settingsState.checkingUpdate;
    const isComplete = settingsState.updateComplete;
    const updateVersion = settingsState.updateVersion;

    return `
        <div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 20px 0;color:#fff;">🔄 Windows Update</h1>

            <div class="settings-section">
                <div style="display:flex;align-items:center;gap:16px;padding:20px;background:#1a2a3a;border-radius:12px;border:1px solid #0078d4;margin-bottom:20px;">
                    <div style="font-size:36px;">🔄</div>
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:14px;color:#fff;">You're up to date</div>
                        <div style="font-size:12px;color:#888;">Last checked: ${lastCheck}</div>
                    </div>
                    <button class="settings-scan-btn" onclick="settingsCheckUpdate('${winId}')" ${isChecking ? 'disabled' : ''}>${isChecking ? 'Checking...' : 'Check for updates'}</button>
                </div>
            </div>

            ${isChecking ? `
            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Checking for updates...</h3>
                <div style="width:100%;height:6px;background:#333;border-radius:3px;overflow:hidden;">
                    <div id="${winId}-update-progress" style="height:100%;width:0%;background:#0078d4;border-radius:3px;transition:width 0.3s;"></div>
                </div>
                <div id="${winId}-update-status" style="color:#888;font-size:12px;margin-top:8px;">Connecting to update server...</div>
            </div>
            ` : ''}

            ${isComplete ? `
            <div class="settings-section">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Update Available</h3>
                <div style="background:#1a2a1a;border:1px solid #4ec9b0;border-radius:12px;padding:20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <span style="font-size:24px;">✅</span>
                        <div>
                            <div style="font-weight:600;font-size:14px;color:#4ec9b0;">WebOS ${updateVersion} is ready to install</div>
                            <div style="font-size:12px;color:#888;">Released: ${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div style="color:#ccc;font-size:12px;line-height:1.6;margin-bottom:16px;">
                        <strong>What's new:</strong><br>
                        • Bug fixes and performance improvements<br>
                        • Security patches<br>
                        • New features and enhancements
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="settings-scan-btn" onclick="settingsInstallUpdate('${winId}')">Install now</button>
                        <button class="settings-scan-btn" style="background:#444;" onclick="settingsDeferUpdate('${winId}')">Remind me later</button>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Update Settings</h3>
                <div class="settings-toggle-row">
                    <div>
                        <div style="font-weight:600;font-size:13px;">Automatic updates</div>
                        <div style="font-size:11px;color:#888;">Download and install updates automatically</div>
                    </div>
                    <label class="settings-toggle-switch">
                        <input type="checkbox" ${settingsState.autoUpdate ? 'checked' : ''} onchange="settingsToggle('${winId}','autoUpdate')">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-info-row"><span class="settings-info-label">Active hours</span><span>8:00 AM - 5:00 PM</span></div>
                <div class="settings-info-row"><span class="settings-info-label">Pause updates</span><span>Not paused</span></div>
            </div>

            <div class="settings-section" style="margin-top:20px;">
                <h3 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px 0;">Update History</h3>
                <div class="settings-app-item">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <span style="font-size:18px;">✅</span>
                        <div>
                            <div style="font-weight:600;font-size:13px;">WebOS 1.5.0</div>
                            <div style="font-size:11px;color:#888;">Installed successfully · ${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
                <div class="settings-app-item">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <span style="font-size:18px;">✅</span>
                        <div>
                            <div style="font-weight:600;font-size:13px;">WebOS 1.4.0</div>
                            <div style="font-size:11px;color:#888;">Installed successfully</div>
                        </div>
                    </div>
                </div>
                <div class="settings-app-item">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <span style="font-size:18px;">✅</span>
                        <div>
                            <div style="font-weight:600;font-size:13px;">WebOS 1.0.0</div>
                            <div style="font-size:11px;color:#888;">Initial release</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function settingsCheckUpdate(winId) {
    settingsState.checkingUpdate = true;
    settingsState.updateComplete = false;
    settingsRenderContent(winId);
    settingsStartUpdateCheck(winId);
}

function settingsStartUpdateCheck(winId) {
    let progress = 0;
    const stages = [
        { at: 15, text: 'Connecting to update server...' },
        { at: 35, text: 'Checking for available updates...' },
        { at: 60, text: 'Downloading update metadata...' },
        { at: 85, text: 'Verifying update packages...' },
        { at: 100, text: 'Update check complete!' },
    ];

    const interval = setInterval(() => {
        progress += Math.random() * 6 + 2;
        if (progress > 100) progress = 100;

        const bar = document.getElementById(winId + '-update-progress');
        const status = document.getElementById(winId + '-update-status');
        if (bar) bar.style.width = progress + '%';

        for (const stage of stages) {
            if (progress >= stage.at && status) {
                status.textContent = stage.text;
            }
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                settingsState.checkingUpdate = false;
                settingsState.updateComplete = true;
                settingsRenderContent(winId);
            }, 600);
        }
    }, 250);
}

function settingsInstallUpdate(winId) {
    const content = document.getElementById(winId + '-settings-content');
    if (!content) return;

    content.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
            <div style="font-size:64px;margin-bottom:16px;animation:spin 2s linear infinite;">🔄</div>
            <h2 style="font-size:20px;font-weight:600;color:#fff;margin:0 0 8px 0;">Installing update...</h2>
            <p style="color:#888;font-size:13px;margin:0;">Please don't turn off your device</p>
            <div style="width:300px;height:6px;background:#333;border-radius:3px;margin:24px auto 0;overflow:hidden;">
                <div id="${winId}-install-progress" style="height:100%;width:0%;background:#0078d4;border-radius:3px;transition:width 0.3s;"></div>
            </div>
            <div id="${winId}-install-status" style="color:#888;font-size:12px;margin-top:12px;">Preparing installation...</div>
        </div>
    `;

    let progress = 0;
    const stages = [
        { at: 10, text: 'Downloading update files...' },
        { at: 30, text: 'Installing features...' },
        { at: 50, text: 'Applying patches...' },
        { at: 70, text: 'Configuring system...' },
        { at: 90, text: 'Finalizing installation...' },
        { at: 100, text: 'Update installed! Restarting...' },
    ];

    const interval = setInterval(() => {
        progress += Math.random() * 5 + 2;
        if (progress > 100) progress = 100;

        const bar = document.getElementById(winId + '-install-progress');
        const status = document.getElementById(winId + '-install-status');
        if (bar) bar.style.width = progress + '%';

        for (const stage of stages) {
            if (progress >= stage.at && status) {
                status.textContent = stage.text;
            }
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                settingsState.lastUpdateCheck = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                settingsState.updateComplete = false;
                settingsState.updateVersion = '1.7.0';
                saveSettingsState();
                restartOS();
            }, 1000);
        }
    }, 300);
}

function settingsDeferUpdate(winId) {
    settingsState.updateComplete = false;
    saveSettingsState();
    settingsRenderContent(winId);
}
