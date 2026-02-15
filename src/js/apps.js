Apps.notepad = {
    title: 'Notepad',
    icon: 'fa-solid fa-file-lines',
    getContent() {
        return `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <textarea style="flex: 1; border: none; padding: 10px; font-family: monospace; font-size: 13px; resize: none; background: white;"></textarea>
            </div>
        `;
    }
};

Apps.terminal = {
    title: 'Terminal',
    icon: 'fa-solid fa-terminal',
    getContent() {
        return `
            <div style="background: #000; color: #00ff00; padding: 15px; font-family: monospace; font-size: 13px; height: 100%;">
                <div style="margin-bottom: 10px;">$ terminal emulator</div>
                <div>user@system:~$ </div>
            </div>
        `;
    }
};

Apps.browser = {
    title: 'Browser',
    icon: 'fa-solid fa-globe',
    getContent() {
        return `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="background: #f0f0f0; padding: 10px; border-bottom: 1px solid #ddd;">
                    <input type="text" placeholder="Enter URL..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 3px;">
                </div>
                <div style="flex: 1; padding: 20px; overflow: auto;">
                    <h2 style="color: #333; margin-bottom: 10px;">Welcome to Browser</h2>
                    <p style="color: #666;">Type a URL to navigate</p>
                </div>
            </div>
        `;
    }
};

Apps.calculator = {
    title: 'Calculator',
    icon: 'fa-solid fa-calculator',
    getContent() {
        return `
            <div style="display: flex; flex-direction: column; height: 100%; gap: 10px;">
                <input type="text" class="calc-display" readonly value="0">
                <div class="calculator-grid">
                    <button class="calc-btn clear">AC</button>
                    <button class="calc-btn operator">/</button>
                    <button class="calc-btn operator">×</button>
                    <button class="calc-btn">7</button>
                    <button class="calc-btn">8</button>
                    <button class="calc-btn">9</button>
                    <button class="calc-btn operator">−</button>
                    <button class="calc-btn">4</button>
                    <button class="calc-btn">5</button>
                    <button class="calc-btn">6</button>
                    <button class="calc-btn operator">+</button>
                    <button class="calc-btn">1</button>
                    <button class="calc-btn">2</button>
                    <button class="calc-btn">3</button>
                    <button class="calc-btn operator">.</button>
                    <button class="calc-btn" style="grid-column: span 2;">0</button>
                    <button class="calc-btn equals">=</button>
                </div>
            </div>
        `;
    }
};
