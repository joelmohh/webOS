const BrowserManager = {
    defaultUrl: 'https://joelmo.dev',
    storageKey: 'joelmos.browser.state.v2',
    windowStates: {},

    getContent() {
        return `
            <div class="browser-app">
                <div class="browser-toolbar">
                    <div class="browser-toolbar-row">
                        <button class="browser-tool-btn" data-role="browser-back" title="Back" aria-label="Back">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        <button class="browser-tool-btn" data-role="browser-forward" title="Forward" aria-label="Forward">
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                        <button class="browser-tool-btn" data-role="browser-reload" title="Reload" aria-label="Reload">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                        <button class="browser-tool-btn" data-role="browser-home" title="Home" aria-label="Home">
                            <i class="fa-solid fa-house"></i>
                        </button>
                        <button class="browser-tool-btn" data-role="browser-favorite-toggle" title="Toggle favorite" aria-label="Toggle favorite">
                            <i class="fa-regular fa-star"></i>
                        </button>
                        <form class="browser-nav" data-role="browser-form" autocomplete="off">
                            <input
                                type="text"
                                class="browser-address"
                                data-role="browser-address"
                                placeholder="Search or type a URL"
                                aria-label="Address bar"
                            >
                            <button type="submit" class="browser-go" data-role="browser-go">Go</button>
                        </form>
                    </div>
                    <div class="browser-toolbar-row browser-subtoolbar-row">
                        <div class="browser-tabs" data-role="browser-tabs"></div>
                        <button class="browser-tool-btn" data-role="browser-new-tab" title="New tab" aria-label="New tab">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <select class="browser-select" data-role="browser-favorites" aria-label="Favorites">
                            <option value="">Favorites</option>
                        </select>
                        <select class="browser-select" data-role="browser-history" aria-label="History">
                            <option value="">History</option>
                        </select>
                    </div>
                    <datalist data-role="browser-suggestions"></datalist>
                </div>
                <div class="browser-frame-wrap">
                    <iframe
                        class="browser-frame"
                        data-role="browser-frame"
                        title="Browser"
                        referrerpolicy="no-referrer"
                    ></iframe>
                </div>
                <div class="browser-status" data-role="browser-status">Ready</div>
            </div>
        `;
    },

    getSessionState(windowId) {
        return this.windowStates[windowId] || null;
    },

    init(windowId, restoredState = null) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        const form = windowEl.querySelector('[data-role="browser-form"]');
        const addressInput = windowEl.querySelector('[data-role="browser-address"]');
        const frame = windowEl.querySelector('[data-role="browser-frame"]');
        const suggestionsList = windowEl.querySelector('[data-role="browser-suggestions"]');
        const statusEl = windowEl.querySelector('[data-role="browser-status"]');
        const backBtn = windowEl.querySelector('[data-role="browser-back"]');
        const forwardBtn = windowEl.querySelector('[data-role="browser-forward"]');
        const reloadBtn = windowEl.querySelector('[data-role="browser-reload"]');
        const homeBtn = windowEl.querySelector('[data-role="browser-home"]');
        const tabsEl = windowEl.querySelector('[data-role="browser-tabs"]');
        const newTabBtn = windowEl.querySelector('[data-role="browser-new-tab"]');
        const favoritesSelect = windowEl.querySelector('[data-role="browser-favorites"]');
        const historySelect = windowEl.querySelector('[data-role="browser-history"]');
        const favoriteToggleBtn = windowEl.querySelector('[data-role="browser-favorite-toggle"]');

        if (!form || !addressInput || !frame || !suggestionsList || !statusEl || !backBtn || !forwardBtn || !reloadBtn || !homeBtn || !tabsEl || !newTabBtn || !favoritesSelect || !historySelect || !favoriteToggleBtn) {
            return;
        }

        const listId = `browser-suggestions-${windowId}`;
        suggestionsList.id = listId;
        addressInput.setAttribute('list', listId);

        const setStatus = (text) => {
            statusEl.textContent = text;
        };

        const setSuggestions = (items) => {
            suggestionsList.innerHTML = items
                .map((suggestion) => `<option value="${String(suggestion).replaceAll('"', '&quot;')}"></option>`)
                .join('');
        };

        const isLikelyUrl = (value) => {
            const trimmed = value.trim();
            if (!trimmed) return false;

            if (/^https?:\/\//i.test(trimmed)) return true;
            if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) return true;
            if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(trimmed)) return true;
            return /[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed);
        };

        const asNavigableUrl = (rawValue) => {
            const value = rawValue.trim();
            if (!value) return this.defaultUrl;
            if (/^https?:\/\//i.test(value)) return value;
            return `https://${value}`;
        };

        const buildTarget = (rawValue) => {
            const value = rawValue.trim();
            if (!value) {
                return { type: 'url', target: this.defaultUrl, display: this.defaultUrl };
            }

            if (isLikelyUrl(value)) {
                const target = asNavigableUrl(value);
                return { type: 'url', target, display: target };
            }

            return { type: 'search', query: value, display: value };
        };

        const escapeHtml = (value) => String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');

        const readPersistedState = () => {
            try {
                const raw = localStorage.getItem(this.storageKey);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!parsed || !Array.isArray(parsed.tabs)) return null;
                return parsed;
            } catch {
                return null;
            }
        };

        const writePersistedState = (state) => {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(state));
            } catch {
            }
        };

        const createTabEntry = (data = {}) => ({
            id: data.id || `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: data.type === 'search' ? 'search' : 'url',
            url: data.url || this.defaultUrl,
            query: data.query || '',
            title: data.title || 'New tab'
        });

        const persisted = readPersistedState();
        const baseSource = restoredState && Array.isArray(restoredState.tabs)
            ? restoredState
            : (persisted || null);

        const baseTabs = Array.isArray(baseSource?.tabs) && baseSource.tabs.length
            ? baseSource.tabs.map((tab) => createTabEntry(tab))
            : [createTabEntry({ type: 'url', url: this.defaultUrl, title: 'Home' })];

        const state = {
            tabs: baseTabs,
            activeTabId: baseSource?.activeTabId || baseTabs[0].id,
            history: Array.isArray(baseSource?.history) ? baseSource.history.slice(0, 50) : [],
            favorites: Array.isArray(baseSource?.favorites) ? baseSource.favorites.slice(0, 50) : []
        };

        if (!state.tabs.some((tab) => tab.id === state.activeTabId)) {
            state.activeTabId = state.tabs[0].id;
        }

        const getActiveTab = () => state.tabs.find((tab) => tab.id === state.activeTabId) || null;

        const syncState = () => {
            const snapshot = {
                tabs: state.tabs.map((tab) => ({
                    id: tab.id,
                    type: tab.type,
                    url: tab.url,
                    query: tab.query,
                    title: tab.title
                })),
                activeTabId: state.activeTabId,
                history: state.history.slice(0, 50),
                favorites: state.favorites.slice(0, 50)
            };

            this.windowStates[windowId] = snapshot;
            writePersistedState(snapshot);
        };

        const renderSearchPage = (query) => {
            frame.srcdoc = `
                <!doctype html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Search</title>
                    <style>
                        body { margin: 0; font-family: Ubuntu, Arial, sans-serif; background: #f7f7f7; color: #222; min-height: 100vh; display: grid; place-items: center; }
                        .search-card { width: min(640px, calc(100% - 48px)); background: #fff; border: 1px solid #e6e6e6; border-radius: 12px; padding: 24px; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08); }
                        .search-title { font-size: 22px; margin: 0 0 10px; }
                        .search-text { margin: 0; color: #555; font-size: 15px; line-height: 1.5; }
                        .search-query { display: inline-block; margin-top: 8px; padding: 6px 10px; border-radius: 999px; background: #f1f5ff; border: 1px solid #d8e2ff; color: #243b75; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <section class="search-card">
                        <h1 class="search-title">Search Preview</h1>
                        <p class="search-text">You searched for:<br><span class="search-query">${escapeHtml(query)}</span></p>
                        <p class="search-text" style="margin-top: 12px;">Unfortunately, Google does not work in an iframe.</p>
                    </section>
                </body>
                </html>
            `;
        };

        const renderTabs = () => {
            tabsEl.innerHTML = state.tabs.map((tab) => `
                <button type="button" class="browser-tab${tab.id === state.activeTabId ? ' active' : ''}" data-action="switch-tab" data-tab-id="${tab.id}">
                    <span class="browser-tab-label">${escapeHtml(tab.title || (tab.type === 'search' ? 'Search' : 'New tab'))}</span>
                    <span class="browser-tab-close" data-action="close-tab" data-tab-id="${tab.id}"><i class="fa-solid fa-xmark"></i></span>
                </button>
            `).join('');
        };

        const renderFavorites = () => {
            favoritesSelect.innerHTML = [
                '<option value="">Favorites</option>',
                ...state.favorites.map((url) => `<option value="${escapeHtml(url)}">${escapeHtml(url)}</option>`)
            ].join('');
        };

        const renderHistory = () => {
            historySelect.innerHTML = [
                '<option value="">History</option>',
                ...state.history.map((url) => `<option value="${escapeHtml(url)}">${escapeHtml(url)}</option>`)
            ].join('');
        };

        const refreshFavoriteButton = () => {
            const tab = getActiveTab();
            const isFavorite = tab?.type === 'url' && state.favorites.includes(tab.url);
            const icon = favoriteToggleBtn.querySelector('i');
            if (icon) {
                icon.className = isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star';
            }
        };

        const addHistory = (url) => {
            if (!url) return;
            state.history = [url, ...state.history.filter((entry) => entry !== url)].slice(0, 50);
        };

        const displayActiveTab = () => {
            const tab = getActiveTab();
            if (!tab) return;

            if (tab.type === 'search') {
                frame.removeAttribute('src');
                renderSearchPage(tab.query || '');
                addressInput.value = tab.query || '';
                setStatus('Showing local search preview.');
            } else {
                frame.removeAttribute('srcdoc');
                frame.src = tab.url;
                addressInput.value = tab.url;
                setStatus('Loading...');
            }

            renderTabs();
            renderFavorites();
            renderHistory();
            refreshFavoriteButton();
            syncState();
        };

        const navigate = (rawValue) => {
            const tab = getActiveTab();
            if (!tab) return;

            const result = buildTarget(rawValue);
            if (result.type === 'search') {
                tab.type = 'search';
                tab.query = result.query;
                tab.title = `Search: ${result.query.slice(0, 24)}`;
                renderSearchPage(result.query);
                frame.removeAttribute('src');
                addressInput.value = result.display;
                setStatus('Showing local search preview.');
            } else {
                tab.type = 'url';
                tab.url = result.target;
                tab.query = '';
                tab.title = result.target.replace(/^https?:\/\//i, '').slice(0, 26) || 'Website';
                frame.removeAttribute('srcdoc');
                frame.src = result.target;
                addressInput.value = result.target;
                setStatus('Loading...');
                addHistory(result.target);
            }

            renderTabs();
            renderFavorites();
            renderHistory();
            refreshFavoriteButton();
            syncState();
        };

        const newTab = () => {
            const tab = createTabEntry({ type: 'url', url: this.defaultUrl, title: 'Home' });
            state.tabs.push(tab);
            state.activeTabId = tab.id;
            displayActiveTab();
        };

        const closeTab = (tabId) => {
            if (state.tabs.length <= 1) return;

            const index = state.tabs.findIndex((tab) => tab.id === tabId);
            if (index < 0) return;

            const wasActive = state.activeTabId === tabId;
            state.tabs = state.tabs.filter((tab) => tab.id !== tabId);

            if (wasActive) {
                const fallback = state.tabs[Math.max(0, index - 1)] || state.tabs[0];
                state.activeTabId = fallback.id;
            }

            displayActiveTab();
        };

        const requestSuggestionsJSONP = (query) => new Promise((resolve) => {
            const callbackName = `googleSuggest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            const script = document.createElement('script');

            const cleanup = () => {
                delete window[callbackName];
                script.remove();
            };

            window[callbackName] = (data) => {
                cleanup();
                const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
                resolve(suggestions);
            };

            script.onerror = () => {
                cleanup();
                resolve([]);
            };

            script.src = `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&q=${encodeURIComponent(query)}&callback=${callbackName}`;
            document.body.appendChild(script);
        });

        let suggestDebounce;
        const requestSuggestions = (query) => {
            if (!query.trim()) {
                setSuggestions([]);
                return;
            }

            clearTimeout(suggestDebounce);
            suggestDebounce = setTimeout(async () => {
                try {
                    const endpoint = `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&q=${encodeURIComponent(query)}`;
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        const data = await response.json();
                        const suggestions = Array.isArray(data?.[1]) ? data[1].slice(0, 8) : [];
                        setSuggestions(suggestions);
                        return;
                    }
                } catch {
                }

                const fallbackSuggestions = await requestSuggestionsJSONP(query);
                setSuggestions(fallbackSuggestions.slice(0, 8));
            }, 220);
        };

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            navigate(addressInput.value);
        });

        addressInput.addEventListener('input', () => {
            requestSuggestions(addressInput.value);
        });

        tabsEl.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const closeButton = target.closest('[data-action="close-tab"]');
            if (closeButton) {
                const tabId = closeButton.getAttribute('data-tab-id');
                if (tabId) closeTab(tabId);
                return;
            }

            const tabButton = target.closest('[data-action="switch-tab"]');
            if (!tabButton) return;
            const tabId = tabButton.getAttribute('data-tab-id');
            if (!tabId) return;
            state.activeTabId = tabId;
            displayActiveTab();
        });

        newTabBtn.addEventListener('click', () => {
            newTab();
        });

        favoritesSelect.addEventListener('change', () => {
            const value = favoritesSelect.value;
            if (!value) return;
            navigate(value);
            favoritesSelect.value = '';
        });

        historySelect.addEventListener('change', () => {
            const value = historySelect.value;
            if (!value) return;
            navigate(value);
            historySelect.value = '';
        });

        favoriteToggleBtn.addEventListener('click', () => {
            const tab = getActiveTab();
            if (!tab || tab.type !== 'url') return;

            if (state.favorites.includes(tab.url)) {
                state.favorites = state.favorites.filter((url) => url !== tab.url);
            } else {
                state.favorites = [tab.url, ...state.favorites].slice(0, 50);
            }

            renderFavorites();
            refreshFavoriteButton();
            syncState();
        });

        backBtn.addEventListener('click', () => {
            frame.contentWindow?.history.back();
        });

        forwardBtn.addEventListener('click', () => {
            frame.contentWindow?.history.forward();
        });

        reloadBtn.addEventListener('click', () => {
            frame.contentWindow?.location.reload();
        });

        homeBtn.addEventListener('click', () => {
            navigate(this.defaultUrl);
        });

        frame.addEventListener('load', () => {
            setStatus('Ready');
        });

        frame.addEventListener('error', () => {
            setStatus('Unable to load this page in the embedded view.');
        });

        displayActiveTab();
    }
};
