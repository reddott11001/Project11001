let doodleState = {};

function renderDoodle(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    const highScore = gameSaves.doodle ? gameSaves.doodle.highScore : 0;
    
    body.innerHTML = `
        <div class="doodle-app" id="${winId}-doodle-app" style="width:100%;height:100%;display:flex;flex-direction:column;background:#f8f9fa;color:#000;">
            <div class="doodle-header" style="display:flex;justify-content:space-between;padding:10px;background:#e9ecef;border-bottom:2px solid #ccc;">
                <div style="font-weight:bold;color:#495057;">Score: <span id="${winId}-doodle-score">0</span></div>
                <div style="font-weight:bold;color:#ff9800;">Best: <span id="${winId}-doodle-best">${highScore}</span></div>
            </div>
            <div class="doodle-game-area" style="flex:1;position:relative;display:flex;justify-content:center;align-items:center;overflow:hidden;background:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\"><path d=\"M 0 0 L 20 0 L 20 20 L 0 20 Z\" fill=\"none\" stroke=\"%23e9ecef\"/></svg>');">
                <canvas id="${winId}-doodle-canvas" width="400" height="600" style="max-width:100%;max-height:100%;object-fit:contain;"></canvas>
                
                <div id="${winId}-doodle-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:10;color:#000;">
                    <h2 style="color:#8bc34a;margin-bottom:20px;font-size:36px;font-family:Comic Sans MS, cursive;">Doodle Jump</h2>
                    <div style="margin-bottom:15px;text-align:center;">
                        <label style="display:block;margin-bottom:5px;">Skin:</label>
                        <select id="${winId}-doodle-skin" style="padding:5px;border-radius:4px;">
                            <option value="green">Classic Green</option>
                            <option value="blue">Ice Blue</option>
                            <option value="ninja">Ninja Black</option>
                        </select>
                    </div>
                    <button onclick="startDoodle('${winId}')" style="padding:10px 20px;background:#8bc34a;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:16px;">Play</button>
                    <div style="margin-top:20px;font-size:14px;text-align:center;color:#666;">
                        LEFT / RIGHT to move.<br>
                        UP to shoot.<br>
                        Jump on platforms, springs, and jetpacks!<br>
                        Avoid monsters!
                    </div>
                </div>
            </div>
        </div>
    `;

    doodleState[winId] = {
        canvas: document.getElementById(`${winId}-doodle-canvas`),
        ctx: document.getElementById(`${winId}-doodle-canvas`).getContext('2d'),
        player: { x: 200, y: 500, vx: 0, vy: 0, width: 30, height: 30, skin: 'green' },
        platforms: [],
        bullets: [],
        monsters: [],
        items: [], // springs, jetpacks
        gravity: 0.2,
        jumpStrength: -8,
        score: 0,
        highScore: highScore,
        cameraY: 0,
        gameOver: false,
        running: false,
        loopId: null,
        leftPressed: false,
        rightPressed: false,
        jetpackTimer: 0
    };

    const keyDownHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        const state = doodleState[winId];
        if (!state) return;
        
        if (e.key === 'ArrowLeft') state.leftPressed = true;
        if (e.key === 'ArrowRight') state.rightPressed = true;
        if (e.key === 'ArrowUp' && state.running && !state.gameOver) {
            e.preventDefault();
            // Shoot
            state.bullets.push({ x: state.player.x, y: state.player.y, vy: -15 });
        }
    };
    
    const keyUpHandler = (e) => {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        const state = doodleState[winId];
        if (!state) return;
        if (e.key === 'ArrowLeft') state.leftPressed = false;
        if (e.key === 'ArrowRight') state.rightPressed = false;
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            if (doodleState[winId] && doodleState[winId].loopId) cancelAnimationFrame(doodleState[winId].loopId);
        };
    }
}

function startDoodle(winId) {
    const state = doodleState[winId];
    if (!state) return;
    
    document.getElementById(`${winId}-doodle-overlay`).style.display = 'none';
    state.player.skin = document.getElementById(`${winId}-doodle-skin`).value;
    
    state.player.x = 200;
    state.player.y = 500;
    state.player.vy = state.jumpStrength;
    state.player.vx = 0;
    
    state.platforms = [];
    state.bullets = [];
    state.monsters = [];
    state.items = [];
    state.score = 0;
    state.cameraY = 0;
    state.jetpackTimer = 0;
    
    // Initial platforms
    for(let i=0; i<15; i++) {
        state.platforms.push({ x: Math.random() * 340, y: 600 - (i * 45), type: 'normal' });
    }
    // Make sure there is one under player
    state.platforms.push({ x: 180, y: 550, type: 'normal' });
    
    state.gameOver = false;
    state.running = true;
    
    document.getElementById(`${winId}-doodle-score`).textContent = '0';
    
    if (state.loopId) cancelAnimationFrame(state.loopId);
    doodleLoop(winId);
}

function doodleLoop(winId) {
    const state = doodleState[winId];
    if (!state || !state.running) return;

    if (!state.gameOver) updateDoodle(winId);
    drawDoodle(winId);

    if (!state.gameOver) {
        state.loopId = requestAnimationFrame(() => doodleLoop(winId));
    }
}

function updateDoodle(winId) {
    const state = doodleState[winId];
    
    // Player horizontal movement
    if (state.leftPressed) state.player.vx = -5;
    else if (state.rightPressed) state.player.vx = 5;
    else state.player.vx = 0;
    
    state.player.x += state.player.vx;
    
    // Wrap around screen
    if (state.player.x > 400) state.player.x = -state.player.width;
    if (state.player.x < -state.player.width) state.player.x = 400;
    
    // Gravity & Vertical movement
    if (state.jetpackTimer > 0) {
        state.player.vy = -12;
        state.jetpackTimer--;
    } else {
        state.player.vy += state.gravity;
    }
    state.player.y += state.player.vy;
    
    // Camera scroll
    if (state.player.y < 300) {
        let diff = 300 - state.player.y;
        state.player.y = 300;
        state.cameraY += diff;
        state.score += Math.floor(diff);
        document.getElementById(`${winId}-doodle-score`).textContent = state.score;
        
        // Move everything else down
        state.platforms.forEach(p => p.y += diff);
        state.monsters.forEach(m => m.y += diff);
        state.items.forEach(i => i.y += diff);
        state.bullets.forEach(b => b.y += diff);
    }
    
    // Remove offscreen things & spawn new ones
    if (state.platforms.length > 0 && state.platforms[0].y > 600) {
        state.platforms.shift();
        
        // Spawn new platform
        let lastY = state.platforms[state.platforms.length-1].y;
        let type = 'normal';
        if (Math.random() < 0.1) type = 'moving';
        else if (Math.random() < 0.05) type = 'fragile';
        
        let newX = Math.random() * 340;
        let newY = lastY - (40 + Math.random()*20);
        state.platforms.push({ x: newX, y: newY, type: type, vx: type==='moving'?(Math.random()<0.5?2:-2):0 });
        
        // Spawn item (spring/jetpack)
        if (type === 'normal' && Math.random() < 0.1) {
            state.items.push({ x: newX + 20, y: newY - 15, type: Math.random() < 0.1 ? 'jetpack' : 'spring' });
        }
        
        // Spawn monster
        if (Math.random() < 0.05) {
            state.monsters.push({ x: Math.random() * 360, y: newY - 40, width: 40, height: 40, type: 'ufo' });
        }
    }
    
    // Collision with platforms (only falling down)
    if (state.player.vy > 0 && state.jetpackTimer === 0) {
        for(let i=0; i<state.platforms.length; i++) {
            let p = state.platforms[i];
            if (state.player.x + state.player.width > p.x && state.player.x < p.x + 60 && 
                state.player.y + state.player.height > p.y && state.player.y + state.player.height < p.y + 15) {
                if (p.type === 'fragile') {
                    state.platforms.splice(i, 1);
                } else {
                    state.player.vy = state.jumpStrength;
                }
                break;
            }
        }
    }
    
    // Collision with items
    if (state.player.vy > 0) {
        for(let i=0; i<state.items.length; i++) {
            let item = state.items[i];
            if (state.player.x + state.player.width > item.x && state.player.x < item.x + 20 && 
                state.player.y + state.player.height > item.y && state.player.y + state.player.height < item.y + 15) {
                if (item.type === 'spring') {
                    state.player.vy = state.jumpStrength * 1.5;
                } else if (item.type === 'jetpack') {
                    state.jetpackTimer = 150;
                }
                state.items.splice(i, 1);
                break;
            }
        }
    }
    
    // Update moving platforms
    state.platforms.forEach(p => {
        if (p.type === 'moving') {
            p.x += p.vx;
            if (p.x < 0 || p.x > 340) p.vx *= -1;
        }
    });
    
    // Update bullets
    for(let i=state.bullets.length-1; i>=0; i--) {
        let b = state.bullets[i];
        b.y += b.vy;
        
        let hit = false;
        for(let j=state.monsters.length-1; j>=0; j--) {
            let m = state.monsters[j];
            if (b.x > m.x && b.x < m.x + m.width && b.y > m.y && b.y < m.y + m.height) {
                state.monsters.splice(j, 1);
                hit = true;
                break;
            }
        }
        
        if (hit || b.y < 0) state.bullets.splice(i, 1);
    }
    
    // Monster collision (die if touch, unless falling on top)
    for(let i=0; i<state.monsters.length; i++) {
        let m = state.monsters[i];
        if (state.player.x + state.player.width > m.x && state.player.x < m.x + m.width && 
            state.player.y + state.player.height > m.y && state.player.y < m.y + m.height) {
            
            if (state.player.vy > 0 && state.player.y < m.y) {
                // Killed monster by jumping on it
                state.monsters.splice(i, 1);
                state.player.vy = state.jumpStrength;
            } else if (state.jetpackTimer === 0) {
                endDoodle(winId);
                return;
            }
        }
    }
    
    // Game Over if fall off screen
    if (state.player.y > 600) {
        endDoodle(winId);
    }
}

function drawDoodle(winId) {
    const state = doodleState[winId];
    const ctx = state.ctx;

    ctx.clearRect(0, 0, 400, 600);
    
    // Platforms
    state.platforms.forEach(p => {
        if (p.type === 'normal') ctx.fillStyle = '#8bc34a'; // green
        else if (p.type === 'moving') ctx.fillStyle = '#03a9f4'; // blue
        else if (p.type === 'fragile') ctx.fillStyle = '#ff9800'; // brown/orange
        
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, 60, 15, 5);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    });
    
    // Items
    state.items.forEach(i => {
        if (i.type === 'spring') {
            ctx.fillStyle = '#795548';
            ctx.fillRect(i.x, i.y, 20, 15);
            ctx.fillStyle = '#d7ccc8';
            ctx.fillRect(i.x, i.y-5, 20, 5);
        } else if (i.type === 'jetpack') {
            ctx.fillStyle = '#f44336';
            ctx.fillRect(i.x, i.y, 20, 30);
            ctx.fillStyle = '#ffc107';
            ctx.fillRect(i.x+5, i.y+30, 10, 10);
        }
    });
    
    // Monsters
    state.monsters.forEach(m => {
        ctx.fillStyle = '#9c27b0';
        ctx.beginPath();
        ctx.arc(m.x + m.width/2, m.y + m.height/2, m.width/2, 0, Math.PI*2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(m.x + 10, m.y + 15, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(m.x + 30, m.y + 15, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(m.x + 10, m.y + 15, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(m.x + 30, m.y + 15, 2, 0, Math.PI*2); ctx.fill();
    });
    
    // Bullets
    ctx.fillStyle = '#333';
    state.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x + state.player.width/2, b.y, 4, 0, Math.PI*2);
        ctx.fill();
    });

    // Player (Doodler)
    ctx.save();
    ctx.translate(state.player.x + state.player.width/2, state.player.y + state.player.height/2);
    if (state.player.vx > 0) ctx.scale(-1, 1);
    
    // Body
    if (state.player.skin === 'green') ctx.fillStyle = '#a4c639';
    else if (state.player.skin === 'blue') ctx.fillStyle = '#00bcd4';
    else if (state.player.skin === 'ninja') ctx.fillStyle = '#212121';
    
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    // Snout
    ctx.beginPath();
    ctx.ellipse(-10, -5, 10, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Eye
    ctx.fillStyle = state.player.skin === 'ninja' ? '#ffeb3b' : '#fff';
    ctx.beginPath();
    ctx.arc(-5, -10, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-6, -10, 1.5, 0, Math.PI*2);
    ctx.fill();

    // Legs
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-5, 18); ctx.lineTo(-10, 25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 18); ctx.lineTo(10, 25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(0, 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, 15); ctx.lineTo(-15, 22); ctx.stroke();

    ctx.restore();
    
    // Draw Jetpack flame if active
    if (state.jetpackTimer > 0) {
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.moveTo(state.player.x + 5, state.player.y + state.player.height);
        ctx.lineTo(state.player.x + 25, state.player.y + state.player.height);
        ctx.lineTo(state.player.x + 15, state.player.y + state.player.height + 20 + Math.random()*10);
        ctx.fill();
    }
}

function endDoodle(winId) {
    const state = doodleState[winId];
    state.gameOver = true;
    state.running = false;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        let saves = JSON.parse(localStorage.getItem('game-saves') || '{}');
        if (!saves.doodle) saves.doodle = {};
        saves.doodle.highScore = state.highScore;
        localStorage.setItem('game-saves', JSON.stringify(saves));
        document.getElementById(`${winId}-doodle-best`).textContent = state.highScore;
    }
    
    const overlay = document.getElementById(`${winId}-doodle-overlay`);
    overlay.style.display = 'flex';
    overlay.style.background = 'rgba(255,255,255,0.9)';
    overlay.querySelector('h2').textContent = 'Game Over';
    overlay.querySelector('h2').style.color = '#f44336';
    overlay.querySelector('button').textContent = 'Play Again';
}
