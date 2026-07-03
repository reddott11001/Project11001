let doomStates = {};

function renderDoom2(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    body.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:#000;font-family:Segoe UI,sans-serif;overflow:hidden;">
            <canvas id="${winId}-doom-canvas" style="flex:1;width:100%;display:block;image-rendering:pixelated;cursor:crosshair;"></canvas>
            <div style="padding:6px 12px;font-size:11px;color:#888;background:#111;border-top:1px solid #333;display:flex;justify-content:space-between;align-items:center;">
                <span>WASD Move | MOUSE Look | CLICK Shoot | SHIFT Run</span>
                <span id="${winId}-doom-hud" style="color:#ff4444;font-weight:bold;">HP: 100 | AMMO: 50</span>
            </div>
        </div>`;

    const canvas = document.getElementById(winId + '-doom-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const map = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,0,0,0,1,0,0,1,0,1],
        [1,0,1,0,0,1,0,1,0,0,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,1,0,1,1,1,0,1,1,0,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,0,0,0,1,1,0,1,1,0,1,0,1,0,0,1],
        [1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,1,1,0,1,0,0,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const state = {
        x: 1.5, y: 1.5,
        angle: 0,
        health: 100,
        ammo: 50,
        kills: 0,
        enemies: [
            { x: 5.5, y: 3.5, hp: 3, alive: true, type: 'imp' },
            { x: 8.5, y: 5.5, hp: 3, alive: true, type: 'demon' },
            { x: 3.5, y: 8.5, hp: 3, alive: true, type: 'imp' },
            { x: 10.5, y: 9.5, hp: 5, alive: true, type: 'baron' },
        ],
        keys: {},
        shooting: false,
        shootCooldown: 0,
        winId: winId,
    };
    doomStates[winId] = state;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) state.shooting = true;
    });
    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) state.shooting = false;
    });
    canvas.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === canvas) {
            state.angle += e.movementX * 0.003;
        }
    });
    canvas.addEventListener('click', () => {
        if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock();
        }
    });

    document.addEventListener('keydown', (e) => {
        state.keys[e.key.toLowerCase()] = true;
    });
    document.addEventListener('keyup', (e) => {
        state.keys[e.key.toLowerCase()] = false;
    });

    function castRay(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        let dist = 0;
        while (dist < 20) {
            dist += 0.02;
            const tx = state.x + cos * dist;
            const ty = state.y + sin * dist;
            const mx = Math.floor(tx);
            const my = Math.floor(ty);
            if (my >= 0 && my < map.length && mx >= 0 && mx < map[0].length && map[my][mx] === 1) {
                return dist;
            }
        }
        return 20;
    }

    function update() {
        const speed = state.keys['shift'] ? 0.08 : 0.05;
        let dx = 0, dy = 0;
        
        if (state.keys['w']) { dx += Math.cos(state.angle) * speed; dy += Math.sin(state.angle) * speed; }
        if (state.keys['s']) { dx -= Math.cos(state.angle) * speed; dy -= Math.sin(state.angle) * speed; }
        if (state.keys['a']) { dx += Math.cos(state.angle - Math.PI/2) * speed * 0.7; dy += Math.sin(state.angle - Math.PI/2) * speed * 0.7; }
        if (state.keys['d']) { dx += Math.cos(state.angle + Math.PI/2) * speed * 0.7; dy += Math.sin(state.angle + Math.PI/2) * speed * 0.7; }
        if (state.keys['arrowleft']) state.angle -= 0.04;
        if (state.keys['arrowright']) state.angle += 0.04;

        const nx = state.x + dx;
        const ny = state.y + dy;
        if (map[Math.floor(ny)][Math.floor(nx)] === 0) {
            state.x = nx;
            state.y = ny;
        } else if (map[Math.floor(state.y)][Math.floor(nx)] === 0) {
            state.x = nx;
        } else if (map[Math.floor(ny)][Math.floor(state.x)] === 0) {
            state.y = ny;
        }

        if (state.shootCooldown > 0) state.shootCooldown--;
        
        if (state.shooting && state.shootCooldown === 0 && state.ammo > 0) {
            state.ammo--;
            state.shootCooldown = 15;
            
            for (const enemy of state.enemies) {
                if (!enemy.alive) continue;
                const edx = enemy.x - state.x;
                const edy = enemy.y - state.y;
                const dist = Math.sqrt(edx*edx + edy*edy);
                const angle = Math.atan2(edy, edx) - state.angle;
                const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
                
                if (dist < 8 && Math.abs(normAngle) < 0.15) {
                    enemy.hp--;
                    if (enemy.hp <= 0) {
                        enemy.alive = false;
                        state.kills++;
                    }
                    break;
                }
            }
        }

        for (const enemy of state.enemies) {
            if (!enemy.alive) continue;
            const edx = state.x - enemy.x;
            const edy = state.y - enemy.y;
            const dist = Math.sqrt(edx*edx + edy*edy);
            
            if (dist < 0.6) {
                state.health -= 0.3;
                if (state.health <= 0) {
                    state.health = 0;
                }
            } else if (dist < 6) {
                enemy.x += (edx / dist) * 0.02;
                enemy.y += (edy / dist) * 0.02;
            }
        }

        const hud = document.getElementById(winId + '-doom-hud');
        if (hud) hud.textContent = `HP: ${Math.floor(state.health)} | AMMO: ${state.ammo} | KILLS: ${state.kills}/${state.enemies.length}`;
    }

    function render() {
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(0, 0, w, h/2);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, h/2, w, h/2);

        const fov = Math.PI / 3;
        const numRays = Math.min(w, 320);
        const stripWidth = w / numRays;

        for (let i = 0; i < numRays; i++) {
            const rayAngle = state.angle - fov/2 + (i / numRays) * fov;
            const dist = castRay(rayAngle);
            const correctedDist = dist * Math.cos(rayAngle - state.angle);
            const wallHeight = Math.min(h, h / (correctedDist * 0.8 + 0.2));
            
            const shade = Math.max(0.1, 1 - dist / 12);
            const r = Math.floor(80 * shade);
            const g = Math.floor(40 * shade);
            const b = Math.floor(30 * shade);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(i * stripWidth, (h - wallHeight) / 2, stripWidth + 1, wallHeight);
        }

        for (const enemy of state.enemies) {
            if (!enemy.alive) continue;
            const edx = enemy.x - state.x;
            const edy = enemy.y - state.y;
            const dist = Math.sqrt(edx*edx + edy*edy);
            const angle = Math.atan2(edy, edx) - state.angle;
            const normAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
            
            if (Math.abs(normAngle) < fov/2 && dist < 10) {
                const screenX = w/2 + (normAngle / (fov/2)) * (w/2);
                const spriteHeight = Math.min(h, h / (dist * 0.8 + 0.2));
                const spriteWidth = spriteHeight * 0.6;
                
                const shade = Math.max(0.2, 1 - dist / 10);
                let color;
                if (enemy.type === 'imp') color = `rgb(${Math.floor(200*shade)},${Math.floor(80*shade)},${Math.floor(40*shade)})`;
                else if (enemy.type === 'demon') color = `rgb(${Math.floor(150*shade)},${Math.floor(50*shade)},${Math.floor(100*shade)})`;
                else color = `rgb(${Math.floor(255*shade)},${Math.floor(100*shade)},${Math.floor(50*shade)})`;
                
                ctx.fillStyle = color;
                ctx.fillRect(screenX - spriteWidth/2, (h - spriteHeight)/2, spriteWidth, spriteHeight);
                
                ctx.fillStyle = `rgb(${Math.floor(255*shade)},${Math.floor(200*shade)},0)`;
                ctx.fillRect(screenX - spriteWidth/4, (h - spriteHeight)/2 + spriteHeight*0.2, spriteWidth/8, spriteWidth/8);
                ctx.fillRect(screenX + spriteWidth/8, (h - spriteHeight)/2 + spriteHeight*0.2, spriteWidth/8, spriteWidth/8);
            }
        }

        if (state.shootCooldown > 10) {
            ctx.fillStyle = 'rgba(255,200,0,0.3)';
            ctx.fillRect(w/2 - 20, h/2 - 20, 40, 40);
        }

        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w/2 - 10, h/2);
        ctx.lineTo(w/2 + 10, h/2);
        ctx.moveTo(w/2, h/2 - 10);
        ctx.lineTo(w/2, h/2 + 10);
        ctx.stroke();

        if (state.health <= 0) {
            ctx.fillStyle = 'rgba(255,0,0,0.5)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('YOU DIED', w/2, h/2);
            ctx.font = '16px sans-serif';
            ctx.fillText('Click to restart', w/2, h/2 + 40);
        } else if (state.kills >= state.enemies.length) {
            ctx.fillStyle = 'rgba(0,100,0,0.5)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE', w/2, h/2);
            ctx.font = '16px sans-serif';
            ctx.fillText(`Kills: ${state.kills}/${state.enemies.length}`, w/2, h/2 + 40);
        }
    }

    function gameLoop() {
        if (!activeWindows[winId] || activeWindows[winId].closed) return;
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            window.removeEventListener('resize', resize);
            if (document.pointerLockElement === canvas) {
                document.exitPointerLock();
            }
            delete doomStates[winId];
        };
    }
}
