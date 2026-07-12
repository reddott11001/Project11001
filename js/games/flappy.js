let flappyState = {};

function renderFlappy(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const highScore = gameSaves.flappy ? gameSaves.flappy.highScore : 0;
    
    body.innerHTML = `
        <div class="flappy-app" id="${winId}-flappy-app" style="width:100%;height:100%;display:flex;flex-direction:column;background:#87CEEB;color:#000;">
            <div class="flappy-header" style="display:flex;justify-content:space-between;padding:10px;background:#55bbee;border-bottom:2px solid #fff;">
                <div style="font-weight:bold;">Score: <span id="${winId}-flappy-score">0</span></div>
                <div style="font-weight:bold;">Best: <span id="${winId}-flappy-best">${highScore}</span></div>
            </div>
            <div class="flappy-game-area" style="flex:1;position:relative;display:flex;justify-content:center;align-items:center;overflow:hidden;">
                <canvas id="${winId}-flappy-canvas" width="400" height="500" style="max-width:100%;max-height:100%;object-fit:contain;background:transparent;"></canvas>
                
                <div id="${winId}-flappy-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:10;color:white;">
                    <h2 style="margin-bottom:20px;font-size:32px;">FLAPPY BIRD</h2>
                    <div style="margin-bottom:15px;text-align:center;">
                        <label style="display:block;margin-bottom:5px;">Select Character:</label>
                        <select id="${winId}-flappy-char" style="padding:5px;background:#fff;color:#000;border-radius:4px;">
                            <option value="yellow">Yellow Bird</option>
                            <option value="blue">Blue Bird</option>
                            <option value="red">Red Bird</option>
                        </select>
                    </div>
                    <div style="margin-bottom:15px;text-align:center;">
                        <label style="display:block;margin-bottom:5px;">Time of Day:</label>
                        <select id="${winId}-flappy-time" style="padding:5px;background:#fff;color:#000;border-radius:4px;">
                            <option value="day">Day (Sunny)</option>
                            <option value="night">Night (Dark)</option>
                            <option value="rain">Rain (Hard)</option>
                        </select>
                    </div>
                    <button onclick="startFlappy('${winId}')" style="padding:10px 20px;background:#ffcc00;color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:16px;">Fly!</button>
                    <div style="margin-top:20px;font-size:12px;text-align:center;">
                        Press SPACE, UP, or CLICK to flap.<br>
                        Dodge the pipes!
                    </div>
                </div>
            </div>
        </div>
    `;

    flappyState[winId] = {
        canvas: document.getElementById(`${winId}-flappy-canvas`),
        ctx: document.getElementById(`${winId}-flappy-canvas`).getContext('2d'),
        bird: { x: 50, y: 250, velocity: 0, gravity: 0.25, jump: -5.5, size: 20 },
        pipes: [],
        pipeWidth: 50,
        pipeGap: 140,
        frame: 0,
        score: 0,
        highScore: highScore,
        gameOver: false,
        running: false,
        loopId: null,
        char: 'yellow',
        time: 'day',
        particles: []
    };

    const jump = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        if (e && e.type === 'keydown' && e.key !== ' ' && e.key !== 'ArrowUp') return;
        if (e && e.type === 'keydown') e.preventDefault();

        const state = flappyState[winId];
        if (state && state.running && !state.gameOver) {
            state.bird.velocity = state.bird.jump;
        }
    };

    document.addEventListener('keydown', jump);
    document.getElementById(`${winId}-flappy-canvas`).addEventListener('mousedown', jump);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', jump);
            if (flappyState[winId] && flappyState[winId].loopId) {
                cancelAnimationFrame(flappyState[winId].loopId);
            }
        };
    }
}

function startFlappy(winId) {
    const state = flappyState[winId];
    if (!state) return;
    
    document.getElementById(`${winId}-flappy-overlay`).style.display = 'none';
    state.char = document.getElementById(`${winId}-flappy-char`).value;
    state.time = document.getElementById(`${winId}-flappy-time`).value;
    
    const appBg = document.getElementById(`${winId}-flappy-app`);
    if (state.time === 'night') appBg.style.background = '#0a0a2a';
    else if (state.time === 'rain') appBg.style.background = '#4a5a6a';
    else appBg.style.background = '#87CEEB';

    state.bird.y = 250;
    state.bird.velocity = 0;
    state.pipes = [];
    state.frame = 0;
    state.score = 0;
    state.gameOver = false;
    state.running = true;
    state.particles = [];
    
    document.getElementById(`${winId}-flappy-score`).textContent = '0';
    
    if (state.loopId) cancelAnimationFrame(state.loopId);
    flappyLoop(winId);
}

function flappyLoop(winId) {
    const state = flappyState[winId];
    if (!state || !state.running) return;

    if (!state.gameOver) {
        updateFlappy(winId);
    }
    drawFlappy(winId);

    if (!state.gameOver) {
        state.loopId = requestAnimationFrame(() => flappyLoop(winId));
    }
}

function updateFlappy(winId) {
    const state = flappyState[winId];
    state.frame++;

    // Weather effects
    if (state.time === 'rain' && state.frame % 2 === 0) {
        state.particles.push({
            x: Math.random() * 400,
            y: -10,
            vy: 10 + Math.random() * 5,
            length: 10 + Math.random() * 10
        });
    }

    // Move weather particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.y += p.vy;
        if (p.y > 500) state.particles.splice(i, 1);
    }

    // Bird physics
    state.bird.velocity += state.bird.gravity;
    state.bird.y += state.bird.velocity;

    // Floor and ceiling collision
    if (state.bird.y + state.bird.size > 500 || state.bird.y - state.bird.size < 0) {
        endFlappy(winId);
        return;
    }

    // Spawn pipes
    if (state.frame % 100 === 0) {
        let maxPos = 400 - state.pipeGap - 50;
        let pos = Math.floor(Math.random() * maxPos) + 50;
        state.pipes.push({
            x: 400,
            top: pos,
            bottom: pos + state.pipeGap,
            passed: false
        });
    }

    // Move pipes & collision
    for (let i = 0; i < state.pipes.length; i++) {
        let p = state.pipes[i];
        p.x -= 2.5; // Speed

        // Collision
        if (
            state.bird.x + state.bird.size > p.x &&
            state.bird.x - state.bird.size < p.x + state.pipeWidth &&
            (state.bird.y - state.bird.size < p.top || state.bird.y + state.bird.size > p.bottom)
        ) {
            endFlappy(winId);
            return;
        }

        // Score
        if (p.x + state.pipeWidth < state.bird.x && !p.passed) {
            state.score++;
            p.passed = true;
            document.getElementById(`${winId}-flappy-score`).textContent = state.score;
            
            // Check achievement (multiple of 10)
            if (state.score > 0 && state.score % 10 === 0) {
                addNotification('🏆 Achievement Unlocked', `Score ${state.score} in Flappy Bird!`);
            }
        }
    }

    // Remove off-screen pipes
    if (state.pipes.length > 0 && state.pipes[0].x < -state.pipeWidth) {
        state.pipes.shift();
    }
}

function drawFlappy(winId) {
    const state = flappyState[winId];
    const ctx = state.ctx;

    ctx.clearRect(0, 0, 400, 500);

    // Draw rain
    if (state.time === 'rain') {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        state.particles.forEach(p => {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 2, p.y + p.length);
        });
        ctx.stroke();
    }

    // Draw pipes
    ctx.fillStyle = '#2ecc71';
    if (state.time === 'night') ctx.fillStyle = '#1e824c';
    
    state.pipes.forEach(p => {
        // Top pipe
        ctx.fillRect(p.x, 0, state.pipeWidth, p.top);
        ctx.strokeRect(p.x, 0, state.pipeWidth, p.top); // border
        // Bottom pipe
        ctx.fillRect(p.x, p.bottom, state.pipeWidth, 500 - p.bottom);
        ctx.strokeRect(p.x, p.bottom, state.pipeWidth, 500 - p.bottom);
    });

    // Draw Bird
    ctx.save();
    ctx.translate(state.bird.x, state.bird.y);
    let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (state.bird.velocity * 0.1)));
    ctx.rotate(rotation);

    let birdColor = '#ffd700'; // yellow
    if (state.char === 'blue') birdColor = '#3498db';
    if (state.char === 'red') birdColor = '#e74c3c';

    // Body
    ctx.fillStyle = birdColor;
    ctx.beginPath();
    ctx.arc(0, 0, state.bird.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(10, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.lineTo(25, 5);
    ctx.lineTo(10, 10);
    ctx.fill();
    ctx.stroke();
    
    // Wing
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-5, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

function endFlappy(winId) {
    const state = flappyState[winId];
    state.gameOver = true;
    state.running = false;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        let saves = JSON.parse(localStorage.getItem('game-saves') || '{}');
        if (!saves.flappy) saves.flappy = {};
        saves.flappy.highScore = state.highScore;
        localStorage.setItem('game-saves', JSON.stringify(saves));
        document.getElementById(`${winId}-flappy-best`).textContent = state.highScore;
    }
    
    const overlay = document.getElementById(`${winId}-flappy-overlay`);
    overlay.style.display = 'flex';
    overlay.querySelector('h2').textContent = 'GAME OVER';
    overlay.querySelector('button').textContent = 'Play Again';
}
