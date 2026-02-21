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
                    insertAtCursor(new Date().toLocaleString('en-US'));
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
                    NotificationManager.notify({
                        title: 'Download complete',
                        message: `${link.download} was exported from Notepad.`,
                        type: 'success'
                    });
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
        return BrowserManager.getContent();
    },
    onOpen(windowId, options = {}) {
        BrowserManager.init(windowId, options.state?.appSession || null);
    },
    getSessionState(windowId) {
        return BrowserManager.getSessionState(windowId);
    }
};

Apps.files = {
    title: 'Files',
    icon: 'fa-solid fa-folder',
    getContent() {
        return FilesManager.getContent();
    },
    onOpen(windowId) {
        FilesManager.init(windowId);
    }
};

Apps.calculator = {
    title: 'Calculator',
    icon: 'fa-solid fa-calculator',
    getContent() {
        return `
            <div class="calc-app">
                <input type="text" class="calc-display" data-role="calc-display" readonly value="0" aria-label="Calculator display">
                <div class="calculator-grid">
                    <button class="calc-btn clear" data-action="clear">AC</button>
                    <button class="calc-btn operator" data-value="/">/</button>
                    <button class="calc-btn operator" data-value="*">×</button>
                    <button class="calc-btn" data-value="7">7</button>
                    <button class="calc-btn" data-value="8">8</button>
                    <button class="calc-btn" data-value="9">9</button>
                    <button class="calc-btn operator" data-value="-">−</button>
                    <button class="calc-btn" data-value="4">4</button>
                    <button class="calc-btn" data-value="5">5</button>
                    <button class="calc-btn" data-value="6">6</button>
                    <button class="calc-btn operator" data-value="+">+</button>
                    <button class="calc-btn" data-value="1">1</button>
                    <button class="calc-btn" data-value="2">2</button>
                    <button class="calc-btn" data-value="3">3</button>
                    <button class="calc-btn operator" data-value=".">.</button>
                    <button class="calc-btn" style="grid-column: span 2;" data-value="0">0</button>
                    <button class="calc-btn equals" data-action="equals">=</button>
                </div>
            </div>
        `;
    },
    onOpen(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        const display = windowEl.querySelector('[data-role="calc-display"]');
        const buttons = windowEl.querySelectorAll('.calc-btn');
        if (!display || !buttons.length) return;

        let expression = '0';

        const render = () => {
            display.value = expression;
        };

        const isOperator = (char) => ['+', '-', '*', '/'].includes(char);

        const lastNumberHasDot = () => {
            const parts = expression.split(/[+\-*/]/);
            return (parts[parts.length - 1] || '').includes('.');
        };

        const clearAll = () => {
            expression = '0';
            render();
        };

        const appendValue = (value) => {
            if (/\d/.test(value)) {
                expression = expression === '0' ? value : expression + value;
                render();
                return;
            }

            if (value === '.') {
                if (lastNumberHasDot()) return;
                const lastChar = expression[expression.length - 1];
                if (isOperator(lastChar)) {
                    expression += '0.';
                } else {
                    expression += '.';
                }
                render();
                return;
            }

            if (isOperator(value)) {
                const lastChar = expression[expression.length - 1];
                if (isOperator(lastChar)) {
                    expression = expression.slice(0, -1) + value;
                } else {
                    expression += value;
                }
                render();
            }
        };

        const calculate = () => {
            try {
                const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
                if (!sanitized) {
                    clearAll();
                    return;
                }

                const result = Function(`return (${sanitized})`)();
                if (!Number.isFinite(result)) {
                    display.value = 'Error';
                    expression = '0';
                    return;
                }

                expression = String(parseFloat(result.toFixed(10)));
                render();
            } catch {
                display.value = 'Error';
                expression = '0';
            }
        };

        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                const value = button.getAttribute('data-value');

                if (action === 'clear') {
                    clearAll();
                    return;
                }

                if (action === 'equals') {
                    calculate();
                    return;
                }

                if (value) {
                    appendValue(value);
                }
            });
        });

        render();
    }
};

Apps.todo = {
    title: 'To-Do List',
    icon: 'fa-solid fa-list-check',
    sessionState: {},
    getContent() {
        return `
            <div class="todo-app">
                <form class="todo-toolbar" data-role="todo-form">
                    <input type="text" class="todo-input" data-role="todo-input" placeholder="Add a task..." aria-label="New task">
                    <button type="submit" class="files-btn">Add</button>
                </form>
                <div class="todo-controls">
                    <div class="todo-filters" data-role="todo-filters">
                        <button type="button" class="todo-filter-btn active" data-filter="all">All</button>
                        <button type="button" class="todo-filter-btn" data-filter="active">Active</button>
                        <button type="button" class="todo-filter-btn" data-filter="done">Done</button>
                    </div>
                    <button type="button" class="files-btn" data-role="todo-clear-completed">Clear completed</button>
                </div>
                <div class="todo-list" data-role="todo-list"></div>
            </div>
        `;
    },
    onOpen(windowId, options = {}) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        const form = windowEl.querySelector('[data-role="todo-form"]');
        const input = windowEl.querySelector('[data-role="todo-input"]');
        const list = windowEl.querySelector('[data-role="todo-list"]');
        const filtersWrap = windowEl.querySelector('[data-role="todo-filters"]');
        const clearCompletedBtn = windowEl.querySelector('[data-role="todo-clear-completed"]');

        if (!form || !input || !list || !filtersWrap || !clearCompletedBtn) return;

        const storageKey = 'joelmos.todo.tasks';
        const filterStorageKey = 'joelmos.todo.filter';

        const readTasks = () => {
            try {
                const raw = localStorage.getItem(storageKey);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };

        const writeTasks = (tasks) => {
            localStorage.setItem(storageKey, JSON.stringify(tasks));
        };

        let tasks = readTasks();
        let filter = options.state?.appSession?.filter || localStorage.getItem(filterStorageKey) || 'all';
        if (!['all', 'active', 'done'].includes(filter)) {
            filter = 'all';
        }

        const setFilter = (nextFilter) => {
            filter = nextFilter;
            localStorage.setItem(filterStorageKey, filter);
            this.sessionState[windowId] = { filter };
        };

        const getFilteredTasks = () => {
            if (filter === 'active') {
                return tasks.filter((task) => !task.done);
            }

            if (filter === 'done') {
                return tasks.filter((task) => task.done);
            }

            return tasks;
        };

        const render = () => {
            const visibleTasks = getFilteredTasks();

            filtersWrap.querySelectorAll('[data-filter]').forEach((button) => {
                if (!(button instanceof HTMLElement)) return;
                button.classList.toggle('active', button.getAttribute('data-filter') === filter);
            });

            clearCompletedBtn.disabled = !tasks.some((task) => task.done);

            if (!visibleTasks.length) {
                list.innerHTML = '<div class="todo-empty">No tasks yet.</div>';
                return;
            }

            list.innerHTML = visibleTasks.map((task) => `
                <div class="todo-item${task.done ? ' done' : ''}">
                    <label class="todo-check-row">
                        <input type="checkbox" data-action="toggle" data-id="${task.id}" ${task.done ? 'checked' : ''}>
                        <span>${task.text}</span>
                    </label>
                    <div class="todo-actions">
                        <button type="button" class="files-btn" data-action="edit" data-id="${task.id}">Edit</button>
                        <button type="button" class="files-btn" data-action="remove" data-id="${task.id}">Remove</button>
                    </div>
                </div>
            `).join('');
        };

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const text = input.value.trim();
            if (!text) return;

            tasks = [
                ...tasks,
                {
                    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    text,
                    done: false
                }
            ];
            writeTasks(tasks);
            input.value = '';
            render();
            input.focus();
        });

        list.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const editButton = target.closest('[data-action="edit"]');
            if (editButton && list.contains(editButton)) {
                const targetId = editButton.getAttribute('data-id');
                if (!targetId) return;

                const current = tasks.find((task) => task.id === targetId);
                if (!current) return;

                const nextText = window.prompt('Edit task', current.text);
                if (nextText === null) return;

                const trimmed = nextText.trim();
                if (!trimmed) return;

                tasks = tasks.map((task) => (
                    task.id === targetId
                        ? { ...task, text: trimmed }
                        : task
                ));
                writeTasks(tasks);
                render();
                return;
            }

            const removeButton = target.closest('[data-action="remove"]');
            if (!removeButton || !list.contains(removeButton)) return;

            const targetId = removeButton.getAttribute('data-id');
            if (!targetId) return;

            tasks = tasks.filter((task) => task.id !== targetId);
            writeTasks(tasks);
            render();
        });

        list.addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const toggleInput = target.closest('[data-action="toggle"]');
            if (!toggleInput || !list.contains(toggleInput)) return;

            const targetId = toggleInput.getAttribute('data-id');
            if (!targetId) return;

            tasks = tasks.map((task) => (
                task.id === targetId
                    ? { ...task, done: Boolean(toggleInput.checked) }
                    : task
            ));
            writeTasks(tasks);
            render();
        });

        filtersWrap.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const button = target.closest('[data-filter]');
            if (!button || !filtersWrap.contains(button)) return;

            const nextFilter = button.getAttribute('data-filter');
            if (!nextFilter || !['all', 'active', 'done'].includes(nextFilter)) return;

            setFilter(nextFilter);
            render();
        });

        clearCompletedBtn.addEventListener('click', () => {
            tasks = tasks.filter((task) => !task.done);
            writeTasks(tasks);
            render();
        });

        setFilter(filter);
        render();
        input.focus();
    },
    getSessionState(windowId) {
        return this.sessionState[windowId] || null;
    }
};

Apps.taskmanager = {
    title: 'Task Manager',
    icon: 'fa-solid fa-list-check',
    getContent() {
        return TaskManager.getContent();
    },
    onOpen(windowId) {
        TaskManager.init(windowId);
    }
};

Apps.settings = {
    title: 'Settings',
    icon: 'fa-solid fa-gear',
    getContent() {
        return `
            <div class="settings-app">
                <div class="setting-group">
                    <h3>Desktop</h3>
                    <div class="setting-item">
                        <label for="wallpaper-select">Wallpaper</label>
                        <select id="wallpaper-select" class="settings-select" data-role="wallpaper-select"></select>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>Clock</h3>
                    <div class="setting-item">
                        <label for="clock-seconds-toggle">Show seconds in top bar</label>
                        <input id="clock-seconds-toggle" data-role="clock-seconds-toggle" type="checkbox">
                    </div>
                </div>

                <p class="settings-note">Changes are applied immediately and saved automatically.</p>
            </div>
        `;
    },
    onOpen(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        const wallpaperSelect = windowEl.querySelector('[data-role="wallpaper-select"]');
        const secondsToggle = windowEl.querySelector('[data-role="clock-seconds-toggle"]');

        if (!wallpaperSelect || !secondsToggle) return;

        wallpaperSelect.innerHTML = SettingsManager.wallpapers
            .map((wallpaper) => `<option value="${wallpaper.id}">${wallpaper.name}</option>`)
            .join('');

        wallpaperSelect.value = SettingsManager.getWallpaperId();
        secondsToggle.checked = SettingsManager.getShowSeconds();

        wallpaperSelect.addEventListener('change', () => {
            SettingsManager.setWallpaper(wallpaperSelect.value);
        });

        secondsToggle.addEventListener('change', () => {
            SettingsManager.setShowSeconds(secondsToggle.checked);
        });
    }
};
