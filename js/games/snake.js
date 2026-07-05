let snakeState = {};

function renderSnake(winId) {
    const body = document.getElementById(winId + '-body');
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const highScore = gameSaves.snake ? gameSaves.snake.highScore : 0;
    
    body.innerHTML = `
        <div class="snake-app" id="${winId}-snake-app" style="width:100%;height:100%;display:flex;flex-direction:column;background:#111;color:#fff;">
            <div class="snake-header" style="display:flex;justify-content:space-between;padding:10px;background:#222;border-bottom:2px solid #00ff00;">
                <div style="font-weight:bold;color:#00ff00;">Score: <span id="${winId}-snake-score">0</span></div>
                <div style="font-weight:bold;color:#ffd700;">Best: <span id="${winId}-snake-best">${highScore}</span></div>
            </div>
            <div class="snake-game-area" style="flex:1;position:relative;display:flex;justify-content:center;align-items:center;background:#000;overflow:hidden;">
                <canvas id="${winId}-snake-canvas" width="400" height="400" style="max-width:100%;max-height:100%;object-fit:contain;background:#1a1a1a;border:1px solid #333;"></canvas>
                
                <div id="${winId}-snake-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:10;">
                    <h2 style="color:#00ff00;margin-bottom:20px;font-size:32px;">SNAKE</h2>
                    <div style="margin-bottom:15px;text-align:center;">
                        <label style="color:#ccc;display:block;margin-bottom:5px;">Select Skin:</label>
                        <select id="${winId}-snake-skin" style="padding:5px;background:#333;color:#fff;border:1px solid #00ff00;border-radius:4px;">
                            <option value="#00ff00">Classic Green</option>
                            <option value="#00ffff">Cyan Neon</option>
                            <option value="#ff00ff">Magenta Pulse</option>
                            <option value="#ffff00">Golden Snake</option>
                        </select>
                    </div>
                    <button onclick="startSnake('${winId}')" style="padding:10px 20px;background:#00ff00;color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:16px;">Start Game</button>
                    <div style="margin-top:20px;color:#888;font-size:12px;text-align:center;">
                        Use ARROW KEYS to move.<br>
                        🍎 = 1 Point | 🌟 = 3 Points & Shield | 👺 = Enemy (Avoid!)
                    </div>
                </div>
            </div>
        </div>
    `;

    snakeState[winId] = {
        canvas: document.getElementById(`${winId}-snake-canvas`),
        ctx: document.getElementById(`${winId}-snake-canvas`).getContext('2d'),
        grid: 20,
        snake: [],
        dx: 20,
        dy: 0,
        apple: {x: 100, y: 100},
        powerup: null,
        enemy: {x: 200, y: 200, dx: 20, dy: 20},
        score: 0,
        highScore: highScore,
        gameOver: false,
        running: false,
        loopTimeout: null,
        skin: '#00ff00',
        shield: 0
    };

    const keyHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].indexOf(e.key) > -1) {
            e.preventDefault();
        }

        const state = snakeState[winId];
        if (!state || !state.running) return;

        if (e.key === 'ArrowLeft' && state.dx === 0) {
            state.dx = -state.grid;
            state.dy = 0;
        } else if (e.key === 'ArrowUp' && state.dy === 0) {
            state.dy = -state.grid;
            state.dx = 0;
        } else if (e.key === 'ArrowRight' && state.dx === 0) {
            state.dx = state.grid;
            state.dy = 0;
        } else if (e.key === 'ArrowDown' && state.dy === 0) {
            state.dy = state.grid;
            state.dx = 0;
        }
    };
    document.addEventListener('keydown', keyHandler);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            if (snakeState[winId] && snakeState[winId].loopTimeout) {
                clearTimeout(snakeState[winId].loopTimeout);
            }
        };
    }
}

function startSnake(winId) {
    const state = snakeState[winId];
    if (!state) return;
    
    document.getElementById(`${winId}-snake-overlay`).style.display = 'none';
    state.skin = document.getElementById(`${winId}-snake-skin`).value;
    
    state.snake = [
        {x: 160, y: 160},
        {x: 140, y: 160},
        {x: 120, y: 160},
        {x: 100, y: 160}
    ];
    state.dx = state.grid;
    state.dy = 0;
    state.score = 0;
    state.shield = 0;
    state.gameOver = false;
    state.running = true;
    document.getElementById(`${winId}-snake-score`).textContent = '0';
    
    placeSnakeApple(winId);
    state.powerup = null;
    state.enemy = {
        x: Math.floor(Math.random() * (400/state.grid)) * state.grid,
        y: Math.floor(Math.random() * (400/state.grid)) * state.grid,
        dx: state.grid,
        dy: state.grid
    };
    
    if (state.loopTimeout) clearTimeout(state.loopTimeout);
    snakeLoop(winId);
}

function placeSnakeApple(winId) {
    const state = snakeState[winId];
    state.apple.x = Math.floor(Math.random() * (400 / state.grid)) * state.grid;
    state.apple.y = Math.floor(Math.random() * (400 / state.grid)) * state.grid;
}

function snakeLoop(winId) {
    const state = snakeState[winId];
    if (!state || !state.running) return;

    state.loopTimeout = setTimeout(() => {
        if (!state.gameOver) {
            updateSnake(winId);
            drawSnake(winId);
            snakeLoop(winId);
        }
    }, 100);
}

function updateSnake(winId) {
    const state = snakeState[winId];
    
    const head = {x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy};
    
    if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400) {
        endSnakeGame(winId);
        return;
    }
    
    for (let i = 0; i < state.snake.length; i++) {
        if (head.x === state.snake[i].x && head.y === state.snake[i].y) {
            endSnakeGame(winId);
            return;
        }
    }
    
    state.snake.unshift(head);
    
    if (head.x === state.apple.x && head.y === state.apple.y) {
        state.score++;
        document.getElementById(`${winId}-snake-score`).textContent = state.score;
        placeSnakeApple(winId);
        
        if (!state.powerup && Math.random() < 0.1) {
            state.powerup = {
                x: Math.floor(Math.random() * (400 / state.grid)) * state.grid,
                y: Math.floor(Math.random() * (400 / state.grid)) * state.grid,
                timer: 100 
            };
        }
    } else {
        state.snake.pop();
    }
    
    if (state.powerup) {
        if (head.x === state.powerup.x && head.y === state.powerup.y) {
            state.score += 3;
            state.shield = 50; 
            document.getElementById(`${winId}-snake-score`).textContent = state.score;
            state.powerup = null;
        } else {
            state.powerup.timer--;
            if (state.powerup.timer <= 0) state.powerup = null;
        }
    }
    
    if (state.shield > 0) state.shield--;
    
    if (Math.random() < 0.3) {
        if (Math.random() < 0.5) state.enemy.dx = (Math.random() < 0.5 ? 1 : -1) * state.grid;
        else state.enemy.dy = (Math.random() < 0.5 ? 1 : -1) * state.grid;
    }
    
    state.enemy.x += state.enemy.dx;
    state.enemy.y += state.enemy.dy;
    
    if (state.enemy.x < 0) { state.enemy.x = 0; state.enemy.dx *= -1; }
    if (state.enemy.x >= 400) { state.enemy.x = 400 - state.grid; state.enemy.dx *= -1; }
    if (state.enemy.y < 0) { state.enemy.y = 0; state.enemy.dy *= -1; }
    if (state.enemy.y >= 400) { state.enemy.y = 400 - state.grid; state.enemy.dy *= -1; }
    
    if (state.shield === 0) {
        for (let i = 0; i < state.snake.length; i++) {
            if (state.enemy.x === state.snake[i].x && state.enemy.y === state.snake[i].y) {
                endSnakeGame(winId);
                return;
            }
        }
    }
}

function drawSnake(winId) {
    const state = snakeState[winId];
    const ctx = state.ctx;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 400, 400);
    
    ctx.strokeStyle = '#222';
    for(let i=0; i<=400; i+=state.grid) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, 400);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(400, i);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(state.apple.x + 2, state.apple.y + 2, state.grid - 4, state.grid - 4);
    
    if (state.powerup) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(state.powerup.x + state.grid/2, state.powerup.y + state.grid/2, state.grid/2 - 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(state.enemy.x + 1, state.enemy.y + 1, state.grid - 2, state.grid - 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(state.enemy.x + 4, state.enemy.y + 4, 4, 4);
    ctx.fillRect(state.enemy.x + 12, state.enemy.y + 4, 4, 4);
    
    for (let i = 0; i < state.snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#fff' : state.skin;
        if (state.shield > 0 && i % 2 === 0) ctx.fillStyle = '#00d4ff'; 
        ctx.fillRect(state.snake[i].x + 1, state.snake[i].y + 1, state.grid - 2, state.grid - 2);
    }
}

function endSnakeGame(winId) {
    const state = snakeState[winId];
    state.gameOver = true;
    state.running = false;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        let saves = JSON.parse(localStorage.getItem('game-saves') || '{}');
        if (!saves.snake) saves.snake = {};
        saves.snake.highScore = state.highScore;
        localStorage.setItem('game-saves', JSON.stringify(saves));
        document.getElementById(`${winId}-snake-best`).textContent = state.highScore;
    }
    
    const overlay = document.getElementById(`${winId}-snake-overlay`);
    overlay.style.display = 'flex';
    overlay.querySelector('h2').textContent = 'GAME OVER';
    overlay.querySelector('h2').style.color = '#ff0000';
    overlay.querySelector('button').textContent = 'Play Again';
}
