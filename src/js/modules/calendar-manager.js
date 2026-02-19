const CalendarManager = {
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth(),
        todayDate: new Date().getDate(),
        todayMonth: new Date().getMonth(),
        todayYear: new Date().getFullYear()
    },

    generateCalendar(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        
        const isCurrentMonth = (year === this.state.todayYear && month === this.state.todayMonth);
        
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
            const isToday = (isCurrentMonth && day === this.state.todayDate) ? 'today' : '';
            calendarHTML += `<div class="calendar-day ${isToday}">${day}</div>`;
        }
        
        calendarHTML += '</div>';
        return calendarHTML;
    },

    navigate(direction) {
        this.state.currentMonth += direction;
        
        if (this.state.currentMonth > 11) {
            this.state.currentMonth = 0;
            this.state.currentYear++;
        } else if (this.state.currentMonth < 0) {
            this.state.currentMonth = 11;
            this.state.currentYear--;
        }
        
        this.updateView();
    },

    updateView() {
        const calendar = document.getElementById('calendar-popup');
        if (calendar) {
            calendar.innerHTML = this.generateCalendar(this.state.currentYear, this.state.currentMonth);
        }
    },

    toggle() {
        let calendar = document.getElementById('calendar-popup');
        
        if (calendar) {
            calendar.remove();
        } else {
            const now = new Date();
            this.state.currentYear = now.getFullYear();
            this.state.currentMonth = now.getMonth();
            
            calendar = document.createElement('div');
            calendar.id = 'calendar-popup';
            calendar.className = 'popup-menu';
            calendar.innerHTML = this.generateCalendar(this.state.currentYear, this.state.currentMonth);
            
            const timeEl = document.getElementById('time');
            const rect = timeEl.getBoundingClientRect();
            calendar.style.left = rect.left + 'px';
            calendar.style.top = (rect.bottom + 5) + 'px';
            
            document.body.appendChild(calendar);
        }
    }
};
