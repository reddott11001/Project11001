let windowZIndex = 100;
let activeWindows = {};
let windowIdCounter = 0;
let dragState = null;

const wallpapers = [
    'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 30%, #1a4a7a 60%, #0d2137 100%)',
    'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #2d2d44 100%)',
];
let currentWallpaper = 0;

let webosInfected = false;
let webosVirusFiles = [];
let webosQuarantineFiles = [];
let downloadedGames = [];

function saveWebOS() {
    try {
        const data = {
            fileSystem: fileSystem,
            webosInfected: webosInfected,
            webosVirusFiles: webosVirusFiles,
            currentWallpaper: currentWallpaper,
            downloadedGames: downloadedGames
        };
        localStorage.setItem('webos-save', JSON.stringify(data));
    } catch(e) {}
}

function loadWebOS() {
    try {
        const saved = localStorage.getItem('webos-save');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.fileSystem) {
                Object.assign(fileSystem, data.fileSystem);
            }
            webosInfected = data.webosInfected || false;
            webosVirusFiles = data.webosVirusFiles || [];
            if (typeof data.currentWallpaper === 'number') {
                currentWallpaper = data.currentWallpaper;
            }
            downloadedGames = data.downloadedGames || [];
            restoreDownloadedIcons();
            return true;
        }
    } catch(e) {}
    return false;
}

function restoreDownloadedIcons() {
    const gameInfo = {
        tictactoe: { name: 'Tic Tac Toe Pro', icon: '⭕' },
        platformer: { name: 'Super Pixel Mario', icon: '🏃' },
        doom2: { name: 'Doom 2: Hell Walker', icon: '🔫' },
    };
    downloadedGames.forEach(gameId => {
        const info = gameInfo[gameId];
        if (!info) return;
        const existing = document.querySelector(`.desktop-icon[data-app="${gameId}"]`);
        if (existing) return;
        const di = document.getElementById('desktop-icons');
        if (!di) return;
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
    });
}

function resetWebOS() {
    localStorage.removeItem('webos-save');
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('boot-screen').style.display = 'none';
        document.getElementById('lock-screen').style.display = 'flex';
        updateClock();
        setInterval(updateClock, 1000);
    }, 2500);

    document.getElementById('lock-screen').addEventListener('click', () => {
        document.getElementById('lock-screen').style.display = 'none';
        loadWebOS();
        document.getElementById('desktop').style.background = wallpapers[currentWallpaper];
        document.getElementById('desktop').style.display = 'block';
        if (webosInfected) {
            showHackerOverlay();
            addNotification('🚨 WebOS Defender CRITICAL', 'SYSTEM COMPROMISED! (saved session)');
        }
        setInterval(saveWebOS, 30000);
    });

    document.addEventListener('click', (e) => {
        const ctx = document.getElementById('context-menu');
        if (!ctx.contains(e.target)) ctx.style.display = 'none';

        const sm = document.getElementById('start-menu');
        const sb = document.getElementById('start-btn');
        if (!sm.contains(e.target) && !sb.contains(e.target)) sm.style.display = 'none';

        const nc = document.getElementById('notification-center');
        const nb = document.getElementById('notification-btn');
        if (!nc.contains(e.target) && !nb.contains(e.target)) nc.style.display = 'none';

        const pm = document.getElementById('power-menu');
        if (!pm.contains(e.target)) pm.style.display = 'none';

        const sr = document.getElementById('search-results');
        const si = document.getElementById('search-input');
        if (!sr.contains(e.target) && e.target !== si) sr.style.display = 'none';
    });

    document.getElementById('desktop').addEventListener('contextmenu', (e) => {
        if (e.target.closest('.app-window') || e.target.closest('#taskbar')) return;
        e.preventDefault();
        const ctx = document.getElementById('context-menu');
        ctx.style.display = 'block';
        ctx.style.left = e.clientX + 'px';
        ctx.style.top = e.clientY + 'px';
    });

    document.getElementById('desktop').addEventListener('mousedown', (e) => {
        if (e.target.closest('.app-window') || e.target.closest('#taskbar') ||
            e.target.closest('#start-menu') || e.target.closest('#context-menu') ||
            e.target.closest('#notification-center') || e.target.closest('#power-menu')) return;

        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    });

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });
});

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString();
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const tt = document.getElementById('taskbar-time');
    const td = document.getElementById('taskbar-date');
    if (tt) tt.textContent = timeStr;
    if (td) td.textContent = dateStr;

    const lt = document.getElementById('lock-time');
    const ld = document.getElementById('lock-date');
    if (lt) lt.textContent = timeStr;
    if (ld) ld.textContent = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`;
}

function toggleStartMenu() {
    const sm = document.getElementById('start-menu');
    sm.style.display = sm.style.display === 'none' ? 'flex' : 'none';
}

function toggleNotifications() {
    const nc = document.getElementById('notification-center');
    nc.style.display = nc.style.display === 'none' ? 'flex' : 'none';
}

function showPowerMenu() {
    document.getElementById('start-menu').style.display = 'none';
    const pm = document.getElementById('power-menu');
    pm.style.display = pm.style.display === 'none' ? 'block' : 'none';
}

function lockScreen() {
    document.getElementById('power-menu').style.display = 'none';
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'flex';
    Object.keys(activeWindows).forEach(id => {
        activeWindows[id].minimized = true;
    });
}

function restartOS() {
    document.getElementById('power-menu').style.display = 'none';
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('shutdown-screen').style.display = 'flex';
    document.querySelector('.shutdown-text').textContent = 'Restarting...';
    setTimeout(() => {
        document.getElementById('shutdown-screen').style.display = 'none';
        document.getElementById('boot-screen').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('boot-screen').style.display = 'none';
            document.getElementById('lock-screen').style.display = 'flex';
        }, 2500);
    }, 2000);
}

function shutdownOS() {
    document.getElementById('power-menu').style.display = 'none';
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('shutdown-screen').style.display = 'flex';
    document.querySelector('.shutdown-text').textContent = 'Shutting down...';
    setTimeout(() => {
        document.getElementById('shutdown-screen').innerHTML = '';
        document.getElementById('shutdown-screen').style.background = '#000';
    }, 3000);
}

function changeWallpaper() {
    document.getElementById('context-menu').style.display = 'none';
    currentWallpaper = (currentWallpaper + 1) % wallpapers.length;
    document.getElementById('desktop').style.background = wallpapers[currentWallpaper];
    saveWebOS();
}

function handleSearch(val) {
    const sr = document.getElementById('search-results');
    if (!val.trim()) {
        sr.style.display = 'none';
        return;
    }
    const apps = [
        { name: 'File Explorer', icon: '📁', id: 'file-explorer' },
        { name: 'Browser', icon: '🌐', id: 'browser' },
        { name: 'Notepad', icon: '📝', id: 'notepad' },
        { name: 'Command Prompt', icon: '⌨️', id: 'cmd' },
        { name: 'BlockStack (Tetris)', icon: '🧱', id: 'tetris' },
        { name: 'Street Brawl (Fighter)', icon: '🥊', id: 'fighter' },

    ];
    const filtered = apps.filter(a => a.name.toLowerCase().includes(val.toLowerCase()));
    if (filtered.length === 0) {
        sr.style.display = 'none';
        return;
    }
    sr.innerHTML = filtered.map(a =>
        `<div class="search-result-item" onclick="openApp('${a.id}'); document.getElementById('search-results').style.display='none'; document.getElementById('search-input').value='';">${a.icon} ${a.name}</div>`
    ).join('');
    sr.style.display = 'block';
}

function openApp(appId) {
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('context-menu').style.display = 'none';

    const existing = Object.values(activeWindows).find(w => w.appId === appId && !w.closed);
    if (existing) {
        restoreWindow(existing.id);
        return;
    }

    const configs = {
        'file-explorer': { title: 'File Explorer', icon: '📁', width: 800, height: 500, render: renderFileExplorer },
        'browser': { title: 'Browser', icon: '🌐', width: 900, height: 600, render: renderBrowser },
        'notepad': { title: 'Notepad', icon: '📝', width: 650, height: 450, render: renderNotepad },
        'tetris': { title: 'BlockStack', icon: '🧱', width: 420, height: 580, render: renderTetris },
        'fighter': { title: 'Street Brawl', icon: '🥊', width: 700, height: 520, render: renderFighter },
        'tictactoe': { title: 'Tic Tac Toe Pro', icon: '⭕', width: 350, height: 430, render: renderTicTacToe },
        'platformer': { title: 'Super Pixel Mario', icon: '🏃', width: 700, height: 520, render: renderPlatformer },
        'doom2': { title: 'Doom 2: Hell Walker', icon: '🔫', width: 700, height: 520, render: renderDoom2 },
        'recycle': { title: 'Recycle Bin', icon: '🗑️', width: 600, height: 400, render: renderRecycleBin },
        'cmd': { title: 'Command Prompt', icon: '⌨️', width: 750, height: 450, render: renderTerminal },
    };

    const config = configs[appId];
    if (!config) return;

    const winId = 'win-' + (++windowIdCounter);
    const container = document.getElementById('windows-container');

    const offsetX = 50 + (windowIdCounter % 8) * 30;
    const offsetY = 30 + (windowIdCounter % 8) * 30;

    const win = document.createElement('div');
    win.className = 'app-window';
    win.id = winId;
    win.style.width = config.width + 'px';
    win.style.height = config.height + 'px';
    win.style.left = offsetX + 'px';
    win.style.top = offsetY + 'px';
    win.style.zIndex = ++windowZIndex;

    win.innerHTML = `
        <div class="window-titlebar" data-winid="${winId}">
            <span class="window-titlebar-icon">${config.icon}</span>
            <span class="window-titlebar-text">${config.title}</span>
            <div class="window-controls">
                <button class="min-btn" onclick="minimizeWindow('${winId}')" title="Minimize">─</button>
                <button class="max-btn" onclick="maximizeWindow('${winId}')" title="Maximize">☐</button>
                <button class="close-btn" onclick="closeWindow('${winId}')" title="Close">✕</button>
            </div>
        </div>
        <div class="window-body" id="${winId}-body"></div>
    `;

    container.appendChild(win);

    activeWindows[winId] = {
        id: winId,
        appId: appId,
        title: config.title,
        icon: config.icon,
        minimized: false,
        maximized: false,
        closed: false,
        prevBounds: null
    };

    config.render(winId);
    addTaskbarButton(winId);
    focusWindow(winId);
    setupWindowDrag(win);
}

function setupWindowDrag(win) {
    const titlebar = win.querySelector('.window-titlebar');
    titlebar.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        const winId = win.id;
        const winData = activeWindows[winId];
        if (winData && winData.maximized) return;

        focusWindow(winId);
        dragState = {
            winId: winId,
            startX: e.clientX,
            startY: e.clientY,
            origLeft: parseInt(win.style.left),
            origTop: parseInt(win.style.top)
        };
        e.preventDefault();
    });

    win.addEventListener('mousedown', (e) => {
        if (!e.target.closest('#taskbar')) {
            focusWindow(win.id);
        }
    });
}

document.addEventListener('mousemove', (e) => {
    if (!dragState) return;
    const win = document.getElementById(dragState.winId);
    if (!win) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    win.style.left = (dragState.origLeft + dx) + 'px';
    win.style.top = (dragState.origTop + dy) + 'px';
});

document.addEventListener('mouseup', () => {
    dragState = null;
});

function focusWindow(winId) {
    document.querySelectorAll('.app-window').forEach(w => w.classList.remove('active'));
    const win = document.getElementById(winId);
    if (win) {
        win.classList.add('active');
        win.style.zIndex = ++windowZIndex;
    }
    document.querySelectorAll('.taskbar-app-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tb-' + winId);
    if (btn) btn.classList.add('active');
}

function minimizeWindow(winId) {
    const win = document.getElementById(winId);
    if (win) {
        win.classList.add('minimized');
        activeWindows[winId].minimized = true;
    }
    const btn = document.getElementById('tb-' + winId);
    if (btn) btn.classList.remove('active');
}

function maximizeWindow(winId) {
    const win = document.getElementById(winId);
    const winData = activeWindows[winId];
    if (!win || !winData) return;

    if (winData.maximized) {
        win.classList.remove('maximized');
        if (winData.prevBounds) {
            win.style.left = winData.prevBounds.left;
            win.style.top = winData.prevBounds.top;
            win.style.width = winData.prevBounds.width;
            win.style.height = winData.prevBounds.height;
        }
        winData.maximized = false;
    } else {
        winData.prevBounds = {
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height
        };
        win.classList.add('maximized');
        winData.maximized = true;
    }
}

function restoreWindow(winId) {
    const win = document.getElementById(winId);
    const winData = activeWindows[winId];
    if (!win || !winData) return;

    if (winData.minimized) {
        win.classList.remove('minimized');
        winData.minimized = false;
    }
    focusWindow(winId);
}

function closeWindow(winId) {
    const win = document.getElementById(winId);
    if (win) win.remove();
    if (activeWindows[winId]) {
        activeWindows[winId].closed = true;
        if (activeWindows[winId].cleanup) {
            activeWindows[winId].cleanup();
        }
    }
    delete activeWindows[winId];
    const btn = document.getElementById('tb-' + winId);
    if (btn) btn.remove();
}

function addTaskbarButton(winId) {
    const winData = activeWindows[winId];
    const taskbarApps = document.getElementById('taskbar-apps');
    const btn = document.createElement('div');
    btn.className = 'taskbar-app-btn';
    btn.id = 'tb-' + winId;
    btn.innerHTML = winData.icon;
    btn.title = winData.title;
    btn.onclick = () => {
        const wd = activeWindows[winId];
        if (!wd) return;
        if (wd.minimized) {
            restoreWindow(winId);
        } else {
            const win = document.getElementById(winId);
            if (win && win.classList.contains('active')) {
                minimizeWindow(winId);
            } else {
                focusWindow(winId);
            }
        }
    };
    taskbarApps.appendChild(btn);
}

function sortIcons() {
    document.getElementById('context-menu').style.display = 'none';
    const container = document.getElementById('desktop-icons');
    const icons = Array.from(container.children);
    icons.sort((a, b) => {
        const nameA = a.querySelector('span').textContent;
        const nameB = b.querySelector('span').textContent;
        return nameA.localeCompare(nameB);
    });
    icons.forEach(i => container.appendChild(i));
}

function toggleIconSize() {
    document.getElementById('context-menu').style.display = 'none';
}

function addNotification(app, text) {
    const list = document.getElementById('notif-list');
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML = `
        <div class="notif-app">${app}</div>
        <div class="notif-text">${text}</div>
        <div class="notif-time">Just now</div>
    `;
    list.insertBefore(item, list.firstChild);
}
