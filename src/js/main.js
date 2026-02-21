document.addEventListener('DOMContentLoaded', () => {
    SettingsManager.init();
    Clock.init();
    BatteryManager.updateBatteryDisplay();

    const renderAppsMenu = (anchorEl) => {
        const existing = document.getElementById('apps-menu');
        if (existing) {
            existing.remove();
            return;
        }

        const popup = document.createElement('div');
        popup.id = 'apps-menu';
        popup.className = 'popup-menu apps-menu-popup';

        const appEntries = Object.entries(Apps).filter(([key, value]) => {
            if (key === 'launchApp') return false;
            return value && typeof value.getContent === 'function';
        });

        const items = appEntries
            .map(([appId, app]) => `
                <button class="app-icon-item" data-app-id="${appId}" type="button">
                    <i class="${app.icon}"></i>
                    <span>${app.title}</span>
                </button>
            `)
            .join('');

        popup.innerHTML = `
            <div class="apps-menu-title">Applications</div>
            <div class="app-grid">${items}</div>
        `;

        popup.addEventListener('click', (event) => {
            const item = event.target.closest('[data-app-id]');
            if (!item) return;

            const appId = item.getAttribute('data-app-id');
            if (appId && Apps[appId]) {
                Apps.launchApp(appId);
                popup.remove();
            }
        });

        const rect = anchorEl.getBoundingClientRect();
        popup.style.left = `${rect.right + 10}px`;
        popup.style.bottom = '50px';

        document.body.appendChild(popup);
    };

    const dockItems = document.querySelectorAll('.dock-item[data-app]');
    dockItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const appId = e.currentTarget.getAttribute('data-app');
            if (!appId) {
                e.stopPropagation();
                renderAppsMenu(e.currentTarget);
                return;
            }

            if (appId && Apps[appId]) {
                Apps.launchApp(appId);
            }
        });
    });
    
    const timeEl = document.getElementById('time');
    timeEl.style.cursor = 'pointer';
    timeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        CalendarManager.toggle();
    });
    
    document.addEventListener('click', (e) => {
        if (e.target.closest('.calendar-nav-btn')) {
            const btn = e.target.closest('.calendar-nav-btn');
            const direction = parseInt(btn.getAttribute('data-nav'));
            CalendarManager.navigate(direction);
            return;
        }
        
        const popup = document.querySelector('.popup-menu');
        if (popup && !popup.contains(e.target) && !e.target.closest('#time') && !e.target.closest('.right-side')) {
            popup.remove();
        }
    });
});
