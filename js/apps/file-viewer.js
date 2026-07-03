let fileViewerState = {};

function renderFileViewer(winId, fileName, fileData, filePath) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    fileViewerState[winId] = {
        fileName: fileName,
        fileData: fileData,
        filePath: filePath
    };
    
    const ext = fileData.ext || 'unknown';
    const icon = getFileIcon(ext);
    const content = fileData.content || '[No content available]';
    
    body.innerHTML = `
        <div class="fv-app">
            <div class="fv-header">
                <div class="fv-icon">${icon}</div>
                <div class="fv-title">${fileName}</div>
            </div>
            <div class="fv-info">
                <div class="fv-info-grid">
                    <div class="fv-info-item">
                        <span class="fv-label">File Name:</span>
                        <span class="fv-value">${fileName}</span>
                    </div>
                    <div class="fv-info-item">
                        <span class="fv-label">File Type:</span>
                        <span class="fv-value">.${ext} File</span>
                    </div>
                    <div class="fv-info-item">
                        <span class="fv-label">Location:</span>
                        <span class="fv-value">${filePath}</span>
                    </div>
                    <div class="fv-info-item">
                        <span class="fv-label">Size:</span>
                        <span class="fv-value">${Math.floor(Math.random() * 1000 + 100)} KB</span>
                    </div>
                </div>
            </div>
            <div class="fv-content">
                <div class="fv-content-label">File Content:</div>
                <div class="fv-content-text">${content.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="fv-actions">
                <button class="fv-btn" onclick="fvOpenWith('${winId}')">Open With...</button>
                <button class="fv-btn" onclick="fvClose('${winId}')">Close</button>
            </div>
        </div>
    `;
}

function fvOpenWith(winId) {
    const state = fileViewerState[winId];
    if (!state) return;
    
    const ext = state.fileData.ext;
    const textTypes = ['txt', 'ini', 'log', 'cfg', 'bat', 'js', 'html', 'css'];
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    
    if (textTypes.includes(ext)) {
        openApp('notepad');
        setTimeout(() => {
            const notepadWin = Object.values(activeWindows).find(w => w.appId === 'notepad' && !w.closed);
            if (notepadWin) {
                const textarea = document.querySelector(`#${notepadWin.id}-body .notepad-textarea`);
                if (textarea) {
                    textarea.value = state.fileData.content || '';
                    notepadUpdateStatus(notepadWin.id);
                }
                const titleText = document.querySelector(`#${notepadWin.id} .window-titlebar-text`);
                if (titleText) titleText.textContent = state.fileName + ' - Notepad';
            }
        }, 100);
    } else if (imageTypes.includes(ext)) {
        openImageViewer(state.fileName, state.fileData);
    } else {
        addNotification('⚠️ File Viewer', `No application available for .${ext} files`);
    }
}

function fvClose(winId) {
    closeWindow(winId);
}

function openImageViewer(fileName, fileData) {
    const existing = Object.values(activeWindows).find(w => w.appId === 'image-viewer' && !w.closed);
    if (existing) {
        renderImageViewer(existing.id, fileName, fileData);
        restoreWindow(existing.id);
        return;
    }
    
    const winId = 'win-' + (++windowIdCounter);
    const container = document.getElementById('windows-container');
    
    const win = document.createElement('div');
    win.className = 'app-window';
    win.id = winId;
    win.style.width = '600px';
    win.style.height = '500px';
    win.style.left = '100px';
    win.style.top = '80px';
    win.style.zIndex = ++windowZIndex;
    
    win.innerHTML = `
        <div class="window-titlebar" data-winid="${winId}">
            <span class="window-titlebar-icon">🖼️</span>
            <span class="window-titlebar-text">Image Viewer - ${fileName}</span>
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
        appId: 'image-viewer',
        title: 'Image Viewer - ' + fileName,
        icon: '🖼️',
        minimized: false,
        maximized: false,
        closed: false,
        prevBounds: null
    };
    
    renderImageViewer(winId, fileName, fileData);
    addTaskbarButton(winId);
    focusWindow(winId);
    setupWindowDrag(win);
}

function openFileViewer(fileName, fileData, filePath) {
    const existing = Object.values(activeWindows).find(w => w.appId === 'file-viewer' && !w.closed);
    if (existing) {
        renderFileViewer(existing.id, fileName, fileData, filePath);
        restoreWindow(existing.id);
        return;
    }
    
    const winId = 'win-' + (++windowIdCounter);
    const container = document.getElementById('windows-container');
    
    const win = document.createElement('div');
    win.className = 'app-window';
    win.id = winId;
    win.style.width = '550px';
    win.style.height = '450px';
    win.style.left = '120px';
    win.style.top = '100px';
    win.style.zIndex = ++windowZIndex;
    
    win.innerHTML = `
        <div class="window-titlebar" data-winid="${winId}">
            <span class="window-titlebar-icon">📄</span>
            <span class="window-titlebar-text">File Viewer - ${fileName}</span>
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
        appId: 'file-viewer',
        title: 'File Viewer - ' + fileName,
        icon: '📄',
        minimized: false,
        maximized: false,
        closed: false,
        prevBounds: null
    };
    
    renderFileViewer(winId, fileName, fileData, filePath);
    addTaskbarButton(winId);
    focusWindow(winId);
    setupWindowDrag(win);
}
