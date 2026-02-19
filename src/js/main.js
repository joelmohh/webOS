document.addEventListener('DOMContentLoaded', () => {
    Clock.init();
    BatteryManager.updateBatteryDisplay();

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
