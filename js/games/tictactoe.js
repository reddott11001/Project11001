let tttStates = {};

function renderTicTacToe(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    tttStates[winId] = { board: ['', '', '', '', '', '', '', '', ''], turn: 'X', gameOver: false, scoreX: 0, scoreO: 0 };
    renderTTT(winId);
}

function renderTTT(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    const s = tttStates[winId];
    if (!s) return;
    const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let winner = null;
    for (const p of winPatterns) {
        if (s.board[p[0]] && s.board[p[0]] === s.board[p[1]] && s.board[p[1]] === s.board[p[2]]) { winner = s.board[p[0]]; break; }
    }
    if (!winner && !s.board.includes('')) winner = 'tie';
    if (winner === 'X') { s.scoreX++; s.gameOver = true; }
    else if (winner === 'O') { s.scoreO++; s.gameOver = true; }
    else if (winner === 'tie') s.gameOver = true;
    let status = winner === 'X' ? '🎉 X Wins!' : winner === 'O' ? '🎉 O Wins!' : winner === 'tie' ? "🤝 It's a Tie!" : `Turn: ${s.turn}`;
    body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#1a1a2e;font-family:Segoe UI,sans-serif;padding:10px;">
            <div style="color:#e0e0e0;font-size:13px;margin-bottom:6px;">Tic Tac Toe</div>
            <div style="color:#aaa;font-size:12px;margin-bottom:8px;">X: ${s.scoreX} &nbsp;|&nbsp; O: ${s.scoreO}</div>
            <div style="color:#ffcc00;font-size:14px;margin-bottom:10px;font-weight:bold;">${status}</div>
            <div style="display:grid;grid-template-columns:repeat(3,64px);gap:4px;">
                ${s.board.map((c, i) => `
                    <div onclick="${s.gameOver || c ? '' : `tttMove('${winId}',${i})`}" style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;background:#16213e;border:2px solid #0f3460;border-radius:6px;cursor:${s.gameOver || c ? 'default' : 'pointer'};color:${c === 'X' ? '#e94560' : '#00d4ff'};transition:0.2s;">${c || ''}</div>
                `).join('')}
            </div>
            ${s.gameOver ? `<button onclick="tttReset('${winId}')" style="margin-top:14px;padding:8px 24px;background:#0f3460;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">Play Again</button>` : ''}
        </div>`;
}

function tttMove(winId, i) {
    const s = tttStates[winId];
    if (!s || s.gameOver || s.board[i]) return;
    s.board[i] = s.turn;
    s.turn = s.turn === 'X' ? 'O' : 'X';
    renderTTT(winId);
}

function tttReset(winId) {
    const s = tttStates[winId];
    if (!s) return;
    s.board = ['', '', '', '', '', '', '', '', ''];
    s.turn = 'X';
    s.gameOver = false;
    renderTTT(winId);
}
