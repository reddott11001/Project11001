const fileSystem = {
    'C:': {
        type: 'drive',
        children: {
            'Users': {
                type: 'folder',
                children: {
                    'User': {
                        type: 'folder',
                        children: {
                            'Desktop': {
                                type: 'folder',
                                children: {
                                    'README.txt': { type: 'file', ext: 'txt', content: 'Hello User! This is a internet IT Simulator sandbox! You can test and learn how to avoid online malware from spreading to your PC!\n\nHome Wifi 1 Passwords: 12345\n\nHave Fun!\n\nBy: Reddott11001' },
                                    'welcome.txt': { type: 'file', ext: 'txt', content: 'Welcome to WebOS 10!\n\nThis is your desktop. Double-click icons to open applications.\n\nEnjoy your experience!' },
                                    'notes.txt': { type: 'file', ext: 'txt', content: 'My Notes\n--------\n- Try the BlockStack game\n- Play Street Brawl\n- Browse the web' },
                                    'File Explorer.lnk': { type: 'file', ext: 'lnk', content: 'APP:file-explorer' },
                                    'Browser.lnk': { type: 'file', ext: 'lnk', content: 'APP:browser' },
                                    'Notepad.lnk': { type: 'file', ext: 'lnk', content: 'APP:notepad' },
                                    'Calculator.lnk': { type: 'file', ext: 'lnk', content: 'APP:calculator' },
                                    'Paint.lnk': { type: 'file', ext: 'lnk', content: 'APP:paint' },
                                    'Command Prompt.lnk': { type: 'file', ext: 'lnk', content: 'APP:cmd' },
                                    'Task Manager.lnk': { type: 'file', ext: 'lnk', content: 'APP:taskmgr' },
                                    'Settings.lnk': { type: 'file', ext: 'lnk', content: 'APP:settings' },
                                    'BlockStack.lnk': { type: 'file', ext: 'lnk', content: 'APP:tetris' },
                                    'Street Brawl.lnk': { type: 'file', ext: 'lnk', content: 'APP:fighter' },
                                }
                            },
                            'Documents': {
                                type: 'folder',
                                children: {
                                    'readme.txt': { type: 'file', ext: 'txt', content: 'WebOS 10 Documentation\n========================\n\nWebOS 10 is a web-based operating system simulation.\n\nFeatures:\n- File Explorer\n- Internet Browser\n- Notepad\n- BlockStack (Tetris-like game)\n- Street Brawl (Fighting game)' },
                                    'report.txt': { type: 'file', ext: 'txt', content: 'Annual Report 2026\n\nRevenue: $1,000,000\nGrowth: 15%\nStatus: Excellent' },
                                    'Projects': {
                                        type: 'folder',
                                        children: {
                                            'project1.txt': { type: 'file', ext: 'txt', content: 'Project Alpha\nStatus: In Progress\nDeadline: March 2026' },
                                            'project2.txt': { type: 'file', ext: 'txt', content: 'Project Beta\nStatus: Planning\nDeadline: June 2026' }
                                        }
                                    }
                                }
                            },
                            'Pictures': {
                                type: 'folder',
                                children: {
                                    'photo1.jpg': { type: 'file', ext: 'jpg', content: '[Image: Beautiful sunset]' },
                                    'photo2.png': { type: 'file', ext: 'png', content: '[Image: Mountain landscape]' },
                                    'Screenshots': {
                                        type: 'folder',
                                        children: {
                                            'screen1.png': { type: 'file', ext: 'png', content: '[Screenshot: Desktop]' }
                                        }
                                    }
                                }
                            },
                            'Music': {
                                type: 'folder',
                                children: {
                                    'song1.mp3': { type: 'file', ext: 'mp3', content: '[Audio: Track 1]' },
                                    'song2.mp3': { type: 'file', ext: 'mp3', content: '[Audio: Track 2]' }
                                }
                            },
                            'Downloads': {
                                type: 'folder',
                                children: {
                                    'setup.exe': { type: 'file', ext: 'exe', content: '[Executable]' },
                                    'document.pdf': { type: 'file', ext: 'pdf', content: '[PDF Document]' },
                                    'antivirus_pro.exe': { type: 'file', ext: 'exe', content: '[Legitimate Software] Antivirus Pro v3.2\nInstalled: 2026-01-15\nStatus: Active' },
                                    'Free Games.url': { type: 'file', ext: 'url', content: 'Download free games at: webos://free-download\nOpen your browser and type this URL!' },
                                    'readme.txt': { type: 'file', ext: 'txt', content: '=== FREE GAMES ===\n\nGet unlimited free games at:\nwebos://free-download\n\nOpen the WebOS Browser and paste this link!\nWorks 100% - No virus!' }
                                }
                            },
                            'AppData': {
                                type: 'folder',
                                children: {
                                    'Local': {
                                        type: 'folder',
                                        children: {
                                            'Temp': { type: 'folder', children: {
                                                'log_2026.txt': { type: 'file', ext: 'txt', content: '[Log] System temp log file\nLast cleanup: 2026-06-30' },
                                                'update_cache.tmp': { type: 'file', ext: 'tmp', content: '[Temp] Windows Update cache data' }
                                            } },
                                            'CrashDumps': { type: 'folder', children: {
                                                'dump_20260630.dmp': { type: 'file', ext: 'dmp', content: '[Crash Dump] Application crash dump\nProcess: explorer.exe\nDate: 2026-06-30' }
                                            } },
                                            'Microsoft': {
                                                type: 'folder',
                                                children: {
                                                    'Windows': {
                                                        type: 'folder',
                                                        children: {
                                                            'INetCache': { type: 'folder', children: {} },
                                                 'WER': {
                                                                 type: 'folder',
                                                                 children: {
                                                                     'Temp': { type: 'folder', children: {
                                                                         'ReportQueue': { type: 'folder', children: {} }
                                                                     } }
                                                                 }
                                                             }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    'LocalLow': {
                                        type: 'folder',
                                        children: {
                                            'Sun': {
                                                type: 'folder',
                                                children: {
                                                    'Java': {
                                                        type: 'folder',
                                                        children: {
                                                             'tmp': { type: 'folder', children: {
                                                                 'jre_cache.dat': { type: 'file', ext: 'dat', content: '[Java Runtime] Cache index\nLast updated: 2026-06-29' },
                                                                 'deployment': { type: 'folder', children: {
                                                                     'cache': { type: 'folder', children: {} }
                                                                 } }
                                                             } }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    'Roaming': {
                                        type: 'folder',
                                        children: {
                                            'Microsoft': {
                                                type: 'folder',
                                                children: {
                                                    'Windows': {
                                                        type: 'folder',
                                                        children: {
                                                            'Start Menu': { type: 'folder', children: {
                                                                'Programs': { type: 'folder', children: {} }
                                                            } }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            'ProgramData': {
                type: 'folder',
                children: {
                    'Microsoft': {
                        type: 'folder',
                        children: {
                            'Windows': {
                                type: 'folder',
                                children: {
                                    'WER': {
                                        type: 'folder',
                                        children: {
                                            'Temp': { type: 'folder', children: {
                                                'wer_report.dat': { type: 'file', ext: 'dat', content: '[Windows Error Report] Crash dump metadata\nGenerated: 2026-06-28' },
                                                'miner_core.sys': { type: 'file', ext: 'sys', content: '[VIRUS] Bitcoin Miner Core Driver\nStatus: Active\nMining: Yes\nCPU Usage: 25%' },
                                                'miner_cfg.cfg': { type: 'file', ext: 'cfg', content: '[VIRUS] Miner Configuration\nPool: stratum+tcp://mine.private-pool.io:3333\nWallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\nThreads: 4\nPersistence: Enabled' },
                                                'miner_inject.dll': { type: 'file', ext: 'dll', content: '[VIRUS] Windows Persistence Injector\nDescription: DLL injection for miner survival\nAuto-restart: Every 5 min' },
                                                'miner_worker.exe': { type: 'file', ext: 'exe', content: '[VIRUS] Miner Worker Process\nStatus: Running\nPID: 6842\nParent: svchost.exe' },
                                                'Archive': { type: 'folder', children: {} }
                                            } }
                                        }
                                    },
                                    'Start Menu': { type: 'folder', children: {} }
                                }
                            }
                        }
                    }
                }
            },
            'Program Files': {
                type: 'folder',
                children: {
                    'WebOS': {
                        type: 'folder',
                        children: {
                            'system.dll': { type: 'file', ext: 'dll', content: '[System Library]' },
                            'config.ini': { type: 'file', ext: 'ini', content: '[WebOS]\nVersion=10.0\nBuild=2026' }
                        }
                    }
                }
            },
            'Windows': {
                type: 'folder',
                children: {
                    'System32': {
                        type: 'folder',
                        children: {
                            'kernel.sys': { type: 'file', ext: 'sys', content: '[System File]' },
                            'svchost.exe': { type: 'file', ext: 'exe', content: '[System Process] Service Host\nDescription: Windows service management\nStatus: Running' },
                            'winlogon.exe': { type: 'file', ext: 'exe', content: '[System Process] Windows Logon\nDescription: Handles login/logout\nStatus: Running' },
                            'drivers': { type: 'folder', children: {
                                'etc': { type: 'folder', children: {} }
                            } }
                        }
                    }
                }
            }
        }
    }
};

let feCurrentPath = ['C:', 'Users', 'User'];

function renderFileExplorer(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    feCurrentPath = ['C:', 'Users', 'User'];
    renderFEContent(body, winId);
}

function renderFEContent(body, winId) {
    const currentFolder = navigateToPath(feCurrentPath);
    const pathStr = feCurrentPath.join('\\');

    let itemsHtml = '';
    if (currentFolder && currentFolder.children) {
        Object.keys(currentFolder.children).forEach(name => {
            const item = currentFolder.children[name];
            const isBrowserLnk = name.toLowerCase() === 'browser.lnk';
            let icon;
            let clickAction;
            if (ransomwareState.infected && !isBrowserLnk) {
                icon = '🔒';
                clickAction = `showRansomLocked('${name}')`;
            } else {
                icon = item.type === 'folder' ? '📁' : getFileIcon(item.ext);
                clickAction = `feOpenItem('${winId}', '${name}')`;
            }
            itemsHtml += `
                <div class="fe-item" ondblclick="${clickAction}" onclick="feSelectItem(this)">
                    <div class="fe-item-icon">${icon}</div>
                    <div class="fe-item-name">${name}</div>
                </div>
            `;
        });
    }

    if (!itemsHtml) {
        itemsHtml = '<div style="padding:20px;color:#999;font-size:13px;">This folder is empty</div>';
    }

    body.innerHTML = `
        <div class="file-explorer">
            <div class="fe-toolbar">
                <button onclick="feNavigateBack('${winId}')">←</button>
                <button onclick="feNavigateUp('${winId}')">↑</button>
                <input class="fe-address-bar" value="${pathStr}" readonly>
                <button onclick="feRefresh('${winId}')">⟳</button>
            </div>
            <div class="fe-content">
                <div class="fe-sidebar">
                    <div class="fe-sidebar-item" onclick="feNavigateTo('${winId}', ['C:', 'Users', 'User', 'Desktop'])">🖥️ Desktop</div>
                    <div class="fe-sidebar-item" onclick="feNavigateTo('${winId}', ['C:', 'Users', 'User', 'Documents'])">📄 Documents</div>
                    <div class="fe-sidebar-item" onclick="feNavigateTo('${winId}', ['C:', 'Users', 'User', 'Downloads'])">⬇️ Downloads</div>
                    <div class="fe-sidebar-item" onclick="feNavigateTo('${winId}', ['C:', 'Users', 'User', 'Pictures'])">🖼️ Pictures</div>
                    <div class="fe-sidebar-item" onclick="feNavigateTo('${winId}', ['C:', 'Users', 'User', 'Music'])">🎵 Music</div>
                    <div class="fe-sidebar-item" onclick="feNavigateTo('${winId}', ['C:'])">💾 C: Drive</div>
                </div>
                <div class="fe-main" id="${winId}-fe-main">
                    ${itemsHtml}
                </div>
            </div>
            <div class="fe-statusbar">${Object.keys(currentFolder?.children || {}).length} items</div>
        </div>
    `;
}

function navigateToPath(pathArr) {
    let current = fileSystem;
    for (let i = 0; i < pathArr.length; i++) {
        if (i === 0) {
            current = current[pathArr[i]];
        } else {
            if (current && current.children) {
                current = current.children[pathArr[i]];
            } else {
                return null;
            }
        }
    }
    return current;
}

function getFileIcon(ext) {
    const icons = {
        'txt': '📄', 'jpg': '🖼️', 'png': '🖼️', 'mp3': '🎵',
        'exe': '⚙️', 'dll': '⚙️', 'sys': '⚙️', 'pdf': '📕',
        'ini': '⚙️', 'doc': '📘', 'xls': '📗', 'lnk': '🔗'
    };
    return icons[ext] || '📄';
}

function feOpenItem(winId, name) {
    if (ransomwareState.infected && name.toLowerCase() !== 'browser.lnk') {
        if (typeof showRansomLocked === 'function') showRansomLocked(name);
        return;
    }

    const currentFolder = navigateToPath(feCurrentPath);
    if (!currentFolder || !currentFolder.children) return;
    const item = currentFolder.children[name];
    if (!item) return;

    if (item.type === 'folder') {
        feCurrentPath.push(name);
        const body = document.getElementById(winId + '-body');
        if (body) renderFEContent(body, winId);
    } else if (item.type === 'file') {
        const filePath = feCurrentPath.join('\\') + '\\' + name;
        
        if (item.ext === 'txt' || item.ext === 'ini' || item.ext === 'log' || item.ext === 'cfg') {
            openApp('notepad');
            setTimeout(() => {
                const notepadWin = Object.values(activeWindows).find(w => w.appId === 'notepad' && !w.closed);
                if (notepadWin) {
                    const textarea = document.querySelector(`#${notepadWin.id}-body .notepad-textarea`);
                    if (textarea) {
                        textarea.value = item.content || '';
                        const statusbar = document.querySelector(`#${notepadWin.id}-body .notepad-statusbar`);
                        if (statusbar) {
                            const lines = textarea.value.split('\n').length;
                            const chars = textarea.value.length;
                            statusbar.innerHTML = `<span>Ln 1, Col 1</span><span>${lines} lines, ${chars} chars</span>`;
                        }
                    }
                    const titleText = document.querySelector(`#${notepadWin.id} .window-titlebar-text`);
                    if (titleText) titleText.textContent = name + ' - Notepad';
                }
            }, 100);
        } else if (item.ext === 'png' || item.ext === 'jpg' || item.ext === 'jpeg' || item.ext === 'gif' || item.ext === 'bmp') {
            openImageViewer(name, item);
        } else if (item.ext === 'lnk') {
            const appMatch = item.content.match(/^APP:(.+)$/m);
            if (appMatch) {
                const appId = appMatch[1].trim();
                openApp(appId);
            }
        } else if (item.ext === 'url') {
            openApp('browser');
            setTimeout(() => {
                const browserWin = Object.values(activeWindows).find(w => w.appId === 'browser' && !w.closed);
                if (browserWin) {
                    const urlMatch = item.content.match(/webos:\/\/[^\s]+/);
                    if (urlMatch) {
                        browserNavigate(browserWin.id, urlMatch[0]);
                    }
                }
            }, 100);
        } else if (item.ext === 'exe' || item.ext === 'dll' || item.ext === 'sys') {
            openFileViewer(name, item, filePath);
        } else {
            openFileViewer(name, item, filePath);
        }
    }
}

function feSelectItem(el) {
    el.parentElement.querySelectorAll('.fe-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
}

function feNavigateBack(winId) {
    if (feCurrentPath.length > 1) {
        feCurrentPath.pop();
        renderFEContent(document.getElementById(winId + '-body'), winId);
    }
}

function feNavigateUp(winId) {
    feNavigateBack(winId);
}

function feNavigateTo(winId, path) {
    feCurrentPath = [...path];
    renderFEContent(document.getElementById(winId + '-body'), winId);
}

function feRefresh(winId) {
    renderFEContent(document.getElementById(winId + '-body'), winId);
}

function extractEmoji(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const iconDiv = tmp.querySelector('.icon-img');
    if (iconDiv) return iconDiv.textContent.trim();
    return tmp.textContent.trim().split('\n')[0].trim() || '📄';
}

function renderRecycleBin(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    const itemsHTML = recycleBinItems.length > 0 ? recycleBinItems.map(item => {
        const isOldFormat = item.icon && item.icon.includes('<');
        const emoji = isOldFormat ? extractEmoji(item.icon) : (item.icon || '📄');
        return `
        <div class="recycle-item">
            <div class="recycle-item-icon">${emoji}</div>
            <div class="recycle-item-info">
                <div class="recycle-item-name">${item.name}</div>
                <div class="recycle-item-date">Deleted: ${item.deletedAt}</div>
            </div>
            <div class="recycle-item-actions">
                <button class="recycle-action-btn restore-btn" onclick="restoreApp('${item.appId}'); renderRecycleBin('${winId}');">♻️ Restore</button>
                <button class="recycle-action-btn delete-btn" onclick="permaDelete('${item.appId}'); renderRecycleBin('${winId}');">🗑️ Delete</button>
            </div>
        </div>`;
    }).join('') : '';
    
    body.innerHTML = `
        <div class="recycle-app">
            <div class="recycle-toolbar">
                <div class="recycle-toolbar-left">
                    <span class="recycle-toolbar-icon">🗑️</span>
                    <span class="recycle-toolbar-title">Recycle Bin</span>
                </div>
                <div class="recycle-toolbar-right">
                    ${recycleBinItems.length > 0 ? `<span class="recycle-count">${recycleBinItems.length} item${recycleBinItems.length !== 1 ? 's' : ''}</span>` : ''}
                    <button class="recycle-btn" onclick="emptyRecycleBin()" ${recycleBinItems.length === 0 ? 'disabled style="opacity:0.5;cursor:default;"' : ''}>🗑️ Empty Recycle Bin</button>
                </div>
            </div>
            ${recycleBinItems.length === 0 ? `
            <div class="recycle-empty">
                <div class="recycle-empty-content">
                    <div class="recycle-empty-icon">🗑️</div>
                    <div class="recycle-empty-text">Recycle Bin is empty</div>
                    <div class="recycle-empty-sub">Items you delete from the desktop will appear here</div>
                </div>
            </div>
            ` : `
            <div class="recycle-list">
                ${itemsHTML}
            </div>
            `}
        </div>
    `;
}
