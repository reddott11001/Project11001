let minesweeperState = {};

function renderMinesweeper(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const stats = gameSaves.minesweeper || { played: 0, won: 0, bestTime: 999 };
    
    body.innerHTML = `
        <div class="ms-app" id="${winId}-ms-app" style="width:100%;height:100%;display:flex;flex-direction:column;background:#c0c0c0;color:#000;font-family:Arial;padding:10px;box-sizing:border-box;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <select id="${winId}-ms-diff" onchange="startMinesweeper('${winId}')" style="padding:2px;">
                    <option value="easy">Easy (9x9, 10 💣)</option>
                    <option value="medium">Medium (16x16, 40 💣)</option>
                </select>
                <div style="font-size:12px;">Played: ${stats.played} | Won: ${stats.won} | Best: ${stats.bestTime === 999 ? '-' : stats.bestTime + 's'}</div>
            </div>
            
            <div style="border:3px solid #808080;border-right-color:#fff;border-bottom-color:#fff;padding:6px;background:#c0c0c0;">
                <div style="display:flex;justify-content:space-between;align-items:center;background:#000;color:#f00;font-family:monospace;font-size:24px;padding:2px 5px;border:2px solid #808080;border-left-color:#808080;border-top-color:#808080;">
                    <div id="${winId}-ms-flags">010</div>
                    <button id="${winId}-ms-face" onclick="startMinesweeper('${winId}')" style="font-size:20px;padding:0;width:30px;height:30px;background:#c0c0c0;border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;cursor:pointer;">🙂</button>
                    <div id="${winId}-ms-time">000</div>
                </div>
            </div>
            
            <div style="flex:1;display:flex;justify-content:center;align-items:center;margin-top:10px;overflow:auto;border:3px solid #808080;border-right-color:#fff;border-bottom-color:#fff;background:#808080;padding:2px;">
                <div id="${winId}-ms-grid" style="display:grid;background:#808080;gap:1px;"></div>
            </div>
        </div>
    `;

    minesweeperState[winId] = {
        grid: [],
        rows: 9, cols: 9, mines: 10,
        flags: 0,
        gameOver: false,
        firstClick: true,
        timer: 0,
        timerId: null,
        stats: stats
    };
    
    startMinesweeper(winId);
}

function startMinesweeper(winId) {
    const state = minesweeperState[winId];
    if (!state) return;
    
    const diff = document.getElementById(`${winId}-ms-diff`).value;
    if (diff === 'easy') { state.rows = 9; state.cols = 9; state.mines = 10; }
    else if (diff === 'medium') { state.rows = 16; state.cols = 16; state.mines = 40; }
    
    state.grid = Array(state.rows).fill().map(() => Array(state.cols).fill().map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
    })));
    
    state.flags = state.mines;
    state.gameOver = false;
    state.firstClick = true;
    state.timer = 0;
    if (state.timerId) clearInterval(state.timerId);
    
    document.getElementById(`${winId}-ms-flags`).textContent = state.flags.toString().padStart(3, '0');
    document.getElementById(`${winId}-ms-time`).textContent = '000';
    document.getElementById(`${winId}-ms-face`).textContent = '🙂';
    
    const gridEl = document.getElementById(`${winId}-ms-grid`);
    gridEl.style.gridTemplateColumns = `repeat(${state.cols}, 20px)`;
    gridEl.style.gridTemplateRows = `repeat(${state.rows}, 20px)`;
    gridEl.innerHTML = '';
    
    for(let r=0; r<state.rows; r++) {
        for(let c=0; c<state.cols; c++) {
            let cell = document.createElement('div');
            cell.id = `${winId}-ms-${r}-${c}`;
            cell.style.cssText = 'width:20px;height:20px;background:#c0c0c0;border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;display:flex;justify-content:center;align-items:center;font-weight:bold;font-size:14px;cursor:default;box-sizing:border-box;user-select:none;';
            
            cell.addEventListener('mousedown', (e) => {
                if (state.gameOver) return;
                if (e.button === 0) revealMinesweeperCell(winId, r, c);
                else if (e.button === 2) flagMinesweeperCell(winId, r, c);
            });
            cell.addEventListener('contextmenu', e => e.preventDefault());
            gridEl.appendChild(cell);
        }
    }
}

function placeMinesweeperMines(winId, firstR, firstC) {
    const state = minesweeperState[winId];
    let placed = 0;
    while(placed < state.mines) {
        let r = Math.floor(Math.random() * state.rows);
        let c = Math.floor(Math.random() * state.cols);
        if (!state.grid[r][c].isMine && (Math.abs(r-firstR)>1 || Math.abs(c-firstC)>1)) {
            state.grid[r][c].isMine = true;
            placed++;
        }
    }
    
    for(let r=0; r<state.rows; r++) {
        for(let c=0; c<state.cols; c++) {
            if (!state.grid[r][c].isMine) {
                let count = 0;
                for(let dr=-1; dr<=1; dr++) {
                    for(let dc=-1; dc<=1; dc++) {
                        let nr = r+dr, nc = c+dc;
                        if(nr>=0 && nr<state.rows && nc>=0 && nc<state.cols && state.grid[nr][nc].isMine) count++;
                    }
                }
                state.grid[r][c].neighborMines = count;
            }
        }
    }
    
    state.timerId = setInterval(() => {
        state.timer++;
        document.getElementById(`${winId}-ms-time`).textContent = Math.min(999, state.timer).toString().padStart(3, '0');
    }, 1000);
}

function revealMinesweeperCell(winId, r, c) {
    const state = minesweeperState[winId];
    if (state.gameOver || state.grid[r][c].isRevealed || state.grid[r][c].isFlagged) return;
    
    if (state.firstClick) {
        state.firstClick = false;
        placeMinesweeperMines(winId, r, c);
        state.stats.played++;
        saveMinesweeperStats(winId);
    }
    
    const cell = state.grid[r][c];
    cell.isRevealed = true;
    
    const el = document.getElementById(`${winId}-ms-${r}-${c}`);
    el.style.border = '1px solid #808080';
    el.style.borderRightColor = '#ccc';
    el.style.borderBottomColor = '#ccc';
    
    if (cell.isMine) {
        el.style.background = '#f00';
        el.textContent = '💣';
        endMinesweeper(winId, false);
    } else {
        el.style.background = '#c0c0c0';
        if (cell.neighborMines > 0) {
            const colors = ['','blue','green','red','darkblue','darkred','teal','black','gray'];
            el.style.color = colors[cell.neighborMines];
            el.textContent = cell.neighborMines;
        } else {
            // Flood fill
            for(let dr=-1; dr<=1; dr++) {
                for(let dc=-1; dc<=1; dc++) {
                    let nr = r+dr, nc = c+dc;
                    if(nr>=0 && nr<state.rows && nc>=0 && nc<state.cols) {
                        revealMinesweeperCell(winId, nr, nc);
                    }
                }
            }
        }
        checkMinesweeperWin(winId);
    }
}

function flagMinesweeperCell(winId, r, c) {
    const state = minesweeperState[winId];
    if (state.gameOver || state.grid[r][c].isRevealed) return;
    
    const cell = state.grid[r][c];
    const el = document.getElementById(`${winId}-ms-${r}-${c}`);
    
    if (cell.isFlagged) {
        cell.isFlagged = false;
        el.textContent = '';
        state.flags++;
    } else {
        if (state.flags > 0) {
            cell.isFlagged = true;
            el.textContent = '🚩';
            state.flags--;
        }
    }
    document.getElementById(`${winId}-ms-flags`).textContent = state.flags.toString().padStart(3, '0');
}

function checkMinesweeperWin(winId) {
    const state = minesweeperState[winId];
    let won = true;
    for(let r=0; r<state.rows; r++) {
        for(let c=0; c<state.cols; c++) {
            if (!state.grid[r][c].isMine && !state.grid[r][c].isRevealed) won = false;
        }
    }
    
    if (won) endMinesweeper(winId, true);
}

function endMinesweeper(winId, won) {
    const state = minesweeperState[winId];
    state.gameOver = true;
    clearInterval(state.timerId);
    
    document.getElementById(`${winId}-ms-face`).textContent = won ? '😎' : '😵';
    
    if (won) {
        state.stats.won++;
        if (state.timer < state.stats.bestTime) state.stats.bestTime = state.timer;
        saveMinesweeperStats(winId);
        addNotification('Minesweeper', `You won in ${state.timer} seconds!`);
    } else {
        // Reveal all mines
        for(let r=0; r<state.rows; r++) {
            for(let c=0; c<state.cols; c++) {
                if (state.grid[r][c].isMine) {
                    const el = document.getElementById(`${winId}-ms-${r}-${c}`);
                    if (!state.grid[r][c].isFlagged) {
                        el.textContent = '💣';
                        el.style.border = '1px solid #808080';
                    }
                } else if (state.grid[r][c].isFlagged) {
                    const el = document.getElementById(`${winId}-ms-${r}-${c}`);
                    el.textContent = '❌';
                }
            }
        }
    }
}

function saveMinesweeperStats(winId) {
    const state = minesweeperState[winId];
    let saves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    saves.minesweeper = state.stats;
    localStorage.setItem('game-saves', JSON.stringify(saves));
}
