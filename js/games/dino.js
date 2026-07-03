let dinoStates = {};

function renderDinoGame(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#f7f7f7;font-family:Arial,sans-serif;">
            <canvas id="${winId}-dino-canvas" width="600" height="150" style="border:1px solid #ddd;background:#fff;"></canvas>
            <div style="margin-top:12px;color:#535353;font-size:12px;">Press SPACE or UP to jump</div>
        </div>
    `;

    const canvas = document.getElementById(winId + '-dino-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const state = {
        dino: { x: 50, y: 120, width: 20, height: 30, jumping: false, jumpVelocity: 0 },
        obstacles: [],
        score: 0,
        gameOver: false,
        speed: 5,
        frame: 0,
        running: true,
        winId: winId
    };
    dinoStates[winId] = state;

    function jump() {
        if (!state.dino.jumping && !state.gameOver) {
            state.dino.jumping = true;
            state.dino.jumpVelocity = -12;
        } else if (state.gameOver) {
            resetGame();
        }
    }

    const keydownHandler = (e) => {
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            jump();
        }
    };
    document.addEventListener('keydown', keydownHandler);

    canvas.addEventListener('click', jump);

    function resetGame() {
        state.dino.y = 120;
        state.dino.jumping = false;
        state.dino.jumpVelocity = 0;
        state.obstacles = [];
        state.score = 0;
        state.gameOver = false;
        state.speed = 5;
    }

    function update() {
        if (!state.running || state.gameOver) return;

        state.frame++;
        state.score += 0.1;

        // Dino physics
        if (state.dino.jumping) {
            state.dino.jumpVelocity += 0.6;
            state.dino.y += state.dino.jumpVelocity;
            if (state.dino.y >= 120) {
                state.dino.y = 120;
                state.dino.jumping = false;
                state.dino.jumpVelocity = 0;
            }
        }

        // Spawn obstacles
        if (state.frame % 90 === 0) {
            const height = Math.random() > 0.5 ? 20 : 30;
            state.obstacles.push({
                x: canvas.width,
                y: 150 - height,
                width: 15,
                height: height
            });
        }

        // Move obstacles
        state.obstacles.forEach(obs => {
            obs.x -= state.speed;
        });

        // Remove off-screen obstacles
        state.obstacles = state.obstacles.filter(obs => obs.x + obs.width > 0);

        // Collision detection
        state.obstacles.forEach(obs => {
            if (state.dino.x < obs.x + obs.width &&
                state.dino.x + state.dino.width > obs.x &&
                state.dino.y < obs.y + obs.height &&
                state.dino.y + state.dino.height > obs.y) {
                state.gameOver = true;
            }
        });

        // Increase speed
        if (state.frame % 500 === 0) {
            state.speed += 0.5;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Ground
        ctx.strokeStyle = '#535353';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 150);
        ctx.lineTo(canvas.width, 150);
        ctx.stroke();

        // Dino
        ctx.fillStyle = '#535353';
        ctx.fillRect(state.dino.x, state.dino.y, state.dino.width, state.dino.height);
        // Dino eye
        ctx.fillStyle = '#fff';
        ctx.fillRect(state.dino.x + 12, state.dino.y + 4, 4, 4);

        // Obstacles (cacti)
        ctx.fillStyle = '#535353';
        state.obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            // Cactus details
            ctx.fillRect(obs.x - 3, obs.y + 5, 3, 8);
            ctx.fillRect(obs.x + obs.width, obs.y + 8, 3, 6);
        });

        // Score
        ctx.fillStyle = '#535353';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Score: ' + Math.floor(state.score), canvas.width - 10, 20);

        // Game over
        if (state.gameOver) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#535353';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
            ctx.font = '12px Arial';
            ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 15);
        }
    }

    function gameLoop() {
        if (!state.running) return;
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            state.running = false;
            document.removeEventListener('keydown', keydownHandler);
            delete dinoStates[winId];
        };
    }
}
