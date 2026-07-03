let imgViewerState = {};

function renderImageViewer(winId, fileName, fileData) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    imgViewerState[winId] = {
        fileName: fileName,
        fileData: fileData,
        zoom: 1
    };
    
    const isPainting = fileName.startsWith('painting_');
    const isPhoto = fileName.endsWith('.jpg') || fileName.endsWith('.png');
    
    let canvasContent = '';
    if (isPainting) {
        canvasContent = `
            <div class="imgv-painting-preview">
                <canvas id="${winId}-imgv-canvas" width="400" height="300"></canvas>
            </div>
        `;
    } else {
        canvasContent = `
            <div class="imgv-photo-preview">
                <div class="imgv-photo-icon">🖼️</div>
                <div class="imgv-photo-desc">${fileData.content || '[Image file]'}</div>
            </div>
        `;
    }
    
    body.innerHTML = `
        <div class="imgv-app">
            <div class="imgv-toolbar">
                <div class="imgv-title">
                    <span class="imgv-icon">${isPainting ? '🎨' : '🖼️'}</span>
                    <span>${fileName}</span>
                </div>
                <div class="imgv-controls">
                    <button class="imgv-btn" onclick="imgvZoomIn('${winId}')" title="Zoom In">🔍+</button>
                    <button class="imgv-btn" onclick="imgvZoomOut('${winId}')" title="Zoom Out">🔍-</button>
                    <button class="imgv-btn" onclick="imgvResetZoom('${winId}')" title="Reset">↺</button>
                </div>
            </div>
            <div class="imgv-content" id="${winId}-imgv-content">
                ${canvasContent}
                <div class="imgv-info">
                    <div class="imgv-info-row">
                        <span class="imgv-info-label">File Name:</span>
                        <span class="imgv-info-value">${fileName}</span>
                    </div>
                    <div class="imgv-info-row">
                        <span class="imgv-info-label">Type:</span>
                        <span class="imgv-info-value">${fileData.ext.toUpperCase()} Image</span>
                    </div>
                    ${fileData.content ? `
                    <div class="imgv-info-row">
                        <span class="imgv-info-label">Info:</span>
                        <span class="imgv-info-value">${fileData.content}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    if (isPainting) {
        setTimeout(() => imgvDrawPaintingPreview(winId), 100);
    }
}

function imgvDrawPaintingPreview(winId) {
    const canvas = document.getElementById(winId + '-imgv-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, w, h);
    
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
    const seed = winId.charCodeAt(winId.length - 1);
    
    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = colors[(seed + i) % colors.length];
        const x = (seed * (i + 1) * 37) % w;
        const y = (seed * (i + 1) * 53) % h;
        const size = 20 + ((seed * (i + 1)) % 60);
        
        ctx.beginPath();
        if (i % 3 === 0) {
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        } else if (i % 3 === 1) {
            ctx.rect(x - size / 2, y - size / 2, size, size);
        } else {
            ctx.moveTo(x, y - size / 2);
            ctx.lineTo(x + size / 2, y + size / 2);
            ctx.lineTo(x - size / 2, y + size / 2);
            ctx.closePath();
        }
        ctx.fill();
    }
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);
}

function imgvZoomIn(winId) {
    const state = imgViewerState[winId];
    if (!state) return;
    state.zoom = Math.min(state.zoom + 0.25, 3);
    imgvApplyZoom(winId);
}

function imgvZoomOut(winId) {
    const state = imgViewerState[winId];
    if (!state) return;
    state.zoom = Math.max(state.zoom - 0.25, 0.5);
    imgvApplyZoom(winId);
}

function imgvResetZoom(winId) {
    const state = imgViewerState[winId];
    if (!state) return;
    state.zoom = 1;
    imgvApplyZoom(winId);
}

function imgvApplyZoom(winId) {
    const state = imgViewerState[winId];
    if (!state) return;
    
    const preview = document.querySelector(`#${winId}-imgv-content .imgv-painting-preview, #${winId}-imgv-content .imgv-photo-preview`);
    if (preview) {
        preview.style.transform = `scale(${state.zoom})`;
    }
}
