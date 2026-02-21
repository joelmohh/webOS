# webOS

webOS is a browser-based desktop-style interface built with plain HTML, CSS, and JavaScript.

## Requirements

- A modern browser (Chrome, Edge, Firefox, Safari)
- A local static server

## Run locally

### Option 1: Python

```bash
cd src
npx serve -l 5500
```

Then open:

`http://localhost:5500`

### Option 2: Open the file directly

- Open `src/index.html` directly in your browser.
- This may work for basic UI checks, but some features can be limited without a local server.

### Option 3: VS Code Five Server extension

- Open `src/index.html`
- Start Five Server from VS Code
- Open the local URL shown by the extension

## Basic usage

- Click an icon in the dock to open an app window.
- Drag windows by the top bar and resize from the bottom-right corner.
- Use Task Manager to monitor running apps and force close them.
- Use Browser with tabs, favorites, and history.
- Use To-Do List with edit, filters, and clear completed.
- Use the bell icon to open Notification Center with search and category filters.

## Project structure

- `src/index.html`: main page
- `src/css/style.css`: styles
- `src/js/main.js`: app bootstrap
- `src/js/apps.js`: app registry and app definitions
- `src/js/modules/`: feature modules (window manager, browser, notifications, etc.)
