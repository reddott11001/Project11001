const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
const TETRIS_BLOCK_SIZE = 24;
const TETRIS_COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
};

const TETRIS_PIECES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]]
};

let tetrisState = {};

function renderTetris(winId) {
    const body = document.getElementById(winId + '-body');
    body.innerHTML = `
        <div class="tetris-app" id="${winId}-tetris-app">
            <div class="tetris-header">
                <div class="tetris-stat">
                    <div>Score</div>
                    <div class="tetris-stat-value" id="${winId}-tetris-score">0</div>
                </div>
                <div class="tetris-stat">
                    <div>Lines</div>
                    <div class="tetris-stat-value" id="${winId}-tetris-lines">0</div>
                </div>
                <div class="tetris-stat">
                    <div>Level</div>
                    <div class="tetris-stat-value" id="${winId}-tetris-level">1</div>
                </div>
            </div>
            <div class="tetris-game-area">
                <div class="tetris-board-container">
                    <canvas id="${winId}-tetris-canvas" width="${TETRIS_COLS * TETRIS_BLOCK_SIZE}" height="${TETRIS_ROWS * TETRIS_BLOCK_SIZE}"></canvas>
                </div>
                <div class="tetris-next-piece">
                    <h4>Next</h4>
                    <canvas id="${winId}-tetris-next-canvas" width="96" height="96"></canvas>
                </div>
            </div>
            <div class="tetris-controls">
                ← → Move | ↑ Rotate | ↓ Soft Drop | Space Hard Drop | P Pause
            </div>
            <div class="tetris-overlay" id="${winId}-tetris-overlay">
                <h2>BlockStack</h2>
                <button onclick="startTetris('${winId}')">Start Game</button>
            </div>
        </div>
    `;

    tetrisState[winId] = {
        board: Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(0)),
        currentPiece: null,
        nextPiece: null,
        score: 0,
        lines: 0,
        level: 1,
        gameOver: false,
        paused: false,
        dropInterval: null,
        dropCounter: 0,
        dropTime: 1000,
        lastTime: 0
    };

    drawTetrisBoard(winId);
    drawNextPiece(winId);

    const keyHandler = (e) => handleTetrisKey(winId, e);
    document.addEventListener('keydown', keyHandler);
    
    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            if (tetrisState[winId] && tetrisState[winId].dropInterval) {
                cancelAnimationFrame(tetrisState[winId].dropInterval);
            }
        };
    }
}

function startTetris(winId) {
    const state = tetrisState[winId];
    state.board = Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(0));
    state.score = 0;
    state.lines = 0;
    state.level = 1;
    state.gameOver = false;
    state.paused = false;
    state.dropTime = 1000;
    
    state.nextPiece = getRandomTetrisPiece();
    spawnTetrisPiece(winId);
    
    document.getElementById(winId + '-tetris-overlay').style.display = 'none';
    updateTetrisStats(winId);
    
    state.lastTime = performance.now();
    tetrisGameLoop(winId);
}

function tetrisGameLoop(winId, time = 0) {
    const state = tetrisState[winId];
    if (state.gameOver || !activeWindows[winId]) return;
    
    const delta = time - state.lastTime;
    state.lastTime = time;
    
    if (!state.paused) {
        state.dropCounter += delta;
        if (state.dropCounter > state.dropTime) {
            moveTetrisPieceDown(winId);
            state.dropCounter = 0;
        }
        drawTetrisBoard(winId);
    }
    
    state.dropInterval = requestAnimationFrame((t) => tetrisGameLoop(winId, t));
}

function getRandomTetrisPiece() {
    const pieces = Object.keys(TETRIS_PIECES);
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        type: type,
        matrix: TETRIS_PIECES[type].map(row => [...row]),
        color: TETRIS_COLORS[type]
    };
}

function spawnTetrisPiece(winId) {
    const state = tetrisState[winId];
    state.currentPiece = state.nextPiece;
    state.nextPiece = getRandomTetrisPiece();
    
    state.currentPiece.x = Math.floor((TETRIS_COLS - state.currentPiece.matrix[0].length) / 2);
    state.currentPiece.y = 0;
    
    if (checkTetrisCollision(winId, state.currentPiece, 0, 0)) {
        state.gameOver = true;
        showTetrisGameOver(winId);
    }
    
    drawNextPiece(winId);
}

function checkTetrisCollision(winId, piece, offsetX, offsetY) {
    const state = tetrisState[winId];
    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;
                
                if (newX < 0 || newX >= TETRIS_COLS || newY >= TETRIS_ROWS) {
                    return true;
                }
                
                if (newY >= 0 && state.board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function moveTetrisPieceDown(winId) {
    const state = tetrisState[winId];
    if (!state.currentPiece || state.gameOver || state.paused) return;
    
    if (!checkTetrisCollision(winId, state.currentPiece, 0, 1)) {
        state.currentPiece.y++;
    } else {
        mergeTetrisPiece(winId);
        clearTetrisLines(winId);
        spawnTetrisPiece(winId);
    }
}

function moveTetrisPiece(winId, dir) {
    const state = tetrisState[winId];
    if (!state.currentPiece || state.gameOver || state.paused) return;
    
    if (!checkTetrisCollision(winId, state.currentPiece, dir, 0)) {
        state.currentPiece.x += dir;
    }
}

function rotateTetrisPiece(winId) {
    const state = tetrisState[winId];
    if (!state.currentPiece || state.gameOver || state.paused) return;
    
    const original = state.currentPiece.matrix;
    const rotated = original[0].map((_, i) => original.map(row => row[i]).reverse());
    state.currentPiece.matrix = rotated;
    
    if (checkTetrisCollision(winId, state.currentPiece, 0, 0)) {
        state.currentPiece.matrix = original;
    }
}

function hardDropTetris(winId) {
    const state = tetrisState[winId];
    if (!state.currentPiece || state.gameOver || state.paused) return;
    
    while (!checkTetrisCollision(winId, state.currentPiece, 0, 1)) {
        state.currentPiece.y++;
        state.score += 2;
    }
    mergeTetrisPiece(winId);
    clearTetrisLines(winId);
    spawnTetrisPiece(winId);
    updateTetrisStats(winId);
}

function mergeTetrisPiece(winId) {
    const state = tetrisState[winId];
    const piece = state.currentPiece;
    
    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x]) {
                const boardY = piece.y + y;
                const boardX = piece.x + x;
                if (boardY >= 0) {
                    state.board[boardY][boardX] = piece.color;
                }
            }
        }
    }
}

function clearTetrisLines(winId) {
    const state = tetrisState[winId];
    let linesCleared = 0;
    
    for (let y = TETRIS_ROWS - 1; y >= 0; y--) {
        if (state.board[y].every(cell => cell !== 0)) {
            state.board.splice(y, 1);
            state.board.unshift(Array(TETRIS_COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800];
        state.score += points[linesCleared] * state.level;
        state.lines += linesCleared;
        state.level = Math.floor(state.lines / 10) + 1;
        state.dropTime = Math.max(100, 1000 - (state.level - 1) * 100);
        updateTetrisStats(winId);
    }
}

function updateTetrisStats(winId) {
    const state = tetrisState[winId];
    document.getElementById(winId + '-tetris-score').textContent = state.score;
    document.getElementById(winId + '-tetris-lines').textContent = state.lines;
    document.getElementById(winId + '-tetris-level').textContent = state.level;
}

function drawTetrisBoard(winId) {
    const canvas = document.getElementById(winId + '-tetris-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = tetrisState[winId];
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    for (let x = 0; x <= TETRIS_COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TETRIS_BLOCK_SIZE, 0);
        ctx.lineTo(x * TETRIS_BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= TETRIS_ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TETRIS_BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * TETRIS_BLOCK_SIZE);
        ctx.stroke();
    }
    
    for (let y = 0; y < TETRIS_ROWS; y++) {
        for (let x = 0; x < TETRIS_COLS; x++) {
            if (state.board[y][x]) {
                drawTetrisBlock(ctx, x, y, state.board[y][x]);
            }
        }
    }
    
    if (state.currentPiece) {
        const piece = state.currentPiece;
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (piece.matrix[y][x]) {
                    drawTetrisBlock(ctx, piece.x + x, piece.y + y, piece.color);
                }
            }
        }
    }
}

function drawTetrisBlock(ctx, x, y, color) {
    const px = x * TETRIS_BLOCK_SIZE;
    const py = y * TETRIS_BLOCK_SIZE;
    
    ctx.fillStyle = color;
    ctx.fillRect(px, py, TETRIS_BLOCK_SIZE, TETRIS_BLOCK_SIZE);
    
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(px, py, TETRIS_BLOCK_SIZE, 4);
    ctx.fillRect(px, py, 4, TETRIS_BLOCK_SIZE);
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px, py + TETRIS_BLOCK_SIZE - 4, TETRIS_BLOCK_SIZE, 4);
    ctx.fillRect(px + TETRIS_BLOCK_SIZE - 4, py, 4, TETRIS_BLOCK_SIZE);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, TETRIS_BLOCK_SIZE, TETRIS_BLOCK_SIZE);
}

function drawNextPiece(winId) {
    const canvas = document.getElementById(winId + '-tetris-next-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = tetrisState[winId];
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (state.nextPiece) {
        const piece = state.nextPiece;
        const blockSize = 20;
        const offsetX = (canvas.width - piece.matrix[0].length * blockSize) / 2;
        const offsetY = (canvas.height - piece.matrix.length * blockSize) / 2;
        
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (piece.matrix[y][x]) {
                    const px = offsetX + x * blockSize;
                    const py = offsetY + y * blockSize;
                    
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(px, py, blockSize, blockSize);
                    
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fillRect(px, py, blockSize, 3);
                    ctx.fillRect(px, py, 3, blockSize);
                    
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(px, py + blockSize - 3, blockSize, 3);
                    ctx.fillRect(px + blockSize - 3, py, 3, blockSize);
                    
                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, blockSize, blockSize);
                }
            }
        }
    }
}

function showTetrisGameOver(winId) {
    const state = tetrisState[winId];
    if (state.dropInterval) {
        cancelAnimationFrame(state.dropInterval);
    }
    
    const overlay = document.getElementById(winId + '-tetris-overlay');
    overlay.innerHTML = `
        <h2>Game Over</h2>
        <div style="color:#fff;font-size:18px;margin-bottom:16px;">Score: ${state.score}</div>
        <button onclick="startTetris('${winId}')">Play Again</button>
    `;
    overlay.style.display = 'flex';
}

function handleTetrisKey(winId, e) {
    const state = tetrisState[winId];
    if (!state || state.gameOver) return;
    
    const win = document.getElementById(winId);
    if (!win || !win.classList.contains('active')) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            moveTetrisPiece(winId, -1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveTetrisPiece(winId, 1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveTetrisPieceDown(winId);
            state.score += 1;
            updateTetrisStats(winId);
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotateTetrisPiece(winId);
            break;
        case ' ':
            e.preventDefault();
            hardDropTetris(winId);
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            state.paused = !state.paused;
            const overlay = document.getElementById(winId + '-tetris-overlay');
            if (state.paused) {
                overlay.innerHTML = `
                    <h2>Paused</h2>
                    <button onclick="handleTetrisKey('${winId}', {key:'P', preventDefault:()=>{}})">Resume</button>
                `;
                overlay.style.display = 'flex';
            } else {
                overlay.style.display = 'none';
                state.lastTime = performance.now();
            }
            break;
    }
}
