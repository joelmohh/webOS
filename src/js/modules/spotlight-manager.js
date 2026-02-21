const SpotlightManager = {
    isOpen: false,

    init() {
        this.ensureDOM();

        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                this.toggle();
                return;
            }

            if (event.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    ensureDOM() {
        if (document.getElementById('spotlight-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'spotlight-overlay';
        overlay.className = 'spotlight-overlay hidden';
        overlay.innerHTML = `
            <div class="spotlight-modal" role="dialog" aria-modal="true" aria-label="Spotlight">
                <input class="spotlight-input" data-role="spotlight-input" type="text" placeholder="Search apps, files, settings or commands...">
                <div class="spotlight-results" data-role="spotlight-results"></div>
            </div>
        `;

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.close();
            }
        });

        document.body.appendChild(overlay);

        const input = overlay.querySelector('[data-role="spotlight-input"]');
        const results = overlay.querySelector('[data-role="spotlight-results"]');

        input?.addEventListener('input', () => {
            this.renderResults(input.value, results);
        });

        input?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const first = results.querySelector('.spotlight-result-item');
                first?.click();
            }
        });
    },

    toggle() {
        if (this.isOpen) {
            this.close();
            return;
        }

        this.open();
    },

    open() {
        const overlay = document.getElementById('spotlight-overlay');
        const input = overlay?.querySelector('[data-role="spotlight-input"]');
        const results = overlay?.querySelector('[data-role="spotlight-results"]');

        if (!overlay || !input || !results) return;

        this.isOpen = true;
        overlay.classList.remove('hidden');
        input.value = '';
        this.renderResults('', results);
        setTimeout(() => input.focus(), 0);
    },

    close() {
        const overlay = document.getElementById('spotlight-overlay');
        if (!overlay) return;

        this.isOpen = false;
        overlay.classList.add('hidden');
    },

    getEntries(query) {
        const q = query.trim().toLowerCase();
        const entries = [];

        Object.entries(Apps)
            .filter(([appId, app]) => appId !== 'launchApp' && app && typeof app.getContent === 'function')
            .forEach(([appId, app]) => {
                if (!q || app.title.toLowerCase().includes(q) || appId.toLowerCase().includes(q)) {
                    entries.push({
                        label: app.title,
                        description: `Open app • ${appId}`,
                        icon: app.icon,
                        action: () => Apps.launchApp(appId)
                    });
                }
            });

        const noteKeys = Object.keys(localStorage).filter((key) => key.startsWith('joelmos.notepad.'));
        noteKeys.forEach((key) => {
            const fileName = `${key.replace('joelmos.notepad.', '').replace(/_/g, ' ') || 'untitled'}.txt`;
            if (!q || fileName.toLowerCase().includes(q)) {
                entries.push({
                    label: fileName,
                    description: 'Open in Files',
                    icon: 'fa-solid fa-file-lines',
                    action: () => Apps.launchApp('files')
                });
            }
        });

        const commandEntries = [
            {
                label: 'Close all windows',
                description: 'Command',
                icon: 'fa-solid fa-xmark',
                action: () => WindowManager.closeAllWindows()
            },
            {
                label: 'Toggle clock seconds',
                description: 'Command',
                icon: 'fa-regular fa-clock',
                action: () => SettingsManager.setShowSeconds(!SettingsManager.getShowSeconds())
            },
            {
                label: 'Open notification center',
                description: 'Command',
                icon: 'fa-regular fa-bell',
                action: () => {
                    const trigger = document.getElementById('notification-center-trigger');
                    if (trigger) NotificationManager.toggleCenter(trigger);
                }
            },
            {
                label: 'Set reminder (1 minute)',
                description: 'Command',
                icon: 'fa-solid fa-hourglass-half',
                action: () => {
                    NotificationManager.notify({ title: 'Reminder scheduled', message: 'A reminder will appear in 1 minute.', type: 'info' });
                    setTimeout(() => {
                        NotificationManager.notify({ title: 'Reminder', message: 'Your 1-minute reminder is ready.', type: 'warning' });
                    }, 60000);
                }
            },
            {
                label: 'Wallpaper: Ubuntu Purple',
                description: 'Setting',
                icon: 'fa-solid fa-image',
                action: () => SettingsManager.setWallpaper('ubuntu-purple')
            },
            {
                label: 'Wallpaper: Ocean Blue',
                description: 'Setting',
                icon: 'fa-solid fa-image',
                action: () => SettingsManager.setWallpaper('ocean-blue')
            },
            {
                label: 'Wallpaper: Forest Green',
                description: 'Setting',
                icon: 'fa-solid fa-image',
                action: () => SettingsManager.setWallpaper('forest-green')
            }
        ];

        commandEntries.forEach((entry) => {
            if (!q || entry.label.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q)) {
                entries.push(entry);
            }
        });

        return entries.slice(0, 18);
    },

    renderResults(query, container) {
        const entries = this.getEntries(query);

        if (!entries.length) {
            container.innerHTML = '<div class="spotlight-empty">No matches found.</div>';
            return;
        }

        container.innerHTML = entries
            .map((entry, index) => `
                <button type="button" class="spotlight-result-item" data-index="${index}">
                    <i class="${entry.icon}"></i>
                    <div class="spotlight-result-text">
                        <span class="spotlight-result-label">${entry.label}</span>
                        <span class="spotlight-result-description">${entry.description}</span>
                    </div>
                </button>
            `)
            .join('');

        container.querySelectorAll('.spotlight-result-item').forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.getAttribute('data-index'));
                const target = entries[index];
                if (!target) return;

                target.action();
                this.close();
            });
        });
    }
};
