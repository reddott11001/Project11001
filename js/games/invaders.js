let invadersState = {};

function renderInvaders(winId) {
    const body = document.getElementById(winId + '-body');
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const highScore = gameSaves.invaders ? gameSaves.invaders.highScore : 0;
    
    body.innerHTML = `
        <div class="invaders-app" id="${winId}-invaders-app" style="width:100%;height:100%;display:flex;flex-direction:column;background:#000;color:#fff;">
            <div class="invaders-header" style="display:flex;justify-content:space-between;padding:10px;background:#111133;border-bottom:2px solid #4444ff;">
                <div style="font-weight:bold;color:#4444ff;">Score: <span id="${winId}-invaders-score">0</span></div>
                <div style="font-weight:bold;color:#ffaa00;">Combo: x<span id="${winId}-invaders-combo">1</span></div>
                <div style="font-weight:bold;color:#ffd700;">Best: <span id="${winId}-invaders-best">${highScore}</span></div>
            </div>
            <div class="invaders-game-area" style="flex:1;position:relative;display:flex;justify-content:center;align-items:center;overflow:hidden;">
                <canvas id="${winId}-invaders-canvas" width="600" height="550" style="max-width:100%;max-height:100%;object-fit:contain;background:#000;border:1px solid #222255;"></canvas>
                
                <div id="${winId}-invaders-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:10;color:white;">
                    <h2 style="color:#4444ff;margin-bottom:20px;font-size:32px;text-shadow: 0 0 10px #4444ff;">SPACE INVADERS</h2>
                    <button onclick="startInvaders('${winId}')" style="padding:10px 20px;background:#4444ff;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:16px;">Start Game</button>
                    <div style="margin-top:20px;font-size:12px;text-align:center;color:#ccc;">
                        LEFT / RIGHT ARROWS to move.<br>
                        SPACE to shoot.<br>
                        Watch out for Bosses and grab Upgrades!
                    </div>
                </div>
            </div>
        </div>
    `;

    invadersState[winId] = {
        canvas: document.getElementById(`${winId}-invaders-canvas`),
        ctx: document.getElementById(`${winId}-invaders-canvas`).getContext('2d'),
        player: { x: 275, y: 500, w: 50, h: 30, speed: 5, cooldown: 0, level: 1, shield: 0 },
        bullets: [],
        enemies: [],
        enemyBullets: [],
        particles: [],
        upgrades: [],
        score: 0,
        combo: 1,
        comboTimer: 0,
        highScore: highScore,
        gameOver: false,
        running: false,
        loopId: null,
        rightPressed: false,
        leftPressed: false,
        spacePressed: false,
        wave: 1,
        boss: null
    };

    const keyDownHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        if(e.key === 'ArrowRight' || e.key === 'Right') invadersState[winId].rightPressed = true;
        if(e.key === 'ArrowLeft' || e.key === 'Left') invadersState[winId].leftPressed = true;
        if(e.key === ' ' || e.key === 'Spacebar') invadersState[winId].spacePressed = true;
    };
    
    const keyUpHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        if(e.key === 'ArrowRight' || e.key === 'Right') invadersState[winId].rightPressed = false;
        if(e.key === 'ArrowLeft' || e.key === 'Left') invadersState[winId].leftPressed = false;
        if(e.key === ' ' || e.key === 'Spacebar') invadersState[winId].spacePressed = false;
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            if (invadersState[winId] && invadersState[winId].loopId) {
                cancelAnimationFrame(invadersState[winId].loopId);
            }
        };
    }
}

function initInvadersWave(winId, wave) {
    const state = invadersState[winId];
    state.enemies = [];
    state.enemyBullets = [];
    
    if (wave % 5 === 0) {
        // Boss wave
        state.boss = { x: 200, y: 50, w: 200, h: 100, hp: wave * 20, maxHp: wave * 20, dx: 3, attackTimer: 0 };
    } else {
        // Normal wave
        let rows = Math.min(3 + Math.floor(wave/2), 6);
        let cols = 8;
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                state.enemies.push({
                    x: c * 60 + 50,
                    y: r * 40 + 50,
                    w: 40, h: 30,
                    hp: 1 + Math.floor(wave/3),
                    type: r === 0 ? 'hard' : 'normal'
                });
            }
        }
        state.enemyDir = 1;
        state.enemySpeed = 1 + (wave * 0.2);
    }
}

function startInvaders(winId) {
    const state = invadersState[winId];
    if (!state) return;
    
    document.getElementById(`${winId}-invaders-overlay`).style.display = 'none';
    state.score = 0;
    state.combo = 1;
    state.wave = 1;
    state.player = { x: 275, y: 500, w: 50, h: 30, speed: 5, cooldown: 0, level: 1, shield: 0 };
    state.bullets = [];
    state.upgrades = [];
    state.gameOver = false;
    state.running = true;
    state.boss = null;
    
    document.getElementById(`${winId}-invaders-score`).textContent = '0';
    document.getElementById(`${winId}-invaders-combo`).textContent = '1';
    
    initInvadersWave(winId, state.wave);
    
    if (state.loopId) cancelAnimationFrame(state.loopId);
    invadersLoop(winId);
}

function invadersLoop(winId) {
    const state = invadersState[winId];
    if (!state || !state.running) return;

    if (!state.gameOver) updateInvaders(winId);
    drawInvaders(winId);

    if (!state.gameOver) {
        state.loopId = requestAnimationFrame(() => invadersLoop(winId));
    }
}

function updateInvaders(winId) {
    const state = invadersState[winId];
    
    // Combo timer
    if (state.comboTimer > 0) {
        state.comboTimer--;
        if (state.comboTimer <= 0) {
            state.combo = 1;
            document.getElementById(`${winId}-invaders-combo`).textContent = state.combo;
        }
    }
    
    // Player movement
    if (state.rightPressed && state.player.x < 600 - state.player.w) state.player.x += state.player.speed;
    else if (state.leftPressed && state.player.x > 0) state.player.x -= state.player.speed;
    
    if (state.player.cooldown > 0) state.player.cooldown--;
    if (state.player.shield > 0) state.player.shield--;
    
    // Shooting
    if (state.spacePressed && state.player.cooldown <= 0) {
        if (state.player.level === 1) {
            state.bullets.push({ x: state.player.x + state.player.w/2 - 2, y: state.player.y, w: 4, h: 15, dy: -10 });
        } else if (state.player.level === 2) {
            state.bullets.push({ x: state.player.x + 10, y: state.player.y, w: 4, h: 15, dy: -10 });
            state.bullets.push({ x: state.player.x + state.player.w - 14, y: state.player.y, w: 4, h: 15, dy: -10 });
        } else {
            state.bullets.push({ x: state.player.x + 10, y: state.player.y, w: 4, h: 15, dy: -10, dx: -2 });
            state.bullets.push({ x: state.player.x + state.player.w/2 - 2, y: state.player.y, w: 4, h: 15, dy: -10, dx: 0 });
            state.bullets.push({ x: state.player.x + state.player.w - 14, y: state.player.y, w: 4, h: 15, dy: -10, dx: 2 });
        }
        state.player.cooldown = 15;
    }
    
    // Move bullets
    for(let i=state.bullets.length-1; i>=0; i--) {
        let b = state.bullets[i];
        b.y += b.dy;
        if(b.dx) b.x += b.dx;
        
        let hit = false;
        if (state.boss) {
            if (b.x > state.boss.x && b.x < state.boss.x + state.boss.w && b.y > state.boss.y && b.y < state.boss.y + state.boss.h) {
                state.boss.hp--;
                hit = true;
                addInvaderParticle(state, b.x, b.y, '#ff0000');
            }
        } else {
            for(let j=state.enemies.length-1; j>=0; j--) {
                let e = state.enemies[j];
                if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
                    e.hp--;
                    hit = true;
                    if (e.hp <= 0) {
                        state.score += 10 * state.combo;
                        state.combo++;
                        state.comboTimer = 180; // 3 seconds to keep combo
                        document.getElementById(`${winId}-invaders-score`).textContent = state.score;
                        document.getElementById(`${winId}-invaders-combo`).textContent = state.combo;
                        
                        addInvaderParticle(state, e.x + e.w/2, e.y + e.h/2, e.type==='hard'?'#ff4444':'#00ff00', 10);
                        
                        if (Math.random() < 0.05) {
                            state.upgrades.push({ x: e.x + e.w/2, y: e.y, type: Math.random() < 0.5 ? 'weapon' : 'shield' });
                        }
                        
                        state.enemies.splice(j, 1);
                    } else {
                        addInvaderParticle(state, b.x, b.y, '#ffffff');
                    }
                    break;
                }
            }
        }
        
        if (hit || b.y < 0) state.bullets.splice(i, 1);
    }
    
    // Boss Logic
    if (state.boss) {
        state.boss.x += state.boss.dx;
        if (state.boss.x < 0 || state.boss.x + state.boss.w > 600) state.boss.dx *= -1;
        
        state.boss.attackTimer++;
        if (state.boss.attackTimer > 60 - state.wave) {
            state.boss.attackTimer = 0;
            state.enemyBullets.push({ x: state.boss.x + state.boss.w/2, y: state.boss.y + state.boss.h, w: 10, h: 20, dy: 5 });
            state.enemyBullets.push({ x: state.boss.x + 20, y: state.boss.y + state.boss.h, w: 10, h: 20, dy: 5 });
            state.enemyBullets.push({ x: state.boss.x + state.boss.w - 20, y: state.boss.y + state.boss.h, w: 10, h: 20, dy: 5 });
        }
        
        if (state.boss.hp <= 0) {
            state.score += 1000;
            addInvaderParticle(state, state.boss.x + state.boss.w/2, state.boss.y + state.boss.h/2, '#ff0000', 50);
            state.boss = null;
            state.wave++;
            initInvadersWave(winId, state.wave);
        }
    } else {
        // Enemy Logic
        let hitEdge = false;
        state.enemies.forEach(e => {
            e.x += state.enemySpeed * state.enemyDir;
            if (e.x < 0 || e.x + e.w > 600) hitEdge = true;
            
            if (Math.random() < 0.005 + (state.wave * 0.001)) {
                state.enemyBullets.push({ x: e.x + e.w/2, y: e.y + e.h, w: 4, h: 10, dy: 4 });
            }
        });
        
        if (hitEdge) {
            state.enemyDir *= -1;
            state.enemies.forEach(e => e.y += 20);
        }
        
        if (state.enemies.length === 0) {
            state.wave++;
            initInvadersWave(winId, state.wave);
        }
    }
    
    // Enemy Bullets
    for(let i=state.enemyBullets.length-1; i>=0; i--) {
        let b = state.enemyBullets[i];
        b.y += b.dy;
        if (b.y > 550) {
            state.enemyBullets.splice(i, 1);
        } else if (b.x > state.player.x && b.x < state.player.x + state.player.w && b.y > state.player.y && b.y < state.player.y + state.player.h) {
            state.enemyBullets.splice(i, 1);
            if (state.player.shield <= 0) {
                if (state.player.level > 1) {
                    state.player.level--; // Lose upgrade instead of dying
                    state.player.shield = 60; // Invincibility frames
                } else {
                    endInvaders(winId);
                    return;
                }
            }
        }
    }
    
    // Move Upgrades
    for(let i=state.upgrades.length-1; i>=0; i--) {
        let u = state.upgrades[i];
        u.y += 3;
        if (u.y > 550) {
            state.upgrades.splice(i, 1);
        } else if (u.x > state.player.x && u.x < state.player.x + state.player.w && u.y > state.player.y && u.y < state.player.y + state.player.h) {
            if (u.type === 'weapon' && state.player.level < 3) state.player.level++;
            if (u.type === 'shield') state.player.shield = 300; // 5 seconds
            state.upgrades.splice(i, 1);
        }
    }
    
    // Particles
    for(let i=state.particles.length-1; i>=0; i--) {
        let p = state.particles[i];
        p.x += p.dx; p.y += p.dy; p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

function addInvaderParticle(state, x, y, color, count=5) {
    for(let i=0; i<count; i++) {
        state.particles.push({
            x: x, y: y,
            dx: (Math.random()-0.5)*4,
            dy: (Math.random()-0.5)*4,
            color: color,
            life: 20 + Math.random()*20
        });
    }
}

function drawInvaders(winId) {
    const state = invadersState[winId];
    const ctx = state.ctx;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 600, 550);
    
    // Stars background
    ctx.fillStyle = '#fff';
    for(let i=0; i<50; i++) {
        let x = (Math.sin(state.wave * i + state.comboTimer) * 300) + 300;
        let y = (i * 11 + state.player.y*0.1) % 550;
        ctx.fillRect(x, y, 1, 1);
    }

    // Draw Boss
    if (state.boss) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(state.boss.x, state.boss.y, state.boss.w, state.boss.h);
        ctx.fillStyle = '#000';
        ctx.fillRect(state.boss.x + 30, state.boss.y + 20, 40, 20);
        ctx.fillRect(state.boss.x + state.boss.w - 70, state.boss.y + 20, 40, 20);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(state.boss.x + state.boss.w/2 - 10, state.boss.y + 60, 20, 20);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(state.boss.x, state.boss.y - 10, state.boss.w, 5);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(state.boss.x, state.boss.y - 10, state.boss.w * (state.boss.hp / state.boss.maxHp), 5);
    }

    // Draw Enemies
    state.enemies.forEach(e => {
        ctx.fillStyle = e.type === 'hard' ? '#ff4444' : '#00ff00';
        ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x + 8, e.y + 5, 8, 8);
        ctx.fillRect(e.x + 24, e.y + 5, 8, 8);
    });

    // Draw Bullets
    ctx.fillStyle = '#00ffff';
    state.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    
    ctx.fillStyle = '#ff00ff';
    state.enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Draw Upgrades
    state.upgrades.forEach(u => {
        ctx.fillStyle = u.type === 'weapon' ? '#ffcc00' : '#00d4ff';
        ctx.fillRect(u.x - 10, u.y - 10, 20, 20);
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.fillText(u.type === 'weapon' ? 'W' : 'S', u.x - 6, u.y + 5);
    });

    // Draw Particles
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 40;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    // Draw Player
    ctx.fillStyle = '#4444ff';
    ctx.fillRect(state.player.x, state.player.y + 10, state.player.w, state.player.h - 10);
    ctx.fillRect(state.player.x + 20, state.player.y, 10, 10);
    
    if (state.player.shield > 0) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.player.x + state.player.w/2, state.player.y + 15, 30, 0, Math.PI*2);
        ctx.stroke();
    }
}

function endInvaders(winId) {
    const state = invadersState[winId];
    state.gameOver = true;
    state.running = false;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        let saves = JSON.parse(localStorage.getItem('game-saves') || '{}');
        if (!saves.invaders) saves.invaders = {};
        saves.invaders.highScore = state.highScore;
        localStorage.setItem('game-saves', JSON.stringify(saves));
        document.getElementById(`${winId}-invaders-best`).textContent = state.highScore;
    }
    
    const overlay = document.getElementById(`${winId}-invaders-overlay`);
    overlay.style.display = 'flex';
    overlay.querySelector('h2').textContent = 'GAME OVER';
    overlay.querySelector('h2').style.color = '#ff0000';
    overlay.querySelector('button').textContent = 'Play Again';
}
