let calcState = {};

function renderCalculator(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    
    calcState[winId] = {
        display: '0',
        prevValue: null,
        operation: null,
        waitingForOperand: false
    };
    
    body.innerHTML = `
        <div class="calc-app">
            <div class="calc-display" id="${winId}-calc-display">0</div>
            <div class="calc-buttons">
                <button class="calc-btn calc-btn-clear" onclick="calcClear('${winId}')">C</button>
                <button class="calc-btn calc-btn-op" onclick="calcBackspace('${winId}')">⌫</button>
                <button class="calc-btn calc-btn-op" onclick="calcPercent('${winId}')">%</button>
                <button class="calc-btn calc-btn-op" onclick="calcOperation('${winId}', '/')">÷</button>
                
                <button class="calc-btn" onclick="calcDigit('${winId}', '7')">7</button>
                <button class="calc-btn" onclick="calcDigit('${winId}', '8')">8</button>
                <button class="calc-btn" onclick="calcDigit('${winId}', '9')">9</button>
                <button class="calc-btn calc-btn-op" onclick="calcOperation('${winId}', '*')">×</button>
                
                <button class="calc-btn" onclick="calcDigit('${winId}', '4')">4</button>
                <button class="calc-btn" onclick="calcDigit('${winId}', '5')">5</button>
                <button class="calc-btn" onclick="calcDigit('${winId}', '6')">6</button>
                <button class="calc-btn calc-btn-op" onclick="calcOperation('${winId}', '-')">−</button>
                
                <button class="calc-btn" onclick="calcDigit('${winId}', '1')">1</button>
                <button class="calc-btn" onclick="calcDigit('${winId}', '2')">2</button>
                <button class="calc-btn" onclick="calcDigit('${winId}', '3')">3</button>
                <button class="calc-btn calc-btn-op" onclick="calcOperation('${winId}', '+')">+</button>
                
                <button class="calc-btn" onclick="calcToggleSign('${winId}')">±</button>
                <button class="calc-btn" onclick="calcDigit('${winId}', '0')">0</button>
                <button class="calc-btn" onclick="calcDecimal('${winId}')">.</button>
                <button class="calc-btn calc-btn-equals" onclick="calcEquals('${winId}')">=</button>
            </div>
        </div>
    `;
}

function calcUpdateDisplay(winId) {
    const display = document.getElementById(winId + '-calc-display');
    if (display) {
        display.textContent = calcState[winId].display;
    }
}

function calcDigit(winId, digit) {
    const state = calcState[winId];
    if (state.waitingForOperand) {
        state.display = digit;
        state.waitingForOperand = false;
    } else {
        state.display = state.display === '0' ? digit : state.display + digit;
    }
    calcUpdateDisplay(winId);
}

function calcDecimal(winId) {
    const state = calcState[winId];
    if (state.waitingForOperand) {
        state.display = '0.';
        state.waitingForOperand = false;
    } else if (!state.display.includes('.')) {
        state.display = state.display + '.';
    }
    calcUpdateDisplay(winId);
}

function calcClear(winId) {
    const state = calcState[winId];
    state.display = '0';
    state.prevValue = null;
    state.operation = null;
    state.waitingForOperand = false;
    calcUpdateDisplay(winId);
}

function calcBackspace(winId) {
    const state = calcState[winId];
    if (!state.waitingForOperand) {
        state.display = state.display.length > 1 ? state.display.slice(0, -1) : '0';
        calcUpdateDisplay(winId);
    }
}

function calcPercent(winId) {
    const state = calcState[winId];
    const value = parseFloat(state.display);
    state.display = String(value / 100);
    calcUpdateDisplay(winId);
}

function calcToggleSign(winId) {
    const state = calcState[winId];
    if (state.display !== '0') {
        state.display = state.display.startsWith('-') ? state.display.slice(1) : '-' + state.display;
        calcUpdateDisplay(winId);
    }
}

function calcOperation(winId, op) {
    const state = calcState[winId];
    const inputValue = parseFloat(state.display);
    
    if (state.prevValue === null) {
        state.prevValue = inputValue;
    } else if (state.operation) {
        const result = calcPerformOperation(state.prevValue, inputValue, state.operation);
        state.display = String(result);
        state.prevValue = result;
        calcUpdateDisplay(winId);
    }
    
    state.waitingForOperand = true;
    state.operation = op;
}

function calcPerformOperation(a, b, op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b !== 0 ? a / b : NaN;
        default: return b;
    }
}

function calcEquals(winId) {
    const state = calcState[winId];
    if (state.operation && state.prevValue !== null) {
        const inputValue = parseFloat(state.display);
        const result = calcPerformOperation(state.prevValue, inputValue, state.operation);
        state.display = isNaN(result) ? 'Error' : String(result);
        state.prevValue = null;
        state.operation = null;
        state.waitingForOperand = true;
        calcUpdateDisplay(winId);
    }
}
