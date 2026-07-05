/**
 * Pac-Man — pixel-based movement with smooth canvas animation.
 *
 * Key design decisions:
 *  - All positions are stored in PIXELS (px, py), not grid cells.
 *  - Characters move at a constant speed (px/frame) using requestAnimationFrame.
 *  - Wall collision is checked by testing whether the BOUNDING BOX of the
 *    character overlaps any wall tile — this prevents tunnelling completely.
 *  - Direction change is only accepted when Pac-Man is close enough to the
 *    centre of a tile (within SNAP_RADIUS px), making turning feel crisp.
 *  - Ghosts use pixel movement with the same collision system.
 */

let pacmanState = {};

// ── Map constants ─────────────────────────────────────────────────────────────
// 1=Wall  0=Pellet  2=PowerPellet  9=Empty  3=GhostHouse(open)
const PM_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1],
    [1,2,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,2,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,9,1,1,9,1,1,1,0,1,1,1,1,1],
    [9,9,9,9,1,0,1,9,9,9,9,9,9,9,9,1,0,1,9,9,9,9],
    [1,1,1,1,1,0,1,9,1,1,3,3,1,1,9,1,0,1,1,1,1,1],
    [9,9,9,9,9,0,9,9,1,9,9,9,9,1,9,9,0,9,9,9,9,9],
    [1,1,1,1,1,0,1,9,1,1,1,1,1,1,9,1,0,1,1,1,1,1],
    [9,9,9,9,1,0,1,9,9,9,9,9,9,9,9,1,0,1,9,9,9,9],
    [1,1,1,1,1,0,1,9,1,1,1,1,1,1,9,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,2,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,2,1],
    [1,1,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const PM_COLS   = PM_MAP[0].length;   // 22
const PM_ROWS   = PM_MAP.length;      // 22
const PM_TS     = 20;                 // tile size in canvas px
const CW        = PM_COLS * PM_TS;    // 440
const CH        = PM_ROWS * PM_TS;    // 440  (no extra black strip needed)
const PACSPEED  = 2.0;                // px per frame
const GHSPEED   = 1.6;
const SNAP      = 3;                  // px — how close to tile centre to allow turning

// ── Render shell ──────────────────────────────────────────────────────────────
function renderPacman(winId) {
    const body = document.getElementById(winId + '-body');
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const highScore = gameSaves.pacman ? gameSaves.pacman.highScore : 0;

    body.innerHTML = `
        <div id="${winId}-pacman-app"
             style="width:100%;height:100%;display:flex;flex-direction:column;background:#000;color:#fff;">
            <div style="display:flex;justify-content:space-between;padding:8px 12px;
                        background:#111;border-bottom:2px solid #1919a6;font-family:monospace;">
                <div style="color:#ff0;font-weight:bold;">Score: <span id="${winId}-pm-score">0</span></div>
                <div style="color:#f00;font-weight:bold;">Lives: <span id="${winId}-pm-lives">3</span></div>
                <div style="color:#0ff;font-weight:bold;">Best: <span id="${winId}-pm-best">${highScore}</span></div>
            </div>
            <div style="flex:1;display:flex;justify-content:center;align-items:center;
                        background:#000;overflow:hidden;position:relative;">
                <canvas id="${winId}-pm-canvas" width="${CW}" height="${CH}"
                        style="max-width:100%;max-height:100%;object-fit:contain;"></canvas>

                <div id="${winId}-pm-overlay"
                     style="position:absolute;inset:0;background:rgba(0,0,0,0.82);
                            display:flex;flex-direction:column;justify-content:center;
                            align-items:center;z-index:20;color:#fff;">
                    <h2 id="${winId}-pm-msg"
                        style="color:#ff0;font-size:30px;margin-bottom:16px;font-family:monospace;">
                        PAC-MAN
                    </h2>
                    <button onclick="startPacman('${winId}')"
                            style="padding:10px 24px;background:#ff0;color:#000;border:none;
                                   border-radius:6px;font-weight:bold;cursor:pointer;font-size:15px;">
                        Play
                    </button>
                    <div style="margin-top:16px;font-size:12px;text-align:center;color:#aaa;line-height:1.8;">
                        Arrow keys to move.<br>
                        Eat all pellets to win.<br>
                        Power pellets let you eat ghosts!
                    </div>
                </div>
            </div>
        </div>
    `;

    pacmanState[winId] = {
        canvas:      document.getElementById(`${winId}-pm-canvas`),
        ctx:         document.getElementById(`${winId}-pm-canvas`).getContext('2d'),
        gridMap:     null,
        pelletsLeft: 0,
        pacman:      null,
        ghosts:      [],
        score:       0,
        highScore:   highScore,
        lives:       3,
        powerTimer:  0,
        gameOver:    false,
        running:     false,
        rafId:       null,
        // buffered next direction from keyboard
        nextDir:     { dx: 0, dy: 0 },
    };

    const keyHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        const state = pacmanState[winId];
        if (!state || !state.running) return;
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();

        if      (e.key === 'ArrowLeft')  state.nextDir = { dx: -1, dy:  0 };
        else if (e.key === 'ArrowRight') state.nextDir = { dx:  1, dy:  0 };
        else if (e.key === 'ArrowUp')    state.nextDir = { dx:  0, dy: -1 };
        else if (e.key === 'ArrowDown')  state.nextDir = { dx:  0, dy:  1 };
    };
    document.addEventListener('keydown', keyHandler);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            const s = pacmanState[winId];
            if (s && s.rafId) cancelAnimationFrame(s.rafId);
        };
    }
}

// ── Pixel helpers ─────────────────────────────────────────────────────────────
// Centre pixel of a tile
function tileCentre(col, row) {
    return { cx: col * PM_TS + PM_TS / 2, cy: row * PM_TS + PM_TS / 2 };
}

// Grid cell that a pixel point falls in
function pixelToCell(px, py) {
    return { col: Math.floor(px / PM_TS), row: Math.floor(py / PM_TS) };
}

// Is a pixel AABB (centre ± half) clear of walls?
// half: half-size of the bounding box
function isClearPx(map, px, py, half) {
    const cols = map[0].length, rows = map.length;
    // Check four corners
    const corners = [
        [px - half + 1, py - half + 1],
        [px + half - 1, py - half + 1],
        [px - half + 1, py + half - 1],
        [px + half - 1, py + half - 1],
    ];
    for (const [cx, cy] of corners) {
        const col = Math.floor(cx / PM_TS);
        const row = Math.floor(cy / PM_TS);
        if (row < 0 || row >= rows) continue; // vertical tunnel (shouldn't exist here)
        if (col < 0 || col >= cols) continue; // horizontal tunnel — allow
        if (map[row][col] === 1) return false;
    }
    return true;
}

// ── Start game ────────────────────────────────────────────────────────────────
function startPacman(winId) {
    const state = pacmanState[winId];
    if (!state) return;

    document.getElementById(`${winId}-pm-overlay`).style.display = 'none';
    state.score   = 0;
    state.lives   = 3;
    state.gameOver = false;
    state.running  = true;
    document.getElementById(`${winId}-pm-score`).textContent = '0';
    document.getElementById(`${winId}-pm-lives`).textContent = '3';

    resetPacmanLevel(winId);
}

function resetPacmanLevel(winId) {
    const state = pacmanState[winId];
    state.gridMap = PM_MAP.map(row => [...row]);

    state.pelletsLeft = 0;
    for (const row of state.gridMap)
        for (const cell of row)
            if (cell === 0 || cell === 2) state.pelletsLeft++;

    resetPacmanPositions(winId);
    if (state.rafId) cancelAnimationFrame(state.rafId);
    pacmanRaf(winId);
}

function resetPacmanPositions(winId) {
    const state = pacmanState[winId];
    // Pac-Man starts at tile (row=16, col=10)
    const pc = tileCentre(10, 16);
    state.pacman = {
        px: pc.cx, py: pc.cy,
        dx: -1, dy: 0,          // current moving direction
        nextDx: -1, nextDy: 0,  // buffered desired direction
        mouth: 0.25,             // mouth opening (fraction of PI)
        mouthDir: 1,             // opening or closing
    };
    state.nextDir = { dx: -1, dy: 0 };

    // Ghost house centre tile: rows 9-11, cols 9-12 area
    const ghostStarts = [
        { col: 10, row: 10 }, { col: 11, row: 10 },
        { col: 9,  row: 10 }, { col: 12, row: 10 },
    ];
    const ghostColors = ['#f00', '#ffb8ff', '#0ff', '#ffb852'];

    state.ghosts = ghostStarts.map((s, i) => {
        const c = tileCentre(s.col, s.row);
        return {
            px: c.cx, py: c.cy,
            dx: i % 2 === 0 ? -1 : 1, dy: 0,
            color: ghostColors[i],
            scared: false,
            lastCol: -1,
            lastRow: -1,
        };
    });
    state.powerTimer = 0;
}

// ── Main game loop (requestAnimationFrame) ────────────────────────────────────
function pacmanRaf(winId) {
    const state = pacmanState[winId];
    if (!state || !state.running) return;

    if (!state.gameOver) updatePacman(winId);
    drawPacman(winId);

    if (!state.gameOver) {
        state.rafId = requestAnimationFrame(() => pacmanRaf(winId));
    }
}

// ── Update logic ──────────────────────────────────────────────────────────────
function updatePacman(winId) {
    const state = pacmanState[winId];
    const pm    = state.pacman;
    const map   = state.gridMap;

    // ── Try to honour buffered direction change ──────────────────────────────
    const { dx: ndx, dy: ndy } = state.nextDir;
    if (ndx !== pm.dx || ndy !== pm.dy) {
        // Only turn when near a tile centre (snap)
        const { col, row } = pixelToCell(pm.px, pm.py);
        const { cx, cy }   = tileCentre(col, row);
        const snapOk = Math.abs(pm.px - cx) <= SNAP && Math.abs(pm.py - cy) <= SNAP;

        if (snapOk) {
            const nextCol = col + ndx;
            const nextRow = row + ndy;
            if (nextRow >= 0 && nextRow < map.length && nextCol >= 0 && nextCol < map[0].length) {
                if (map[nextRow][nextCol] !== 1) {
                    pm.dx = ndx; pm.dy = ndy;
                    pm.px = cx; pm.py = cy;
                }
            }
        }
    }

    // ── Move Pac-Man with Wall Stopping ──────────────────────────────────────
    const { col, row } = pixelToCell(pm.px, pm.py);
    const { cx, cy }   = tileCentre(col, row);
    
    let stop = false;
    if (row >= 0 && row < map.length && col >= 0 && col < map[0].length) {
        if (pm.dx === 1 && pm.px >= cx) {
            if (col + 1 >= map[0].length || map[row][col + 1] === 1) stop = true;
        }
        if (pm.dx === -1 && pm.px <= cx) {
            if (col - 1 < 0 || map[row][col - 1] === 1) stop = true;
        }
        if (pm.dy === 1 && pm.py >= cy) {
            if (row + 1 >= map.length || map[row + 1][col] === 1) stop = true;
        }
        if (pm.dy === -1 && pm.py <= cy) {
            if (row - 1 < 0 || map[row - 1][col] === 1) stop = true;
        }
    }

    if (stop) {
        pm.px = cx;
        pm.py = cy;
        pm.dx = 0;
        pm.dy = 0;
    } else {
        pm.px += pm.dx * PACSPEED;
        pm.py += pm.dy * PACSPEED;
    }

    // Horizontal tunnel wrap
    const HALF = PM_TS / 2;
    if (pm.px < -HALF)       { pm.px = CW + HALF; }
    else if (pm.px > CW + HALF) { pm.px = -HALF; }

    // ── Mouth animation ───────────────────────────────────────────────────────
    pm.mouth += pm.mouthDir * 0.08;
    if (pm.mouth >= 0.28) pm.mouthDir = -1;
    if (pm.mouth <= 0.01) pm.mouthDir = 1;

    // ── Eat pellet at current tile ────────────────────────────────────────────
    const { col: pc, row: pr } = pixelToCell(pm.px, pm.py);
    if (pr >= 0 && pr < map.length && pc >= 0 && pc < map[0].length) {
        if (map[pr][pc] === 0) {
            map[pr][pc] = 9;
            state.score += 10;
            state.pelletsLeft--;
            document.getElementById(`${winId}-pm-score`).textContent = state.score;
        } else if (map[pr][pc] === 2) {
            map[pr][pc] = 9;
            state.score += 50;
            state.pelletsLeft--;
            state.powerTimer = 300; // ~5 seconds at 60fps
            document.getElementById(`${winId}-pm-score`).textContent = state.score;
        }
    }

    if (state.powerTimer > 0) state.powerTimer--;
    const powered = state.powerTimer > 0;
    state.ghosts.forEach(g => g.scared = powered);

    // ── Win condition ─────────────────────────────────────────────────────────
    if (state.pelletsLeft <= 0) {
        // Brief pause then next level
        state.running = false;
        setTimeout(() => {
            state.running = true;
            resetPacmanLevel(winId);
        }, 800);
        return;
    }

    // ── Move Ghosts ───────────────────────────────────────────────────────────
    state.ghosts.forEach((g, gi) => {
        const { col: gc, row: gr } = pixelToCell(g.px, g.py);
        const { cx, cy }           = tileCentre(gc, gr);
        
        // Decide direction when we are very close to the center of the current tile AND we haven't decided for this tile yet
        const atCentre = Math.abs(g.px - cx) <= GHSPEED && Math.abs(g.py - cy) <= GHSPEED;
        const newTile = gc !== g.lastCol || gr !== g.lastRow;

        if (atCentre && newTile) {
            // Snap to center
            g.px = cx;
            g.py = cy;
            g.lastCol = gc;
            g.lastRow = gr;

            const dirs = [
                { dx:  0, dy: -1 },
                { dx:  0, dy:  1 },
                { dx: -1, dy:  0 },
                { dx:  1, dy:  0 },
            ].filter(d => {
                // No 180-degree reversal unless forced
                if (d.dx === -g.dx && d.dy === -g.dy) return false;
                const nextCol = gc + d.dx;
                const nextRow = gr + d.dy;
                if (nextRow < 0 || nextRow >= map.length || nextCol < 0 || nextCol >= map[0].length) return false;
                return map[nextRow][nextCol] !== 1;
            });

            if (dirs.length === 0) {
                // Forced reversal
                g.dx = -g.dx;
                g.dy = -g.dy;
            } else {
                let choice;
                if (powered) {
                    // Run away from pac-man
                    choice = dirs.reduce((best, d) => {
                        const dist = Math.hypot(cx + d.dx * PM_TS - pm.px, cy + d.dy * PM_TS - pm.py);
                        return dist > (best ? Math.hypot(cx + best.dx * PM_TS - pm.px, cy + best.dy * PM_TS - pm.py) : -Infinity) ? d : best;
                    }, null);
                } else if (gi < 2 && Math.random() < 0.65) {
                    // First two ghosts: chase pac-man
                    choice = dirs.reduce((best, d) => {
                        const dist = Math.hypot(cx + d.dx * PM_TS - pm.px, cy + d.dy * PM_TS - pm.py);
                        return dist < (best ? Math.hypot(cx + best.dx * PM_TS - pm.px, cy + best.dy * PM_TS - pm.py) : Infinity) ? d : best;
                    }, null);
                } else {
                    choice = dirs[Math.floor(Math.random() * dirs.length)];
                }
                if (choice) {
                    g.dx = choice.dx;
                    g.dy = choice.dy;
                }
            }
        }

        // Move
        g.px += g.dx * GHSPEED;
        g.py += g.dy * GHSPEED;

        // Tunnel wrap
        const gHalf = PM_TS / 2;
        if (g.px < -gHalf) g.px = CW + gHalf;
        else if (g.px > CW + gHalf) g.px = -gHalf;

        // ── Ghost ↔ Pac-Man collision ─────────────────────────────────────────
        const dist = Math.hypot(g.px - pm.px, g.py - pm.py);
        if (dist < PM_TS - 4) {
            if (powered) {
                const sc = tileCentre(10, 10);
                g.px = sc.cx; g.py = sc.cy; g.dx = 1; g.dy = 0;
                state.score += 200;
                document.getElementById(`${winId}-pm-score`).textContent = state.score;
            } else {
                state.lives--;
                document.getElementById(`${winId}-pm-lives`).textContent = state.lives;
                if (state.lives <= 0) {
                    endPacman(winId);
                } else {
                    resetPacmanPositions(winId);
                }
            }
        }
    });
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawPacman(winId) {
    const state = pacmanState[winId];
    const { ctx, gridMap, pacman: pm, ghosts, powerTimer } = state;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CW, CH);

    // ── Draw map ──────────────────────────────────────────────────────────────
    for (let r = 0; r < PM_ROWS; r++) {
        for (let c = 0; c < PM_COLS; c++) {
            const cell = gridMap[r][c];
            const x = c * PM_TS, y = r * PM_TS;

            if (cell === 1) {
                // Wall: filled blue square with inner "neon" border
                ctx.fillStyle = '#1919a6';
                ctx.fillRect(x, y, PM_TS, PM_TS);
                ctx.strokeStyle = '#4747ff';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 2, y + 2, PM_TS - 4, PM_TS - 4);
            } else if (cell === 0) {
                // Pellet
                ctx.fillStyle = '#ffb8ae';
                ctx.beginPath();
                ctx.arc(x + PM_TS / 2, y + PM_TS / 2, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (cell === 2) {
                // Power pellet (pulsing)
                const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
                ctx.fillStyle = `rgba(255,184,174,${0.6 + 0.4 * pulse})`;
                ctx.beginPath();
                ctx.arc(x + PM_TS / 2, y + PM_TS / 2, 5 + pulse * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ── Draw ghosts ───────────────────────────────────────────────────────────
    const powered = powerTimer > 0;
    ghosts.forEach(g => {
        const r = PM_TS / 2 - 1;
        const x = g.px, y = g.py;

        // Scared colour flash
        let ghostColor = g.color;
        if (powered) {
            ghostColor = powerTimer < 90 && Math.floor(Date.now() / 200) % 2 === 0
                ? '#fff' : '#0000cc';
        }

        ctx.fillStyle = ghostColor;
        ctx.beginPath();
        ctx.arc(x, y - 2, r, Math.PI, 0);
        // Skirt with bumps
        ctx.lineTo(x + r, y + r);
        for (let i = 3; i >= 0; i--) {
            const bx = x - r + (i + 0.5) * (r * 2 / 4);
            const bump = i % 2 === 0 ? y + r : y + r - 4;
            ctx.lineTo(bx, bump);
        }
        ctx.lineTo(x - r, y + r);
        ctx.closePath();
        ctx.fill();

        // Eyes
        if (!powered) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(x - 4, y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 4, y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#00f';
            ctx.beginPath(); ctx.arc(x - 4 + g.dx * 1.5, y - 3 + g.dy * 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 4 + g.dx * 1.5, y - 3 + g.dy * 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    });

    // ── Draw Pac-Man ──────────────────────────────────────────────────────────
    const angle  = Math.atan2(pm.dy, pm.dx) || 0;
    const mouth  = pm.mouth * Math.PI;
    const startA = angle + mouth;
    const endA   = angle - mouth;

    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.moveTo(pm.px, pm.py);
    ctx.arc(pm.px, pm.py, PM_TS / 2 - 1, startA, endA);
    ctx.closePath();
    ctx.fill();
}

// ── End Pac-Man ───────────────────────────────────────────────────────────────
function endPacman(winId) {
    const state = pacmanState[winId];
    state.gameOver = true;
    state.running  = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);

    if (state.score > state.highScore) {
        state.highScore = state.score;
        let saves = JSON.parse(localStorage.getItem('game-saves') || '{}');
        saves.pacman = saves.pacman || {};
        saves.pacman.highScore = state.highScore;
        localStorage.setItem('game-saves', JSON.stringify(saves));
        document.getElementById(`${winId}-pm-best`).textContent = state.highScore;
    }

    document.getElementById(`${winId}-pm-msg`).textContent    = 'GAME OVER';
    document.getElementById(`${winId}-pm-msg`).style.color    = '#f00';
    document.getElementById(`${winId}-pm-overlay`).style.display = 'flex';
    document.querySelector(`#${winId}-pm-overlay button`).textContent = 'Play Again';
}
