let windowZIndex = 100;
let activeWindows = {};
let windowIdCounter = 0;
let dragState = null;
let selectionState = { isSelecting: false, startX: 0, startY: 0, rect: null };
let recycleBinItems = [];
let iconDragState = { isDragging: false, icon: null, startX: 0, startY: 0, origLeft: 0, origTop: 0, hasMoved: false };
let iconPositions = {};

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
let wifiConnected = true;

function saveWebOS() {
    try {
        const data = {
            fileSystem: fileSystem,
            webosInfected: webosInfected,
            webosVirusFiles: webosVirusFiles,
            currentWallpaper: currentWallpaper,
            downloadedGames: downloadedGames,
            recycleBinItems: recycleBinItems,
            iconPositions: iconPositions
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
            recycleBinItems = data.recycleBinItems || [];
            iconPositions = data.iconPositions || {};
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
            if (iconDragState.hasMoved) {
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
            const appId = icon.getAttribute('data-app');
            const canDelete = !isBuiltInApp(appId);
            showIconContextMenu(e.clientX, e.clientY, appId, canDelete);
        });
        icon.addEventListener('mousedown', handleIconMouseDown);
        di.appendChild(icon);
        
        // Position downloaded games after the built-in icons in single column
        const builtInCount = 6; // recycle, file-explorer, notepad, browser, fighter, tetris
        const gameIndex = downloadedGames.indexOf(gameId);
        const col = 0;
        const row = builtInCount + (gameIndex >= 0 ? gameIndex : 0);
        const pos = getCellPosition(col, row);
        icon.style.left = pos.left + 'px';
        icon.style.top = pos.top + 'px';
        iconPositions[gameId] = pos;
    });
}

const GRID_CELL_WIDTH = 90;
const GRID_CELL_HEIGHT = 100;
const GRID_PADDING = 10;
const TASKBAR_HEIGHT = 48;

function getGridCell(left, top) {
    const col = Math.floor((left - GRID_PADDING) / GRID_CELL_WIDTH);
    const row = Math.floor((top - GRID_PADDING) / GRID_CELL_HEIGHT);
    return { col: Math.max(0, col), row: Math.max(0, row) };
}

function getCellPosition(col, row) {
    return {
        left: GRID_PADDING + col * GRID_CELL_WIDTH,
        top: GRID_PADDING + row * GRID_CELL_HEIGHT
    };
}

function getMaxRows() {
    const container = document.getElementById('desktop-icons');
    if (!container) return 10;
    const containerHeight = container.clientHeight - TASKBAR_HEIGHT;
    return Math.max(1, Math.floor((containerHeight - GRID_PADDING) / GRID_CELL_HEIGHT));
}

function getMaxCols() {
    const container = document.getElementById('desktop-icons');
    if (!container) return 10;
    const containerWidth = container.clientWidth;
    return Math.max(1, Math.floor((containerWidth - GRID_PADDING) / GRID_CELL_WIDTH));
}

function isWithinBounds(left, top) {
    const container = document.getElementById('desktop-icons');
    if (!container) return true;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight - TASKBAR_HEIGHT;
    
    return left >= 0 && 
           top >= 0 && 
           left + 80 <= containerWidth && 
           top + 90 <= containerHeight;
}

function clampToBounds(left, top) {
    const container = document.getElementById('desktop-icons');
    if (!container) return { left, top };
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight - TASKBAR_HEIGHT;
    
    const clampedLeft = Math.max(0, Math.min(left, containerWidth - 80));
    const clampedTop = Math.max(0, Math.min(top, containerHeight - 90));
    
    return { left: clampedLeft, top: clampedTop };
}

function getOccupiedCells() {
    const occupied = new Set();
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        const left = parseInt(icon.style.left) || 0;
        const top = parseInt(icon.style.top) || 0;
        const cell = getGridCell(left, top);
        occupied.add(`${cell.col},${cell.row}`);
    });
    return occupied;
}

function findNearestEmptyCell(targetLeft, targetTop, excludeAppId) {
    const clamped = clampToBounds(targetLeft, targetTop);
    const targetCell = getGridCell(clamped.left, clamped.top);
    const maxRows = getMaxRows();
    const maxCols = getMaxCols();
    
    const occupied = getOccupiedCells();
    
    if (excludeAppId && iconDragState.isDragging && iconDragState.appId === excludeAppId) {
        // During drag: exclude the dragged icon's ORIGINAL position (before drag)
        const origLeft = iconDragState.origLeft;
        const origTop = iconDragState.origTop;
        const excludeCell = getGridCell(origLeft, origTop);
        occupied.delete(`${excludeCell.col},${excludeCell.row}`);
    }
    // During init or other times: don't exclude, let the algorithm find truly empty cells
    
    const targetKey = `${targetCell.col},${targetCell.row}`;
    if (targetCell.col < maxCols && targetCell.row < maxRows && !occupied.has(targetKey)) {
        return targetCell;
    }
    
    for (let radius = 1; radius < Math.max(maxCols, maxRows); radius++) {
        const candidates = [];
        
        for (let dRow = -radius; dRow <= radius; dRow++) {
            for (let dCol = -radius; dCol <= radius; dCol++) {
                if (Math.abs(dRow) !== radius && Math.abs(dCol) !== radius) continue;
                
                const checkCol = targetCell.col + dCol;
                const checkRow = targetCell.row + dRow;
                
                if (checkCol < 0 || checkRow < 0 || checkCol >= maxCols || checkRow >= maxRows) continue;
                
                const key = `${checkCol},${checkRow}`;
                if (!occupied.has(key)) {
                    const distance = Math.abs(dCol) + Math.abs(dRow);
                    candidates.push({ col: checkCol, row: checkRow, distance });
                }
            }
        }
        
        if (candidates.length > 0) {
            candidates.sort((a, b) => a.distance - b.distance);
            return { col: candidates[0].col, row: candidates[0].row };
        }
    }
    
    return { col: Math.min(targetCell.col, maxCols - 1), row: Math.min(targetCell.row, maxRows - 1) };
}

function snapIconToGrid(icon, excludeAppId) {
    const currentLeft = parseInt(icon.style.left) || 0;
    const currentTop = parseInt(icon.style.top) || 0;
    
    const cell = findNearestEmptyCell(currentLeft, currentTop, excludeAppId);
    const pos = getCellPosition(cell.col, cell.row);
    
    const clampedPos = clampToBounds(pos.left, pos.top);
    
    icon.style.transition = 'left 0.2s ease, top 0.2s ease';
    icon.style.left = clampedPos.left + 'px';
    icon.style.top = clampedPos.top + 'px';
    
    setTimeout(() => {
        icon.style.transition = '';
    }, 200);
    
    return clampedPos;
}

function initIconPositions() {
    const icons = document.querySelectorAll('.desktop-icon');
    const container = document.getElementById('desktop-icons');
    if (!container) return;
    
    // Define the desired layout order (single column)
    const builtInApps = ['recycle', 'file-explorer', 'notepad', 'browser', 'fighter', 'tetris'];
    
    icons.forEach((icon, index) => {
        const appId = icon.getAttribute('data-app');
        
        // Temporarily move icon off-screen so it's not counted in occupied cells
        icon.style.left = '-1000px';
        icon.style.top = '-1000px';
        
        let finalPos;
        // Always use the correct layout order, ignore saved positions
        const builtInIndex = builtInApps.indexOf(appId);
        if (builtInIndex !== -1) {
            // Position built-in apps in single column (col 0)
            const col = 0;
            const row = builtInIndex;
            const pos = getCellPosition(col, row);
            finalPos = { left: pos.left, top: pos.top };
        } else {
            // For downloaded games, position them after built-in apps in same column
            const builtInCount = builtInApps.length;
            const gameIndex = downloadedGames.indexOf(appId);
            const totalRow = builtInCount + (gameIndex >= 0 ? gameIndex : 0);
            const col = 0;
            const row = totalRow;
            const pos = getCellPosition(col, row);
            finalPos = { left: pos.left, top: pos.top };
        }
        
        icon.style.left = finalPos.left + 'px';
        icon.style.top = finalPos.top + 'px';
        iconPositions[appId] = finalPos;
    });
    
    saveWebOS();
}

function setupIconDrag() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('mousedown', handleIconMouseDown);
    });
}

function handleIconMouseDown(e) {
    if (e.button !== 0) return;
    
    const icon = e.currentTarget;
    const appId = icon.getAttribute('data-app');
    
    iconDragState = {
        isDragging: true,
        icon: icon,
        appId: appId,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: parseInt(icon.style.left) || 0,
        origTop: parseInt(icon.style.top) || 0,
        hasMoved: false
    };
    
    e.preventDefault();
    e.stopPropagation();
}

function handleIconMouseMove(e) {
    if (!iconDragState.isDragging || !iconDragState.icon) return;
    
    const dx = e.clientX - iconDragState.startX;
    const dy = e.clientY - iconDragState.startY;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        iconDragState.hasMoved = true;
        iconDragState.icon.classList.add('dragging');
        
        const newLeft = iconDragState.origLeft + dx;
        const newTop = iconDragState.origTop + dy;
        
        iconDragState.icon.style.left = newLeft + 'px';
        iconDragState.icon.style.top = newTop + 'px';
        
        let snapCell = findNearestEmptyCell(newLeft, newTop, iconDragState.appId);
        let snapPos = getCellPosition(snapCell.col, snapCell.row);
        
        let ghost = document.getElementById('grid-snap-ghost');
        if (!ghost) {
            ghost = document.createElement('div');
            ghost.id = 'grid-snap-ghost';
            ghost.style.cssText = `
                position: absolute;
                width: 80px;
                height: 90px;
                border: 2px dashed rgba(0, 120, 215, 0.6);
                background: rgba(0, 120, 215, 0.1);
                border-radius: 4px;
                pointer-events: none;
                z-index: 5;
                transition: left 0.1s ease, top 0.1s ease;
            `;
            const container = document.getElementById('desktop-icons');
            if (container) container.appendChild(ghost);
        }
        
        const isOverTaskbar = newTop + 90 > (document.getElementById('desktop-icons').clientHeight - TASKBAR_HEIGHT);
        
        if (isOverTaskbar) {
            ghost.style.display = 'none';
        } else {
            ghost.style.left = snapPos.left + 'px';
            ghost.style.top = snapPos.top + 'px';
            ghost.style.display = 'block';
        }
        
        const recycleIcon = document.querySelector('.desktop-icon[data-app="recycle"]');
        if (recycleIcon && !isBuiltInApp(iconDragState.appId)) {
            const recycleRect = recycleIcon.getBoundingClientRect();
            const iconRect = iconDragState.icon.getBoundingClientRect();
            
            const isOver = !(iconRect.right < recycleRect.left || 
                           iconRect.left > recycleRect.right || 
                           iconRect.bottom < recycleRect.top || 
                           iconRect.top > recycleRect.bottom);
            
            if (isOver) {
                recycleIcon.classList.add('drag-over-recycle');
                ghost.style.display = 'none';
            } else {
                recycleIcon.classList.remove('drag-over-recycle');
            }
        }
    }
}

function handleIconMouseUp(e) {
    if (!iconDragState.isDragging) return;
    
    const icon = iconDragState.icon;
    const appId = iconDragState.appId;
    
    const ghost = document.getElementById('grid-snap-ghost');
    if (ghost) {
        ghost.style.display = 'none';
    }
    
    if (icon) {
        icon.classList.remove('dragging');
        
        if (iconDragState.hasMoved) {
            let droppedOnRecycle = false;
            let droppedOutOfBounds = false;
            
            const container = document.getElementById('desktop-icons');
            if (container) {
                const iconRect = icon.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const maxTop = containerRect.bottom - TASKBAR_HEIGHT;
                
                if (iconRect.bottom > maxTop) {
                    droppedOutOfBounds = true;
                }
            }
            
            if (!isBuiltInApp(appId)) {
                const recycleIcon = document.querySelector('.desktop-icon[data-app="recycle"]');
                if (recycleIcon) {
                    const recycleRect = recycleIcon.getBoundingClientRect();
                    const iconRect = icon.getBoundingClientRect();
                    
                    const isOver = !(iconRect.right < recycleRect.left || 
                                   iconRect.left > recycleRect.right || 
                                   iconRect.bottom < recycleRect.top || 
                                   iconRect.top > recycleRect.bottom);
                    
                    if (isOver) {
                        recycleIcon.classList.remove('drag-over-recycle');
                        droppedOnRecycle = true;
                        deleteApp(appId);
                    }
                }
            }
            
            if (!droppedOnRecycle) {
                if (droppedOutOfBounds) {
                    icon.style.transition = 'left 0.2s ease, top 0.2s ease';
                    icon.style.left = iconDragState.origLeft + 'px';
                    icon.style.top = iconDragState.origTop + 'px';
                    setTimeout(() => {
                        icon.style.transition = '';
                    }, 200);
                } else {
                    const snappedPos = snapIconToGrid(icon, appId);
                    iconPositions[appId] = snappedPos;
                    saveWebOS();
                }
            }
        }
    }
    
    iconDragState = { isDragging: false, icon: null, startX: 0, startY: 0, origLeft: 0, origTop: 0, hasMoved: false };
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
        initIconPositions();
        setupIconDrag();
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

        const scm = document.getElementById('start-context-menu');
        if (!scm.contains(e.target) && !sb.contains(e.target)) scm.style.display = 'none';

        const icm = document.getElementById('icon-context-menu');
        if (icm && !icm.contains(e.target)) icm.style.display = 'none';
    }, true);

    document.getElementById('desktop').addEventListener('contextmenu', (e) => {
        if (e.target.closest('.app-window') || e.target.closest('#taskbar') || e.target.closest('.desktop-icon')) return;
        e.preventDefault();
        const ctx = document.getElementById('context-menu');
        ctx.style.display = 'block';
        ctx.style.left = e.clientX + 'px';
        ctx.style.top = e.clientY + 'px';
    });

    document.getElementById('desktop').addEventListener('mousedown', (e) => {
        if (e.target.closest('.app-window') || e.target.closest('#taskbar') ||
            e.target.closest('#start-menu') || e.target.closest('#context-menu') ||
            e.target.closest('#notification-center') || e.target.closest('#power-menu') ||
            e.target.closest('#selection-rect')) return;

        if (e.target.closest('.desktop-icon')) return;

        if (e.button === 0) {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            
            selectionState.isSelecting = true;
            selectionState.startX = e.clientX;
            selectionState.startY = e.clientY;
            
            let rect = document.getElementById('selection-rect');
            if (!rect) {
                rect = document.createElement('div');
                rect.id = 'selection-rect';
                document.body.appendChild(rect);
            }
            rect.style.display = 'block';
            rect.style.left = e.clientX + 'px';
            rect.style.top = e.clientY + 'px';
            rect.style.width = '0px';
            rect.style.height = '0px';
        }
    });

    document.addEventListener('mousemove', (e) => {
        handleIconMouseMove(e);
        
        if (!selectionState.isSelecting) return;
        
        const rect = document.getElementById('selection-rect');
        if (!rect) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const left = Math.min(selectionState.startX, currentX);
        const top = Math.min(selectionState.startY, currentY);
        const width = Math.abs(currentX - selectionState.startX);
        const height = Math.abs(currentY - selectionState.startY);
        
        rect.style.left = left + 'px';
        rect.style.top = top + 'px';
        rect.style.width = width + 'px';
        rect.style.height = height + 'px';
        
        const selRect = { left, top, right: left + width, bottom: top + height };
        
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            const iconRect = icon.getBoundingClientRect();
            const intersects = !(iconRect.right < selRect.left || 
                               iconRect.left > selRect.right || 
                               iconRect.bottom < selRect.top || 
                               iconRect.top > selRect.bottom);
            
            if (intersects) {
                icon.classList.add('selected');
            } else {
                icon.classList.remove('selected');
            }
        });
    });

    document.addEventListener('mouseup', (e) => {
        handleIconMouseUp(e);
        
        if (selectionState.isSelecting) {
            selectionState.isSelecting = false;
            const rect = document.getElementById('selection-rect');
            if (rect) {
                rect.style.display = 'none';
            }
        }
    });

    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            if (iconDragState.hasMoved) {
                iconDragState.hasMoved = false;
                return;
            }
            e.stopPropagation();
            if (!e.ctrlKey) {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            }
            icon.classList.toggle('selected');
        });
        
        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
            
            const appId = icon.getAttribute('data-app');
            const canDelete = !isBuiltInApp(appId);
            
            showIconContextMenu(e.clientX, e.clientY, appId, canDelete);
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

function isBuiltInApp(appId) {
    const builtInApps = ['file-explorer', 'browser', 'notepad', 'cmd', 'recycle', 
                         'tetris', 'fighter', 'solitaire', 'calculator', 'paint'];
    return builtInApps.includes(appId);
}

function showIconContextMenu(x, y, appId, canDelete) {
    let menu = document.getElementById('icon-context-menu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'icon-context-menu';
        document.body.appendChild(menu);
    }
    
    const appName = getAppName(appId);
    
    menu.innerHTML = `
        <div class="ctx-item" onclick="openApp('${appId}'); hideIconContextMenu();">📂 Open</div>
        ${canDelete ? `<div class="ctx-sep"></div><div class="ctx-item" onclick="deleteApp('${appId}'); hideIconContextMenu();">🗑️ Delete</div>` : ''}
    `;
    
    menu.style.display = 'block';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    setTimeout(() => {
        document.addEventListener('click', hideIconContextMenu, { once: true });
    }, 0);
}

function hideIconContextMenu() {
    const menu = document.getElementById('icon-context-menu');
    if (menu) menu.style.display = 'none';
}

function getAppName(appId) {
    const names = {
        'tictactoe': 'Tic Tac Toe Pro',
        'platformer': 'Super Pixel Mario',
        'doom2': 'Doom 2: Hell Walker'
    };
    return names[appId] || appId;
}

function deleteApp(appId) {
    if (isBuiltInApp(appId)) {
        addNotification('⚠️ Cannot Delete', 'This is a built-in application and cannot be deleted.');
        return;
    }
    
    const icon = document.querySelector(`.desktop-icon[data-app="${appId}"]`);
    if (!icon) return;
    
    const appName = getAppName(appId);
    const iconHTML = icon.innerHTML;
    
    recycleBinItems.push({
        appId: appId,
        name: appName,
        icon: iconHTML,
        deletedAt: new Date().toLocaleString()
    });
    
    icon.remove();
    
    if (downloadedGames.includes(appId)) {
        downloadedGames = downloadedGames.filter(g => g !== appId);
    }
    
    saveWebOS();
    addNotification('🗑️ Deleted', `${appName} has been moved to Recycle Bin.`);
}

function restoreApp(appId) {
    const item = recycleBinItems.find(i => i.appId === appId);
    if (!item) return;
    
    const di = document.getElementById('desktop-icons');
    if (!di) return;
    
    const existing = document.querySelector(`.desktop-icon[data-app="${appId}"]`);
    if (existing) {
        recycleBinItems = recycleBinItems.filter(i => i.appId !== appId);
        saveWebOS();
        return;
    }
    
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.setAttribute('data-app', appId);
    icon.setAttribute('ondblclick', `openApp('${appId}')`);
    icon.innerHTML = item.icon;
    
    icon.addEventListener('click', (e) => {
        if (iconDragState.hasMoved) {
            iconDragState.hasMoved = false;
            return;
        }
        e.stopPropagation();
        if (!e.ctrlKey) {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        }
        icon.classList.toggle('selected');
    });
    
    icon.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
        const canDelete = !isBuiltInApp(appId);
        showIconContextMenu(e.clientX, e.clientY, appId, canDelete);
    });
    
    icon.addEventListener('mousedown', handleIconMouseDown);
    
    di.appendChild(icon);
    
    // Temporarily move icon off-screen so it's not counted in occupied cells
    icon.style.left = '-1000px';
    icon.style.top = '-1000px';
    
    // Always position in single column after built-in icons
    const builtInCount = 6;
    const gameIndex = downloadedGames.indexOf(appId);
    const col = 0;
    const row = builtInCount + (gameIndex >= 0 ? gameIndex : 0);
    const pos = getCellPosition(col, row);
    const clampedPos = clampToBounds(pos.left, pos.top);
    
    icon.style.left = clampedPos.left + 'px';
    icon.style.top = clampedPos.top + 'px';
    iconPositions[appId] = clampedPos;
    
    if (!downloadedGames.includes(appId)) {
        downloadedGames.push(appId);
    }
    
    recycleBinItems = recycleBinItems.filter(i => i.appId !== appId);
    saveWebOS();
    addNotification('♻️ Restored', `${item.name} has been restored to desktop.`);
}

function emptyRecycleBin() {
    if (recycleBinItems.length === 0) {
        addNotification('🗑️ Recycle Bin', 'Recycle Bin is already empty.');
        return;
    }
    
    const count = recycleBinItems.length;
    recycleBinItems = [];
    saveWebOS();
    addNotification('🗑️ Recycle Bin Emptied', `${count} item(s) permanently deleted.`);
    
    const rbWin = Object.values(activeWindows).find(w => w.appId === 'recycle' && !w.closed);
    if (rbWin) {
        renderRecycleBin(rbWin.id);
    }
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
        { name: 'Calculator', icon: '🔢', id: 'calculator' },
        { name: 'Paint', icon: '🎨', id: 'paint' },
        { name: 'Command Prompt', icon: '⌨️', id: 'cmd' },
        { name: 'BlockStack (Tetris)', icon: '🧱', id: 'tetris' },
        { name: 'Street Brawl (Fighter)', icon: '🥊', id: 'fighter' },
        { name: 'Solitaire', icon: '🃏', id: 'solitaire' },

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
        'calculator': { title: 'Calculator', icon: '🔢', width: 320, height: 480, render: renderCalculator },
        'paint': { title: 'Paint', icon: '🎨', width: 900, height: 620, render: renderPaint },
        'solitaire': { title: 'Solitaire', icon: '🃏', width: 850, height: 620, render: renderSolitaire },
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
    const winData = activeWindows[winId];
    if (!win || !winData) return;

    const appId = winData.appId;
    const needsSave = ['notepad', 'paint', 'tetris', 'fighter', 'solitaire'].includes(appId);

    if (needsSave) {
        showSaveConfirmModal(winId, appId);
        return;
    }

    performCloseWindow(winId);
}

function performCloseWindow(winId) {
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
    
    if (typeof stopFreakyPopups === 'function') {
        stopFreakyPopups();
    }
}

let saveConfirmState = { winId: null, appId: null };

function showSaveConfirmModal(winId, appId) {
    saveConfirmState = { winId, appId };
    
    const messages = {
        'notepad': 'Save your text to the file system before closing?',
        'paint': 'Save your painting to the file system before closing?',
        'tetris': 'Save your BlockStack high score before closing?',
        'fighter': 'Save your Street Brawl progress before closing?',
        'solitaire': 'Save your Solitaire game progress before closing?'
    };
    
    const msg = messages[appId] || 'Save your changes before closing?';
    document.getElementById('save-confirm-message').textContent = msg;
    document.getElementById('save-confirm-modal').style.display = 'flex';
}

function saveConfirmAction(action) {
    const { winId, appId } = saveConfirmState;
    document.getElementById('save-confirm-modal').style.display = 'none';
    
    if (action === 'cancel') {
        saveConfirmState = { winId: null, appId: null };
        return;
    }
    
    if (action === 'save') {
        performSave(winId, appId);
    }
    
    performCloseWindow(winId);
    saveConfirmState = { winId: null, appId: null };
}

function performSave(winId, appId) {
    switch (appId) {
        case 'notepad':
            saveNotepadToFile(winId);
            break;
        case 'paint':
            savePaintToFile(winId);
            break;
        case 'tetris':
            saveTetrisProgress(winId);
            break;
        case 'fighter':
            saveFighterProgress(winId);
            break;
        case 'solitaire':
            saveSolitaireProgress(winId);
            break;
    }
}

function saveNotepadToFile(winId) {
    const textarea = document.getElementById(winId + '-textarea');
    if (!textarea) return;
    
    const content = textarea.value;
    if (!content.trim()) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `note_${timestamp}.txt`;
    
    const folder = navigateToPath(['C:', 'Users', 'User', 'Documents']);
    if (folder && folder.children) {
        folder.children[filename] = {
            type: 'file',
            ext: 'txt',
            content: content
        };
        saveWebOS();
        addNotification('💾 Notepad', `Saved as "${filename}" to Documents folder`);
    }
}

function savePaintToFile(winId) {
    const canvas = document.getElementById(winId + '-paint-canvas');
    if (!canvas) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `painting_${timestamp}.png`;
    
    const folder = navigateToPath(['C:', 'Users', 'User', 'Pictures']);
    if (folder && folder.children) {
        folder.children[filename] = {
            type: 'file',
            ext: 'png',
            content: `[Painting saved] ${filename}\nDimensions: ${canvas.width}x${canvas.height}\nCreated: ${new Date().toLocaleString()}`
        };
        saveWebOS();
        addNotification('🎨 Paint', `Saved as "${filename}" to Pictures folder`);
    }
}

function saveTetrisProgress(winId) {
    const state = tetrisState[winId];
    if (!state) return;
    
    const saveData = {
        highScore: state.score,
        lines: state.lines,
        level: state.level,
        savedAt: new Date().toLocaleString()
    };
    
    let gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    gameSaves.tetris = saveData;
    localStorage.setItem('game-saves', JSON.stringify(gameSaves));
    
    addNotification('🧱 BlockStack', `High score saved: ${state.score} points`);
}

function saveFighterProgress(winId) {
    const state = fighterState[winId];
    if (!state) return;
    
    const saveData = {
        playerHealth: state.player.health,
        cpuHealth: state.cpu.health,
        timer: state.timer,
        savedAt: new Date().toLocaleString()
    };
    
    let gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    gameSaves.fighter = saveData;
    localStorage.setItem('game-saves', JSON.stringify(gameSaves));
    
    addNotification('🥊 Street Brawl', `Progress saved (HP: ${Math.round(state.player.health)}%)`);
}

function saveSolitaireProgress(winId) {
    const state = solState[winId];
    if (!state) return;
    
    const saveData = {
        moves: state.moves,
        stock: state.stock,
        waste: state.waste,
        foundations: state.foundations,
        tableau: state.tableau,
        savedAt: new Date().toLocaleString()
    };
    
    let gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    gameSaves.solitaire = saveData;
    localStorage.setItem('game-saves', JSON.stringify(gameSaves));
    
    addNotification('🃏 Solitaire', `Game saved (${state.moves} moves)`);
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

function showStartContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById('start-context-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    document.getElementById('start-menu').style.display = 'none';
}

function showRunDialog() {
    document.getElementById('start-context-menu').style.display = 'none';
    document.getElementById('run-dialog').style.display = 'block';
    const input = document.getElementById('run-input');
    if (input) {
        input.value = '';
        input.focus();
    }
}

function closeRunDialog() {
    document.getElementById('run-dialog').style.display = 'none';
}

function runExecute() {
    const input = document.getElementById('run-input');
    if (!input) return;
    const value = input.value.trim().toLowerCase();
    closeRunDialog();
    
    if (!value) return;
    
    const appMap = {
        'cmd': 'cmd',
        'command': 'cmd',
        'command prompt': 'cmd',
        'explorer': 'file-explorer',
        'file explorer': 'file-explorer',
        'files': 'file-explorer',
        'notepad': 'notepad',
        'note': 'notepad',
        'browser': 'browser',
        'chrome': 'browser',
        'firefox': 'browser',
        'edge': 'browser',
        'calculator': 'calculator',
        'calc': 'calculator',
        'paint': 'paint',
        'mspaint': 'paint',
        'solitaire': 'solitaire',
        'sol': 'solitaire',
        'cards': 'solitaire',
        'tetris': 'tetris',
        'blockstack': 'tetris',
        'fighter': 'fighter',
        'brawl': 'fighter',
        'street brawl': 'fighter',
        'recycle': 'recycle',
        'recycle bin': 'recycle',
        'tictactoe': 'tictactoe',
        'platformer': 'platformer',
        'mario': 'platformer',
        'doom': 'doom2',
        'doom2': 'doom2',
    };
    
    if (appMap[value]) {
        openApp(appMap[value]);
    } else if (value.includes('.')) {
        openApp('file-explorer');
        addNotification('🏃 Run', `Opening: ${value}`);
    } else {
        addNotification('❌ Run', `Cannot find '${value}'. Check spelling.`);
    }
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

function toggleWifiPanel() {
    const panel = document.getElementById('wifi-panel');
    if (!panel) {
        createWifiPanel();
        return;
    }
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function createWifiPanel() {
    const existing = document.getElementById('wifi-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'wifi-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 48px;
        right: 10px;
        width: 320px;
        background: #2b2b2b;
        border: 1px solid #404040;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        z-index: 9999;
        font-family: 'Segoe UI', sans-serif;
        color: #fff;
        overflow: hidden;
    `;

    panel.innerHTML = `
        <div style="padding: 16px 20px; border-bottom: 1px solid #404040;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 500;">Network & Internet</span>
                <span style="font-size: 12px; color: #888;">${wifiConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: ${wifiConnected ? '#1a3a5c' : '#333'}; border-radius: 6px; cursor: pointer;" onclick="toggleWifiConnection()">
                <div style="font-size: 24px;">${wifiConnected ? '📶' : '📵'}</div>
                <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 500;">Home Wifi 1</div>
                    <div style="font-size: 11px; color: #888;">${wifiConnected ? 'Connected, secured' : 'Not connected'}</div>
                </div>
                <div style="width: 40px; height: 20px; background: ${wifiConnected ? '#0078d4' : '#555'}; border-radius: 10px; position: relative; transition: background 0.2s;">
                    <div style="width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; top: 2px; ${wifiConnected ? 'right: 2px' : 'left: 2px'}; transition: all 0.2s;"></div>
                </div>
            </div>
        </div>
        <div style="padding: 12px 20px; border-bottom: 1px solid #404040;">
            <div style="font-size: 12px; color: #888; margin-bottom: 8px;">Available networks</div>
            <div style="padding: 8px; background: #333; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">📶</span>
                <div style="flex: 1;">
                    <div style="font-size: 12px;">Home Wifi 1</div>
                    <div style="font-size: 10px; color: #888;">Secured</div>
                </div>
                <span style="font-size: 10px; color: #0078d4;">${wifiConnected ? 'Connected' : ''}</span>
            </div>
            <div style="padding: 8px; background: #2b2b2b; border-radius: 4px; display: flex; align-items: center; gap: 10px; margin-top: 4px; opacity: 0.6;">
                <span style="font-size: 18px;">📶</span>
                <div style="flex: 1;">
                    <div style="font-size: 12px;">Neighbor_WiFi_5G</div>
                    <div style="font-size: 10px; color: #888;">Secured</div>
                </div>
            </div>
            <div style="padding: 8px; background: #2b2b2b; border-radius: 4px; display: flex; align-items: center; gap: 10px; margin-top: 4px; opacity: 0.6;">
                <span style="font-size: 18px;">📶</span>
                <div style="flex: 1;">
                    <div style="font-size: 12px;">CoffeeShop_Free</div>
                    <div style="font-size: 10px; color: #888;">Open</div>
                </div>
            </div>
        </div>
        <div style="padding: 12px 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0;">
                <span style="font-size: 12px;">Airplane mode</span>
                <div style="width: 36px; height: 18px; background: #555; border-radius: 9px; position: relative;">
                    <div style="width: 14px; height: 14px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px;"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    setTimeout(() => {
        document.addEventListener('click', closeWifiPanelOnClickOutside);
    }, 10);
}

function closeWifiPanelOnClickOutside(e) {
    const panel = document.getElementById('wifi-panel');
    const wifiIcon = document.getElementById('wifi-icon');
    if (panel && !panel.contains(e.target) && !wifiIcon.contains(e.target)) {
        panel.style.display = 'none';
        document.removeEventListener('click', closeWifiPanelOnClickOutside);
    }
}

function toggleWifiConnection() {
    wifiConnected = !wifiConnected;
    
    const wifiIcon = document.getElementById('wifi-icon');
    if (wifiIcon) {
        wifiIcon.textContent = wifiConnected ? '📶' : '📵';
        wifiIcon.title = wifiConnected ? 'Network - Connected' : 'Network - Disconnected';
    }
    
    createWifiPanel();
    
    if (wifiConnected) {
        addNotification('🌐 Network', 'Connected to Home Wifi 1');
    } else {
        addNotification('🌐 Network', 'Disconnected from Home Wifi 1');
    }
    
    const browserWin = Object.values(activeWindows).find(w => w.appId === 'browser' && !w.closed);
    if (browserWin) {
        updateBrowserForWifiState();
    }
}

function updateBrowserForWifiState() {
    const browserWin = Object.values(activeWindows).find(w => w.appId === 'browser' && !w.closed);
    if (!browserWin) return;
    
    const winId = browserWin.id;
    const content = document.getElementById(winId + '-browser-content');
    if (!content) return;
    
    const tab = getActiveTab(winId);
    if (!tab) return;
    
    if (!wifiConnected) {
        content.innerHTML = getNoInternetPage(winId);
        // Start dino game after DOM is ready
        setTimeout(() => {
            if (typeof renderDinoGame === 'function') {
                renderDinoGame(winId);
            }
        }, 100);
    } else if (tab.url === 'home') {
        content.innerHTML = getBrowserHomePage(winId);
    } else if (tab.url.startsWith('webos://')) {
        content.innerHTML = getWebOSPage(tab.url);
    }
}

function getNoInternetPage(winId) {
    return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#f7f7f7;font-family:Arial,sans-serif;">
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:48px;margin-bottom:12px;">📵</div>
                <h2 style="color:#535353;margin:0 0 8px 0;font-size:20px;font-weight:normal;">No internet</h2>
                <p style="color:#777;font-size:13px;margin:0;">Play the Chrome Dino game while offline!</p>
            </div>
            <div id="${winId}-dino-container" style="width:600px;height:150px;"></div>
            <div style="margin-top:12px;color:#535353;font-size:12px;">Press SPACE or UP arrow to jump</div>
        </div>
    `;
}
