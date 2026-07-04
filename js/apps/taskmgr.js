function renderTaskManager(winId) {
    const body = document.getElementById(winId + '-body');
    body.innerHTML = `
        <div style="height:100%;display:flex;flex-direction:column;background:#1e1e1e;color:#fff;font-family:Segoe UI,sans-serif;font-size:12px;">
            <div style="display:flex;gap:2px;padding:4px 8px;background:#2d2d2d;border-bottom:1px solid #444;">
                <button class="taskmgr-btn" onclick="taskmgrRefresh('${winId}')" style="background:#0e6398;color:#fff;border:none;padding:4px 14px;border-radius:3px;cursor:pointer;font-size:11px;">⟳ Refresh</button>
                <button class="taskmgr-btn" onclick="taskmgrEndTask('${winId}')" style="background:#c42b1c;color:#fff;border:none;padding:4px 14px;border-radius:3px;cursor:pointer;font-size:11px;">✕ End Task</button>
                <span style="flex:1;"></span>
                <span id="${winId}-taskmgr-count" style="color:#888;font-size:11px;padding:4px 0;"></span>
            </div>
            <div style="display:flex;gap:16px;flex:1;overflow:hidden;">
                <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
                    <div style="padding:6px 8px;background:#252525;border-bottom:1px solid #3a3a3a;display:flex;gap:8px;font-weight:bold;color:#ccc;font-size:11px;">
                        <span style="width:28px;text-align:center;"></span>
                        <span style="flex:1;">Process Name</span>
                        <span style="width:60px;text-align:center;">Status</span>
                        <span style="width:60px;text-align:center;">PID</span>
                    </div>
                    <div id="${winId}-taskmgr-list" style="flex:1;overflow-y:auto;background:#1a1a1a;"></div>
                </div>
                <div style="width:240px;padding:12px;border-left:1px solid #3a3a3a;overflow-y:auto;">
                    <div style="font-weight:bold;color:#ccc;margin-bottom:10px;">📊 Performance</div>
                    <div id="${winId}-miner-list" style="margin-bottom:12px;"></div>
                    <div style="margin-bottom:14px;">
                        <div style="display:flex;justify-content:space-between;color:#888;font-size:10px;margin-bottom:4px;">
                            <span>CPU Usage</span>
                            <span id="${winId}-cpu-pct">0%</span>
                        </div>
                        <div style="height:8px;background:#333;border-radius:4px;overflow:hidden;">
                            <div id="${winId}-cpu-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#4ec9b0,#2b9b8a);border-radius:4px;transition:width 0.5s;"></div>
                        </div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="display:flex;justify-content:space-between;color:#888;font-size:10px;margin-bottom:4px;">
                            <span>Memory</span>
                            <span id="${winId}-mem-pct">0%</span>
                        </div>
                        <div style="height:8px;background:#333;border-radius:4px;overflow:hidden;">
                            <div id="${winId}-mem-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#569cd6,#3b75a8);border-radius:4px;transition:width 0.5s;"></div>
                        </div>
                    </div>
                    <div style="background:#2a2a2a;border-radius:6px;padding:10px;margin-top:8px;">
                        <div style="color:#888;font-size:10px;margin-bottom:4px;">System</div>
                        <div style="color:#aaa;font-size:10px;line-height:1.6;">
                            <div>Processes: <span id="${winId}-proc-count">0</span></div>
                            <div>Uptime: <span id="${winId}-uptime">0m</span></div>
                            <div>WebOS v1.0.0</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    taskmgrRefresh(winId);
    const interval = setInterval(() => taskmgrRefresh(winId, true), 2000);

    if (activeWindows[winId]) {
        const oldCleanup = activeWindows[winId].cleanup;
        activeWindows[winId].cleanup = () => {
            if (oldCleanup) oldCleanup();
            clearInterval(interval);
        };
    }
}

let taskmgrStartTime = Date.now();

function taskmgrRefresh(winId, keepSelection) {
    const list = document.getElementById(winId + '-taskmgr-list');
    const countEl = document.getElementById(winId + '-taskmgr-count');
    if (!list) return;

    const apps = Object.values(activeWindows).filter(w => !w.closed && w.appId !== 'taskmgr');
    const selected = list.querySelector('.taskmgr-selected');
    const selectedAppId = selected ? selected.dataset.appid : null;

    list.innerHTML = '';
    apps.forEach(w => {
        const row = document.createElement('div');
        row.dataset.appid = w.appId;
        row.style.cssText = `
            display:flex;gap:8px;padding:5px 8px;cursor:pointer;border-bottom:1px solid #2a2a2a;
            align-items:center;font-size:11px;${selectedAppId === w.appId ? 'background:#094771;' : ''}
        `;
        row.onclick = () => {
            list.querySelectorAll('.taskmgr-selected').forEach(el => el.style.background = 'transparent');
            row.style.background = '#094771';
            row.classList.add('taskmgr-selected');
        };
        const icon = w.icon || '📄';
        const name = w.title || w.appId;
        const status = w.minimized ? 'Suspended' : 'Running';
        const pid = w.id ? w.id.replace('win-', '') : '—';
        const statusColor = w.minimized ? '#888' : '#4ec9b0';
        row.innerHTML = `
            <span style="width:28px;text-align:center;font-size:14px;">${icon}</span>
            <span style="flex:1;color:#ddd;">${name}</span>
            <span style="width:60px;text-align:center;color:${statusColor};">${status}</span>
            <span style="width:60px;text-align:center;color:#888;">${pid}</span>
        `;
        list.appendChild(row);
    });

    activeMiners.forEach(miner => {
        const minerRow = document.createElement('div');
        minerRow.dataset.appid = miner.id;
        minerRow.style.cssText = `
            display:flex;gap:8px;padding:5px 8px;cursor:pointer;border-bottom:1px solid #2a2a2a;
            align-items:center;font-size:11px;background:rgba(${hexToRgb(miner.color)},0.08);
            ${selectedAppId === miner.id ? 'background:#094771;' : ''}
        `;
        minerRow.onclick = () => {
            list.querySelectorAll('.taskmgr-selected').forEach(el => el.style.background = 'transparent');
            minerRow.style.background = '#094771';
            minerRow.classList.add('taskmgr-selected');
        };
        minerRow.innerHTML = `
            <span style="width:28px;text-align:center;font-size:14px;">${miner.icon}</span>
            <span style="flex:1;color:${miner.color};">${miner.name}</span>
            <span style="width:60px;text-align:center;color:#ff6644;">Mining</span>
            <span style="width:60px;text-align:center;color:#888;">M${minerIdCounter - activeMiners.indexOf(miner)}</span>
        `;
        list.appendChild(minerRow);
    });

    if (countEl) {
        const total = apps.length + activeMiners.length;
        countEl.textContent = total + ' process' + (total !== 1 ? 'es' : '');
    }

    const cpuEl = document.getElementById(winId + '-cpu-pct');
    const cpuBar = document.getElementById(winId + '-cpu-bar');
    const memEl = document.getElementById(winId + '-mem-pct');
    const memBar = document.getElementById(winId + '-mem-bar');
    const procCountEl = document.getElementById(winId + '-proc-count');
    const uptimeEl = document.getElementById(winId + '-uptime');
    const minerListEl = document.getElementById(winId + '-miner-list');

    const totalCpu = getTotalMinerCpu ? getTotalMinerCpu() : 0;
    const baseCpu = 5 + Math.random() * 15;
    const cpu = Math.min(100, Math.round(totalCpu + baseCpu));
    if (cpuEl) cpuEl.textContent = cpu + '%';
    if (cpuBar) cpuBar.style.width = cpu + '%';

    const mem = Math.round(20 + Math.random() * 40);
    if (memEl) memEl.textContent = mem + '%';
    if (memBar) memBar.style.width = mem + '%';

    if (minerListEl) {
        if (activeMiners.length === 0) {
            minerListEl.innerHTML = '<div style="color:#00ff00;font-size:10px;">✅ No miners active</div>';
        } else {
            let html = '<div style="font-size:10px;color:#888;margin-bottom:6px;">⛏️ Active Miners:</div>';
            activeMiners.forEach(m => {
                const cpuPct = Math.round(m.cpu * (0.8 + Math.random() * 0.4));
                html += `
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding:4px 6px;background:rgba(0,0,0,0.3);border-radius:4px;border-left:3px solid ${m.color};">
                        <span style="font-size:14px;">${m.icon}</span>
                        <div style="flex:1;">
                            <div style="display:flex;justify-content:space-between;color:#aaa;font-size:9px;">
                                <span style="color:${m.color};">${m.name}</span>
                                <span>${cpuPct}% CPU</span>
                            </div>
                            <div style="height:3px;background:#333;border-radius:2px;margin-top:2px;overflow:hidden;">
                                <div style="height:100%;width:${cpuPct}%;background:${m.color};border-radius:2px;"></div>
                            </div>
                        </div>
                    </div>
                `;
            });
            minerListEl.innerHTML = html;
        }
    }

    if (procCountEl) procCountEl.textContent = Object.values(activeWindows).filter(w => !w.closed).length;
    if (uptimeEl) {
        const mins = Math.round((Date.now() - taskmgrStartTime) / 60000);
        uptimeEl.textContent = mins + 'm';
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : '255,255,255';
}

function taskmgrEndTask(winId) {
    const list = document.getElementById(winId + '-taskmgr-list');
    if (!list) return;
    const selected = list.querySelector('.taskmgr-selected');
    if (!selected) { addNotification('⚠️ Task Manager', 'Select a process to end.'); return; }

    const appId = selected.dataset.appid;
    const miner = activeMiners.find(m => m.id === appId);
    if (miner) {
        stopMiner(miner.id);
        addNotification('⛏️ Task Manager', miner.name + ' terminated.');
        taskmgrRefresh(winId);
        return;
    }

    const win = Object.values(activeWindows).find(w => w.appId === appId && !w.closed);
    if (win) {
        performCloseWindow(win.id);
        addNotification('✕ Task Manager', 'Ended task: ' + (win.title || appId));
        taskmgrRefresh(winId);
    } else {
        addNotification('⚠️ Task Manager', 'Process not found.');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'Escape' || e.key === 'Esc')) {
        e.preventDefault();
        openApp('taskmgr');
    }
});
