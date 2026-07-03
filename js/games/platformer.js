let platStates = {};

function renderPlatformer(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    body.innerHTML = '';
    body.style.background = '#111';
    body.style.display = 'flex';
    body.style.alignItems = 'center';
    body.style.justifyContent = 'center';
    body.style.overflow = 'hidden';
    
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;background:#222;';
    body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const s = {
        player: { x: 50, y: 300, w: 24, h: 32, vy: 0, onGround: false },
        platforms: [
            { x: 0, y: 400, w: 660, h: 40 },
            { x: 150, y: 320, w: 100, h: 16 },
            { x: 320, y: 260, w: 100, h: 16 },
            { x: 480, y: 320, w: 100, h: 16 },
            { x: 80, y: 200, w: 80, h: 16 },
            { x: 250, y: 160, w: 80, h: 16 },
            { x: 430, y: 180, w: 80, h: 16 },
        ],
        coins: [
            { x: 170, y: 300, collected: false },
            { x: 340, y: 240, collected: false },
            { x: 500, y: 300, collected: false },
            { x: 100, y: 180, collected: false },
            { x: 270, y: 140, collected: false },
            { x: 450, y: 160, collected: false },
        ],
        flag: { x: 600, y: 360 },
        score: 0,
        won: false,
        keys: {},
        winId: winId,
        running: true,
    };
    platStates[winId] = s;

    function resize() {
        const rect = body.getBoundingClientRect();
        canvas.width = Math.min(660, rect.width - 20);
        canvas.height = Math.min(440, rect.height - 20);
    }
    resize();

    function jump() {
        if (s.player.onGround) { s.player.vy = -10; s.player.onGround = false; }
    }

    const keydownHandler = (e) => {
        if (!s.running) return;
        const win = document.getElementById(winId);
        if (!win || !win.classList.contains('active')) return;
        
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { 
            e.preventDefault(); 
            jump(); 
        }
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
    };
    
    const keyupHandler = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
    };

    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);

    function update() {
        if (s.won || !s.running) return;
        if (s.keys.left) s.player.x -= 4;
        if (s.keys.right) s.player.x += 4;
        s.player.vy += 0.5;
        s.player.y += s.player.vy;
        s.player.onGround = false;
        
        for (const p of s.platforms) {
            if (s.player.x < p.x + p.w && s.player.x + s.player.w > p.x && 
                s.player.y + s.player.h > p.y && s.player.y + s.player.h < p.y + p.h + 10 && 
                s.player.vy >= 0) {
                s.player.y = p.y - s.player.h;
                s.player.vy = 0;
                s.player.onGround = true;
            }
        }
        
        if (s.player.x < 0) s.player.x = 0;
        if (s.player.x + s.player.w > canvas.width) s.player.x = canvas.width - s.player.w;
        if (s.player.y > canvas.height + 50) { 
            s.player.x = 50; 
            s.player.y = 300; 
            s.player.vy = 0; 
        }
        
        for (const c of s.coins) {
            if (!c.collected && Math.abs(s.player.x + s.player.w/2 - c.x) < 20 && 
                Math.abs(s.player.y + s.player.h/2 - c.y) < 20) {
                c.collected = true; 
                s.score++;
            }
        }
        
        if (!s.won && Math.abs(s.player.x + s.player.w/2 - s.flag.x) < 20 && 
            Math.abs(s.player.y + s.player.h/2 - s.flag.y) < 20) {
            s.won = true;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (const p of s.platforms) {
            ctx.fillStyle = '#0f3460';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = '#e94560';
            ctx.fillRect(p.x, p.y, p.w, 3);
        }
        
        for (const c of s.coins) {
            if (!c.collected) {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⭐', c.x, c.y + 4);
            }
        }
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(s.flag.x, s.flag.y, 12, 40);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(s.flag.x + 2, s.flag.y - 10, 8, 12);
        
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(s.player.x, s.player.y, s.player.w, s.player.h);
        ctx.fillStyle = '#0088cc';
        ctx.fillRect(s.player.x + 4, s.player.y + 4, 6, 6);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🏆 ' + s.score + '/6', 10, 24);
        
        if (s.won) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🎉 YOU WIN!', canvas.width/2, canvas.height/2 - 10);
            ctx.fillStyle = '#aaa';
            ctx.font = '14px sans-serif';
            ctx.fillText('Score: ' + s.score + '/6 coins', canvas.width/2, canvas.height/2 + 30);
        }
        
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('← → to move | SPACE to jump', canvas.width - 10, canvas.height - 10);
    }

    function loop() {
        if (!s.running) return;
        update();
        draw();
        requestAnimationFrame(loop);
    }
    loop();

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            s.running = false;
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keyup', keyupHandler);
            delete platStates[winId];
        };
    }
}
