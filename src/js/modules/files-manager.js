const FilesManager = {
    getContent() {
        return `
            <div class="files-app">
                <div class="files-sidebar">
                    <div class="files-toolbar">
                        <button class="files-btn" data-role="import-btn" type="button">
                            <i class="fa-solid fa-file-import"></i>
                            Import files
                        </button>
                        <input class="files-input" data-role="file-input" type="file" multiple>
                    </div>

                    <div class="files-section">
                        <h3>Saved notes</h3>
                        <div class="files-list" data-role="notes-list"></div>
                    </div>

                    <div class="files-section">
                        <h3>Imported files</h3>
                        <div class="files-list" data-role="imports-list"></div>
                    </div>
                </div>

                <div class="files-preview" data-role="preview">
                    <div class="files-empty">Select a file to preview.</div>
                </div>
            </div>
        `;
    },

    init(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        const importBtn = windowEl.querySelector('[data-role="import-btn"]');
        const fileInput = windowEl.querySelector('[data-role="file-input"]');
        const notesList = windowEl.querySelector('[data-role="notes-list"]');
        const importsList = windowEl.querySelector('[data-role="imports-list"]');
        const previewEl = windowEl.querySelector('[data-role="preview"]');

        if (!importBtn || !fileInput || !notesList || !importsList || !previewEl) return;

        const importedFiles = new Map();

        const formatSize = (size) => {
            if (size < 1024) return `${size} B`;
            if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
            return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        };

        const clearPreview = () => {
            previewEl.innerHTML = '<div class="files-empty">Select a file to preview.</div>';
        };

        const renderTextPreview = (title, subtitle, content) => {
            previewEl.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'files-preview-header';
            header.innerHTML = `<h2>${title}</h2><span>${subtitle}</span>`;

            const body = document.createElement('pre');
            body.className = 'files-preview-text';
            body.textContent = content;

            previewEl.appendChild(header);
            previewEl.appendChild(body);
        };

        const renderUnsupportedPreview = (title, subtitle, details) => {
            previewEl.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'files-preview-header';
            header.innerHTML = `<h2>${title}</h2><span>${subtitle}</span>`;

            const detailEl = document.createElement('div');
            detailEl.className = 'files-meta';
            detailEl.textContent = details;

            previewEl.appendChild(header);
            previewEl.appendChild(detailEl);
        };

        const createDownloadButton = (label, handler) => {
            const btn = document.createElement('button');
            btn.className = 'files-btn';
            btn.type = 'button';
            btn.textContent = label;
            btn.addEventListener('click', handler);
            return btn;
        };

        const renderNotePreview = (noteKey, title, content) => {
            previewEl.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'files-preview-header';
            header.innerHTML = `<h2>${title}</h2><span>Saved note</span>`;

            const actions = document.createElement('div');
            actions.className = 'files-preview-actions';
            actions.appendChild(createDownloadButton('Export .txt', () => {
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${title.replace(/\s+/g, '_')}.txt`;
                link.click();
                URL.revokeObjectURL(link.href);
                NotificationManager.notify({
                    title: 'Download complete',
                    message: `${link.download} was downloaded from Files.`,
                    type: 'success'
                });
            }));

            const body = document.createElement('pre');
            body.className = 'files-preview-text';
            body.textContent = content;

            previewEl.appendChild(header);
            previewEl.appendChild(actions);
            previewEl.appendChild(body);
        };

        const renderImportedPreview = (fileRecord) => {
            const file = fileRecord.file;
            const subtitle = `${file.type || 'Unknown type'} • ${formatSize(file.size)}`;

            if (file.type.startsWith('image/')) {
                previewEl.innerHTML = '';

                const header = document.createElement('div');
                header.className = 'files-preview-header';
                header.innerHTML = `<h2>${file.name}</h2><span>${subtitle}</span>`;

                const actions = document.createElement('div');
                actions.className = 'files-preview-actions';
                actions.appendChild(createDownloadButton('Download', () => {
                    const url = URL.createObjectURL(file);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    link.click();
                    URL.revokeObjectURL(url);
                    NotificationManager.notify({
                        title: 'Download complete',
                        message: `${file.name} download finished.`,
                        type: 'success'
                    });
                }));

                const image = document.createElement('img');
                image.className = 'files-preview-image';
                image.src = URL.createObjectURL(file);
                image.alt = file.name;
                image.onload = () => URL.revokeObjectURL(image.src);

                previewEl.appendChild(header);
                previewEl.appendChild(actions);
                previewEl.appendChild(image);
                return;
            }

            if (file.type.startsWith('text/') || /\.(txt|md|json|js|ts|css|html)$/i.test(file.name)) {
                const reader = new FileReader();
                reader.onload = () => {
                    renderTextPreview(file.name, subtitle, String(reader.result || ''));

                    const actions = document.createElement('div');
                    actions.className = 'files-preview-actions';
                    actions.appendChild(createDownloadButton('Download', () => {
                        const url = URL.createObjectURL(file);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = file.name;
                        link.click();
                        URL.revokeObjectURL(url);
                        NotificationManager.notify({
                            title: 'Download complete',
                            message: `${file.name} download finished.`,
                            type: 'success'
                        });
                    }));
                    previewEl.insertBefore(actions, previewEl.children[1]);
                };
                reader.readAsText(file);
                return;
            }

            renderUnsupportedPreview(file.name, subtitle, 'Preview is not available for this file type.');

            const actions = document.createElement('div');
            actions.className = 'files-preview-actions';
            actions.appendChild(createDownloadButton('Download', () => {
                const url = URL.createObjectURL(file);
                const link = document.createElement('a');
                link.href = url;
                link.download = file.name;
                link.click();
                URL.revokeObjectURL(url);
                NotificationManager.notify({
                    title: 'Download complete',
                    message: `${file.name} download finished.`,
                    type: 'success'
                });
            }));
            previewEl.appendChild(actions);
        };

        const createListItem = (iconClass, primary, secondary, onClick) => {
            const button = document.createElement('button');
            button.className = 'files-item';
            button.type = 'button';

            const icon = document.createElement('i');
            icon.className = iconClass;

            const textWrap = document.createElement('div');
            textWrap.className = 'files-item-text';

            const title = document.createElement('div');
            title.className = 'files-item-title';
            title.textContent = primary;

            const meta = document.createElement('div');
            meta.className = 'files-item-meta';
            meta.textContent = secondary;

            textWrap.appendChild(title);
            textWrap.appendChild(meta);

            button.appendChild(icon);
            button.appendChild(textWrap);
            button.addEventListener('click', onClick);

            return button;
        };

        const renderSavedNotes = () => {
            notesList.innerHTML = '';

            const noteKeys = Object.keys(localStorage).filter((key) => key.startsWith('joelmos.notepad.'));
            if (!noteKeys.length) {
                const empty = document.createElement('div');
                empty.className = 'files-list-empty';
                empty.textContent = 'No saved notes found.';
                notesList.appendChild(empty);
                return;
            }

            noteKeys.sort();
            noteKeys.forEach((noteKey) => {
                const content = localStorage.getItem(noteKey) || '';
                const rawName = noteKey.replace('joelmos.notepad.', '').replace(/_/g, ' ');
                const title = rawName ? `${rawName}.txt` : 'untitled.txt';
                const secondary = `${formatSize(new Blob([content]).size)} • Notepad`;

                notesList.appendChild(
                    createListItem('fa-solid fa-file-lines', title, secondary, () => {
                        renderNotePreview(noteKey, title, content);
                    })
                );
            });
        };

        const renderImportedFiles = () => {
            importsList.innerHTML = '';

            if (!importedFiles.size) {
                const empty = document.createElement('div');
                empty.className = 'files-list-empty';
                empty.textContent = 'No imported files in this session.';
                importsList.appendChild(empty);
                return;
            }

            const records = Array.from(importedFiles.values());
            records.sort((a, b) => b.createdAt - a.createdAt);

            records.forEach((record) => {
                const file = record.file;
                const iconClass = file.type.startsWith('image/')
                    ? 'fa-solid fa-file-image'
                    : file.type.startsWith('text/')
                        ? 'fa-solid fa-file-lines'
                        : 'fa-solid fa-file';

                importsList.appendChild(
                    createListItem(
                        iconClass,
                        file.name,
                        `${formatSize(file.size)} • ${file.type || 'Unknown type'}`,
                        () => renderImportedPreview(record)
                    )
                );
            });
        };

        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', () => {
            const files = Array.from(fileInput.files || []);
            files.forEach((file) => {
                const id = `${file.name}-${file.size}-${file.lastModified}`;
                importedFiles.set(id, {
                    id,
                    file,
                    createdAt: Date.now()
                });
            });

            fileInput.value = '';
            renderImportedFiles();

            if (files.length > 0) {
                NotificationManager.notify({
                    title: 'Import complete',
                    message: `${files.length} file${files.length > 1 ? 's' : ''} imported to Files.`,
                    type: 'info'
                });
            }
        });

        renderSavedNotes();
        renderImportedFiles();
        clearPreview();
    }
};
