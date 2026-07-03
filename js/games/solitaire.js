let solState = {};

function renderSolitaire(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    body.innerHTML = `
        <div class="sol-app">
            <div class="sol-top-bar">
                <button class="sol-btn" onclick="solNewGame('${winId}')">New Game</button>
                <button class="sol-btn sol-hint-btn" onclick="solShowHint('${winId}')">💡 Hint</button>
                <span class="sol-score" id="${winId}-sol-score">Moves: 0</span>
            </div>
            <div class="sol-game-area" id="${winId}-sol-game"></div>
        </div>
    `;
    
    const gameSaves = JSON.parse(localStorage.getItem('game-saves') || '{}');
    if (gameSaves.solitaire) {
        solLoadGame(winId, gameSaves.solitaire);
    } else {
        solNewGame(winId);
    }
}

function solLoadGame(winId, saveData) {
    const state = {
        stock: saveData.stock || [],
        waste: saveData.waste || [],
        foundations: saveData.foundations || [[], [], [], []],
        tableau: saveData.tableau || [[], [], [], [], [], [], []],
        moves: saveData.moves || 0,
        selectedCard: null,
        selectedFrom: null,
        selectedTableau: null,
        selectedFoundation: null,
        hints: [],
        hintIndex: 0,
        animating: false,
        dragData: null
    };
    
    solState[winId] = state;
    solRender(winId);
    addNotification('🃏 Solitaire', `Game loaded (${state.moves} moves)`);
}

function solNewGame(winId) {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    let deck = [];
    for (let suit of suits) {
        for (let i = 0; i < values.length; i++) {
            deck.push({
                suit: suit,
                value: values[i],
                numValue: i + 1,
                color: (suit === '♥' || suit === '♦') ? 'red' : 'black',
                faceUp: false
            });
        }
    }
    
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    const state = {
        stock: [],
        waste: [],
        foundations: [[], [], [], []],
        tableau: [[], [], [], [], [], [], []],
        moves: 0,
        selectedCard: null,
        selectedFrom: null,
        selectedTableau: null,
        selectedFoundation: null,
        hints: [],
        hintIndex: 0,
        animating: false,
        dragData: null
    };
    
    let cardIndex = 0;
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = deck[cardIndex++];
            card.faceUp = (row === col);
            state.tableau[col].push(card);
        }
    }
    
    while (cardIndex < deck.length) {
        state.stock.push(deck[cardIndex++]);
    }
    
    solState[winId] = state;
    solRender(winId);
}

function solRender(winId) {
    const state = solState[winId];
    const game = document.getElementById(winId + '-sol-game');
    if (!game) return;
    
    let html = '<div class="sol-top-row">';
    
    html += '<div class="sol-stock-waste">';
    html += `<div class="sol-pile sol-stock" onclick="solDrawStock('${winId}')">`;
    if (state.stock.length > 0) {
        html += '<div class="sol-card sol-card-back"></div>';
    } else {
        html += '<div class="sol-card sol-card-empty sol-recycle-icon">🔄</div>';
    }
    html += '</div>';
    
    html += `<div class="sol-pile sol-waste" id="${winId}-waste-pile">`;
    if (state.waste.length > 0) {
        const card = state.waste[state.waste.length - 1];
        const isHint = state.hints.length > 0 && state.hints[state.hintIndex] && 
                       state.hints[state.hintIndex].from.type === 'waste';
        html += `<div class="sol-card sol-card-front ${card.color} ${isHint ? 'sol-hint-glow' : ''}" 
                    draggable="true" 
                    ondragstart="solDragStart(event,'${winId}','waste',0)"
                    onclick="solSelectWaste('${winId}')">
                    <div class="sol-card-top">${card.value}${card.suit}</div>
                    <div class="sol-card-center">${card.suit}</div>
                </div>`;
    } else {
        html += '<div class="sol-card sol-card-empty"></div>';
    }
    html += '</div>';
    html += '</div>';
    
    html += '<div class="sol-foundations">';
    for (let i = 0; i < 4; i++) {
        const isHint = state.hints.length > 0 && state.hints[state.hintIndex] && 
                       state.hints[state.hintIndex].to.type === 'foundation' && state.hints[state.hintIndex].to.index === i;
        html += `<div class="sol-pile sol-foundation ${isHint ? 'sol-hint-target' : ''}" 
                    id="${winId}-found-${i}"
                    ondragover="solDragOver(event)" 
                    ondrop="solDrop(event,'${winId}','foundation',${i})"
                    onclick="solSelectFoundation('${winId}', ${i})">`;
        if (state.foundations[i].length > 0) {
            const fc = state.foundations[i][state.foundations[i].length - 1];
            html += `<div class="sol-card sol-card-front ${fc.color}">
                <div class="sol-card-top">${fc.value}${fc.suit}</div>
                <div class="sol-card-center">${fc.suit}</div>
            </div>`;
        } else {
            html += `<div class="sol-card sol-card-empty"><span class="sol-foundation-label">${['♠','♥','♦','♣'][i]}</span></div>`;
        }
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    
    html += '<div class="sol-tableau">';
    for (let col = 0; col < 7; col++) {
        const pileHeight = state.tableau[col].length > 0 
            ? 96 + (state.tableau[col].length - 1) * 25 + 20 
            : 96;
        const isHintTarget = state.hints.length > 0 && state.hints[state.hintIndex] && 
                             state.hints[state.hintIndex].to.type === 'tableau' && state.hints[state.hintIndex].to.index === col;
        html += `<div class="sol-tableau-col ${isHintTarget ? 'sol-hint-target' : ''}" 
                    data-col="${col}" 
                    style="min-height:${pileHeight}px"
                    ondragover="solDragOver(event)" 
                    ondrop="solDrop(event,'${winId}','tableau',${col})"
                    onclick="solSelectTableauEmpty('${winId}', ${col}, event)">`;
        if (state.tableau[col].length === 0) {
            html += '<div class="sol-card sol-card-empty"></div>';
        } else {
            for (let i = 0; i < state.tableau[col].length; i++) {
                const card = state.tableau[col][i];
                const isSelected = state.selectedFrom === 'tableau' && 
                                   state.selectedTableau && 
                                   state.selectedTableau.col === col && 
                                   state.selectedTableau.index === i;
                const isHintCard = state.hints.length > 0 && state.hints[state.hintIndex] && 
                                   state.hints[state.hintIndex].from.type === 'tableau' &&
                                   state.hints[state.hintIndex].from.col === col &&
                                   state.hints[state.hintIndex].from.index === i;
                const offset = i * (card.faceUp ? 25 : 10);
                if (card.faceUp) {
                    html += `<div class="sol-tableau-card" style="top:${offset}px; z-index:${i+1}" 
                                onclick="solSelectTableau('${winId}', ${col}, ${i})">`;
                    html += `<div class="sol-card sol-card-front ${card.color} ${isSelected ? 'sol-card-selected' : ''} ${isHintCard ? 'sol-hint-glow' : ''}"
                                draggable="true"
                                ondragstart="solDragStart(event,'${winId}','tableau',${col},${i})">
                        <div class="sol-card-top">${card.value}${card.suit}</div>
                        <div class="sol-card-center">${card.suit}</div>
                    </div>`;
                    html += '</div>';
                } else {
                    html += `<div class="sol-tableau-card" style="top:${offset}px; z-index:${i+1}"><div class="sol-card sol-card-back"></div></div>`;
                }
            }
        }
        html += '</div>';
    }
    html += '</div>';
    
    game.innerHTML = html;
    
    const scoreEl = document.getElementById(winId + '-sol-score');
    if (scoreEl) scoreEl.textContent = 'Moves: ' + state.moves;
}

function solDrawStock(winId) {
    const state = solState[winId];
    if (state.animating) return;
    state.selectedCard = null;
    state.selectedFrom = null;
    state.hints = [];
    
    if (state.stock.length === 0) {
        state.animating = true;
        const wasteCards = [...state.waste];
        state.waste = [];
        let delay = 0;
        wasteCards.forEach((card, i) => {
            card.faceUp = false;
            setTimeout(() => {
                state.stock.push(card);
                solRender(winId);
                if (i === wasteCards.length - 1) {
                    state.animating = false;
                }
            }, delay);
            delay += 60;
        });
        if (wasteCards.length === 0) state.animating = false;
    } else {
        state.animating = true;
        const card = state.stock.pop();
        card.faceUp = true;
        setTimeout(() => {
            state.waste.push(card);
            state.moves++;
            state.animating = false;
            solRender(winId);
        }, 120);
    }
}

function solSelectWaste(winId) {
    const state = solState[winId];
    if (state.animating) return;
    if (state.waste.length === 0) return;
    
    const card = state.waste[state.waste.length - 1];
    
    if (state.selectedFrom === 'waste') {
        state.selectedCard = null;
        state.selectedFrom = null;
        solRender(winId);
        return;
    }
    
    if (state.selectedCard) {
        solTryMove(winId, null, null, null);
    } else {
        state.selectedCard = card;
        state.selectedFrom = 'waste';
        state.hints = [];
        solRender(winId);
    }
}

function solSelectFoundation(winId, foundIdx) {
    const state = solState[winId];
    if (state.animating) return;
    
    if (state.selectedCard) {
        solTryMove(winId, foundIdx, null, null);
    } else if (state.foundations[foundIdx].length > 0) {
        const card = state.foundations[foundIdx][state.foundations[foundIdx].length - 1];
        state.selectedCard = card;
        state.selectedFrom = 'foundation';
        state.selectedFoundation = foundIdx;
        state.hints = [];
        solRender(winId);
    }
}

function solSelectTableau(winId, col, index) {
    if (event) event.stopPropagation();
    const state = solState[winId];
    if (state.animating) return;
    const pile = state.tableau[col];
    
    if (index >= pile.length) return;
    const card = pile[index];
    
    if (!card.faceUp) {
        if (index === pile.length - 1) {
            card.faceUp = true;
            state.hints = [];
            solRender(winId);
        }
        return;
    }
    
    if (state.selectedFrom === 'tableau' && state.selectedTableau && state.selectedTableau.col === col && state.selectedTableau.index === index) {
        state.selectedCard = null;
        state.selectedFrom = null;
        state.selectedTableau = null;
        solRender(winId);
        return;
    }
    
    if (state.selectedCard) {
        state.selectedTableau = { col, index };
        solTryMove(winId, undefined, col, index);
    } else {
        state.selectedCard = card;
        state.selectedFrom = 'tableau';
        state.selectedTableau = { col, index };
        state.hints = [];
        solRender(winId);
    }
}

function solSelectTableauEmpty(winId, col, event) {
    const state = solState[winId];
    if (state.animating) return;
    if (state.tableau[col].length > 0) return;
    
    if (state.selectedCard) {
        solTryMove(winId, undefined, col, 0);
    }
}

function solTryMove(winId, targetFound, targetCol, targetIndex) {
    const state = solState[winId];
    const card = state.selectedCard;
    if (!card) return;
    
    let moved = false;
    let moveAnim = null;
    
    if (state.selectedFrom === 'waste') {
        if (targetFound !== undefined && targetFound !== null) {
            if (solCanPlaceOnFoundation(card, state.foundations[targetFound])) {
                state.waste.pop();
                state.foundations[targetFound].push(card);
                moved = true;
            }
        } else if (targetCol !== undefined && targetCol !== null) {
            if (solCanPlaceOnTableau(card, state.tableau[targetCol], targetIndex)) {
                state.waste.pop();
                state.tableau[targetCol].push(card);
                moved = true;
            }
        }
    } else if (state.selectedFrom === 'tableau') {
        const srcCol = state.selectedTableau.col;
        const srcIdx = state.selectedTableau.index;
        const cards = state.tableau[srcCol].slice(srcIdx);
        
        if (targetFound !== undefined && targetFound !== null && cards.length === 1) {
            if (solCanPlaceOnFoundation(card, state.foundations[targetFound])) {
                state.tableau[srcCol].splice(srcIdx);
                state.foundations[targetFound].push(card);
                if (state.tableau[srcCol].length > 0) {
                    state.tableau[srcCol][state.tableau[srcCol].length - 1].faceUp = true;
                }
                moved = true;
            }
        } else if (targetCol !== undefined && targetCol !== null) {
            if (solCanPlaceOnTableau(card, state.tableau[targetCol], targetIndex)) {
                state.tableau[srcCol].splice(srcIdx);
                for (let c of cards) {
                    state.tableau[targetCol].push(c);
                }
                if (state.tableau[srcCol].length > 0) {
                    state.tableau[srcCol][state.tableau[srcCol].length - 1].faceUp = true;
                }
                moved = true;
            }
        }
    } else if (state.selectedFrom === 'foundation') {
        const srcFound = state.selectedFoundation;
        const srcCard = state.foundations[srcFound].pop();
        
        if (targetCol !== undefined && targetCol !== null) {
            if (solCanPlaceOnTableau(srcCard, state.tableau[targetCol], targetIndex)) {
                state.tableau[targetCol].push(srcCard);
                moved = true;
            } else {
                state.foundations[srcFound].push(srcCard);
            }
        } else {
            state.foundations[srcFound].push(srcCard);
        }
    }
    
    if (moved) {
        state.moves++;
        solAnimateMove(winId, () => {
            solCheckWin(winId);
        });
    }
    
    state.selectedCard = null;
    state.selectedFrom = null;
    state.selectedTableau = null;
    state.selectedFoundation = null;
    state.hints = [];
    solRender(winId);
}

function solAnimateMove(winId, callback) {
    const game = document.getElementById(winId + '-sol-game');
    if (!game) { if (callback) callback(); return; }
    
    const cards = game.querySelectorAll('.sol-card-front');
    cards.forEach(c => {
        c.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        c.style.transform = 'scale(1.05)';
        setTimeout(() => {
            c.style.transform = 'scale(1)';
        }, 200);
    });
    
    if (callback) setTimeout(callback, 250);
}

function solDragStart(event, winId, fromType, fromCol, fromIndex) {
    const state = solState[winId];
    if (state.animating) { event.preventDefault(); return; }
    
    state.dragData = { fromType, fromCol, fromIndex };
    state.selectedCard = null;
    state.selectedFrom = null;
    state.hints = [];
    
    if (fromType === 'waste') {
        state.selectedCard = state.waste[state.waste.length - 1];
        state.selectedFrom = 'waste';
    } else if (fromType === 'tableau') {
        const pile = state.tableau[fromCol];
        if (fromIndex < pile.length && pile[fromIndex].faceUp) {
            state.selectedCard = pile[fromIndex];
            state.selectedFrom = 'tableau';
            state.selectedTableau = { col: fromCol, index: fromIndex };
        }
    }
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', '');
    
    const dragEl = event.target.closest('.sol-card');
    if (dragEl) {
        event.dataTransfer.setDragImage(dragEl, 35, 48);
    }
    
    setTimeout(() => {
        if (dragEl) dragEl.style.opacity = '0.4';
    }, 0);
}

function solDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function solDrop(event, winId, toType, toIndex) {
    event.preventDefault();
    const state = solState[winId];
    if (!state.dragData) return;
    
    const drag = state.dragData;
    
    if (toType === 'foundation') {
        solTryMove(winId, toIndex, null, null);
    } else if (toType === 'tableau') {
        const targetPile = state.tableau[toIndex];
        const targetIdx = targetPile.length;
        solTryMove(winId, undefined, toIndex, targetIdx);
    }
    
    state.dragData = null;
    solRender(winId);
}

function solCanPlaceOnFoundation(card, foundation) {
    if (foundation.length === 0) {
        return card.value === 'A';
    }
    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && card.numValue === topCard.numValue + 1;
}

function solCanPlaceOnTableau(card, tableau, targetIndex) {
    if (targetIndex !== tableau.length) return false;
    
    if (tableau.length === 0) {
        return card.value === 'K';
    }
    const topCard = tableau[tableau.length - 1];
    return topCard.faceUp && card.color !== topCard.color && card.numValue === topCard.numValue - 1;
}

function solShowHint(winId) {
    const state = solState[winId];
    if (state.animating) return;
    
    state.selectedCard = null;
    state.selectedFrom = null;
    state.selectedTableau = null;
    state.selectedFoundation = null;
    
    const hints = solFindHints(state);
    
    if (hints.length === 0) {
        state.hints = [];
        solRender(winId);
        addNotification('💡 Solitaire', 'No more moves available! Try drawing from stock or start a new game.');
        return;
    }
    
    state.hints = hints;
    state.hintIndex = 0;
    solRender(winId);
    
    if (hints.length > 1) {
        if (state._hintInterval) clearInterval(state._hintInterval);
        state._hintInterval = setInterval(() => {
            state.hintIndex = (state.hintIndex + 1) % state.hints.length;
            solRender(winId);
        }, 2000);
        
        setTimeout(() => {
            if (state._hintInterval) {
                clearInterval(state._hintInterval);
                state._hintInterval = null;
            }
            state.hints = [];
            solRender(winId);
        }, 8000);
    } else {
        setTimeout(() => {
            state.hints = [];
            solRender(winId);
        }, 4000);
    }
}

function solFindHints(state) {
    const hints = [];
    
    for (let col = 0; col < 7; col++) {
        const pile = state.tableau[col];
        for (let i = pile.length - 1; i >= 0; i--) {
            const card = pile[i];
            if (!card.faceUp) break;
            
            for (let f = 0; f < 4; f++) {
                if (i === pile.length - 1 && solCanPlaceOnFoundation(card, state.foundations[f])) {
                    hints.push({
                        from: { type: 'tableau', col, index: i },
                        to: { type: 'foundation', index: f },
                        card: card
                    });
                }
            }
            
            if (i > 0) continue;
            
            for (let tc = 0; tc < 7; tc++) {
                if (tc === col) continue;
                if (solCanPlaceOnTableau(card, state.tableau[tc], state.tableau[tc].length)) {
                    if (state.tableau[tc].length > 0 || card.value === 'K') {
                        const topTarget = state.tableau[tc].length > 0 ? state.tableau[tc][state.tableau[tc].length - 1] : null;
                        if (topTarget && topTarget.faceUp) {
                            hints.push({
                                from: { type: 'tableau', col, index: i },
                                to: { type: 'tableau', index: tc },
                                card: card
                            });
                        }
                    }
                }
            }
        }
    }
    
    if (state.waste.length > 0) {
        const wasteCard = state.waste[state.waste.length - 1];
        
        for (let f = 0; f < 4; f++) {
            if (solCanPlaceOnFoundation(wasteCard, state.foundations[f])) {
                hints.push({
                    from: { type: 'waste' },
                    to: { type: 'foundation', index: f },
                    card: wasteCard
                });
            }
        }
        
        for (let tc = 0; tc < 7; tc++) {
            if (solCanPlaceOnTableau(wasteCard, state.tableau[tc], state.tableau[tc].length)) {
                if (state.tableau[tc].length > 0 || wasteCard.value === 'K') {
                    hints.push({
                        from: { type: 'waste' },
                        to: { type: 'tableau', index: tc },
                        card: wasteCard
                    });
                }
            }
        }
    }
    
    const seen = new Set();
    return hints.filter(h => {
        const key = `${h.from.type}-${h.from.col || 0}-${h.from.index || 0}-${h.to.type}-${h.to.index}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function solCheckWin(winId) {
    const state = solState[winId];
    const totalInFoundations = state.foundations.reduce((sum, f) => sum + f.length, 0);
    
    if (totalInFoundations === 52) {
        setTimeout(() => {
            solWinAnimation(winId);
        }, 300);
    }
}

function solWinAnimation(winId) {
    const game = document.getElementById(winId + '-sol-game');
    if (!game) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'sol-win-overlay';
    overlay.innerHTML = `
        <div class="sol-win-box">
            <div class="sol-win-icon">🏆</div>
            <h2 class="sol-win-title">YOU WIN!</h2>
            <div class="sol-win-stats">Completed in ${solState[winId].moves} moves</div>
            <button class="sol-win-btn" onclick="solNewGame('${winId}'); this.closest('.sol-win-overlay').remove();">Play Again</button>
        </div>
    `;
    game.style.position = 'relative';
    game.appendChild(overlay);
    
    const suits = ['♠', '♥', '♦', '♣'];
    const colors = ['#fff', '#ff4444', '#ff4444', '#fff'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'sol-confetti';
            confetti.textContent = suits[Math.floor(Math.random() * 4)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.color = colors[Math.floor(Math.random() * 4)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            overlay.appendChild(confetti);
        }, i * 100);
    }
}
