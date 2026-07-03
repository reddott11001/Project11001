const FIGHTER_CANVAS_WIDTH = 680;
const FIGHTER_CANVAS_HEIGHT = 400;
const FIGHTER_GROUND_Y = 340;
const FIGHTER_GRAVITY = 0.8;
const FIGHTER_JUMP_FORCE = -15;

let fighterState = {};

function renderFighter(winId) {
    const body = document.getElementById(winId + '-body');
    
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const savedFight = gameSaves.fighter || null;
    
    const playerHP = savedFight ? Math.round(savedFight.playerHealth) : 100;
    const cpuHP = savedFight ? Math.round(savedFight.cpuHealth) : 100;
    const savedTimer = savedFight ? savedFight.timer : 60;
    
    body.innerHTML = `
        <div class="fighter-app" id="${winId}-fighter-app">
            <div class="fighter-hud">
                <div class="fighter-health-container">
                    <div class="fighter-name">PLAYER</div>
                    <div class="fighter-health-bar">
                        <div class="fighter-health-fill" id="${winId}-player-health" style="width:${playerHP}%"></div>
                    </div>
                </div>
                <div class="fighter-timer" id="${winId}-fighter-timer">${savedTimer}</div>
                <div class="fighter-health-container" style="text-align:right;">
                    <div class="fighter-name">CPU</div>
                    <div class="fighter-health-bar">
                        <div class="fighter-health-fill" id="${winId}-cpu-health" style="width:${cpuHP}%"></div>
                    </div>
                </div>
            </div>
            <div class="fighter-arena">
                <canvas id="${winId}-fighter-canvas" width="${FIGHTER_CANVAS_WIDTH}" height="${FIGHTER_CANVAS_HEIGHT}"></canvas>
                <div class="fighter-overlay" id="${winId}-fighter-overlay">
                    <h2>STREET BRAWL</h2>
                    <div class="subtitle">${savedFight ? 'Saved fight loaded! Continue or start new.' : 'Fight to the finish!'}</div>
                    <div style="display:flex;gap:8px;">
                        ${savedFight ? '<button onclick="resumeFighter(\'' + winId + '\')">Resume</button>' : ''}
                        <button onclick="startFighter('${winId}')">${savedFight ? 'New Fight' : 'Start Fight'}</button>
                    </div>
                </div>
            </div>
            <div class="fighter-controls-info">
                A/D: Move | W: Jump | J: Punch | K: Kick | L: Block
            </div>
        </div>
    `;

    fighterState[winId] = {
        player: createFighter(100, FIGHTER_GROUND_Y, 'player'),
        cpu: createFighter(500, FIGHTER_GROUND_Y, 'cpu'),
        gameRunning: false,
        gameOver: false,
        timer: savedTimer,
        timerInterval: null,
        keys: {},
        animFrame: null
    };
    
    if (savedFight) {
        fighterState[winId].player.health = savedFight.playerHealth;
        fighterState[winId].cpu.health = savedFight.cpuHealth;
    }

    drawFighterScene(winId);

    const keyDownHandler = (e) => {
        const state = fighterState[winId];
        if (state) state.keys[e.key.toLowerCase()] = true;
    };
    const keyUpHandler = (e) => {
        const state = fighterState[winId];
        if (state) state.keys[e.key.toLowerCase()] = false;
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            const state = fighterState[winId];
            if (state) {
                if (state.timerInterval) clearInterval(state.timerInterval);
                if (state.animFrame) cancelAnimationFrame(state.animFrame);
            }
        };
    }
}

function createFighter(x, y, type) {
    return {
        x: x,
        y: y,
        width: 50,
        height: 90,
        velX: 0,
        velY: 0,
        health: 100,
        maxHealth: 100,
        facing: type === 'player' ? 1 : -1,
        isJumping: false,
        isAttacking: false,
        isBlocking: false,
        attackType: null,
        attackTimer: 0,
        attackCooldown: 0,
        hitTimer: 0,
        color: type === 'player' ? '#0078d4' : '#e81123',
        type: type
    };
}

function startFighter(winId) {
    const state = fighterState[winId];
    state.player = createFighter(100, FIGHTER_GROUND_Y, 'player');
    state.cpu = createFighter(500, FIGHTER_GROUND_Y, 'cpu');
    state.gameRunning = true;
    state.gameOver = false;
    state.timer = 60;
    state.keys = {};

    document.getElementById(winId + '-fighter-overlay').style.display = 'none';

    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        if (state.gameRunning && !state.gameOver) {
            state.timer--;
            document.getElementById(winId + '-fighter-timer').textContent = state.timer;
            if (state.timer <= 0) {
                endFighterRound(winId);
            }
        }
    }, 1000);

    fighterGameLoop(winId);
}

function resumeFighter(winId) {
    const state = fighterState[winId];
    state.gameRunning = true;
    state.gameOver = false;
    state.keys = {};

    document.getElementById(winId + '-fighter-overlay').style.display = 'none';

    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        if (state.gameRunning && !state.gameOver) {
            state.timer--;
            document.getElementById(winId + '-fighter-timer').textContent = state.timer;
            if (state.timer <= 0) {
                endFighterRound(winId);
            }
        }
    }, 1000);

    fighterGameLoop(winId);
    addNotification('🥊 Street Brawl', 'Fight resumed!');
}

function fighterGameLoop(winId) {
    const state = fighterState[winId];
    if (!state.gameRunning || state.gameOver || !activeWindows[winId]) return;

    updateFighterInput(winId);
    updateFighterAI(winId);
    updateFighterPhysics(winId);
    checkFighterAttacks(winId);
    drawFighterScene(winId);
    updateFighterHUD(winId);

    state.animFrame = requestAnimationFrame(() => fighterGameLoop(winId));
}

function updateFighterInput(winId) {
    const state = fighterState[winId];
    const player = state.player;

    if (player.hitTimer > 0) {
        player.hitTimer--;
        return;
    }

    player.isBlocking = state.keys['l'];
    
    if (!player.isAttacking && !player.isBlocking) {
        if (state.keys['a']) {
            player.velX = -4;
        } else if (state.keys['d']) {
            player.velX = 4;
        } else {
            player.velX = 0;
        }

        if (state.keys['w'] && !player.isJumping) {
            player.velY = FIGHTER_JUMP_FORCE;
            player.isJumping = true;
        }

        if (player.attackCooldown <= 0) {
            if (state.keys['j']) {
                player.isAttacking = true;
                player.attackType = 'punch';
                player.attackTimer = 15;
                player.attackCooldown = 25;
            } else if (state.keys['k']) {
                player.isAttacking = true;
                player.attackType = 'kick';
                player.attackTimer = 20;
                player.attackCooldown = 30;
            }
        }
    }

    if (player.isAttacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) {
            player.isAttacking = false;
            player.attackType = null;
        }
    }

    if (player.attackCooldown > 0) player.attackCooldown--;
}

function updateFighterAI(winId) {
    const state = fighterState[winId];
    const cpu = state.cpu;
    const player = state.player;

    if (cpu.hitTimer > 0) {
        cpu.hitTimer--;
        return;
    }

    const distance = Math.abs(cpu.x - player.x);
    const direction = player.x < cpu.x ? -1 : 1;
    cpu.facing = direction;

    if (distance > 80) {
        cpu.velX = direction * 2.5;
    } else if (distance < 50) {
        cpu.velX = -direction * 2;
    } else {
        cpu.velX = 0;
    }

    if (Math.random() < 0.02 && !cpu.isJumping) {
        cpu.velY = FIGHTER_JUMP_FORCE;
        cpu.isJumping = true;
    }

    if (distance < 90 && cpu.attackCooldown <= 0 && !cpu.isAttacking) {
        if (Math.random() < 0.05) {
            cpu.isAttacking = true;
            cpu.attackType = Math.random() < 0.5 ? 'punch' : 'kick';
            cpu.attackTimer = cpu.attackType === 'punch' ? 15 : 20;
            cpu.attackCooldown = cpu.attackType === 'punch' ? 25 : 30;
        }
    }

    if (player.isAttacking && distance < 100 && Math.random() < 0.1) {
        cpu.isBlocking = true;
    } else {
        cpu.isBlocking = false;
    }

    if (cpu.isAttacking) {
        cpu.attackTimer--;
        if (cpu.attackTimer <= 0) {
            cpu.isAttacking = false;
            cpu.attackType = null;
        }
    }

    if (cpu.attackCooldown > 0) cpu.attackCooldown--;
}

function updateFighterPhysics(winId) {
    const state = fighterState[winId];

    [state.player, state.cpu].forEach(fighter => {
        fighter.x += fighter.velX;
        fighter.y += fighter.velY;
        fighter.velY += FIGHTER_GRAVITY;

        if (fighter.y >= FIGHTER_GROUND_Y) {
            fighter.y = FIGHTER_GROUND_Y;
            fighter.velY = 0;
            fighter.isJumping = false;
        }

        fighter.x = Math.max(25, Math.min(FIGHTER_CANVAS_WIDTH - 25, fighter.x));
    });

    const p = state.player;
    const c = state.cpu;
    p.facing = c.x > p.x ? 1 : -1;
}

function checkFighterAttacks(winId) {
    const state = fighterState[winId];
    const player = state.player;
    const cpu = state.cpu;

    if (player.isAttacking && player.attackTimer === (player.attackType === 'punch' ? 10 : 14)) {
        const attackRange = player.attackType === 'punch' ? 60 : 75;
        const attackX = player.x + player.facing * 30;
        const dist = Math.abs(attackX - cpu.x);

        if (dist < attackRange && Math.abs(player.y - cpu.y) < 60) {
            if (cpu.isBlocking) {
                cpu.hitTimer = 5;
            } else {
                const damage = player.attackType === 'punch' ? 8 : 12;
                cpu.health = Math.max(0, cpu.health - damage);
                cpu.hitTimer = 15;
                cpu.velX = player.facing * 5;
            }
        }
    }

    if (cpu.isAttacking && cpu.attackTimer === (cpu.attackType === 'punch' ? 10 : 14)) {
        const attackRange = cpu.attackType === 'punch' ? 60 : 75;
        const attackX = cpu.x + cpu.facing * 30;
        const dist = Math.abs(attackX - player.x);

        if (dist < attackRange && Math.abs(cpu.y - player.y) < 60) {
            if (player.isBlocking) {
                player.hitTimer = 5;
            } else {
                const damage = cpu.attackType === 'punch' ? 6 : 10;
                player.health = Math.max(0, player.health - damage);
                player.hitTimer = 15;
                player.velX = cpu.facing * 4;
            }
        }
    }

    if (player.health <= 0 || cpu.health <= 0) {
        endFighterRound(winId);
    }
}

function endFighterRound(winId) {
    const state = fighterState[winId];
    state.gameRunning = false;
    state.gameOver = true;

    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    let winner = '';
    if (state.player.health <= 0) {
        winner = 'CPU WINS!';
    } else if (state.cpu.health <= 0) {
        winner = 'YOU WIN!';
    } else {
        winner = state.player.health > state.cpu.health ? 'YOU WIN!' : 'CPU WINS!';
    }

    const overlay = document.getElementById(winId + '-fighter-overlay');
    overlay.innerHTML = `
        <h2>${winner}</h2>
        <div class="subtitle">Player: ${Math.round(state.player.health)}% | CPU: ${Math.round(state.cpu.health)}%</div>
        <button onclick="startFighter('${winId}')">Rematch</button>
    `;
    overlay.style.display = 'flex';
}

function updateFighterHUD(winId) {
    const state = fighterState[winId];
    const playerHealthBar = document.getElementById(winId + '-player-health');
    const cpuHealthBar = document.getElementById(winId + '-cpu-health');

    if (playerHealthBar) {
        playerHealthBar.style.width = state.player.health + '%';
        if (state.player.health < 30) playerHealthBar.classList.add('low');
        else playerHealthBar.classList.remove('low');
    }

    if (cpuHealthBar) {
        cpuHealthBar.style.width = state.cpu.health + '%';
        if (state.cpu.health < 30) cpuHealthBar.classList.add('low');
        else cpuHealthBar.classList.remove('low');
    }
}

function drawFighterScene(winId) {
    const canvas = document.getElementById(winId + '-fighter-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = fighterState[winId];

    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a0a2e');
    bgGrad.addColorStop(0.6, '#2d1b4e');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1a1a3e';
    for (let i = 0; i < 5; i++) {
        const bx = 50 + i * 150;
        const bh = 80 + Math.random() * 60;
        ctx.fillRect(bx, FIGHTER_GROUND_Y - bh - 40, 80, bh + 40);
    }

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, FIGHTER_GROUND_Y + 10, canvas.width, canvas.height - FIGHTER_GROUND_Y);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FIGHTER_GROUND_Y + 10);
    ctx.lineTo(canvas.width, FIGHTER_GROUND_Y + 10);
    ctx.stroke();

    drawFighter(ctx, state.player);
    drawFighter(ctx, state.cpu);
}

function drawFighter(ctx, fighter) {
    const x = fighter.x;
    const y = fighter.y;
    const f = fighter.facing;

    if (fighter.hitTimer > 0 && fighter.hitTimer % 3 === 0) {
        ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = fighter.color;
    ctx.fillRect(x - 15, y - 70, 30, 40);

    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(x, y - 80, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillRect(x + f * 5 - 2, y - 83, 4, 3);

    ctx.fillStyle = fighter.color;
    if (fighter.isAttacking && fighter.attackType === 'punch') {
        const armExtend = fighter.attackTimer > 8 ? 35 : 25;
        ctx.fillRect(x + f * 15, y - 60, f * armExtend, 10);
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(x + f * (15 + armExtend), y - 55, 6, 0, Math.PI * 2);
        ctx.fill();
    } else if (fighter.isBlocking) {
        ctx.fillRect(x + f * 10, y - 65, f * 15, 10);
        ctx.fillRect(x + f * 10, y - 50, f * 15, 10);
    } else {
        ctx.fillRect(x + f * 15, y - 60, f * 15, 8);
    }

    ctx.fillStyle = fighter.color;
    ctx.fillRect(x - 10, y - 30, 8, 30);
    ctx.fillRect(x + 2, y - 30, 8, 30);

    if (fighter.isAttacking && fighter.attackType === 'kick') {
        const kickExtend = fighter.attackTimer > 10 ? 40 : 30;
        ctx.fillStyle = fighter.color;
        ctx.fillRect(x + f * 5, y - 25, f * kickExtend, 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(x + f * (5 + kickExtend), y - 25, f * 10, 10);
    }

    ctx.fillStyle = '#333';
    ctx.fillRect(x - 12, y - 2, 10, 6);
    ctx.fillRect(x + 2, y - 2, 10, 6);

    if (fighter.isBlocking) {
        ctx.strokeStyle = 'rgba(100,200,255,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y - 45, 35, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}
