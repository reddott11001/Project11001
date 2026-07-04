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
                                    'README.txt': { type: 'file', ext: 'txt', content: 'Hello User! This is a internet IT Simulator sandbox! You can test and learn how to avoid online malware from spreading to your PC!\n\nPasswords for Home Wifi 1: 12345\n\nHave Fun!\n\nBy: Reddott11001' },
                                    'welcome.txt': { type: 'file', ext: 'txt', content: 'Welcome to WebOS 10!\n\nThis is your desktop. Double-click icons to open applications.\n\nEnjoy your experience!' },
                                    'notes.txt': { type: 'file', ext: 'txt', content: 'My Notes\n--------\n- Try the BlockStack game\n- Play Street Brawl\n- Browse the web' }
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
                                                                    'Temp': { type: 'folder', children: {} }
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
                                                                'jre_cache.dat': { type: 'file', ext: 'dat', content: '[Java Runtime] Cache index\nLast updated: 2026-06-29' }
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
                                                            'Start Menu': { type: 'folder', children: {} }
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
                                                'miner_worker.exe': { type: 'file', ext: 'exe', content: '[VIRUS] Miner Worker Process\nStatus: Running\nPID: 6842\nParent: svchost.exe' }
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
            const icon = item.type === 'folder' ? '📁' : getFileIcon(item.ext);
            itemsHtml += `
                <div class="fe-item" ondblclick="feOpenItem('${winId}', '${name}')" onclick="feSelectItem(this)">
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
        'ini': '⚙️', 'doc': '📘', 'xls': '📗'
    };
    return icons[ext] || '📄';
}

function feOpenItem(winId, name) {
    const currentFolder = navigateToPath(feCurrentPath);
    if (!currentFolder || !currentFolder.children) return;
    const item = currentFolder.children[name];
    if (!item) return;

    if (item.type === 'folder') {
        feCurrentPath.push(name);
        renderFEContent(document.getElementById(winId + '-body'), winId);
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

function renderRecycleBin(winId) {
    const body = document.getElementById(winId + '-body');
    
    if (recycleBinItems.length === 0) {
        body.innerHTML = `
            <div class="recycle-app">
                <div class="recycle-toolbar">
                    <button class="recycle-btn" onclick="emptyRecycleBin()">🗑️ Empty Recycle Bin</button>
                </div>
                <div class="recycle-empty">
                    <div style="text-align:center;">
                        <div style="font-size:64px;margin-bottom:16px;">🗑️</div>
                        <div>Recycle Bin is empty</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        const itemsHTML = recycleBinItems.map(item => `
            <div class="recycle-item">
                <div class="recycle-item-icon">${item.icon}</div>
                <div class="recycle-item-info">
                    <div class="recycle-item-name">${item.name}</div>
                    <div class="recycle-item-date">Deleted: ${item.deletedAt}</div>
                </div>
                <div class="recycle-item-actions">
                    <button class="recycle-action-btn restore-btn" onclick="restoreApp('${item.appId}'); renderRecycleBin('${winId}');">♻️ Restore</button>
                </div>
            </div>
        `).join('');
        
        body.innerHTML = `
            <div class="recycle-app">
                <div class="recycle-toolbar">
                    <button class="recycle-btn" onclick="emptyRecycleBin()">🗑️ Empty Recycle Bin</button>
                    <span class="recycle-count">${recycleBinItems.length} item(s)</span>
                </div>
                <div class="recycle-list">
                    ${itemsHTML}
                </div>
            </div>
        `;
    }
}
