const BatteryManager = {
    batteryRef: null,
    listenersBound: false,
    lowBatteryNotified: false,

    getBatteryIcon(level, charging) {
        if (charging) {
            return 'fa-solid fa-bolt';
        }
        if (level >= 90) return 'fa-solid fa-battery-full';
        if (level >= 60) return 'fa-solid fa-battery-three-quarters';
        if (level >= 30) return 'fa-solid fa-battery-half';
        if (level >= 10) return 'fa-solid fa-battery-quarter';
        return 'fa-solid fa-battery-empty';
    },

    formatTime(seconds) {
        if (seconds === Infinity || isNaN(seconds)) {
            return 'Calculating...';
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        }
        return `${minutes}m remaining`;
    },

    async getBatteryInfo() {
        try {
            if ('getBattery' in navigator) {
                if (!this.batteryRef) {
                    this.batteryRef = await navigator.getBattery();
                }

                const battery = this.batteryRef;
                const level = Math.round(battery.level * 100);
                const charging = battery.charging;
                const icon = this.getBatteryIcon(level, charging);
                
                let status;
                if (charging) {
                    status = battery.chargingTime !== Infinity 
                        ? this.formatTime(battery.chargingTime) 
                        : 'Charging';
                } else {
                    status = battery.dischargingTime !== Infinity 
                        ? this.formatTime(battery.dischargingTime) 
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
    },

    async updateBatteryDisplay() {
        const batteryEl = document.getElementById('battery-display');
        if (!batteryEl) return;
        
        const info = await this.getBatteryInfo();
        batteryEl.innerHTML = `<i class="${info.icon}"></i> ${info.level}%`;

        if (!info.charging && info.level <= 20 && !this.lowBatteryNotified) {
            this.lowBatteryNotified = true;
            NotificationManager.notify({
                title: 'Low battery',
                message: `Battery is at ${info.level}%. Consider connecting power.`,
                type: 'warning',
                duration: 5000
            });
        }

        if (info.charging || info.level > 25) {
            this.lowBatteryNotified = false;
        }
        
        if ('getBattery' in navigator && this.batteryRef && !this.listenersBound) {
            const battery = this.batteryRef;

            battery.addEventListener('levelchange', () => this.updateBatteryDisplay());
            battery.addEventListener('chargingchange', () => this.updateBatteryDisplay());
            this.listenersBound = true;
        }
    }
};
