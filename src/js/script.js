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

        const isMaximized = false;
        
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
    
    WindowManager.createWindow(appId, app.title, app.icon, app.getContent());
};

const CalendarState = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    todayDate: new Date().getDate(),
    todayMonth: new Date().getMonth(),
    todayYear: new Date().getFullYear()
};

function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    
    document.getElementById('time').innerHTML = `${dayName} ${day} ${month} ${hours}:${minutes}`;
}

function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const isCurrentMonth = (year === CalendarState.todayYear && month === CalendarState.todayMonth);
    
    let calendarHTML = `
        <div class="calendar-header">
            <button class="calendar-nav-btn" data-nav="-1">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <strong>${monthNames[month]} ${year}</strong>
            <button class="calendar-nav-btn" data-nav="1">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-name">S</div>
            <div class="calendar-day-name">M</div>
            <div class="calendar-day-name">T</div>
            <div class="calendar-day-name">W</div>
            <div class="calendar-day-name">T</div>
            <div class="calendar-day-name">F</div>
            <div class="calendar-day-name">S</div>
    `;
    
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = (isCurrentMonth && day === CalendarState.todayDate) ? 'today' : '';
        calendarHTML += `<div class="calendar-day ${isToday}">${day}</div>`;
    }
    
    calendarHTML += '</div>';
    return calendarHTML;
}

function navigateCalendar(direction) {
    CalendarState.currentMonth += direction;
    
    if (CalendarState.currentMonth > 11) {
        CalendarState.currentMonth = 0;
        CalendarState.currentYear++;
    } else if (CalendarState.currentMonth < 0) {
        CalendarState.currentMonth = 11;
        CalendarState.currentYear--;
    }
    
    updateCalendarView();
}

function updateCalendarView() {
    const calendar = document.getElementById('calendar-popup');
    if (calendar) {
        calendar.innerHTML = generateCalendar(CalendarState.currentYear, CalendarState.currentMonth);
    }
}

function toggleCalendar() {
    let calendar = document.getElementById('calendar-popup');
    
    if (calendar) {
        calendar.remove();
    } else {
        const now = new Date();
        CalendarState.currentYear = now.getFullYear();
        CalendarState.currentMonth = now.getMonth();
        
        calendar = document.createElement('div');
        calendar.id = 'calendar-popup';
        calendar.className = 'popup-menu';
        calendar.innerHTML = generateCalendar(CalendarState.currentYear, CalendarState.currentMonth);
        
        const timeEl = document.getElementById('time');
        const rect = timeEl.getBoundingClientRect();
        calendar.style.left = rect.left + 'px';
        calendar.style.top = (rect.bottom + 5) + 'px';
        
        document.body.appendChild(calendar);
    }
}

function toggleSystemMenu(type) {
    const existingMenu = document.querySelector('.popup-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'popup-menu system-menu';
    
    if (type === 'wifi') {
        menu.innerHTML = `
            <div class="menu-header">Wi-Fi</div>
            <div class="menu-item active">
                <i class="fa-solid fa-wifi"></i>
                <span>Home Network</span>
                <i class="fa-solid fa-lock" style="margin-left: auto; font-size: 12px;"></i>
            </div>
            <div class="menu-item">
                <i class="fa-solid fa-wifi"></i>
                <span>Guest Network</span>
                <i class="fa-solid fa-lock" style="margin-left: auto; font-size: 12px;"></i>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item">
                <i class="fa-solid fa-gear"></i>
                <span>Network Settings</span>
            </div>
        `;
    } else if (type === 'volume') {
        menu.innerHTML = `
            <div class="menu-header">Volume</div>
            <div class="volume-slider">
                <i class="fa-solid fa-volume-low"></i>
                <input type="range" min="0" max="100" value="70" class="slider">
                <i class="fa-solid fa-volume-high"></i>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item">
                <i class="fa-solid fa-gear"></i>
                <span>Sound Settings</span>
            </div>
        `;
    } else if (type === 'battery') {
        getBatteryInfo().then(info => {
            menu.innerHTML = `
                <div class="menu-header">Power</div>
                <div class="battery-info">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="${info.icon}" style="font-size: 32px;"></i>
                        <div>
                            <div style="font-weight: bold;">${info.level}%</div>
                            <div style="font-size: 11px; color: #999;">${info.status}</div>
                        </div>
                    </div>
                </div>
                <div class="menu-divider"></div>
                <div class="menu-item">
                    <i class="fa-solid fa-gear"></i>
                    <span>Power Settings</span>
                </div>
            `;
        });
        menu.innerHTML = `
            <div class="menu-header">Power</div>
            <div class="battery-info">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size: 32px;"></i>
                    <div>
                        <div style="font-weight: bold;">Loading...</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    const rightSide = document.querySelector('.right-side');
    const rect = rightSide.getBoundingClientRect();
    menu.style.right = '15px';
    menu.style.top = (rect.bottom + 5) + 'px';
    
    document.body.appendChild(menu);
}

function getBatteryIcon(level, charging) {
    if (charging) {
        return 'fa-solid fa-battery-bolt';
    }
    if (level > 87) return 'fa-solid fa-battery-full';
    if (level > 62) return 'fa-solid fa-battery-three-quarters';
    if (level > 37) return 'fa-solid fa-battery-half';
    if (level > 12) return 'fa-solid fa-battery-quarter';
    return 'fa-solid fa-battery-empty';
}

function formatTime(seconds) {
    if (seconds === Infinity || isNaN(seconds)) {
        return 'Calculating...';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
}

async function getBatteryInfo() {
    try {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            const level = Math.round(battery.level * 100);
            const charging = battery.charging;
            const icon = getBatteryIcon(level, charging);
            
            let status;
            if (charging) {
                status = battery.chargingTime !== Infinity 
                    ? formatTime(battery.chargingTime) 
                    : 'Charging';
            } else {
                status = battery.dischargingTime !== Infinity 
                    ? formatTime(battery.dischargingTime) 
                    : 'On Battery';
            }
            
            return { level, charging, icon, status };
        }
    } catch (error) {
        console.error('Battery API error:', error);
    }
    
    return {
        level: 100,
        charging: false,
        icon: 'fa-solid fa-battery-full',
        status: 'Battery info unavailable'
    };
}

async function updateBatteryDisplay() {
    const batteryEl = document.getElementById('battery-display');
    if (!batteryEl) return;
    
    const info = await getBatteryInfo();
    batteryEl.innerHTML = `<i class="${info.icon}"></i> ${info.level}%`;
    
    if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        
        battery.addEventListener('levelchange', () => updateBatteryDisplay());
        battery.addEventListener('chargingchange', () => updateBatteryDisplay());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 60000);
    
    updateBatteryDisplay();

    const dockItems = document.querySelectorAll('.dock-item[data-app]');
    dockItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const appId = e.currentTarget.getAttribute('data-app');
            if (appId && Apps[appId]) {
                Apps.launchApp(appId);
            }
        });
    });
    
    const timeEl = document.getElementById('time');
    timeEl.style.cursor = 'pointer';
    timeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCalendar();
    });
    
    document.addEventListener('click', (e) => {
        if (e.target.closest('.calendar-nav-btn')) {
            const btn = e.target.closest('.calendar-nav-btn');
            const direction = parseInt(btn.getAttribute('data-nav'));
            navigateCalendar(direction);
            return;
        }
        
        const popup = document.querySelector('.popup-menu');
        if (popup && !popup.contains(e.target) && !e.target.closest('#time') && !e.target.closest('.right-side')) {
            popup.remove();
        }
    });
});