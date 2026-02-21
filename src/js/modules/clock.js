const Clock = {
    showSeconds: false,
    timer: null,

    readShowSecondsPreference() {
        return localStorage.getItem('joelmos.settings.showSeconds') === 'true';
    },

    update() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayName = days[now.getDay()];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const timeValue = this.showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
        
        const timeEl = document.getElementById('time');
        if (timeEl) {
            timeEl.innerHTML = `${dayName} ${day} ${month} ${timeValue}`;
        }
    },

    restartTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        const interval = this.showSeconds ? 1000 : 60000;
        this.timer = setInterval(() => this.update(), interval);
    },

    configure(options = {}) {
        if (typeof options.showSeconds === 'boolean') {
            this.showSeconds = options.showSeconds;
            this.update();
            this.restartTimer();
        }
    },

    init() {
        this.showSeconds = this.readShowSecondsPreference();
        this.update();
        this.restartTimer();
    }
};
