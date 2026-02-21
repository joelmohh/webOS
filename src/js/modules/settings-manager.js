const SettingsManager = {
    wallpaperStorageKey: 'joelmos.settings.wallpaper',
    showSecondsStorageKey: 'joelmos.settings.showSeconds',
    wallpapers: [
        {
            id: 'ubuntu-purple',
            name: 'Ubuntu Purple',
            value: 'linear-gradient(135deg, #2c001e 0%, #5e2750 100%)'
        },
        {
            id: 'ocean-blue',
            name: 'Ocean Blue',
            value: 'linear-gradient(135deg, #0b1f3a 0%, #1f5d8c 100%)'
        },
        {
            id: 'forest-green',
            name: 'Forest Green',
            value: 'linear-gradient(135deg, #0b2e1f 0%, #2f6b3f 100%)'
        }
    ],

    getWallpaperId() {
        const stored = localStorage.getItem(this.wallpaperStorageKey);
        return this.wallpapers.some((wallpaper) => wallpaper.id === stored) ? stored : this.wallpapers[0].id;
    },

    applyWallpaperById(id) {
        const selected = this.wallpapers.find((wallpaper) => wallpaper.id === id) || this.wallpapers[0];
        document.body.style.background = selected.value;
        document.body.style.backgroundSize = 'cover';
    },

    setWallpaper(id) {
        const selected = this.wallpapers.find((wallpaper) => wallpaper.id === id);
        if (!selected) return;

        localStorage.setItem(this.wallpaperStorageKey, selected.id);
        this.applyWallpaperById(selected.id);
    },

    getShowSeconds() {
        return localStorage.getItem(this.showSecondsStorageKey) === 'true';
    },

    setShowSeconds(value) {
        localStorage.setItem(this.showSecondsStorageKey, String(Boolean(value)));
        if (typeof Clock !== 'undefined' && typeof Clock.configure === 'function') {
            Clock.configure({ showSeconds: Boolean(value) });
        }
    },

    init() {
        this.applyWallpaperById(this.getWallpaperId());
    }
};
