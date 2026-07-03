let termState = {};

const termCommands = {
    help: { desc: "Show available commands", usage: "help [command]" },
    dir: { desc: "List files in current directory", usage: "dir" },
    ls: { desc: "List files in current directory", usage: "ls" },
    cd: { desc: "Change directory", usage: "cd <path>" },
    pwd: { desc: "Print working directory", usage: "pwd" },
    cls: { desc: "Clear terminal screen", usage: "cls" },
    clear: { desc: "Clear terminal screen", usage: "clear" },
    echo: { desc: "Display a message", usage: "echo <message>" },
    systeminfo: { desc: "Display system information", usage: "systeminfo" },
    whoami: { desc: "Show current user", usage: "whoami" },
    date: { desc: "Show current date and time", usage: "date" },
    time: { desc: "Show current time", usage: "time" },
    neofetch: { desc: "Display system info in style", usage: "neofetch" },
    open: { desc: "Open an application", usage: "open <app>  (file-explorer, browser, notepad, calc, paint, cmd, taskmgr)" },
    shutdown: { desc: "Shut down the OS", usage: "shutdown" },
    restart: { desc: "Restart the OS", usage: "restart" },
    lock: { desc: "Lock the screen", usage: "lock" },
    wallpaper: { desc: "Change desktop wallpaper", usage: "wallpaper" },
    calc: { desc: "Simple calculator", usage: "calc <expression>  (e.g., calc 2+2*3)" },
    color: { desc: "Change terminal text color", usage: "color <hex>  (e.g., color 00ff00)" },
    title: { desc: "Set terminal window title", usage: "title <text>" },
    type: { desc: "Display contents of a file", usage: "type <filename>" },
    mkdir: { desc: "Create a new directory", usage: "mkdir <name>" },
    md: { desc: "Create a new directory", usage: "md <name>" },
    ver: { desc: "Show WebOS version", usage: "ver" },
    hostname: { desc: "Show computer hostname", usage: "hostname" },
    ipconfig: { desc: "Show network configuration", usage: "ipconfig" },
    tasklist: { desc: "Show running applications", usage: "tasklist" },
    notepad: { desc: "Shortcut to open Notepad", usage: "notepad" },
    explorer: { desc: "Shortcut to open File Explorer", usage: "explorer" },
    taskmgr: { desc: "Open Task Manager", usage: "taskmgr" },
    ping: { desc: "Send network ping (simulated)", usage: "ping <hostname>" },
    matrix: { desc: "Matrix rain effect", usage: "matrix" },
    banner: { desc: "Display a colorful banner", usage: "banner <text>" },
    scan: { desc: "Scan system for virus/threat files (names only)", usage: "scan" },
    locate: { desc: "Deep scan to reveal virus file hiding locations", usage: "locate" },
    del: { desc: "Delete a file (must be in correct directory)", usage: "del <filename>" },
    rm: { desc: "Delete a file (alias for del)", usage: "rm <filename>" },
    kill: { desc: "Kill a running process", usage: "kill <PID or name>" },
    clean: { desc: "Clean system after virus removal", usage: "clean" },
    system: { desc: "Check system integrity status", usage: "system" },
    resetos: { desc: "Reset WebOS to factory defaults (clears all saved data)", usage: "resetos" },
};

function renderTerminal(winId) {
    const body = document.getElementById(winId + '-body');
    body.style.overflow = 'hidden';
    body.innerHTML = `
        <div class="term-container" id="${winId}-term">
            <div class="term-output" id="${winId}-term-output"></div>
            <div class="term-input-line">
                <span class="term-prompt" id="${winId}-term-prompt">C:\\Users\\User> </span>
                <input type="text" class="term-input" id="${winId}-term-input" autofocus
                    onkeydown="termHandleKey(event, '${winId}')">
            </div>
        </div>
    `;

    termState[winId] = {
        cwd: ['C:', 'Users', 'User'],
        history: [],
        historyIndex: -1,
        color: '#00ff00',
        matrixInterval: null,
        matrixChars: []
    };

    const input = document.getElementById(winId + '-term-input');
    setTimeout(() => input.focus(), 100);

    termPrint(winId, 'WebOS Command Prompt v10.0', '#0078d4');
    termPrint(winId, '(C) 2026 WebOS Corporation. All rights reserved.\n', '#666');
    termPrint(winId, '╔══════════════════════════════════════════════════╗', '#888');
    termPrint(winId, '║  This terminal only controls your WebOS system.  ║', '#ffcc00');
    termPrint(winId, '║  All commands run inside the browser sandbox.   ║', '#ffcc00');
    termPrint(winId, '║  Nothing affects your real computer OS.         ║', '#ffcc00');
    termPrint(winId, '╚══════════════════════════════════════════════════╝\n', '#888');
    termPrint(winId, 'Type "help" for available commands.\n', '#888');

    body.addEventListener('click', () => input.focus());

    if (activeWindows[winId]) {
        activeWindows[winId].cleanup = () => {
            const st = termState[winId];
            if (st && st.matrixInterval) {
                clearInterval(st.matrixInterval);
                st.matrixInterval = null;
            }
        };
    }
}

function termHandleKey(e, winId) {
    const input = document.getElementById(winId + '-term-input');
    const st = termState[winId];
    if (!input || !st) return;

    if (e.key === 'Enter') {
        const cmd = input.value.trim();
        input.value = '';
        termProcessCommand(winId, cmd);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (st.history.length > 0) {
            st.historyIndex = Math.max(0, st.historyIndex - 1);
            input.value = st.history[st.historyIndex] || '';
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (st.historyIndex < st.history.length - 1) {
            st.historyIndex++;
            input.value = st.history[st.historyIndex] || '';
        } else {
            st.historyIndex = st.history.length;
            input.value = '';
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const partial = input.value.trim().toLowerCase();
        if (partial) {
            const matches = Object.keys(termCommands).filter(c => c.startsWith(partial));
            if (matches.length === 1) {
                input.value = matches[0];
            }
        }
    }
}

function termPrint(winId, text, color) {
    const output = document.getElementById(winId + '-term-output');
    if (!output) return;
    const line = document.createElement('div');
    line.className = 'term-line';
    if (color) line.style.color = color;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function termProcessCommand(winId, cmd) {
    const st = termState[winId];
    if (!cmd.trim()) {
        termPrintPrompt(winId);
        return;
    }

    st.history.push(cmd);
    st.historyIndex = st.history.length;

    const prompt = document.getElementById(winId + '-term-prompt');
    const cwdStr = st.cwd.join('\\');
    if (prompt) prompt.textContent = cwdStr + '> ';

    termPrint(winId, cwdStr + '>' + cmd, '#ccc');

    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
        case 'help': termHelp(winId, args); break;
        case 'dir': case 'ls': termDir(winId, args); break;
        case 'cd': termCd(winId, args); break;
        case 'pwd': termPwd(winId); break;
        case 'cls': case 'clear': termCls(winId); break;
        case 'echo': termEcho(winId, args); break;
        case 'systeminfo': termSystemInfo(winId); break;
        case 'whoami': termPrint(winId, 'webos\\user', st.color); break;
        case 'date': termPrint(winId, new Date().toLocaleDateString(), st.color); break;
        case 'time': termPrint(winId, new Date().toLocaleTimeString(), st.color); break;
        case 'neofetch': termNeofetch(winId); break;
        case 'open': termOpen(winId, args); break;
        case 'shutdown': termPrint(winId, 'Shutting down...', '#ff4444'); setTimeout(() => shutdownOS(), 1000); break;
        case 'restart': termPrint(winId, 'Restarting...', '#ffaa00'); setTimeout(() => restartOS(), 1000); break;
        case 'lock': lockScreen(); break;
        case 'wallpaper': changeWallpaper(); termPrint(winId, 'Wallpaper changed.', st.color); break;
        case 'calc': termCalc(winId, args); break;
        case 'color': termColor(winId, args); break;
        case 'title': termTitle(winId, args); break;
        case 'type': termType(winId, args); break;
        case 'mkdir': case 'md': termMkdir(winId, args); break;
        case 'ver': termPrint(winId, '\nWebOS Version 10.0 Build 2026\n', '#0078d4'); break;
        case 'hostname': termPrint(winId, 'WEBCORE-PC', st.color); break;
        case 'ipconfig': termIpconfig(winId); break;
        case 'tasklist': termTasklist(winId); break;
        case 'notepad': termPrint(winId, 'Opening Notepad...', st.color); openApp('notepad'); break;
        case 'explorer': termPrint(winId, 'Opening File Explorer...', st.color); openApp('file-explorer'); break;
        case 'taskmgr': termPrint(winId, 'Opening Task Manager...', st.color); openApp('taskmgr'); break;
        case 'ping': termPing(winId, args); break;
        case 'matrix': termMatrix(winId); break;
        case 'banner': termBanner(winId, args); break;
        case 'scan': termScan(winId); break;
        case 'locate': termLocate(winId); break;
        case 'del': case 'rm': termDelete(winId, args); break;
        case 'kill': termKill(winId, args); break;
        case 'clean': termClean(winId); break;
        case 'system': termSystemCheck(winId); break;
        case 'resetos': termResetOS(winId, args); break;
        default:
            termPrint(winId, `'${command}' is not recognized as an internal or external command.`, '#ff4444');
            termPrint(winId, 'Type "help" for available commands.', '#888');
    }

    termPrintPrompt(winId);
}

function termPrintPrompt(winId) {
    const input = document.getElementById(winId + '-term-input');
    if (input) input.focus();
}

function termHelp(winId, args) {
    const st = termState[winId];
    if (args.length > 0) {
        const cmd = args[0].toLowerCase();
        const info = termCommands[cmd];
        if (info) {
            termPrint(winId, `\n${cmd} - ${info.desc}`, '#00d4ff');
            termPrint(winId, `Usage: ${info.usage}`, st.color);
        } else {
            termPrint(winId, `No help available for '${cmd}'.`, '#ff4444');
        }
        return;
    }

    termPrint(winId, '\n Available commands:', '#00d4ff');
    const categories = {
        'System:': ['systeminfo', 'ver', 'whoami', 'hostname', 'date', 'time', 'neofetch'],
        'Files:': ['dir', 'ls', 'cd', 'pwd', 'type', 'mkdir', 'md'],
        'Apps:':      ['open', 'notepad', 'explorer', 'tasklist', 'taskmgr'],
        'OS:': ['shutdown', 'restart', 'lock', 'wallpaper'],
        'Terminal:': ['cls', 'clear', 'color', 'title', 'echo', 'help'],
        'Hack:': ['scan', 'locate', 'del', 'rm', 'kill', 'clean', 'system'],
        'Fun:': ['calc', 'ping', 'matrix', 'banner'],
    };

    for (const [cat, cmds] of Object.entries(categories)) {
        termPrint(winId, `  ${cat}`, '#888');
        termPrint(winId, '    ' + cmds.join(', '), st.color);
    }
    termPrint(winId, '', null);
}

function termDir(winId, args) {
    const st = termState[winId];
    const folder = navigateToPath(st.cwd);
    if (!folder || !folder.children) {
        termPrint(winId, ' Directory is empty or invalid.', st.color);
        return;
    }
    termPrint(winId, `\n Directory of ${st.cwd.join('\\')}\n`, '#fff');
    const items = Object.entries(folder.children);
    items.forEach(([name, item]) => {
        if (item.type === 'folder') {
            termPrint(winId, `  [DIR]  ${name}`, '#00d4ff');
        } else {
            termPrint(winId, `  [FILE] ${name}`, st.color);
        }
    });
    termPrint(winId, `\n  ${items.length} item(s)\n`, '#888');
}

function termCd(winId, args) {
    const st = termState[winId];
    if (args.length === 0 || args[0] === '' || args[0] === '~') {
        st.cwd = ['C:', 'Users', 'User'];
        termUpdatePrompt(winId);
        return;
    }
    const target = args.join(' ').replace(/\//g, '\\');
    if (target === '..' || target === '..\\') {
        if (st.cwd.length > 1) {
            st.cwd.pop();
            termUpdatePrompt(winId);
        } else {
            termPrint(winId, 'Cannot go above root directory.', '#ff4444');
        }
        return;
    }
    if (target === '\\' || target === '/') {
        st.cwd = ['C:'];
        termUpdatePrompt(winId);
        return;
    }

    let newPath;
    if (target.startsWith('\\') || target.startsWith('/')) {
        newPath = ['C:'];
    } else {
        newPath = [...st.cwd];
    }

    const parts = target.replace(/^[\\/]/, '').split('\\');
    for (const part of parts) {
        if (part === '..') {
            if (newPath.length > 1) newPath.pop();
        } else if (part === '.' || part === '') {
            continue;
        } else {
            const folder = navigateToPath(newPath);
            if (folder && folder.children && folder.children[part] && folder.children[part].type === 'folder') {
                newPath.push(part);
            } else {
                // try navigating from root as fallback
                const rootNewPath = ['C:'];
                let foundInRoot = true;
                for (const p of parts) {
                    if (p === '..' || p === '.' || p === '') continue;
                    const f = navigateToPath(rootNewPath);
                    if (f && f.children && f.children[p] && f.children[p].type === 'folder') {
                        rootNewPath.push(p);
                    } else {
                        foundInRoot = false;
                        break;
                    }
                }
                if (foundInRoot) {
                    newPath = rootNewPath;
                    break;
                }
                termPrint(winId, `The system cannot find the path specified.`, '#ff4444');
                return;
            }
        }
    }
    st.cwd = newPath;
    termUpdatePrompt(winId);
}

function termUpdatePrompt(winId) {
    const st = termState[winId];
    const prom = document.getElementById(winId + '-term-prompt');
    if (prom) prom.textContent = st.cwd.join('\\') + '> ';
}

function termPwd(winId) {
    const st = termState[winId];
    termPrint(winId, st.cwd.join('\\'), st.color);
}

function termCls(winId) {
    const output = document.getElementById(winId + '-term-output');
    if (output) output.innerHTML = '';
}

function termEcho(winId, args) {
    const st = termState[winId];
    termPrint(winId, args.join(' '), st.color);
}

function termSystemInfo(winId) {
    termPrint(winId, '\n System Information', '#00d4ff');
    termPrint(winId, '─────────────────────', '#666');
    termPrint(winId, `  OS Name:        WebOS 10`, '#00ff00');
    termPrint(winId, `  OS Version:     10.0.2026`, '#00ff00');
    termPrint(winId, `  Hostname:       WEBCORE-PC`, '#00ff00');
    termPrint(winId, `  User:           webos\\user`, '#00ff00');
    termPrint(winId, `  Environment:    Web Browser (sandboxed)`, '#00ff00');
    termPrint(winId, `  Shell:          WebOS CMD v1.0`, '#00ff00');
    termPrint(winId, `  All commands affect only this WebOS session.`, '#888');
    termPrint(winId, '─────────────────────\n', '#666');
}

function termNeofetch(winId) {
    const colors = ['#ff4444', '#ff8800', '#ffcc00', '#00cc44', '#00aaff', '#8844ff', '#ff44aa'];
    termPrint(winId, '', null);
    termPrint(winId, `        ............                    `, colors[4]);
    termPrint(winId, `    .';;;;;;:;;;;;;;'.                ` + `User@WEBCORE-PC`, colors[1]);
    termPrint(winId, `   ;;;;;;;;;;;;;;;;;;;;               ` + `---------------`, '#666');
    termPrint(winId, `  :;;;;;;;;;;;;;;;;;;;;:              ` + `OS: WebOS 10 Build 2026`, colors[0]);
    termPrint(winId, `  ;;;;;;;;;;;;;;;;;;;;;;              ` + `Host: WEBCORE-PC`, colors[1]);
    termPrint(winId, `  ;;;;;;;;;;;;;;;;;;;;;;              ` + `Kernel: JS/Web v10.0`, colors[2]);
    termPrint(winId, `  :;;;;;;;;;;;;;;;;;;;;:              ` + `Shell: WebOS CMD v1.0`, colors[3]);
    termPrint(winId, `   ;;;;;;;;;;;;;;;;;;;;               ` + `Terminal: WebOS Terminal`, colors[4]);
    termPrint(winId, `    '.;;;;;;;;;;;;;;;;'               ` + `CPU: Virtual Cores`, colors[5]);
    termPrint(winId, `       ';;;;;;;;;;;;'                 ` + `Memory: Virtual`, colors[6]);
    termPrint(winId, `         '::::::::'                   ` + `DE: WebOS Desktop`, colors[0]);
    termPrint(winId, `           ......                     ` + `Sandbox: Browser (safe)`, colors[1]);
    termPrint(winId, '', null);
}

function termOpen(winId, args) {
    if (args.length === 0) {
        termPrint(winId, 'Usage: open <app>', '#ff4444');
        termPrint(winId, 'Available: file-explorer, browser, notepad, calculator, paint, solitaire, tetris, fighter, cmd', '#888');
        return;
    }
    const appId = args[0].toLowerCase();
    const valid = ['file-explorer', 'browser', 'notepad', 'calculator', 'paint', 'solitaire', 'tetris', 'fighter', 'cmd', 'recycle', 'taskmgr'];
    const alias = { 'explorer': 'file-explorer', 'terminal': 'cmd', 'calc': 'calculator', 'taskman': 'taskmgr' };
    const resolved = alias[appId] || appId;

    if (valid.includes(resolved)) {
        termPrint(winId, `Opening ${resolved}...`, '#00ff00');
        openApp(resolved);
    } else {
        termPrint(winId, `Unknown application: '${appId}'`, '#ff4444');
    }
}

function termCalc(winId, args) {
    if (args.length === 0) {
        termPrint(winId, 'Usage: calc <expression>  (e.g., calc (2+3)*4)', '#ff4444');
        return;
    }
    const expr = args.join(' ').replace(/x/g, '*').replace(/÷/g, '/');
    try {
        if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
            termPrint(winId, 'Error: Only numeric expressions allowed (0-9, +, -, *, /, (, ), %, .)', '#ff4444');
            return;
        }
        const result = safeMathEval(expr);
        if (result !== undefined && !isNaN(result) && isFinite(result)) {
            termPrint(winId, expr + ' = ' + result, '#00ff00');
        } else {
            termPrint(winId, 'Invalid expression.', '#ff4444');
        }
    } catch {
        termPrint(winId, 'Invalid expression.', '#ff4444');
    }
}

function safeMathEval(expr) {
    let pos = 0;
    function peek() { return expr[pos]; }
    function next() { return expr[pos++]; }
    function skipWS() { while (pos < expr.length && expr[pos] === ' ') pos++; }
    function parseNum() {
        skipWS();
        if (peek() === '(') { next(); const v = parseExpr(); skipWS(); if (peek() === ')') next(); skipWS(); return v; }
        if (peek() === '-') { next(); return -parseNum(); }
        let num = '';
        while (pos < expr.length && /[0-9.]/.test(peek())) num += next();
        return parseFloat(num) || 0;
    }
    function parseFactor() {
        let v = parseNum(); skipWS();
        while (peek() === '*' || peek() === '/') {
            const op = next(); const right = parseNum();
            v = op === '*' ? v * right : v / right;
            skipWS();
        }
        return v;
    }
    function parseExpr() {
        let v = parseFactor(); skipWS();
        while (peek() === '+' || peek() === '-') {
            const op = next(); const right = parseFactor();
            v = op === '+' ? v + right : v - right;
            skipWS();
        }
        return v;
    }
    return parseExpr();
}

function termColor(winId, args) {
    const st = termState[winId];
    if (args.length === 0) {
        termPrint(winId, `Current color: ${st.color}`, st.color);
        termPrint(winId, 'Usage: color <hex>  (e.g., color 00ff00 for green)', '#888');
        return;
    }
    let hex = args[0].replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        st.color = '#' + hex.toLowerCase();
        const container = document.getElementById(winId + '-term');
        if (container) container.style.setProperty('--term-color', st.color);
        termUpdatePrompt(winId);
        termPrint(winId, `Color set to ${st.color}`, st.color);
    } else {
        termPrint(winId, 'Invalid color code. Use 6-digit hex (e.g., 00ff00).', '#ff4444');
    }
}

function termTitle(winId, args) {
    const title = args.join(' ') || 'WebOS Command Prompt';
    const titlebar = document.querySelector(`#${winId} .window-titlebar-text`);
    if (titlebar) titlebar.textContent = title;
}

function termType(winId, args) {
    const st = termState[winId];
    if (args.length === 0) {
        termPrint(winId, 'Usage: type <filename>', '#ff4444');
        return;
    }
    const filename = args.join(' ');
    const folder = navigateToPath(st.cwd);
    if (!folder || !folder.children || !folder.children[filename]) {
        termPrint(winId, `The system cannot find the file specified: ${filename}`, '#ff4444');
        return;
    }
    const item = folder.children[filename];
    if (item.type === 'folder') {
        termPrint(winId, `'${filename}' is a directory. Use 'dir' to view contents.`, '#ff4444');
        return;
    }
    termPrint(winId, '', null);
    termPrint(winId, `── ${filename} ──`, '#888');
    (item.content || '[Empty file]').split('\n').forEach(line => termPrint(winId, line, st.color));
    termPrint(winId, `──────────────`, '#888');
}

function termMkdir(winId, args) {
    const st = termState[winId];
    if (args.length === 0) {
        termPrint(winId, 'Usage: mkdir <directory name>', '#ff4444');
        return;
    }
    const name = args.join(' ');
    const folder = navigateToPath(st.cwd);
    if (!folder) {
        termPrint(winId, 'Invalid path.', '#ff4444');
        return;
    }
    if (!folder.children) folder.children = {};
    if (folder.children[name]) {
        termPrint(winId, `A subdirectory or file '${name}' already exists.`, '#ff4444');
        return;
    }
    folder.children[name] = { type: 'folder', children: {} };
    saveWebOS();
    termPrint(winId, `Directory '${name}' created.`, '#00ff00');
}

function termIpconfig(winId) {
    const st = termState[winId];
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    termPrint(winId, '\n Windows IP Configuration\n', '#fff');
    termPrint(winId, `  IPv4 Address:   ${rnd(10,223)}.${rnd(0,255)}.${rnd(0,255)}.${rnd(1,254)}`, st.color);
    termPrint(winId, `  Subnet Mask:    255.255.255.0`, st.color);
    termPrint(winId, `  Default Gateway: 192.168.1.1`, st.color);
    termPrint(winId, `  DNS Server:     8.8.8.8`, st.color);
    termPrint(winId, `  DHCP Enabled:   Yes`, st.color);
    termPrint(winId, `  MAC Address:    ${Array(6).fill(0).map(() => rnd(0,255).toString(16).padStart(2,'0')).join(':')}`, st.color);
    termPrint(winId, '');
}

function termTasklist(winId) {
    const st = termState[winId];
    const openApps = Object.values(activeWindows).filter(w => !w.closed);
    termPrint(winId, '\n Running Applications:', '#fff');
    termPrint(winId, '────────────────────────────────', '#666');
    if (openApps.length === 0) {
        termPrint(winId, ' No running applications.', st.color);
    } else {
        openApps.forEach(w => {
            termPrint(winId, `  ${w.icon} ${w.title}  [PID: ${w.id.replace('win-','')}]`, st.color);
        });
    }
    termPrint(winId, `\n Total: ${openApps.length} application(s)\n`, '#888');
}

function termPing(winId, args) {
    const st = termState[winId];
    const host = args[0] || 'localhost';
    const ms = () => Math.floor(Math.random() * 100 + 10);
    const ttl = () => Math.floor(Math.random() * 64 + 64);

    termPrint(winId, `\n Pinging ${host} [${termRandomIP()}] with 32 bytes of data:\n`, '#fff');
    for (let i = 0; i < 4; i++) {
        const delay = ms();
        const status = delay < 150 ? 'Reply from' : 'Request timed out';
        if (delay < 150) {
            termPrint(winId, `  Reply from ${termRandomIP()}: bytes=32 time=${delay}ms TTL=${ttl()}`, st.color);
        } else {
            termPrint(winId, `  Request timed out.`, '#ff4444');
        }
    }
    termPrint(winId, `\n Ping statistics for ${host}:`, '#fff');
    termPrint(winId, `  Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`, st.color);
}

function termRandomIP() {
    return `${Math.floor(Math.random()*200+10)}.${Math.floor(Math.random()*255+1)}.${Math.floor(Math.random()*255+1)}.${Math.floor(Math.random()*254+1)}`;
}

function termMatrix(winId) {
    const st = termState[winId];
    if (st.matrixInterval) {
        clearInterval(st.matrixInterval);
        st.matrixInterval = null;
        document.getElementById(winId + '-term-output').style.background = '';
        termPrint(winId, 'Matrix effect stopped.', st.color);
        return;
    }

    const output = document.getElementById(winId + '-term-output');
    output.innerHTML = '';
    output.style.background = '#000';
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

    st.matrixInterval = setInterval(() => {
        if (!document.getElementById(winId + '-term')) {
            clearInterval(st.matrixInterval);
            st.matrixInterval = null;
            return;
        }
        const line = document.createElement('div');
        line.style.color = '#0f0';
        line.style.fontSize = '12px';
        line.style.fontFamily = 'monospace';
        const len = Math.floor(Math.random() * 60 + 20);
        let str = '';
        for (let i = 0; i < len; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        line.textContent = str;
        output.appendChild(line);
        if (output.children.length > 60) {
            output.removeChild(output.firstChild);
        }
        output.scrollTop = output.scrollHeight;
    }, 80);

    setTimeout(() => {
        if (st.matrixInterval) {
            clearInterval(st.matrixInterval);
            st.matrixInterval = null;
            output.style.background = '';
            output.innerHTML = '';
            termPrint(winId, 'Matrix effect stopped.', '#0f0');
            termPrintPrompt(winId);
        }
    }, 8000);

    termPrint(winId, 'Matrix effect started! (runs for 8 seconds)', '#0f0');
}

function termBanner(winId, args) {
    const text = args.join(' ') || 'WebOS';
    const colors = ['#ff4444', '#ff8800', '#ffcc00', '#00cc44', '#00aaff', '#8844ff', '#ff44aa'];
    const art = `
 ██╗    ██╗███████╗██████╗  ██████╗ ███████╗
 ██║    ██║██╔════╝██╔══██╗██╔═══██╗██╔════╝
 ██║ █╗ ██║█████╗  ██████╔╝██║   ██║███████╗
 ██║███╗██║██╔══╝  ██╔══██╗██║   ██║╚════██║
 ╚███╔███╔╝███████╗██████╔╝╚██████╔╝███████║
  ╚══╝╚══╝ ╚══════╝╚═════╝  ╚═════╝ ╚══════╝
    `;
    termPrint(winId, art, colors[Math.floor(Math.random() * colors.length)]);
    if (text !== 'WebOS') {
        termPrint(winId, `               ${text}`, '#fff');
    }
}

function termScan(winId) {
    const st = termState[winId];
    if (!webosInfected) {
        termPrint(winId, '\n System is clean. No threats detected.', '#00ff00');
        return;
    }

    const remaining = webosVirusFiles.filter(vf => {
        const folder = navigateToPath(vf.path);
        return folder && folder.children && folder.children[vf.name];
    });

    termPrint(winId, '\n ╔══════════════════════════════════════╗', '#ff4444');
    termPrint(winId, ' ║     WEBOS DEFENDER - THREAT SCAN    ║', '#ff4444');
    termPrint(winId, ' ╚══════════════════════════════════════╝\n', '#ff4444');

    if (remaining.length === 0) {
        termPrint(winId, ' [SCAN] No virus files found. Run "clean" to finish.', '#00ff00');
        return;
    }

    termPrint(winId, ` [SCAN] Threats found: ${remaining.length}\n`, '#ffcc00');

    remaining.forEach((vf, i) => {
        termPrint(winId, ` [${i+1}] ⚠️ ${vf.name}`, '#ff4444');
        termPrint(winId, `      Type: .${vf.ext} | Threat Level: CRITICAL`, '#ff6666');
    });

    termPrint(winId, '\n [TIP] Files are hidden in deep system paths.', '#888');
    termPrint(winId, ' [TIP] Use "locate" for deep scan to reveal hiding locations.', '#888');
    termPrint(winId, ' [TIP] Then "cd" to that folder and "del <filename>" to remove.\n', '#888');
}

function termLocate(winId) {
    const st = termState[winId];
    if (!webosInfected) {
        termPrint(winId, '\n System is clean. Nothing to locate.', '#00ff00');
        return;
    }

    const remaining = webosVirusFiles.filter(vf => {
        const folder = navigateToPath(vf.path);
        return folder && folder.children && folder.children[vf.name];
    });

    termPrint(winId, '\n ╔══════════════════════════════════════╗', '#00d4ff');
    termPrint(winId, ' ║    DEEP SCAN - PATH REVEALER        ║', '#00d4ff');
    termPrint(winId, ' ╚══════════════════════════════════════╝\n', '#00d4ff');

    if (remaining.length === 0) {
        termPrint(winId, ' [LOCATE] No virus files found. Run "clean" to finish.', '#00ff00');
        return;
    }

    termPrint(winId, ` [LOCATE] Revealing ${remaining.length} hidden threat locations:\n`, '#ffcc00');

    remaining.forEach((vf, i) => {
        const fullPath = [...vf.path, vf.name].join('\\');
        termPrint(winId, ` [${i+1}] ${vf.name}`, '#ff4444');
        termPrint(winId, `      → ${fullPath}`, '#00d4ff');
    });

    termPrint(winId, '\n [TIP] Use "cd" to navigate to each path, then "del <filename>".', '#888');
    termPrint(winId, ' [TIP] Example: cd \\Users\\User\\AppData\\Local\\Temp\n', '#888');
}

function termDelete(winId, args) {
    const st = termState[winId];
    if (args.length === 0) {
        termPrint(winId, 'Usage: del <filename>  |  del *  (all virus in current dir)', '#ff4444');
        return;
    }

    if (args[0] === '*') {
        return termDeleteAllInDir(winId);
    }

    const folder = navigateToPath(st.cwd);
    if (!folder || !folder.children) {
        termPrint(winId, ' Invalid directory.', '#ff4444');
        return;
    }

    let deletedCount = 0;

    args.forEach(name => {
        const virusFile = webosVirusFiles.find(vf =>
            vf.name === name && vf.path.join('\\') === st.cwd.join('\\')
        );
        if (virusFile && folder.children[name]) {
            delete folder.children[name];
            webosVirusFiles = webosVirusFiles.filter(vf => vf !== virusFile);
            deletedCount++;
            termPrint(winId, ` ✅ ${name} - Virus deleted successfully!`, '#00ff00');
            return;
        }

        if (folder.children[name]) {
            delete folder.children[name];
            deletedCount++;
            termPrint(winId, ` ✅ ${name} - Deleted.`, '#00ff00');
            return;
        }

        const virusAnywhere = webosVirusFiles.find(vf => vf.name === name);
        if (virusAnywhere) {
            const targetPath = virusAnywhere.path.join('\\');
            const currentPath = st.cwd.join('\\');
            termPrint(winId, ` ❌ ${name} - Not found in ${currentPath}`, '#ff4444');
            termPrint(winId, ` 💡 Hint: This threat is hiding in a different directory.`, '#ffcc00');
            termPrint(winId, ` 💡 Use "locate" to reveal its path, then "cd" there.`, '#ffcc00');
            return;
        }

        termPrint(winId, ` ❌ ${name} - File not found.`, '#ff4444');
    });

    if (deletedCount > 0) {
        saveWebOS();
        checkInfectionCleared();
    }
}

function termDeleteAllInDir(winId) {
    const st = termState[winId];
    const folder = navigateToPath(st.cwd);
    if (!folder || !folder.children) {
        termPrint(winId, ' Invalid directory.', '#ff4444');
        return;
    }

    const curDirVirusFiles = webosVirusFiles.filter(vf =>
        vf.path.join('\\') === st.cwd.join('\\') && folder.children[vf.name]
    );

    if (curDirVirusFiles.length === 0) {
        termPrint(winId, ' No virus files found in current directory.', '#ffcc00');
        return;
    }

    let count = 0;
    curDirVirusFiles.forEach(vf => {
        delete folder.children[vf.name];
        webosVirusFiles = webosVirusFiles.filter(item => item !== vf);
        count++;
        termPrint(winId, ` ✅ ${vf.name} - Deleted.`, '#00ff00');
    });

    termPrint(winId, `\n 🗑️ ${count} virus file(s) removed from ${st.cwd.join('\\')}`, '#ffcc00');

    if (count > 0) {
        saveWebOS();
        checkInfectionCleared();
    }
}

function termKill(winId, args) {
    const st = termState[winId];
    if (args.length === 0) {
        termPrint(winId, 'Usage: kill <name or PID>  |  kill -all', '#ff4444');
        return;
    }

    const target = args[0].toLowerCase();

    if (target === '-all') {
        const infectedProcesses = ['svchost.exe', 'winlogon.exe', 'keylogger.exe'];
        infectedProcesses.forEach(p => {
            termPrint(winId, ` 🔫 Killing ${p}...`, '#ffcc00');
            setTimeout(() => termPrint(winId, ` ✅ ${p} terminated.`, '#00ff00'), 500);
        });
        return;
    }

    const processList = ['svchost.exe', 'winlogon', 'keylogger', 'explorer', 'cmd', 'notepad'];
    const match = processList.find(p => p.toLowerCase().includes(target));

    if (match) {
        termPrint(winId, ` 🔫 Killing ${match}...`, '#ffcc00');
        setTimeout(() => {
            termPrint(winId, ` ✅ Process ${match} (PID: ${Math.floor(Math.random()*9999+1000)}) terminated.`, '#00ff00');
        }, 800);
    } else {
        termPrint(winId, ` Process "${target}" not found.`, '#ff4444');
        termPrint(winId, ' Running: svchost.exe, winlogon.exe, explorer.exe, cmd.exe, notepad.exe', '#888');
    }
}

function termClean(winId) {
    const st = termState[winId];
    if (webosInfected) {
        const remaining = webosVirusFiles.filter(vf => {
            const folder = navigateToPath(vf.path);
            return folder && folder.children && folder.children[vf.name];
        });
        if (remaining.length > 0) {
            termPrint(winId, `\n ❌ Cannot clean: ${remaining.length} threat(s) still active!`, '#ff4444');
            termPrint(winId, ' Use "scan" to see remaining threats, then "del" to remove them.\n', '#888');
            return;
        }
    }

    termPrint(winId, '\n 🧹 Cleaning system...\n', '#ffcc00');
    const steps = [
        'Removing temporary files...',
        'Clearing registry entries...',
        'Resetting security policies...',
        'Verifying system files...',
        'Restoring default settings...',
    ];

    steps.forEach((step, i) => {
        setTimeout(() => {
            termPrint(winId, ` [${i+1}/${steps.length}] ${step}`, '#888');
            if (i === steps.length - 1) {
                setTimeout(() => {
                    if (!webosInfected) {
                        termPrint(winId, '\n ✅ System cleaned successfully! No threats remaining.', '#00ff00');
                    } else {
                        checkInfectionCleared();
                        termPrint(winId, '\n ✅ System cleaned!', '#00ff00');
                    }
                }, 500);
            }
        }, i * 600);
    });
}

function termSystemCheck(winId) {
    const st = termState[winId];
    termPrint(winId, '\n ╔══════════════════════════════════════╗', '#00d4ff');
    termPrint(winId, ' ║      SYSTEM INTEGRITY CHECK          ║', '#00d4ff');
    termPrint(winId, ' ╚══════════════════════════════════════╝\n', '#00d4ff');

    const checks = [
        { name: 'File System Integrity', pass: true },
        { name: 'Security Policies', pass: !webosInfected },
        { name: 'Network Connections', pass: !webosInfected },
        { name: 'Startup Entries', pass: !webosInfected },
        { name: 'Running Processes', pass: !webosInfected },
    ];

    checks.forEach(c => {
        termPrint(winId, ` ${c.pass ? '✅' : '❌'} ${c.name}`, c.pass ? '#00ff00' : '#ff4444');
    });

    if (webosInfected) {
        const remaining = webosVirusFiles.filter(vf => {
            const folder = navigateToPath(vf.path);
            return folder && folder.children && folder.children[vf.name];
        });
        termPrint(winId, '\n 🔴 STATUS: SYSTEM COMPROMISED', '#ff4444');
        termPrint(winId, ` ⚠️ ${remaining.length} threat(s) still active.`, '#ffcc00');
        termPrint(winId, ' Run "scan" for details, use "del" to remove threats.\n', '#888');
    } else {
        termPrint(winId, '\n 🟢 STATUS: SYSTEM CLEAN - All checks passed.', '#00ff00');
        termPrint(winId, ' ✅ No threats detected. System is secure.\n', '#888');
    }
}

function termResetOS(winId, args) {
    if (args && args[0] === '--confirm') {
        termPrint(winId, ' Resetting system...', '#ffcc00');
        setTimeout(() => {
            resetWebOS();
        }, 1500);
    } else {
        termPrint(winId, '\n ⚠️ WARNING: This will reset WebOS to factory defaults!', '#ff4444');
        termPrint(winId, ' All saved data, files, and settings will be lost.\n', '#ffcc00');
        termPrint(winId, ' Type "resetos --confirm" to proceed.\n', '#888');
        termPrint(winId, ' ⚡ Quick tip: just type "resetos --confirm" if you are sure.', '#888');
    }
}
