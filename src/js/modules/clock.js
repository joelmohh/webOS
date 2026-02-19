const Clock = {
    update() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayName = days[now.getDay()];
        const day = now.getDate();
        const month = months[now.getMonth()];
        
        const timeEl = document.getElementById('time');
        if (timeEl) {
            timeEl.innerHTML = `${dayName} ${day} ${month} ${hours}:${minutes}`;
        }
    },

    init() {
        this.update();
        setInterval(() => this.update(), 60000);
    }
};
