const SystemMenu = {
    async toggle(type) {
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
            
            const rightSide = document.querySelector('.right-side');
            const rect = rightSide.getBoundingClientRect();
            menu.style.right = '15px';
            menu.style.top = (rect.bottom + 5) + 'px';
            
            document.body.appendChild(menu);
            
            const info = await BatteryManager.getBatteryInfo();
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
            `;
            return;
        }
        
        const rightSide = document.querySelector('.right-side');
        const rect = rightSide.getBoundingClientRect();
        menu.style.right = '15px';
        menu.style.top = (rect.bottom + 5) + 'px';
        
        document.body.appendChild(menu);
    }
};

function toggleSystemMenu(type) {
    SystemMenu.toggle(type);
}
