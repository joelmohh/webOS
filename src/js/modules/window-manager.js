const WindowManager = {
    windows: {},
    windowCount: 0,
    zIndexCounter: 100,
    focusedWindow: null,
    windowOrder: [],
    changeListeners: {},
    persistTimer: null,
    isRestoringSession: false,

    createWindow(appId, title, icon, content, options = {}) {
        this.windowCount++;
        const id = `window-${appId}-${this.windowCount}`;
        const windowEl = document.createElement('div');
        windowEl.className = 'os-window focused';
        windowEl.id = id;
        windowEl.setAttribute('data-app-id', appId);
        
        const state = options.state || null;
        const left = typeof state?.left === 'number' ? state.left : 40 + (this.windowCount * 30);
        const top = typeof state?.top === 'number' ? state.top : 60 + (this.windowCount * 30);
        const width = typeof state?.width === 'number' ? state.width : 500;
        const height = typeof state?.height === 'number' ? state.height : 400;
        
        windowEl.style.left = left + 'px';
        windowEl.style.top = top + 'px';
        windowEl.style.width = width + 'px';
        windowEl.style.height = height + 'px';
        
        windowEl.innerHTML = `
            <div class="os-window-header">
                <div class="os-window-title">
                    <i class="${icon}"></i>
                    <span>${title}</span>
                </div>
                <div class="window-controls">
                    <button class="window-btn minimize" title="Minimize"><i class="fa-solid fa-minus"></i></button>
                    <button class="window-btn maximize" title="Maximize"><i class="fa-solid fa-square"></i></button>
                    <button class="window-btn close" title="Close"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="os-window-content">
                ${content}
            </div>
        `;

        const wm = document.getElementById('window-manager');
        wm.appendChild(windowEl);

        this.windows[id] = {
            id,
            appId,
            title,
            icon,
            element: windowEl,
            minimized: Boolean(state?.minimized),
            maximized: Boolean(state?.maximized),
            originalState: state?.originalState || null
        };

        this.attachWindowEvents(id);
        this.windowOrder.push(id);

        if (this.windows[id].maximized) {
            windowEl.classList.add('maximized');
            windowEl.style.width = '100%';
            windowEl.style.height = '100%';
            windowEl.style.left = '0px';
            windowEl.style.top = '0px';
            windowEl.style.borderRadius = '0px';
        }

        if (this.windows[id].minimized) {
            windowEl.classList.add('minimized');
        }

        if (typeof state?.zIndex === 'number') {
            windowEl.style.zIndex = state.zIndex;
            this.zIndexCounter = Math.max(this.zIndexCounter, state.zIndex);
        } else {
            this.focusWindow(id);
        }

        if (!this.focusedWindow && !this.windows[id].minimized) {
            this.focusWindow(id);
        }

        this.updateTaskbar();
        this.schedulePersist();
        this.emitChange();

        return id;
    },

    attachWindowEvents(id) {
        const windowEl = this.windows[id].element;
        const header = windowEl.querySelector('.os-window-header');
        const minimizeBtn = windowEl.querySelector('.minimize');
        const maximizeBtn = windowEl.querySelector('.maximize');
        const closeBtn = windowEl.querySelector('.close');

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        const handleHeaderMouseDown = (e) => {
            if (e.target.closest('.window-controls')) return;
            
            isDragging = true;
            offsetX = e.clientX - windowEl.offsetLeft;
            offsetY = e.clientY - windowEl.offsetTop;
            
            this.focusWindow(id);
        };

        const handleDragMove = (e) => {
            if (!isDragging) return;
            
            const wm = document.getElementById('window-manager');
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            
            if (newLeft >= 0 && newLeft + windowEl.offsetWidth <= wm.offsetWidth) {
                windowEl.style.left = newLeft + 'px';
            }
            if (newTop >= 0 && newTop + windowEl.offsetHeight <= wm.offsetHeight) {
                windowEl.style.top = newTop + 'px';
            }
        };

        const handleDragEnd = () => {
            isDragging = false;
            this.schedulePersist();
        };

        header.addEventListener('mousedown', handleHeaderMouseDown);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);

        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeWindow(id);
        });

        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximizeWindow(id);
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(id);
        });

        windowEl.addEventListener('mousedown', () => {
            this.focusWindow(id);
        });

        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        windowEl.appendChild(resizer);

        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        const handleResizerStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = windowEl.offsetWidth;
            startHeight = windowEl.offsetHeight;
            this.focusWindow(id);
        };

        const handleResizerMove = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = startWidth + deltaX;
            const newHeight = startHeight + deltaY;
            
            if (newWidth > 300) {
                windowEl.style.width = newWidth + 'px';
            }
            if (newHeight > 150) {
                windowEl.style.height = newHeight + 'px';
            }
        };

        const handleResizerEnd = () => {
            isResizing = false;
            this.schedulePersist();
        };

        resizer.addEventListener('mousedown', handleResizerStart);
        resizer.addEventListener('touchstart', handleResizerStart);
        
        window.addEventListener('mousemove', handleResizerMove);
        window.addEventListener('touchmove', handleResizerMove);
        
        window.addEventListener('mouseup', handleResizerEnd);
        window.addEventListener('touchend', handleResizerEnd);

        this.windows[id].listeners = {
            handleHeaderMouseDown,
            handleDragMove,
            handleDragEnd,
            handleResizerStart,
            handleResizerMove,
            handleResizerEnd
        };
    },

    focusWindow(id) {
        if (!this.windows[id]) return;

        if (this.focusedWindow && this.focusedWindow !== id) {
            const prevWin = this.windows[this.focusedWindow];
            if (prevWin && prevWin.element) {
                prevWin.element.classList.remove('focused');
            }
        }
        
        const windowEl = this.windows[id].element;
        windowEl.classList.add('focused');
        this.zIndexCounter += 1;
        windowEl.style.zIndex = this.zIndexCounter;
        this.focusedWindow = id;
        this.updateTaskbar();
        this.schedulePersist();
        this.emitChange();
    },

    minimizeWindow(id) {
        if (!this.windows[id]) return;
        this.windows[id].minimized = !this.windows[id].minimized;
        this.windows[id].element.classList.toggle('minimized');
        this.updateTaskbar();
        this.schedulePersist();
        this.emitChange();
    },

    toggleMaximizeWindow(id) {
        const win = this.windows[id];
        if (!win) return;
        
        if (win.maximized) {
            const fallbackState = {
                width: 500,
                height: 400,
                left: 40,
                top: 60
            };
            const targetState = win.originalState || fallbackState;
            win.element.style.width = targetState.width + 'px';
            win.element.style.height = targetState.height + 'px';
            win.element.style.left = targetState.left + 'px';
            win.element.style.top = targetState.top + 'px';
            win.element.classList.remove('maximized');
            win.element.style.borderRadius = '8px 8px 4px 4px';
            win.maximized = false;
        } else {
            win.originalState = {
                width: win.element.offsetWidth,
                height: win.element.offsetHeight,
                left: parseInt(win.element.style.left),
                top: parseInt(win.element.style.top)
            };
            win.element.style.width = '100%';
            win.element.style.height = '100%';
            win.element.style.left = '0px';
            win.element.style.top = '0px';
            win.element.classList.add('maximized');
            win.element.style.borderRadius = '0px';
            win.maximized = true;
        }

        this.schedulePersist();
        this.emitChange();
    },

    closeWindow(id) {
        if (!this.windows[id]) return;

        if (typeof TaskManager !== 'undefined' && TaskManager.refreshTimers && TaskManager.refreshTimers[id]) {
            clearInterval(TaskManager.refreshTimers[id]);
            delete TaskManager.refreshTimers[id];
        }

        this.removeChangeListener(id);
        this.windows[id].element.remove();
        delete this.windows[id];
        this.windowOrder = this.windowOrder.filter(wId => wId !== id);
        if (this.focusedWindow === id) {
            this.focusedWindow = null;
            if (this.windowOrder.length > 0) {
                this.focusWindow(this.windowOrder[this.windowOrder.length - 1]);
            }
        }
        this.updateTaskbar();
        this.schedulePersist();
        this.emitChange();
    },

    closeAllWindows(options = {}) {
        const exclude = new Set(options.exclude || []);
        Object.keys(this.windows).forEach((id) => {
            if (!exclude.has(id)) {
                this.closeWindow(id);
            }
        });
        this.schedulePersist();
        this.emitChange();
    },

    getWindowList() {
        return Object.values(this.windows).map((win) => ({
            id: win.id,
            appId: win.appId,
            title: win.title,
            icon: win.icon,
            minimized: Boolean(win.minimized),
            maximized: Boolean(win.maximized),
            zIndex: Number(win.element?.style.zIndex || 0)
        }));
    },

    addChangeListener(listenerId, callback) {
        if (!listenerId || typeof callback !== 'function') return;
        this.changeListeners[listenerId] = callback;
    },

    removeChangeListener(listenerId) {
        if (!listenerId) return;
        delete this.changeListeners[listenerId];
    },

    emitChange() {
        Object.values(this.changeListeners).forEach((callback) => {
            try {
                callback(this.getWindowList());
            } catch (error) {
                console.error('WindowManager listener error:', error);
            }
        });
    },

    buildSessionSnapshot() {
        const focused = this.focusedWindow ? this.windows[this.focusedWindow] : null;
        return {
            focusedAppId: focused?.appId || null,
            zIndexCounter: this.zIndexCounter,
            windows: this.windowOrder
                .map((id) => this.windows[id])
                .filter(Boolean)
                .map((win) => ({
                    appId: win.appId,
                    title: win.title,
                    icon: win.icon,
                    appSession: (typeof Apps[win.appId]?.getSessionState === 'function')
                        ? (Apps[win.appId].getSessionState(win.id) || null)
                        : null,
                    left: parseInt(win.element.style.left, 10) || 0,
                    top: parseInt(win.element.style.top, 10) || 0,
                    width: parseInt(win.element.style.width, 10) || win.element.offsetWidth || 500,
                    height: parseInt(win.element.style.height, 10) || win.element.offsetHeight || 400,
                    minimized: Boolean(win.minimized),
                    maximized: Boolean(win.maximized),
                    originalState: win.originalState || null,
                    zIndex: parseInt(win.element.style.zIndex, 10) || 0
                }))
        };
    },

    schedulePersist() {
        if (this.isRestoringSession) return;

        clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => {
            const snapshot = this.buildSessionSnapshot();
            StateManager.saveDesktopSession(snapshot);
        }, 120);
    },

    restoreSession() {
        const session = StateManager.loadDesktopSession();
        if (!session || !Array.isArray(session.windows) || !session.windows.length) {
            return;
        }

        this.isRestoringSession = true;

        session.windows.forEach((state) => {
            if (!state?.appId || !Apps[state.appId]) return;
            Apps.launchApp(state.appId, { state, skipPersist: true });
        });

        if (session.focusedAppId) {
            const target = this.windowOrder
                .slice()
                .reverse()
                .find((id) => this.windows[id]?.appId === session.focusedAppId);
            if (target) {
                this.focusWindow(target);
            }
        }

        if (typeof session.zIndexCounter === 'number') {
            this.zIndexCounter = Math.max(this.zIndexCounter, session.zIndexCounter);
        }

        this.isRestoringSession = false;
        this.schedulePersist();
        this.emitChange();
    },

    updateTaskbar() {
        const taskbar = document.getElementById('taskbar');
        if (!taskbar) return;
        taskbar.innerHTML = '';

        for (const id in this.windows) {
            const win = this.windows[id];
            if (win.minimized) continue;

            const item = document.createElement('div');
            item.className = 'taskbar-item';
            if (this.focusedWindow === id) {
                item.classList.add('active');
            }

            item.innerHTML = `<i class="${win.icon}"></i> <span>${win.title}</span>`;
            
            item.addEventListener('click', () => {
                if (this.focusedWindow === id) {
                    this.minimizeWindow(id);
                } else {
                    this.windows[id].minimized = false;
                    this.windows[id].element.classList.remove('minimized');
                    this.focusWindow(id);
                }
            });

            taskbar.appendChild(item);
        }
    }
};

const Apps = {};

Apps.launchApp = function(appId, options = {}) {
    const app = Apps[appId];
    if (!app) return;

    const windowId = WindowManager.createWindow(appId, app.title, app.icon, app.getContent(), {
        state: options.state || null
    });

    if (typeof app.onOpen === 'function') {
        app.onOpen(windowId, { state: options.state || null });
    }

    if (!options.skipPersist) {
        WindowManager.schedulePersist();
    }

    return windowId;
};
