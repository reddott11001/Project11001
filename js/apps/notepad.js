function renderNotepad(winId) {
    const body = document.getElementById(winId + '-body');
    
    const docsFolder = navigateToPath(['C:', 'Users', 'User', 'Documents']);
    const savedNotes = docsFolder && docsFolder.children 
        ? Object.keys(docsFolder.children).filter(k => docsFolder.children[k].ext === 'txt' && k.startsWith('note_')).length 
        : 0;
    
    body.innerHTML = `
        <div class="notepad-app">
            <div class="notepad-menu">
                <div class="notepad-menu-item" onclick="notepadNew('${winId}')">File</div>
                <div class="notepad-menu-item" onclick="notepadSave('${winId}')">Save</div>
                <div class="notepad-menu-item" onclick="notepadEdit('${winId}')">Edit</div>
                <div class="notepad-menu-item" onclick="notepadFormat('${winId}')">Format</div>
                <div class="notepad-menu-item" onclick="notepadHelp('${winId}')">Help</div>
            </div>
            <textarea class="notepad-textarea" id="${winId}-textarea" 
                placeholder="Start typing..."
                oninput="notepadUpdateStatus('${winId}')"
                onkeyup="notepadUpdateCursor('${winId}')"
                onclick="notepadUpdateCursor('${winId}')"></textarea>
            <div class="notepad-statusbar">
                <span id="${winId}-cursor">Ln 1, Col 1</span>
                <span id="${winId}-stats">0 lines, 0 chars${savedNotes > 0 ? ' | ' + savedNotes + ' saved note(s)' : ''}</span>
            </div>
        </div>
    `;

    const textarea = document.getElementById(winId + '-textarea');
    textarea.focus();
}

function notepadUpdateStatus(winId) {
    const textarea = document.getElementById(winId + '-textarea');
    if (!textarea) return;
    const lines = textarea.value.split('\n').length;
    const chars = textarea.value.length;
    const stats = document.getElementById(winId + '-stats');
    if (stats) stats.textContent = `${lines} lines, ${chars} chars`;
}

function notepadUpdateCursor(winId) {
    const textarea = document.getElementById(winId + '-textarea');
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const text = textarea.value.substring(0, pos);
    const lines = text.split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    const cursor = document.getElementById(winId + '-cursor');
    if (cursor) cursor.textContent = `Ln ${ln}, Col ${col}`;
    notepadUpdateStatus(winId);
}

function notepadNew(winId) {
    const textarea = document.getElementById(winId + '-textarea');
    if (textarea) {
        if (textarea.value && !confirm('Discard unsaved changes?')) return;
        textarea.value = '';
        notepadUpdateStatus(winId);
        const titleText = document.querySelector(`#${winId} .window-titlebar-text`);
        if (titleText) titleText.textContent = 'Untitled - Notepad';
    }
}

function notepadEdit(winId) {
    const textarea = document.getElementById(winId + '-textarea');
    if (!textarea) return;
    textarea.select();
    document.execCommand('copy');
}

function notepadSave(winId) {
    const textarea = document.getElementById(winId + '-textarea');
    if (!textarea) return;
    
    const content = textarea.value;
    if (!content.trim()) {
        addNotification('💾 Notepad', 'Nothing to save - document is empty');
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `note_${timestamp}.txt`;
    
    const folder = navigateToPath(['C:', 'Users', 'User', 'Documents']);
    if (folder && folder.children) {
        folder.children[filename] = {
            type: 'file',
            ext: 'txt',
            content: content
        };
        saveWebOS();
        addNotification('💾 Notepad', `Saved as "${filename}" to Documents folder`);
        
        const stats = document.getElementById(winId + '-stats');
        if (stats) {
            const lines = content.split('\n').length;
            const chars = content.length;
            const docsFolder = navigateToPath(['C:', 'Users', 'User', 'Documents']);
            const savedNotes = docsFolder && docsFolder.children 
                ? Object.keys(docsFolder.children).filter(k => docsFolder.children[k].ext === 'txt' && k.startsWith('note_')).length 
                : 0;
            stats.textContent = `${lines} lines, ${chars} chars | ${savedNotes} saved note(s)`;
        }
    }
}

function notepadFormat(winId) {
    const textarea = document.getElementById(winId + '-textarea');
    if (!textarea) return;
    const current = window.getComputedStyle(textarea).fontFamily;
    if (current.includes('Consolas')) {
        textarea.style.fontFamily = "'Segoe UI', sans-serif";
        textarea.style.fontSize = '14px';
    } else {
        textarea.style.fontFamily = "'Consolas', 'Courier New', monospace";
        textarea.style.fontSize = '14px';
    }
}

function notepadHelp(winId) {
    alert('WebOS Notepad v1.0\n\nA simple text editor.\n\nTips:\n- Text is auto-saved in session\n- Use Format to toggle fonts\n- Line/Column shown in status bar');
}
