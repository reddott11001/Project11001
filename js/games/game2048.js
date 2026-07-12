/**
 * 2048 — with smooth CSS glide animations.
 *
 * Architecture:
 *   - Grid cells are pre-rendered as "background" slots (always visible, grey).
 *   - Each tile is an absolute-positioned <div> that moves via CSS transform.
 *   - On every move we:
 *       1. Compute next positions & merges.
 *       2. Set new transforms on existing tile elements (CSS transition kicks in).
 *       3. After 110 ms (transition done) we remove merged tiles, add the new
 *          tile, and run the "pop" appear animation on the new tile.
 *
 * This gives genuine per-tile slide + merge pop, not just a fade-in re-render.
 */

let game2048State = {};

// ── Colour palette ────────────────────────────────────────────────────────────
const TILE_COLORS = {
    0:    '#cdc1b4',
    2:    '#eee4da', 4:    '#ede0c8', 8:    '#f2b179',
    16:   '#f59563', 32:   '#f67c5f', 64:   '#f65e3b',
    128:  '#edcf72', 256:  '#edcc61', 512:  '#edc850',
    1024: '#edc53f', 2048: '#edc22e',
};
const TILE_TEXT_COLORS = {
    2: '#776e65', 4: '#776e65',
};

// ── Render shell ─────────────────────────────────────────────────────────────
function render2048(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const highScore = gameSaves.game2048 ? gameSaves.game2048.highScore : 0;

    body.innerHTML = `
        <div id="${winId}-2048-app"
             style="width:100%;height:100%;display:flex;flex-direction:column;
                    background:#faf8ef;color:#776e65;font-family:Arial,sans-serif;
                    align-items:center;overflow:hidden;">

            <!-- Header row -->
            <div style="width:100%;max-width:420px;display:flex;justify-content:space-between;
                        align-items:center;padding:16px 10px 8px;">
                <div style="font-size:40px;font-weight:bold;letter-spacing:-2px;">2048</div>
                <div style="display:flex;gap:8px;">
                    <div style="background:#bbada0;padding:6px 18px;border-radius:4px;text-align:center;color:#fff;">
                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;">Score</div>
                        <div style="font-weight:bold;font-size:20px;" id="${winId}-2048-score">0</div>
                    </div>
                    <div style="background:#bbada0;padding:6px 18px;border-radius:4px;text-align:center;color:#fff;">
                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;">Best</div>
                        <div style="font-weight:bold;font-size:20px;" id="${winId}-2048-best">${highScore}</div>
                    </div>
                </div>
            </div>

            <!-- Controls row -->
            <div style="width:100%;max-width:420px;display:flex;justify-content:space-between;
                        align-items:center;padding:0 10px 10px;">
                <p style="margin:0;font-size:13px;">Get to <strong>2048</strong>!</p>
                <div style="display:flex;gap:6px;align-items:center;">
                    <select id="${winId}-2048-mode"
                            onchange="start2048('${winId}')"
                            style="padding:5px 4px;border-radius:4px;border:1px solid #ccc;font-size:13px;">
                        <option value="4">4×4 Classic</option>
                        <option value="5">5×5 Large</option>
                    </select>
                    <button onclick="undo2048('${winId}')"
                            style="padding:6px 12px;background:#8f7a66;color:#fff;border:none;
                                   border-radius:3px;font-weight:bold;cursor:pointer;font-size:13px;">Undo</button>
                    <button onclick="start2048('${winId}')"
                            style="padding:6px 12px;background:#8f7a66;color:#fff;border:none;
                                   border-radius:3px;font-weight:bold;cursor:pointer;font-size:13px;">New</button>
                </div>
            </div>

            <!-- Board wrapper -->
            <div style="position:relative;width:100%;max-width:420px;flex:1;
                        display:flex;justify-content:center;align-items:flex-start;padding:0 10px;box-sizing:border-box;">
                <div id="${winId}-2048-board-wrap"
                     style="position:relative;width:100%;padding-bottom:100%;
                            background:#bbada0;border-radius:8px;overflow:hidden;">

                    <!-- background cell slots -->
                    <div id="${winId}-2048-bg" style="position:absolute;inset:0;padding:8px;box-sizing:border-box;"></div>

                    <!-- animated tiles layer -->
                    <div id="${winId}-2048-tiles" style="position:absolute;inset:0;padding:8px;box-sizing:border-box;"></div>

                    <!-- game over overlay -->
                    <div id="${winId}-2048-overlay"
                         style="position:absolute;inset:0;background:rgba(238,228,218,0.75);
                                display:none;flex-direction:column;justify-content:center;
                                align-items:center;z-index:50;border-radius:8px;">
                        <h2 id="${winId}-2048-msg"
                            style="font-size:36px;color:#776e65;margin-bottom:20px;"></h2>
                        <button onclick="start2048('${winId}')"
                                style="padding:10px 24px;background:#8f7a66;color:#fff;border:none;
                                       border-radius:4px;font-weight:bold;cursor:pointer;font-size:16px;">
                            Try again
                        </button>
                    </div>
                </div>
            </div>

            <div style="padding:10px;color:#776e65;font-size:12px;text-align:center;">
                <strong>Arrow keys</strong> to slide tiles.
            </div>
        </div>
    `;

    game2048State[winId] = {
        gridSize: 4,
        grid: [],       // 2-D array of { value, id }  (id=0 means empty)
        history: [],
        nextId: 1,
        score: 0,
        highScore: highScore,
        gameOver: false,
        won: false,
        animating: false,
        tileEls: {},    // id → DOM element
        tileSize: 0,    // computed cell px size
        gap: 8,
    };

    const keyHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        const state = game2048State[winId];
        if (!state || state.animating || state.gameOver) return;

        let dir = null;
        if (e.key === 'ArrowUp')    { dir = [-1, 0]; e.preventDefault(); }
        else if (e.key === 'ArrowDown')  { dir = [1, 0];  e.preventDefault(); }
        else if (e.key === 'ArrowLeft')  { dir = [0, -1]; e.preventDefault(); }
        else if (e.key === 'ArrowRight') { dir = [0, 1];  e.preventDefault(); }

        if (dir) doMove2048(winId, dir[0], dir[1]);
    };
    document.addEventListener('keydown', keyHandler);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
        };
    }

    start2048(winId);
}

// ── Helper: pixel geometry ────────────────────────────────────────────────────
function getTileSize2048(winId) {
    const state = game2048State[winId];
    const wrap = document.getElementById(`${winId}-2048-board-wrap`);
    if (!wrap) return 80;
    const total = wrap.offsetWidth - state.gap * 2;
    return (total - state.gap * (state.gridSize - 1)) / state.gridSize;
}

function tilePos2048(winId, r, c) {
    const state = game2048State[winId];
    const ts = getTileSize2048(winId);
    const x = state.gap + c * (ts + state.gap);
    const y = state.gap + r * (ts + state.gap);
    return { x, y, ts };
}

// ── Background grid slots ─────────────────────────────────────────────────────
function renderBg2048(winId) {
    const state = game2048State[winId];
    const bg = document.getElementById(`${winId}-2048-bg`);
    if (!bg) return;
    bg.innerHTML = '';
    const n = state.gridSize;
    const ts = getTileSize2048(winId);
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const { x, y } = tilePos2048(winId, r, c);
            const slot = document.createElement('div');
            slot.style.cssText = `
                position:absolute;
                left:${x}px; top:${y}px;
                width:${ts}px; height:${ts}px;
                background:#cdc1b4;
                border-radius:4px;
            `;
            bg.appendChild(slot);
        }
    }
}

// ── Create a tile DOM element ─────────────────────────────────────────────────
function createTileEl2048(winId, r, c, value, isNew) {
    const state = game2048State[winId];
    const { x, y, ts } = tilePos2048(winId, r, c);

    const el = document.createElement('div');
    const bg    = TILE_COLORS[value] || '#3c3a32';
    const color = TILE_TEXT_COLORS[value] || '#f9f6f2';
    const fz    = value >= 1000 ? Math.round(ts * 0.28)
                : value >= 100  ? Math.round(ts * 0.34)
                :                 Math.round(ts * 0.42);

    el.style.cssText = `
        position:absolute;
        width:${ts}px; height:${ts}px;
        left:${x}px; top:${y}px;
        background:${bg};
        color:${color};
        border-radius:4px;
        display:flex; justify-content:center; align-items:center;
        font-weight:bold; font-size:${fz}px;
        transition: left 110ms ease, top 110ms ease;
        z-index:10;
        user-select:none;
    `;
    el.textContent = value;

    if (isNew) {
        el.style.transform = 'scale(0)';
        el.style.transition = el.style.transition + ', transform 100ms ease';
    }

    return el;
}

// ── Full tile layer rebuild (called on new game / undo) ───────────────────────
function rebuildTiles2048(winId) {
    const state = game2048State[winId];
    const layer = document.getElementById(`${winId}-2048-tiles`);
    if (!layer) return;
    layer.innerHTML = '';
    state.tileEls = {};

    for (let r = 0; r < state.gridSize; r++) {
        for (let c = 0; c < state.gridSize; c++) {
            const cell = state.grid[r][c];
            if (cell.value === 0) continue;
            const el = createTileEl2048(winId, r, c, cell.value, false);
            layer.appendChild(el);
            state.tileEls[cell.id] = el;
        }
    }
}

// ── Start / New game ─────────────────────────────────────────────────────────
function start2048(winId) {
    const state = game2048State[winId];
    if (!state) return;

    document.getElementById(`${winId}-2048-overlay`).style.display = 'none';
    state.gridSize = parseInt(document.getElementById(`${winId}-2048-mode`).value);
    state.grid = Array.from({ length: state.gridSize }, () =>
        Array.from({ length: state.gridSize }, () => ({ value: 0, id: 0 }))
    );
    state.score = 0;
    state.gameOver = false;
    state.won = false;
    state.animating = false;
    state.nextId = 1;
    state.history = [];
    state.tileEls = {};

    document.getElementById(`${winId}-2048-score`).textContent = '0';

    // Need a micro-delay so the wrap has rendered its CSS size
    setTimeout(() => {
        renderBg2048(winId);
        const layer = document.getElementById(`${winId}-2048-tiles`);
        if (layer) layer.innerHTML = '';
        state.tileEls = {};

        spawnTile2048(winId, true);
        spawnTile2048(winId, true);
    }, 30);
}

// ── Spawn a random tile (appear animation) ────────────────────────────────────
function spawnTile2048(winId, instant) {
    const state = game2048State[winId];
    const empty = [];
    for (let r = 0; r < state.gridSize; r++)
        for (let c = 0; c < state.gridSize; c++)
            if (state.grid[r][c].value === 0) empty.push([r, c]);

    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const value  = Math.random() < 0.9 ? 2 : 4;
    const id     = state.nextId++;

    state.grid[r][c] = { value, id };

    const layer = document.getElementById(`${winId}-2048-tiles`);
    if (!layer) return;

    const el = createTileEl2048(winId, r, c, value, !instant);
    layer.appendChild(el);
    state.tileEls[id] = el;

    if (!instant) {
        // Trigger pop animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.transform = 'scale(1)';
            });
        });
    }
}

// ── Undo ─────────────────────────────────────────────────────────────────────
function undo2048(winId) {
    const state = game2048State[winId];
    if (!state || !state.history.length || state.animating) return;

    const last = state.history.pop();
    state.grid  = JSON.parse(JSON.stringify(last.grid));
    state.score = last.score;
    document.getElementById(`${winId}-2048-score`).textContent = state.score;
    state.gameOver = false;
    document.getElementById(`${winId}-2048-overlay`).style.display = 'none';

    // Re-sync nextId
    let maxId = 0;
    for (let r = 0; r < state.gridSize; r++)
        for (let c = 0; c < state.gridSize; c++)
            if (state.grid[r][c].id > maxId) maxId = state.grid[r][c].id;
    state.nextId = maxId + 1;

    setTimeout(() => {
        renderBg2048(winId);
        rebuildTiles2048(winId);
    }, 0);
}

// ── Move logic ────────────────────────────────────────────────────────────────
function doMove2048(winId, dR, dC) {
    const state = game2048State[winId];

    // Save history before move
    state.history.push({
        grid:  JSON.parse(JSON.stringify(state.grid)),
        score: state.score
    });
    if (state.history.length > 5) state.history.shift();

    const n = state.gridSize;
    let moved = false;

    // merged[r][c] = true means we already merged into (r,c) this move
    const merged = Array.from({ length: n }, () => Array(n).fill(false));

    // Helper: traverse rows/cols in the correct order
    const rows = dR === 1  ? [...Array(n).keys()].reverse() : [...Array(n).keys()];
    const cols = dC === 1  ? [...Array(n).keys()].reverse() : [...Array(n).keys()];

    // Track which tile ids need to be removed after animation (merges)
    const toRemove = [];   // { id, delay }
    const toMerge  = [];   // { r, c, value }  – new merged tile to create

    for (const r of rows) {
        for (const c of cols) {
            const cell = state.grid[r][c];
            if (cell.value === 0) continue;

            let curR = r, curC = c;

            while (true) {
                const nR = curR + dR, nC = curC + dC;
                if (nR < 0 || nR >= n || nC < 0 || nC >= n) break;

                const target = state.grid[nR][nC];

                if (target.value === 0) {
                    // Slide into empty
                    state.grid[nR][nC] = state.grid[curR][curC];
                    state.grid[curR][curC] = { value: 0, id: 0 };
                    curR = nR; curC = nC;
                    moved = true;
                } else if (target.value === cell.value && !merged[nR][nC]) {
                    // Merge
                    const newVal = target.value * 2;
                    state.score += newVal;
                    merged[nR][nC] = true;

                    // Mark old tile at (r,c) to slide into (nR,nC) then disappear
                    toRemove.push({ id: state.grid[curR][curC].id, mergeInto: [nR, nC] });
                    // Also remove the tile that was already sitting there
                    toRemove.push({ id: target.id,                  mergeInto: [nR, nC] });

                    // Replace target cell with the merged tile (new id)
                    const newId = state.nextId++;
                    state.grid[nR][nC] = { value: newVal, id: newId };
                    state.grid[curR][curC] = { value: 0, id: 0 };

                    toMerge.push({ r: nR, c: nC, value: newVal, id: newId });
                    moved = true;
                    break;
                } else {
                    break;
                }
            }
        }
    }

    if (!moved) {
        state.history.pop();
        return;
    }

    document.getElementById(`${winId}-2048-score`).textContent = state.score;
    if (state.score > state.highScore) {
        state.highScore = state.score;
        document.getElementById(`${winId}-2048-best`).textContent = state.highScore;
        let saves = JSON.parse(localStorage.getItem('game-saves') || '{}');
        saves.game2048 = saves.game2048 || {};
        saves.game2048.highScore = state.highScore;
        localStorage.setItem('game-saves', JSON.stringify(saves));
    }

    // ── Phase 1: Animate slides via CSS transitions ───────────────────────────
    state.animating = true;

    // Move each tile element to its new position in the grid
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = state.grid[r][c];
            if (cell.value === 0) continue;
            const el = state.tileEls[cell.id];
            if (!el) continue;
            const { x, y } = tilePos2048(winId, r, c);
            el.style.left = `${x}px`;
            el.style.top  = `${y}px`;
        }
    }

    // Tiles that are being merged: slide them to their merge destination
    for (const rm of toRemove) {
        const el = state.tileEls[rm.id];
        if (!el) continue;
        const [mr, mc] = rm.mergeInto;
        const { x, y } = tilePos2048(winId, mr, mc);
        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;
        el.style.zIndex = '5'; // under the new merged tile
    }

    // ── Phase 2: After slide finishes, resolve merges & spawn new tile ────────
    setTimeout(() => {
        // Remove merged tile elements
        for (const rm of toRemove) {
            const el = state.tileEls[rm.id];
            if (el) el.remove();
            delete state.tileEls[rm.id];
        }

        // Add merged (result) tile elements with pop animation
        const layer = document.getElementById(`${winId}-2048-tiles`);
        for (const tm of toMerge) {
            const el = createTileEl2048(winId, tm.r, tm.c, tm.value, false);
            // pop: scale from 0.8 to 1
            el.style.transform = 'scale(0.8)';
            el.style.transition = 'left 0ms, top 0ms, transform 120ms ease';
            layer.appendChild(el);
            state.tileEls[tm.id] = el;

            // Check for 2048
            if (tm.value === 2048 && !state.won) {
                state.won = true;
                addNotification('🏆 2048', 'You reached 2048! Amazing!');
            }

            requestAnimationFrame(() => requestAnimationFrame(() => {
                el.style.transform = 'scale(1)';
            }));
        }

        // Spawn a new tile
        spawnTile2048(winId, false);

        state.animating = false;
        checkGameOver2048(winId);
    }, 120); // wait for CSS transition (110ms) + tiny buffer
}

// ── Check game over ───────────────────────────────────────────────────────────
function checkGameOver2048(winId) {
    const state = game2048State[winId];
    const n = state.gridSize;

    for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) {
            if (state.grid[r][c].value === 0) return;
            if (r < n-1 && state.grid[r][c].value === state.grid[r+1][c].value) return;
            if (c < n-1 && state.grid[r][c].value === state.grid[r][c+1].value) return;
        }

    state.gameOver = true;
    const ov = document.getElementById(`${winId}-2048-overlay`);
    document.getElementById(`${winId}-2048-msg`).textContent = 'Game Over!';
    ov.style.display = 'flex';
}
