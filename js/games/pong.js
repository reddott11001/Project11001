let pongState = {};

function renderPong(winId) {
    const body = document.getElementById(winId + '-body');
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const highScore = gameSaves.pong ? gameSaves.pong.highScore : 0;
    
    body.innerHTML = `
        <div class="pong-app" id="${winId}-pong-app" style="width:100%;height:100%;display:flex;flex-direction:column;background:#000;color:#fff;">
            <div class="pong-header" style="display:flex;justify-content:space-between;padding:10px;background:#111;border-bottom:2px solid #fff;">
                <div style="font-weight:bold;color:#0f0;">Player 1: <span id="${winId}-pong-score1">0</span></div>
                <div style="font-weight:bold;color:#f00;">Player 2 / AI: <span id="${winId}-pong-score2">0</span></div>
            </div>
            <div class="pong-game-area" style="flex:1;position:relative;display:flex;justify-content:center;align-items:center;overflow:hidden;">
                <canvas id="${winId}-pong-canvas" width="700" height="400" style="max-width:100%;max-height:100%;object-fit:contain;background:#000;"></canvas>
                
                <div id="${winId}-pong-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:10;color:white;">
                    <h2 style="color:#fff;margin-bottom:20px;font-size:36px;letter-spacing:10px;">PONG</h2>
                    <div style="margin-bottom:20px;">
                        <button onclick="startPong('${winId}', 'ai')" style="padding:10px 20px;background:#0f0;color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:16px;margin:5px;">1 Player (vs AI)</button>
                        <button onclick="startPong('${winId}', 'multi')" style="padding:10px 20px;background:#f00;color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:16px;margin:5px;">2 Players</button>
                    </div>
                    <div style="margin-top:20px;font-size:12px;text-align:center;color:#ccc;">
                        P1: W / S to move.<br>
                        P2: UP / DOWN to move.<br>
                        First to 7 wins! Watch for random power-ups!
                    </div>
                </div>
            </div>
        </div>
    `;

    pongState[winId] = {
        canvas: document.getElementById(`${winId}-pong-canvas`),
        ctx: document.getElementById(`${winId}-pong-canvas`).getContext('2d'),
        paddle1: { x: 20, y: 150, w: 10, h: 80, dy: 0, speed: 6 },
        paddle2: { x: 670, y: 150, w: 10, h: 80, dy: 0, speed: 6 },
        ball: { x: 350, y: 200, r: 8, dx: 5, dy: 5, speed: 7 },
        powerups: [],
        particles: [],
        score1: 0,
        score2: 0,
        mode: 'ai', // 'ai' or 'multi'
        gameOver: false,
        running: false,
        loopId: null,
        keys: {}
    };

    const keyHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        pongState[winId].keys[e.key.toLowerCase()] = e.type === 'keydown';
        if(['w','s','arrowup','arrowdown'].includes(e.key.toLowerCase())) e.preventDefault();
    };

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyHandler);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            document.removeEventListener('keyup', keyHandler);
            if (pongState[winId] && pongState[winId].loopId) cancelAnimationFrame(pongState[winId].loopId);
        };
    }
}

function startPong(winId, mode) {
    const state = pongState[winId];
    if (!state) return;
    
    document.getElementById(`${winId}-pong-overlay`).style.display = 'none';
    state.mode = mode;
    state.score1 = 0;
    state.score2 = 0;
    document.getElementById(`${winId}-pong-score1`).textContent = '0';
    document.getElementById(`${winId}-pong-score2`).textContent = '0';
    
    state.gameOver = false;
    state.running = true;
    
    resetPongBall(winId);
    
    if (state.loopId) cancelAnimationFrame(state.loopId);
    pongLoop(winId);
}

function resetPongBall(winId) {
    const state = pongState[winId];
    state.ball.x = 350;
    state.ball.y = 200;
    state.ball.speed = 7;
    state.ball.dx = (Math.random() > 0.5 ? 1 : -1) * state.ball.speed;
    state.ball.dy = (Math.random() * 2 - 1) * state.ball.speed;
    state.powerups = [];
    state.paddle1.h = 80;
    state.paddle2.h = 80;
}

function pongLoop(winId) {
    const state = pongState[winId];
    if (!state || !state.running) return;

    if (!state.gameOver) updatePong(winId);
    drawPong(winId);

    if (!state.gameOver) {
        state.loopId = requestAnimationFrame(() => pongLoop(winId));
    }
}

function updatePong(winId) {
    const state = pongState[winId];
    
    // Player 1 Movement
    if (state.keys['w'] && state.paddle1.y > 0) state.paddle1.y -= state.paddle1.speed;
    if (state.keys['s'] && state.paddle1.y < 400 - state.paddle1.h) state.paddle1.y += state.paddle1.speed;
    
    // Player 2 Movement
    if (state.mode === 'multi') {
        if (state.keys['arrowup'] && state.paddle2.y > 0) state.paddle2.y -= state.paddle2.speed;
        if (state.keys['arrowdown'] && state.paddle2.y < 400 - state.paddle2.h) state.paddle2.y += state.paddle2.speed;
    } else {
        // AI Logic
        let targetY = state.ball.y - state.paddle2.h/2;
        // Introduce some delay/error based on ball speed
        if (state.paddle2.y < targetY - 10) state.paddle2.y += state.paddle2.speed * 0.8;
        if (state.paddle2.y > targetY + 10) state.paddle2.y -= state.paddle2.speed * 0.8;
        // Clamp
        if (state.paddle2.y < 0) state.paddle2.y = 0;
        if (state.paddle2.y > 400 - state.paddle2.h) state.paddle2.y = 400 - state.paddle2.h;
    }
    
    // Move ball
    state.ball.x += state.ball.dx;
    state.ball.y += state.ball.dy;
    
    // Wall bounce
    if (state.ball.y < state.ball.r || state.ball.y > 400 - state.ball.r) {
        state.ball.dy *= -1;
    }
    
    // Paddle collision
    let hitPaddle = (paddle, isLeft) => {
        if (state.ball.y + state.ball.r > paddle.y && state.ball.y - state.ball.r < paddle.y + paddle.h) {
            if (isLeft && state.ball.x - state.ball.r < paddle.x + paddle.w && state.ball.dx < 0) {
                state.ball.dx *= -1;
                let hitPoint = (state.ball.y - (paddle.y + paddle.h/2)) / (paddle.h/2);
                state.ball.dy = hitPoint * state.ball.speed;
                state.ball.speed += 0.5; // increase speed
                state.ball.dx = state.ball.speed;
                addPongParticle(state, state.ball.x, state.ball.y, '#fff');
            } else if (!isLeft && state.ball.x + state.ball.r > paddle.x && state.ball.dx > 0) {
                state.ball.dx *= -1;
                let hitPoint = (state.ball.y - (paddle.y + paddle.h/2)) / (paddle.h/2);
                state.ball.dy = hitPoint * state.ball.speed;
                state.ball.speed += 0.5;
                state.ball.dx = -state.ball.speed;
                addPongParticle(state, state.ball.x, state.ball.y, '#fff');
            }
        }
    };
    hitPaddle(state.paddle1, true);
    hitPaddle(state.paddle2, false);
    
    // Spawn Powerups
    if (Math.random() < 0.002 && state.powerups.length < 2) {
        state.powerups.push({
            x: 350, y: Math.random() * 300 + 50,
            r: 15,
            type: Math.random() < 0.5 ? 'big' : 'fast'
        });
    }
    
    // Powerup collision
    for(let i=state.powerups.length-1; i>=0; i--) {
        let p = state.powerups[i];
        let dist = Math.hypot(state.ball.x - p.x, state.ball.y - p.y);
        if (dist < state.ball.r + p.r) {
            if (p.type === 'big') {
                if (state.ball.dx > 0) state.paddle1.h = 120; // Last hit by p1
                else state.paddle2.h = 120;
            } else {
                state.ball.speed += 3;
                state.ball.dx = state.ball.dx > 0 ? state.ball.speed : -state.ball.speed;
            }
            state.powerups.splice(i, 1);
        }
    }
    
    // Particles
    for(let i=state.particles.length-1; i>=0; i--) {
        let p = state.particles[i];
        p.x += p.dx; p.y += p.dy; p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
    
    // Score
    if (state.ball.x < 0) {
        state.score2++;
        document.getElementById(`${winId}-pong-score2`).textContent = state.score2;
        checkPongWin(winId);
        if (!state.gameOver) resetPongBall(winId);
    } else if (state.ball.x > 700) {
        state.score1++;
        document.getElementById(`${winId}-pong-score1`).textContent = state.score1;
        checkPongWin(winId);
        if (!state.gameOver) resetPongBall(winId);
    }
}

function addPongParticle(state, x, y, color) {
    for(let i=0; i<10; i++) {
        state.particles.push({
            x: x, y: y,
            dx: (Math.random()-0.5)*10,
            dy: (Math.random()-0.5)*10,
            color: color,
            life: 20
        });
    }
}

function checkPongWin(winId) {
    const state = pongState[winId];
    if (state.score1 >= 7 || state.score2 >= 7) {
        state.gameOver = true;
        const overlay = document.getElementById(`${winId}-pong-overlay`);
        overlay.style.display = 'flex';
        overlay.querySelector('h2').textContent = state.score1 >= 7 ? 'PLAYER 1 WINS' : (state.mode==='multi'?'PLAYER 2 WINS':'AI WINS');
    }
}

function drawPong(winId) {
    const state = pongState[winId];
    const ctx = state.ctx;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 700, 400);
    
    // Net
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(350, 0);
    ctx.lineTo(350, 400);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Powerups
    state.powerups.forEach(p => {
        ctx.fillStyle = p.type === 'big' ? '#0f0' : '#f00';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(p.type === 'big' ? 'B' : 'F', p.x-4, p.y+4);
    });

    // Paddles
    ctx.fillStyle = '#0f0';
    ctx.fillRect(state.paddle1.x, state.paddle1.y, state.paddle1.w, state.paddle1.h);
    ctx.fillStyle = '#f00';
    ctx.fillRect(state.paddle2.x, state.paddle2.y, state.paddle2.w, state.paddle2.h);
    
    // Particles
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;

    // Ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI*2);
    ctx.fill();
}
