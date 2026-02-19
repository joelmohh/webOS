const WindowManager = {
    windows: {},
    windowCount: 0,
    focusedWindow: null,
    windowOrder: [],

    createWindow(appId, title, icon, content) {
        this.windowCount++;
        const id = `window-${appId}-${this.windowCount}`;
        const windowEl = document.createElement('div');
        windowEl.className = 'os-window focused';
        windowEl.id = id;
        windowEl.setAttribute('data-app-id', appId);
        
        let left = 40 + (this.windowCount * 30);
        let top = 60 + (this.windowCount * 30);
        
        windowEl.style.left = left + 'px';
        windowEl.style.top = top + 'px';
        windowEl.style.width = '500px';
        windowEl.style.height = '400px';
        
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
            minimized: false,
            maximized: false,
            originalState: null
        };

        this.attachWindowEvents(id);
        this.focusWindow(id);
        this.windowOrder.push(id);
        this.updateTaskbar();

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
        if (this.focusedWindow && this.focusedWindow !== id) {
            const prevEl = this.windows[this.focusedWindow].element;
            prevEl.classList.remove('focused');
        }
        
        const windowEl = this.windows[id].element;
        windowEl.classList.add('focused');
        windowEl.style.zIndex = 100 + this.windowCount;
        this.focusedWindow = id;
        this.updateTaskbar();
    },

    minimizeWindow(id) {
        this.windows[id].minimized = !this.windows[id].minimized;
        this.windows[id].element.classList.toggle('minimized');
        this.updateTaskbar();
    },

    toggleMaximizeWindow(id) {
        const win = this.windows[id];
        const wm = document.getElementById('window-manager');
        
        if (win.maximized) {
            win.element.style.width = win.originalState.width + 'px';
            win.element.style.height = win.originalState.height + 'px';
            win.element.style.left = win.originalState.left + 'px';
            win.element.style.top = win.originalState.top + 'px';
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
    },

    closeWindow(id) {
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
    },

    updateTaskbar() {
        const taskbar = document.getElementById('taskbar');
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

Apps.launchApp = function(appId) {
    const app = Apps[appId];
    if (!app) return;

    const windowId = WindowManager.createWindow(appId, app.title, app.icon, app.getContent());
    if (typeof app.onOpen === 'function') {
        app.onOpen(windowId);
    }

    return windowId;
};
