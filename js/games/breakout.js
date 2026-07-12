let breakoutState = {};

function renderBreakout(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const highScore = gameSaves.breakout ? gameSaves.breakout.highScore : 0;
    
    body.innerHTML = `
        <div class="breakout-app" id="${winId}-breakout-app" style="width:100%;height:100%;display:flex;flex-direction:column;background:#000;color:#fff;">
            <div class="breakout-header" style="display:flex;justify-content:space-between;padding:10px;background:#331133;border-bottom:2px solid #ff00ff;">
                <div style="font-weight:bold;color:#ff00ff;">Score: <span id="${winId}-breakout-score">0</span></div>
                <div style="font-weight:bold;color:#00ffff;">Level: <span id="${winId}-breakout-level">1</span></div>
                <div style="font-weight:bold;color:#ffd700;">Best: <span id="${winId}-breakout-best">${highScore}</span></div>
            </div>
            <div class="breakout-game-area" style="flex:1;position:relative;display:flex;justify-content:center;align-items:center;overflow:hidden;">
                <canvas id="${winId}-breakout-canvas" width="600" height="500" style="max-width:100%;max-height:100%;object-fit:contain;background:#111;border:1px solid #ff00ff;"></canvas>
                
                <div id="${winId}-breakout-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:10;color:white;">
                    <h2 style="color:#ff00ff;margin-bottom:20px;font-size:32px;text-shadow: 0 0 10px #ff00ff;">BREAKOUT</h2>
                    <button onclick="startBreakout('${winId}')" style="padding:10px 20px;background:#ff00ff;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:16px;">Start Game</button>
                    <div style="margin-top:20px;font-size:12px;text-align:center;color:#ccc;">
                        Use LEFT / RIGHT ARROWS or MOUSE to move paddle.<br>
                        Break all bricks to advance levels.<br>
                        Watch out for special power-up drops (Laser, Multi-ball)!
                    </div>
                </div>
            </div>
        </div>
    `;

    breakoutState[winId] = {
        canvas: document.getElementById(`${winId}-breakout-canvas`),
        ctx: document.getElementById(`${winId}-breakout-canvas`).getContext('2d'),
        paddle: { x: 250, y: 470, w: 100, h: 10, dx: 7, isLaser: false, laserTimer: 0 },
        balls: [],
        bricks: [],
        powerups: [],
        lasers: [],
        score: 0,
        highScore: highScore,
        level: 1,
        gameOver: false,
        running: false,
        loopId: null,
        rightPressed: false,
        leftPressed: false,
        boss: null
    };

    const keyDownHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        if(e.key === 'ArrowRight' || e.key === 'Right') breakoutState[winId].rightPressed = true;
        if(e.key === 'ArrowLeft' || e.key === 'Left') breakoutState[winId].leftPressed = true;
    };
    
    const keyUpHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        if(e.key === 'ArrowRight' || e.key === 'Right') breakoutState[winId].rightPressed = false;
        if(e.key === 'ArrowLeft' || e.key === 'Left') breakoutState[winId].leftPressed = false;
    };

    const mouseMoveHandler = (e) => {
        const state = breakoutState[winId];
        if (!state || !state.running || state.gameOver) return;
        const rect = state.canvas.getBoundingClientRect();
        const scaleX = state.canvas.width / rect.width;
        const relativeX = (e.clientX - rect.left) * scaleX;
        if(relativeX > 0 && relativeX < state.canvas.width) {
            state.paddle.x = relativeX - state.paddle.w/2;
        }
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    document.getElementById(`${winId}-breakout-canvas`).addEventListener('mousemove', mouseMoveHandler);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            if (breakoutState[winId] && breakoutState[winId].loopId) {
                cancelAnimationFrame(breakoutState[winId].loopId);
            }
        };
    }
}

function initBreakoutLevel(winId, level) {
    const state = breakoutState[winId];
    state.bricks = [];
    state.balls = [{ x: 300, y: 450, dx: 4 * (Math.random()>0.5?1:-1), dy: -4, radius: 6 }];
    state.paddle.x = 250;
    state.powerups = [];
    state.lasers = [];
    state.boss = null;

    if (level % 3 === 0) {
        // Boss level
        state.boss = { x: 200, y: 50, w: 200, h: 50, hp: level * 10, maxHp: level * 10, dx: 3 };
    } else {
        // Normal level
        let rowCount = 3 + level;
        let colCount = 8;
        let p = 10, w = 62.5, h = 20, mt = 50, ml = 45;
        
        for(let c=0; c<colCount; c++) {
            for(let r=0; r<rowCount; r++) {
                let type = 'normal';
                let hp = 1;
                let color = `hsl(${r * 360/rowCount}, 100%, 50%)`;
                
                if (Math.random() < 0.1) {
                    type = 'hard'; hp = 2; color = '#ccc';
                }
                
                state.bricks.push({
                    x: (c*(w+p))+ml,
                    y: (r*(h+p))+mt,
                    w: w, h: h,
                    status: hp,
                    type: type,
                    color: color
                });
            }
        }
    }
}

function startBreakout(winId) {
    const state = breakoutState[winId];
    if (!state) return;
    
    document.getElementById(`${winId}-breakout-overlay`).style.display = 'none';
    state.score = 0;
    state.level = 1;
    state.gameOver = false;
    state.running = true;
    
    document.getElementById(`${winId}-breakout-score`).textContent = '0';
    document.getElementById(`${winId}-breakout-level`).textContent = '1';
    
    initBreakoutLevel(winId, state.level);
    
    if (state.loopId) cancelAnimationFrame(state.loopId);
    breakoutLoop(winId);
}

function breakoutLoop(winId) {
    const state = breakoutState[winId];
    if (!state || !state.running) return;

    if (!state.gameOver) {
        updateBreakout(winId);
    }
    drawBreakout(winId);

    if (!state.gameOver) {
        state.loopId = requestAnimationFrame(() => breakoutLoop(winId));
    }
}

function updateBreakout(winId) {
    const state = breakoutState[winId];
    
    // Move paddle
    if (state.rightPressed && state.paddle.x < 600 - state.paddle.w) state.paddle.x += state.paddle.dx;
    else if (state.leftPressed && state.paddle.x > 0) state.paddle.x -= state.paddle.dx;

    // Laser logic
    if (state.paddle.isLaser) {
        state.paddle.laserTimer--;
        if (state.paddle.laserTimer <= 0) state.paddle.isLaser = false;
        
        // Fire lasers randomly
        if (state.paddle.laserTimer % 20 === 0) {
            state.lasers.push({ x: state.paddle.x + 10, y: state.paddle.y, dy: -6 });
            state.lasers.push({ x: state.paddle.x + state.paddle.w - 10, y: state.paddle.y, dy: -6 });
        }
    }

    // Move lasers
    for (let i=state.lasers.length-1; i>=0; i--) {
        let l = state.lasers[i];
        l.y += l.dy;
        if (l.y < 0) state.lasers.splice(i, 1);
        else if (state.boss && l.x > state.boss.x && l.x < state.boss.x + state.boss.w && l.y < state.boss.y + state.boss.h && l.y > state.boss.y) {
            state.boss.hp--;
            state.lasers.splice(i, 1);
        } else {
            for(let j=0; j<state.bricks.length; j++) {
                let b = state.bricks[j];
                if (b.status > 0 && l.x > b.x && l.x < b.x+b.w && l.y > b.y && l.y < b.y+b.h) {
                    b.status--;
                    state.lasers.splice(i, 1);
                    if (b.status <= 0) state.score += 10;
                    break;
                }
            }
        }
    }

    // Move powerups
    for (let i=state.powerups.length-1; i>=0; i--) {
        let p = state.powerups[i];
        p.y += 2;
        if (p.y > 500) {
            state.powerups.splice(i, 1);
        } else if (p.x > state.paddle.x && p.x < state.paddle.x + state.paddle.w && p.y + 10 > state.paddle.y) {
            // Collect powerup
            if (p.type === 'multi') {
                if (state.balls.length > 0) {
                    let b = state.balls[0];
                    state.balls.push({x: b.x, y: b.y, dx: -b.dx, dy: b.dy, radius: b.radius});
                    state.balls.push({x: b.x, y: b.y, dx: b.dx, dy: -b.dy, radius: b.radius});
                }
            } else if (p.type === 'laser') {
                state.paddle.isLaser = true;
                state.paddle.laserTimer = 300; // 5 seconds
            }
            state.powerups.splice(i, 1);
        }
    }

    // Boss movement
    if (state.boss) {
        state.boss.x += state.boss.dx;
        if (state.boss.x < 0 || state.boss.x + state.boss.w > 600) state.boss.dx = -state.boss.dx;
        if (state.boss.hp <= 0) {
            state.score += 500;
            state.boss = null;
        }
    }

    // Move balls
    for (let i=state.balls.length-1; i>=0; i--) {
        let ball = state.balls[i];
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision
        if(ball.x + ball.dx > 600-ball.radius || ball.x + ball.dx < ball.radius) ball.dx = -ball.dx;
        if(ball.y + ball.dy < ball.radius) ball.dy = -ball.dy;
        
        // Paddle collision
        if(ball.y + ball.dy > 470 - ball.radius && ball.x > state.paddle.x && ball.x < state.paddle.x + state.paddle.w) {
            ball.dy = -ball.dy;
            ball.y = 470 - ball.radius;
            // Angle adjustment
            let hitPoint = ball.x - (state.paddle.x + state.paddle.w/2);
            ball.dx = hitPoint * 0.15;
        }
        else if(ball.y + ball.dy > 500) {
            state.balls.splice(i, 1);
        }

        // Boss collision
        if (state.boss && ball.x > state.boss.x && ball.x < state.boss.x + state.boss.w && ball.y > state.boss.y && ball.y < state.boss.y + state.boss.h) {
            ball.dy = -ball.dy;
            state.boss.hp--;
        }

        // Brick collision
        for(let c=0; c<state.bricks.length; c++) {
            let b = state.bricks[c];
            if(b.status > 0) {
                if(ball.x > b.x && ball.x < b.x+b.w && ball.y > b.y && ball.y < b.y+b.h) {
                    ball.dy = -ball.dy;
                    b.status--;
                    if(b.status <= 0) {
                        state.score += 10;
                        document.getElementById(`${winId}-breakout-score`).textContent = state.score;
                        
                        // Drop powerup (15% chance)
                        if (Math.random() < 0.15) {
                            state.powerups.push({ x: b.x + b.w/2, y: b.y, type: Math.random()<0.5 ? 'multi' : 'laser' });
                        }
                    }
                }
            }
        }
    }

    if (state.balls.length === 0) {
        endBreakout(winId);
        return;
    }

    // Check level complete
    if (!state.boss) {
        let activeBricks = state.bricks.filter(b => b.status > 0);
        if (activeBricks.length === 0) {
            state.level++;
            document.getElementById(`${winId}-breakout-level`).textContent = state.level;
            initBreakoutLevel(winId, state.level);
        }
    } else {
        if (state.boss.hp <= 0) {
            state.level++;
            document.getElementById(`${winId}-breakout-level`).textContent = state.level;
            initBreakoutLevel(winId, state.level);
        }
    }
}

function drawBreakout(winId) {
    const state = breakoutState[winId];
    const ctx = state.ctx;

    ctx.clearRect(0, 0, 600, 500);

    // Draw Bricks
    for(let c=0; c<state.bricks.length; c++) {
        let b = state.bricks[c];
        if(b.status > 0) {
            ctx.fillStyle = b.status === 2 ? '#888' : b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            
            if (b.status === 2) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(b.x + b.w/2 - 2, b.y + b.h/2 - 2, 4, 4);
            }
        }
    }

    // Draw Boss
    if (state.boss) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(state.boss.x, state.boss.y, state.boss.w, state.boss.h);
        ctx.fillStyle = '#000';
        ctx.fillRect(state.boss.x + 20, state.boss.y + 10, 40, 10);
        ctx.fillRect(state.boss.x + state.boss.w - 60, state.boss.y + 10, 40, 10);
        // HP bar
        ctx.fillStyle = '#333';
        ctx.fillRect(state.boss.x, state.boss.y - 15, state.boss.w, 10);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(state.boss.x, state.boss.y - 15, state.boss.w * (state.boss.hp / state.boss.maxHp), 10);
    }

    // Draw Powerups
    state.powerups.forEach(p => {
        ctx.fillStyle = p.type === 'multi' ? '#00ffff' : '#ff00ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText(p.type === 'multi' ? 'M' : 'L', p.x-4, p.y+3);
    });

    // Draw Lasers
    ctx.fillStyle = '#ff00ff';
    state.lasers.forEach(l => {
        ctx.fillRect(l.x - 2, l.y, 4, 15);
    });

    // Draw Paddle
    ctx.fillStyle = state.paddle.isLaser ? '#ff00ff' : '#00d4ff';
    ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);
    if (state.paddle.isLaser) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(state.paddle.x + 5, state.paddle.y - 5, 10, 10);
        ctx.fillRect(state.paddle.x + state.paddle.w - 15, state.paddle.y - 5, 10, 10);
    }

    // Draw Balls
    ctx.fillStyle = '#fff';
    state.balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
        ctx.fill();
    });
}

function endBreakout(winId) {
    const state = breakoutState[winId];
    state.gameOver = true;
    state.running = false;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        let saves = JSON.parse(localStorage.getItem('game-saves') || '{}');
        if (!saves.breakout) saves.breakout = {};
        saves.breakout.highScore = state.highScore;
        localStorage.setItem('game-saves', JSON.stringify(saves));
        document.getElementById(`${winId}-breakout-best`).textContent = state.highScore;
    }
    
    const overlay = document.getElementById(`${winId}-breakout-overlay`);
    overlay.style.display = 'flex';
    overlay.querySelector('h2').textContent = 'GAME OVER';
    overlay.querySelector('h2').style.color = '#ff0000';
    overlay.querySelector('button').textContent = 'Play Again';
}
