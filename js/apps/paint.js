let paintState = {};

function renderPaint(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    const picsFolder = navigateToPath(['C:', 'Users', 'User', 'Pictures']);
    const savedPaintings = picsFolder && picsFolder.children 
        ? Object.keys(picsFolder.children).filter(k => k.startsWith('painting_')).length 
        : 0;
    
    paintState[winId] = {
        drawing: false,
        color: '#000000',
        brushSize: 5,
        lastX: 0,
        lastY: 0,
        savedCount: savedPaintings
    };
    
    body.innerHTML = `
        <div class="paint-app">
            <div class="paint-toolbar">
                <div class="paint-tool-group">
                    <label>Color:</label>
                    <input type="color" id="${winId}-paint-color" value="#000000" onchange="paintSetColor('${winId}', this.value)">
                </div>
                <div class="paint-tool-group">
                    <label>Size:</label>
                    <input type="range" id="${winId}-paint-size" min="1" max="50" value="5" oninput="paintSetSize('${winId}', this.value)">
                    <span id="${winId}-paint-size-label">5px</span>
                </div>
                <div class="paint-tool-group">
                    <button class="paint-btn" onclick="paintSave('${winId}')">💾 Save</button>
                    <button class="paint-btn" onclick="paintClear('${winId}')">Clear</button>
                    <button class="paint-btn" onclick="paintSetEraser('${winId}')">Eraser</button>
                </div>
            </div>
            <div class="paint-canvas-container">
                <canvas id="${winId}-paint-canvas" width="800" height="500"></canvas>
            </div>
        </div>
    `;
    
    const canvas = document.getElementById(winId + '-paint-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        canvas.addEventListener('mousedown', (e) => paintStart(winId, e));
        canvas.addEventListener('mousemove', (e) => paintDraw(winId, e));
        canvas.addEventListener('mouseup', () => paintStop(winId));
        canvas.addEventListener('mouseout', () => paintStop(winId));
    }
}

function paintStart(winId, e) {
    const state = paintState[winId];
    state.drawing = true;
    const canvas = document.getElementById(winId + '-paint-canvas');
    const rect = canvas.getBoundingClientRect();
    state.lastX = e.clientX - rect.left;
    state.lastY = e.clientY - rect.top;
}

function paintDraw(winId, e) {
    const state = paintState[winId];
    if (!state.drawing) return;
    
    const canvas = document.getElementById(winId + '-paint-canvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.strokeStyle = state.color;
    ctx.lineWidth = state.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(state.lastX, state.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    state.lastX = x;
    state.lastY = y;
}

function paintStop(winId) {
    paintState[winId].drawing = false;
}

function paintSetColor(winId, color) {
    paintState[winId].color = color;
}

function paintSetSize(winId, size) {
    paintState[winId].brushSize = parseInt(size);
    const label = document.getElementById(winId + '-paint-size-label');
    if (label) label.textContent = size + 'px';
}

function paintClear(winId) {
    const canvas = document.getElementById(winId + '-paint-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function paintSave(winId) {
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
        
        if (paintState[winId]) {
            paintState[winId].savedCount = (paintState[winId].savedCount || 0) + 1;
        }
        
        addNotification('🎨 Paint', `Saved as "${filename}" to Pictures folder`);
    }
}

function paintSetEraser(winId) {
    paintState[winId].color = '#ffffff';
    paintState[winId].brushSize = 20;
    const colorInput = document.getElementById(winId + '-paint-color');
    const sizeInput = document.getElementById(winId + '-paint-size');
    const sizeLabel = document.getElementById(winId + '-paint-size-label');
    if (colorInput) colorInput.value = '#ffffff';
    if (sizeInput) sizeInput.value = 20;
    if (sizeLabel) sizeLabel.textContent = '20px';
}
