const BrowserManager = {
    defaultUrl: 'https://joelmo.dev',

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

    init(windowId) {
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

        if (!form || !addressInput || !frame || !suggestionsList || !statusEl || !backBtn || !forwardBtn || !reloadBtn || !homeBtn) {
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

        const renderSearchPage = (query) => {
            const escapedQuery = query
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;');

            frame.srcdoc = `
                <!doctype html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Search</title>
                    <style>
                        body {
                            margin: 0;
                            font-family: Ubuntu, Arial, sans-serif;
                            background: #f7f7f7;
                            color: #222;
                            min-height: 100vh;
                            display: grid;
                            place-items: center;
                        }

                        .search-card {
                            width: min(640px, calc(100% - 48px));
                            background: #fff;
                            border: 1px solid #e6e6e6;
                            border-radius: 12px;
                            padding: 24px;
                            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
                        }

                        .search-title {
                            font-size: 22px;
                            margin: 0 0 10px;
                        }

                        .search-text {
                            margin: 0;
                            color: #555;
                            font-size: 15px;
                            line-height: 1.5;
                        }

                        .search-query {
                            display: inline-block;
                            margin-top: 8px;
                            padding: 6px 10px;
                            border-radius: 999px;
                            background: #f1f5ff;
                            border: 1px solid #d8e2ff;
                            color: #243b75;
                            font-weight: 600;
                        }
                    </style>
                </head>
                <body>
                    <section class="search-card">
                        <h1 class="search-title">Search Preview</h1>
                        <p class="search-text">
                            You searched for:<br>
                            <span class="search-query">${escapedQuery}</span>
                        </p>
                        <p class="search-text" style="margin-top: 12px;">
                            Unfortunately, Google does not work in an iframe.
                        </p>
                    </section>
                </body>
                </html>
            `;
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
                } catch (error) {
                }

                const fallbackSuggestions = await requestSuggestionsJSONP(query);
                setSuggestions(fallbackSuggestions.slice(0, 8));
            }, 220);
        };

        const navigate = (rawValue) => {
            const result = buildTarget(rawValue);

            if (result.type === 'search') {
                frame.removeAttribute('src');
                renderSearchPage(result.query);
                addressInput.value = result.display;
                setStatus('Showing local search preview.');
                return;
            }

            frame.removeAttribute('srcdoc');
            frame.src = result.target;
            addressInput.value = result.target;
            setStatus('Loading...');
        };

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            navigate(addressInput.value);
        });

        addressInput.addEventListener('input', () => {
            requestSuggestions(addressInput.value);
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

        navigate(this.defaultUrl);
    }
};
