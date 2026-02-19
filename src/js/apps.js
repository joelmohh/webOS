Apps.notepad = {
    title: 'Notepad',
    icon: 'fa-solid fa-file-lines',
    getContent() {
        return `
            <div class="notepad-app">
                <div class="notepad-toolbar">
                    <input id="note-title" class="notepad-title" data-role="title" type="text" value="Untitled.txt" aria-label="File name">
                    <button class="notepad-btn" data-action="new"><i class="fa-solid fa-file"></i> New</button>
                    <button class="notepad-btn" data-action="save"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                    <button class="notepad-btn" data-action="download"><i class="fa-solid fa-download"></i> Export</button>
                    <button class="notepad-btn" data-action="timestamp"><i class="fa-regular fa-clock"></i> Date/Time</button>
                    <button class="notepad-btn" data-action="wrap">Wrap: on</button>
                </div>
                <div class="notepad-workspace">
                    <textarea class="notepad-editor" data-role="editor" spellcheck="false" placeholder="Start typing...&#10;&#10;Shortcuts: Ctrl+S to save, Tab to indent."></textarea>
                </div>
                <div class="notepad-status">
                    <span data-role="meta">0 chars • 1 line</span>
                    <span data-role="cursor">Ln 1, Col 1</span>
                    <span data-role="saved">Unsaved</span>
                </div>
            </div>
        `;
    },
    onOpen(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        const editor = windowEl.querySelector('[data-role="editor"]');
        const titleInput = windowEl.querySelector('[data-role="title"]');
        const meta = windowEl.querySelector('[data-role="meta"]');
        const cursor = windowEl.querySelector('[data-role="cursor"]');
        const saved = windowEl.querySelector('[data-role="saved"]');
        const actionButtons = windowEl.querySelectorAll('.notepad-btn');

        let isDirty = false;
        let wordWrap = true;
        let autosaveTimer;

        const getStorageKey = () => {
            const base = (titleInput.value || 'untitled').trim().toLowerCase().replace(/\s+/g, '_');
            return `joelmos.notepad.${base}`;
        };

        const updateMeta = () => {
            const text = editor.value;
            const charCount = text.length;
            const lineCount = text.length === 0 ? 1 : text.split('\n').length;
            meta.textContent = `${charCount} chars • ${lineCount} ${lineCount > 1 ? 'lines' : 'line'}`;
            saved.textContent = isDirty ? 'Unsaved' : 'Saved';
        };

        const updateCursor = () => {
            const beforeCursor = editor.value.slice(0, editor.selectionStart);
            const lines = beforeCursor.split('\n');
            const line = lines.length;
            const col = lines[lines.length - 1].length + 1;
            cursor.textContent = `Ln ${line}, Col ${col}`;
        };

        const insertAtCursor = (value) => {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.setRangeText(value, start, end, 'end');
            isDirty = true;
            updateMeta();
            updateCursor();
            editor.focus();
        };

        const persist = () => {
            localStorage.setItem(getStorageKey(), editor.value);
            isDirty = false;
            updateMeta();
        };

        const queueAutosave = () => {
            clearTimeout(autosaveTimer);
            autosaveTimer = setTimeout(() => {
                if (isDirty) {
                    persist();
                }
            }, 800);
        };

        const loadDraft = () => {
            const cached = localStorage.getItem(getStorageKey());
            if (cached !== null) {
                editor.value = cached;
                isDirty = false;
            }
        };

        actionButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');

                if (action === 'new') {
                    editor.value = '';
                    isDirty = false;
                    updateMeta();
                    updateCursor();
                    editor.focus();
                    return;
                }

                if (action === 'save') {
                    persist();
                    return;
                }

                if (action === 'timestamp') {
                    insertAtCursor(new Date().toLocaleString());
                    return;
                }

                if (action === 'wrap') {
                    wordWrap = !wordWrap;
                    editor.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
                    editor.style.overflowX = wordWrap ? 'hidden' : 'auto';
                    button.textContent = `Wrap: ${wordWrap ? 'on' : 'off'}`;
                    return;
                }

                if (action === 'download') {
                    const fileName = (titleInput.value || 'note').trim().replace(/\s+/g, '_');
                    const blob = new Blob([editor.value], { type: 'text/plain;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                    persist();
                }
            });
        });

        editor.addEventListener('input', () => {
            isDirty = true;
            updateMeta();
            updateCursor();
            queueAutosave();
        });

        editor.addEventListener('click', updateCursor);
        editor.addEventListener('keyup', updateCursor);
        editor.addEventListener('select', updateCursor);

        editor.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                event.preventDefault();
                insertAtCursor('    ');
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                persist();
            }
        });

        titleInput.addEventListener('input', () => {
            isDirty = true;
            updateMeta();
            queueAutosave();
        });

        titleInput.addEventListener('blur', loadDraft);

        loadDraft();
        updateMeta();
        updateCursor();
        editor.focus();
    }
};

Apps.terminal = {
    title: 'Terminal',
    icon: 'fa-solid fa-terminal',
    getContent() {
        return `
            <div class="terminal-app">
                <div class="terminal-output" data-role="output"></div>
                <form class="terminal-input-row" data-role="form">
                    <span class="terminal-prompt">user@joelmos:~$</span>
                    <input type="text" class="terminal-input" data-role="input" autocomplete="off" spellcheck="false" aria-label="Terminal command">
                </form>
            </div>
        `;
    },
    onOpen(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        const output = windowEl.querySelector('[data-role="output"]');
        const form = windowEl.querySelector('[data-role="form"]');
        const input = windowEl.querySelector('[data-role="input"]');

        if (!output || !form || !input) return;

        const history = [];
        let historyIndex = -1;

        const writeLine = (text = '', className = '') => {
            const line = document.createElement('div');
            line.className = `terminal-line${className ? ` ${className}` : ''}`;
            line.textContent = text;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        };

        const writeCommand = (command) => {
            const line = document.createElement('div');
            line.className = 'terminal-line terminal-command';
            line.innerHTML = `<span class="terminal-prompt">user@joelmos:~$</span> ${command}`;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        };

        const commands = {
            help: () => {
                writeLine('Available commands:');
                writeLine('help, clear, date, whoami, pwd, ls, echo, ping, uname');
            },
            clear: () => {
                output.innerHTML = '';
            },
            date: () => {
                writeLine(new Date().toString());
            },
            whoami: () => {
                writeLine('guest');
            },
            pwd: () => {
                writeLine('/home/guest');
            },
            ls: () => {
                writeLine('Desktop  Documents  Downloads  Notes.txt');
            },
            uname: () => {
                writeLine('JoelmOS 1.0.0 x86_64');
            },
            echo: (args) => {
                writeLine(args.join(' '));
            },
            ping: async (args) => {
                const host = args[0] || 'localhost';
                const packets = Math.min(Math.max(parseInt(args[1], 10) || 4, 1), 8);
                writeLine(`PING ${host} (${host}) 56(84) bytes of data.`);

                for (let index = 1; index <= packets; index++) {
                    await new Promise((resolve) => setTimeout(resolve, 350));
                    const time = (Math.random() * 25 + 4).toFixed(2);
                    writeLine(`64 bytes from ${host}: icmp_seq=${index} ttl=64 time=${time} ms`);
                }

                writeLine('');
                writeLine(`--- ${host} ping statistics ---`);
                writeLine(`${packets} packets transmitted, ${packets} received, 0% packet loss`);
            }
        };

        const runCommand = async (raw) => {
            const parsed = raw.trim();
            if (!parsed) return;

            const [name, ...args] = parsed.split(/\s+/);
            if (commands[name]) {
                await commands[name](args);
            } else {
                writeLine(`Command not found: ${name}`, 'terminal-error');
                writeLine('Type "help" to list available commands.');
            }
        };

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const command = input.value;
            writeCommand(command);
            if (command.trim()) {
                history.push(command);
            }
            historyIndex = history.length;
            input.value = '';
            await runCommand(command);
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (historyIndex > 0) {
                    historyIndex -= 1;
                    input.value = history[historyIndex] || '';
                }
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (historyIndex < history.length - 1) {
                    historyIndex += 1;
                    input.value = history[historyIndex] || '';
                } else {
                    historyIndex = history.length;
                    input.value = '';
                }
            }
        });

        writeLine('joelmos terminal [version 0.1]');
        writeLine('Type "help" to view available commands.');
        writeLine('');
        input.focus();
    }
};

Apps.browser = {
    title: 'Browser',
    icon: 'fa-solid fa-globe',
    getContent() {
        return `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="background: #f0f0f0; padding: 0; border-bottom: 1px solid #ddd;">
                    <input type="text" placeholder="Enter URL..." style="width: 100%; padding: 0; border: 1px solid #ccc; border-radius: 0;">
                </div>
                <div style="flex: 1; padding: 0; overflow: auto;">
                    <h2 style="color: #333; margin-bottom: 0;">Welcome to Browser</h2>
                    <p style="color: #666;">Type a URL to navigate</p>
                </div>
            </div>
        `;
    }
};

Apps.calculator = {
    title: 'Calculator',
    icon: 'fa-solid fa-calculator',
    getContent() {
        return `
            <div style="display: flex; flex-direction: column; height: 100%; gap: 0;">
                <input type="text" class="calc-display" readonly value="0">
                <div class="calculator-grid">
                    <button class="calc-btn clear">AC</button>
                    <button class="calc-btn operator">/</button>
                    <button class="calc-btn operator">×</button>
                    <button class="calc-btn">7</button>
                    <button class="calc-btn">8</button>
                    <button class="calc-btn">9</button>
                    <button class="calc-btn operator">−</button>
                    <button class="calc-btn">4</button>
                    <button class="calc-btn">5</button>
                    <button class="calc-btn">6</button>
                    <button class="calc-btn operator">+</button>
                    <button class="calc-btn">1</button>
                    <button class="calc-btn">2</button>
                    <button class="calc-btn">3</button>
                    <button class="calc-btn operator">.</button>
                    <button class="calc-btn" style="grid-column: span 2;">0</button>
                    <button class="calc-btn equals">=</button>
                </div>
            </div>
        `;
    }
};
