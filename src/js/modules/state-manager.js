const StateManager = {
    keys: {
        desktopSession: 'joelmos.desktop.session'
    },

    saveDesktopSession(state) {
        try {
            localStorage.setItem(this.keys.desktopSession, JSON.stringify(state));
        } catch (error) {
            console.error('Unable to save desktop session:', error);
        }
    },

    loadDesktopSession() {
        try {
            const raw = localStorage.getItem(this.keys.desktopSession);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.windows)) {
                return null;
            }

            return parsed;
        } catch (error) {
            console.error('Unable to read desktop session:', error);
            return null;
        }
    }
};
