const TaskManager = {
    refreshTimers: {},
    usageStats: {},

    ensureUsageStat(id, appId) {
        if (this.usageStats[id]) return this.usageStats[id];

        const baseCpuMap = {
            browser: 19,
            files: 8,
            notepad: 6,
            terminal: 9,
            calculator: 4,
            taskmanager: 7,
            settings: 5,
            todo: 5
        };

        const baseMemMap = {
            browser: 220,
            files: 95,
            notepad: 78,
            terminal: 88,
            calculator: 54,
            taskmanager: 84,
            settings: 62,
            todo: 58
        };

        const baseCpu = baseCpuMap[appId] || 7;
        const baseMem = baseMemMap[appId] || 72;

        this.usageStats[id] = {
            cpu: Math.max(1, Math.min(98, baseCpu + Math.random() * 6)),
            mem: Math.max(28, baseMem + Math.random() * 26)
        };

        return this.usageStats[id];
    },

    nextUsage(id, appId) {
        const usage = this.ensureUsageStat(id, appId);
        usage.cpu = Math.max(1, Math.min(99, usage.cpu + (Math.random() * 6 - 3)));
        usage.mem = Math.max(24, usage.mem + (Math.random() * 18 - 6));
        return {
            cpu: Number(usage.cpu.toFixed(1)),
            mem: Math.round(usage.mem)
        };
    },

    cleanupUsage(windowIds) {
        const alive = new Set(windowIds);
        Object.keys(this.usageStats).forEach((id) => {
            if (!alive.has(id)) {
                delete this.usageStats[id];
            }
        });
    },

    getContent() {
        return `
            <div class="task-manager-app">
                <div class="task-manager-toolbar">
                    <button type="button" class="files-btn" data-role="tm-refresh">
                        <i class="fa-solid fa-rotate"></i>
                        Refresh
                    </button>
                    <button type="button" class="files-btn" data-role="tm-close-all">
                        <i class="fa-solid fa-ban"></i>
                        End all tasks
                    </button>
                </div>
                <div class="task-manager-table" data-role="tm-table"></div>
            </div>
        `;
    },

    init(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        const table = windowEl.querySelector('[data-role="tm-table"]');
        const refreshBtn = windowEl.querySelector('[data-role="tm-refresh"]');
        const closeAllBtn = windowEl.querySelector('[data-role="tm-close-all"]');

        if (!table || !refreshBtn || !closeAllBtn) return;

        const render = () => {
            const latestWindowEl = document.getElementById(windowId);
            if (!latestWindowEl) {
                return;
            }

            const latestTable = latestWindowEl.querySelector('[data-role="tm-table"]');
            if (!latestTable) {
                return;
            }

            const rows = WindowManager.getWindowList()
                .filter((item) => item.id !== windowId)
                .map((item) => {
                    const usage = this.nextUsage(item.id, item.appId);
                    return {
                        ...item,
                        cpu: usage.cpu,
                        mem: usage.mem,
                        usageScore: usage.cpu + (usage.mem / 12)
                    };
                })
                .sort((a, b) => b.usageScore - a.usageScore);

            this.cleanupUsage(rows.map((row) => row.id));

            if (!rows.length) {
                latestTable.innerHTML = '<div class="task-manager-empty">No running apps.</div>';
                return;
            }

            latestTable.innerHTML = rows.map((row) => `
                <div class="task-row">
                    <div class="task-cell task-title"><i class="${row.icon}"></i> ${row.title}</div>
                    <div class="task-cell">${row.appId}</div>
                    <div class="task-cell">${row.minimized ? 'Minimized' : 'Running'}</div>
                    <div class="task-cell">${row.cpu}% CPU</div>
                    <div class="task-cell">${row.mem} MB</div>
                    <div class="task-cell task-actions">
                        <button type="button" class="files-btn task-kill-btn" data-action="kill" data-id="${row.id}">Force close</button>
                    </div>
                </div>
            `).join('');
        };

        table.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const button = target.closest('[data-action="kill"]');
            if (!button || !table.contains(button)) return;

            const targetId = button.getAttribute('data-id');
            if (!targetId) return;

            const selected = WindowManager.getWindowList().find((item) => item.id === targetId);
            const confirmClose = window.confirm(`Force close ${selected?.title || 'this app'}? Unsaved work may be lost.`);
            if (!confirmClose) return;

            WindowManager.closeWindow(targetId);
            NotificationManager.notify({
                title: 'Task ended',
                message: 'The selected app was force closed.',
                type: 'warning'
            });
            render();
        });

        refreshBtn.addEventListener('click', render);
        closeAllBtn.addEventListener('click', () => {
            WindowManager.closeAllWindows({ exclude: [windowId] });
            NotificationManager.notify({
                title: 'Tasks ended',
                message: 'All other running apps were closed.',
                type: 'warning'
            });
            render();
        });

        if (this.refreshTimers[windowId]) {
            clearInterval(this.refreshTimers[windowId]);
        }

        this.refreshTimers[windowId] = setInterval(() => {
            if (!document.getElementById(windowId)) {
                clearInterval(this.refreshTimers[windowId]);
                delete this.refreshTimers[windowId];
                return;
            }
            render();
        }, 1000);

        WindowManager.addChangeListener(windowId, render);
        render();
    }
};
