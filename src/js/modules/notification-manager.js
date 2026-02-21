const NotificationManager = {
    notifications: [],
    nextId: 1,
    unreadCount: 0,
    activeType: 'all',
    searchQuery: '',

    init() {
        if (!document.getElementById('notification-toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'notification-toast-container';
            toastContainer.className = 'notification-toast-container';
            document.body.appendChild(toastContainer);
        }

        this.updateBadge();
    },

    notify({ title, message, type = 'info', duration = 3200 } = {}) {
        if (!title && !message) return;

        const normalizedType = ['info', 'success', 'warning', 'error'].includes(type) ? type : 'info';

        const notification = {
            id: this.nextId++,
            title: title || 'System',
            message: message || '',
            type: normalizedType,
            createdAt: Date.now(),
            read: false
        };

        this.notifications.unshift(notification);
        this.unreadCount += 1;
        this.updateBadge();
        this.renderCenter();
        this.showToast(notification, duration);
    },

    showToast(notification, duration) {
        const container = document.getElementById('notification-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type}`;
        toast.innerHTML = `
            <div class="notification-toast-title">${notification.title}</div>
            <div class="notification-toast-message">${notification.message}</div>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 220);
        }, Math.max(1200, duration));
    },

    markAllRead() {
        this.notifications.forEach((notification) => {
            notification.read = true;
        });
        this.unreadCount = 0;
        this.updateBadge();
        this.renderCenter();
    },

    clearAll() {
        this.notifications = [];
        this.unreadCount = 0;
        this.updateBadge();
        this.renderCenter();
    },

    removeById(id) {
        if (!id) return;
        this.notifications = this.notifications.filter((notification) => notification.id !== id);
        this.unreadCount = this.notifications.filter((notification) => !notification.read).length;
        this.updateBadge();
        this.renderCenter();
    },

    toggleCenter(anchorEl) {
        const existing = document.getElementById('notification-center');
        if (existing) {
            existing.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'notification-center';
        panel.className = 'popup-menu notification-center';
        panel.innerHTML = `
            <div class="notification-center-header">
                <strong>Notifications</strong>
                <div class="notification-center-actions">
                    <button type="button" class="notification-clear-btn" data-role="notification-read">Mark all read</button>
                    <button type="button" class="notification-clear-btn" data-role="notification-clear">Clear</button>
                </div>
            </div>
            <div class="notification-center-toolbar">
                <input type="text" class="notification-search" data-role="notification-search" placeholder="Search notifications" aria-label="Search notifications">
                <div class="notification-filters" data-role="notification-filters">
                    <button type="button" class="notification-filter-btn active" data-filter="all">All</button>
                    <button type="button" class="notification-filter-btn" data-filter="info">Info</button>
                    <button type="button" class="notification-filter-btn" data-filter="success">Success</button>
                    <button type="button" class="notification-filter-btn" data-filter="warning">Warning</button>
                    <button type="button" class="notification-filter-btn" data-filter="error">Error</button>
                </div>
            </div>
            <div class="notification-list" data-role="notification-list"></div>
        `;

        const rect = anchorEl.getBoundingClientRect();
        panel.style.right = '12px';
        panel.style.top = `${rect.bottom + 5}px`;

        document.body.appendChild(panel);

        const markReadButton = panel.querySelector('[data-role="notification-read"]');
        const clearButton = panel.querySelector('[data-role="notification-clear"]');
        const searchInput = panel.querySelector('[data-role="notification-search"]');
        markReadButton?.addEventListener('click', () => this.markAllRead());
        clearButton?.addEventListener('click', () => this.clearAll());

        searchInput?.addEventListener('input', () => {
            this.searchQuery = searchInput.value.trim().toLowerCase();
            this.renderCenter();
        });

        panel.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const filterBtn = target.closest('[data-filter]');
            if (filterBtn) {
                const filter = filterBtn.getAttribute('data-filter') || 'all';
                this.activeType = filter;
                this.renderCenter();
                return;
            }

            const removeBtn = target.closest('[data-action="notification-remove"]');
            if (!removeBtn) return;

            const rawId = removeBtn.getAttribute('data-id');
            const id = Number(rawId);
            if (!Number.isFinite(id)) return;
            this.removeById(id);
        });

        this.notifications.forEach((notification) => {
            notification.read = true;
        });
        this.unreadCount = 0;
        this.updateBadge();
        this.renderCenter();
    },

    updateBadge() {
        const trigger = document.getElementById('notification-center-trigger');
        if (!trigger) return;

        let badge = trigger.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            trigger.appendChild(badge);
        }

        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 9 ? '9+' : String(this.unreadCount);
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    },

    renderCenter() {
        const panel = document.getElementById('notification-center');
        if (!panel) return;

        const list = panel.querySelector('[data-role="notification-list"]');
        const filtersWrap = panel.querySelector('[data-role="notification-filters"]');
        if (!list) return;

        filtersWrap?.querySelectorAll('[data-filter]').forEach((button) => {
            if (!(button instanceof HTMLElement)) return;
            const isActive = button.getAttribute('data-filter') === this.activeType;
            button.classList.toggle('active', isActive);
        });

        const filteredNotifications = this.notifications
            .filter((notification) => this.activeType === 'all' || notification.type === this.activeType)
            .filter((notification) => {
                if (!this.searchQuery) return true;
                const stack = `${notification.title} ${notification.message}`.toLowerCase();
                return stack.includes(this.searchQuery);
            });

        if (!filteredNotifications.length) {
            list.innerHTML = '<div class="notification-empty">No notifications yet.</div>';
            return;
        }

        list.innerHTML = filteredNotifications
            .slice(0, 50)
            .map((notification) => {
                const time = new Date(notification.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return `
                    <article class="notification-item ${notification.read ? '' : 'unread'}">
                        <div class="notification-item-top">
                            <div class="notification-item-title">${notification.title}</div>
                            <button type="button" class="notification-item-remove" data-action="notification-remove" data-id="${notification.id}" aria-label="Remove notification">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div class="notification-item-message">${notification.message}</div>
                        <div class="notification-item-time">${time} • ${notification.type}</div>
                    </article>
                `;
            })
            .join('');
    }
};
