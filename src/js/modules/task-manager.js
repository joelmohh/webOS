const TaskManager = {
    refreshTimers: {},

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
                .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

            if (!rows.length) {
                latestTable.innerHTML = '<div class="task-manager-empty">No running apps.</div>';
                return;
            }

            latestTable.innerHTML = rows.map((row) => `
                <div class="task-row">
                    <div class="task-cell task-title"><i class="${row.icon}"></i> ${row.title}</div>
                    <div class="task-cell">${row.appId}</div>
                    <div class="task-cell">${row.minimized ? 'Minimized' : 'Running'}</div>
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
