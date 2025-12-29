let notes = JSON.parse(localStorage.getItem("notes")) || [];
const notesDiv = document.getElementById("notes");
const searchInput = document.getElementById("search");
let editingIndex = null;
const contentDiv = document.getElementById('content');
const tagsInput = document.getElementById('tags');
const folderSelect = document.getElementById('folder');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const filterFolderSelect = document.getElementById('filterFolder');
// IndexedDB for attachments
const DB_NAME = 'notebook-db';
const DB_VERSION = 1;
let _dbPromise = null;
function openDb() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('attachments')) {
                db.createObjectStore('attachments', { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return _dbPromise;
}

async function putAttachmentBlob(blob, name, type) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('attachments', 'readwrite');
        const store = tx.objectStore('attachments');
        const item = { blob, name, type };
        const rq = store.add(item);
        rq.onsuccess = () => resolve(rq.result);
        rq.onerror = () => reject(rq.error);
    });
}

async function getAttachmentBlob(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('attachments', 'readonly');
        const store = tx.objectStore('attachments');
        const rq = store.get(Number(id));
        rq.onsuccess = () => resolve(rq.result ? rq.result.blob : null);
        rq.onerror = () => reject(rq.error);
    });
}

async function deleteAttachment(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('attachments', 'readwrite');
        const store = tx.objectStore('attachments');
        const rq = store.delete(Number(id));
        rq.onsuccess = () => resolve();
        rq.onerror = () => reject(rq.error);
    });
}
// Theme inputs
const bgInput = document.getElementById("bgColor");
const cardInput = document.getElementById("cardColor");
const accentInput = document.getElementById("accentColor");
const textInput = document.getElementById("textColor");
const saveThemeBtn = document.getElementById("saveTheme");
const resetThemeBtn = document.getElementById("resetTheme");

// Save
function save() {
    localStorage.setItem("notes", JSON.stringify(notes));
}

// Render
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').toString();
}

function render(filter = "") {
    notesDiv.innerHTML = "";
    const q = (filter || (searchInput && searchInput.value) || '').toLowerCase();
    const folderFilter = (filterFolderSelect && filterFolderSelect.value) || 'all';

    notes
        .filter(n => {
            if (folderFilter !== 'all' && n.folder !== folderFilter) return false;
            const contentText = stripHtml(n.content).toLowerCase();
            const tagsText = (n.tags || []).join(' ').toLowerCase();
            return n.title.toLowerCase().includes(q) || contentText.includes(q) || tagsText.includes(q);
        })
        .forEach((note, index) => {

        const div = document.createElement("div");
        div.className = "note";

        const tagsHtml = (note.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ');

        div.innerHTML = `
            <h3>${note.title}</h3>
            <div class="note-content">${note.content}</div>
            <div class="meta">
                <small>${note.category} • ${note.folder} • ${note.date}</small>
                <div class="note-tags">${tagsHtml}</div>
            </div>
            <div class="note-actions">
                <button onclick="editNote(${index})"><img src="assets/icons/edit.svg" class="icon" alt="Edit"> Edit</button>
                <button onclick="deleteNote(${index})"><img src="assets/icons/delete.svg" class="icon" alt="Delete"> Delete</button>
            </div>
        `;
        notesDiv.appendChild(div);
    });
}

// Add
function clearForm() {
    document.getElementById('title').value = '';
    if (contentDiv) contentDiv.innerHTML = '';
    if (tagsInput) tagsInput.value = '';
    if (folderSelect) folderSelect.selectedIndex = 0;
    if (saveNoteBtn) saveNoteBtn.innerHTML = '<img src="assets/icons/add.svg" alt="add" class="icon"> Add Note';
    editingIndex = null;
}

function addNote() {
    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const content = (contentDiv && contentDiv.innerHTML.trim()) || '';
    const folder = (folderSelect && folderSelect.value) || 'Inbox';
    const tags = (tagsInput && tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)) || [];

    if (!title || !stripHtml(content).trim()) {
        alert("Title and content required");
        return;
    }

    const noteObj = {
        title,
        content,
        category,
        folder,
        tags,
        date: new Date().toLocaleString()
    };

    if (editingIndex === null) {
        notes.unshift(noteObj);
    } else {
        noteObj.date = notes[editingIndex].date; // preserve original date
        notes[editingIndex] = noteObj;
        editingIndex = null;
    }

    save();
    render();
    clearForm();
}

// Delete
function deleteNote(index) {
    if (!confirm('Delete this note?')) return;
    notes.splice(index, 1);
    save();
    render(searchInput.value);
}

// Edit
function editNote(index) {
    const n = notes[index];
    if (!n) return;
    document.getElementById('title').value = n.title;
    if (contentDiv) contentDiv.innerHTML = n.content;
    if (tagsInput) tagsInput.value = (n.tags || []).join(', ');
    if (folderSelect) folderSelect.value = n.folder || 'Inbox';
    document.getElementById('category').value = n.category || 'General';
    if (saveNoteBtn) saveNoteBtn.innerHTML = '<img src="assets/icons/add.svg" alt="add" class="icon"> Save Changes';
    editingIndex = index;
}

// Search
searchInput.addEventListener("input", () => {
    render(searchInput.value);
});

// Theme init will run after DOM ready
function initThemeControls() {
    try {
        const toggleThemeBtn = document.getElementById("toggleTheme");
        const toggleThemeIcon = toggleThemeBtn?.querySelector('img');
        if (toggleThemeBtn) {
            toggleThemeBtn.onclick = () => {
                const isDark = document.body.classList.toggle("dark");
                if (isDark) {
                    applyPreset('dark', true);
                    if (toggleThemeIcon) toggleThemeIcon.src = 'assets/icons/sun.svg';
                } else {
                    applyPreset('light', true);
                    if (toggleThemeIcon) toggleThemeIcon.src = 'assets/icons/moon.svg';
                }
            };
        }

        // wire color inputs to preview (re-read elements in case DOM changed)
        const bgInput = document.getElementById("bgColor");
        const cardInput = document.getElementById("cardColor");
        const accentInput = document.getElementById("accentColor");
        const textInput = document.getElementById("textColor");
        const saveThemeBtn = document.getElementById("saveTheme");
        const resetThemeBtn = document.getElementById("resetTheme");

        if (bgInput) bgInput.addEventListener('input', () => applyTheme(readInputsToTheme()));
        if (cardInput) cardInput.addEventListener('input', () => applyTheme(readInputsToTheme()));
        if (accentInput) accentInput.addEventListener('input', () => applyTheme(readInputsToTheme()));
        if (textInput) textInput.addEventListener('input', () => applyTheme(readInputsToTheme()));

        if (saveThemeBtn) saveThemeBtn.addEventListener('click', () => { saveTheme(); alert('Theme saved'); });
        if (resetThemeBtn) resetThemeBtn.addEventListener('click', () => { localStorage.removeItem('theme'); applyTheme(defaultTheme); themeToInputs(defaultTheme); });

        // wire presets
        const presetLightBtn = document.getElementById('presetLight');
        const presetDarkBtn = document.getElementById('presetDark');
        const presetSolarBtn = document.getElementById('presetSolar');
        if (presetLightBtn) presetLightBtn.addEventListener('click', () => applyPreset('light', true));
        if (presetDarkBtn) presetDarkBtn.addEventListener('click', () => applyPreset('dark', true));
        if (presetSolarBtn) presetSolarBtn.addEventListener('click', () => applyPreset('solar', true));

        // Load theme (re-run to pick up saved theme)
        loadTheme();
    } catch (err) {
        console.error('initThemeControls error', err);
        logDebug('initThemeControls error: ' + err.message);
    }
}

// Ensure theme controls initialize after DOM ready
if (document.readyState !== 'loading') {
    initThemeControls();
} else {
    document.addEventListener('DOMContentLoaded', initThemeControls);
}

// Debug log helper
function logDebug(msg){
    try{
        const el = document.getElementById('debugLog');
        if (!el) return;
        const time = new Date().toLocaleTimeString();
        el.innerText = time + ' — ' + msg + '\n' + el.innerText;
    }catch(e){/* ignore */}
}

// Theme handling
const defaultTheme = {
    bg: '#f4f6f8',
    card: '#ffffff',
    text: '#000000',
    accent: '#007bff'
};

function applyTheme(t) {
    if (!t) return;
    const root = document.documentElement;
    try {
        root.style.setProperty('--bg', t.bg);
        root.style.setProperty('--card', t.card);
        root.style.setProperty('--text', t.text);
        root.style.setProperty('--accent', t.accent);
        console.log('applyTheme:', t);
        logDebug('applyTheme: ' + JSON.stringify(t));
        // If theme contains a background choice, apply it
        if (t.bgImage) {
            try { setBackgroundImage(t.bgImage); } catch (e) {}
        }
    } catch (e) {
        console.error('applyTheme error', e, t);
        logDebug('applyTheme error: ' + e.message);
    }
    try { setOverlayColorAuto(); } catch(e){}
}

// choose overlay color (dark or light) based on `--text` luminance
function setOverlayColorAuto() {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const text = (cs.getPropertyValue('--text') || '#000').trim();
    const m = text.match(/^#?([0-9a-f]{6})$/i);
    let r = 0, g = 0, b = 0;
    if (m) {
        const hex = m[1];
        r = parseInt(hex.substring(0,2),16);
        g = parseInt(hex.substring(2,4),16);
        b = parseInt(hex.substring(4,6),16);
    }
    const lum = (0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255));
    const useDark = lum > 0.6;
    const rgb = useDark ? '0,0,0' : '255,255,255';
    try { root.style.setProperty('--bg-overlay-rgb', rgb); } catch(e){}
}

function themeToInputs(t) {
    if (!t) return;
    if (bgInput) bgInput.value = t.bg;
    if (cardInput) cardInput.value = t.card;
    if (accentInput) accentInput.value = t.accent;
    if (textInput) textInput.value = t.text;
}

function readInputsToTheme() {
    return {
        bg: bgInput?.value || defaultTheme.bg,
        card: cardInput?.value || defaultTheme.card,
        accent: accentInput?.value || defaultTheme.accent,
        text: textInput?.value || defaultTheme.text
    };
}

function saveTheme() {
    const theme = readInputsToTheme();
        // include background choice in the saved theme
        const bgChoice = localStorage.getItem('bgImageChoice') || null;
        if (bgChoice) theme.bgImage = bgChoice;
        localStorage.setItem('theme', JSON.stringify(theme));
}

function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        try {
            const t = JSON.parse(saved);
            applyTheme(t);
            themeToInputs(t);
            return;
        } catch (e) {
            console.warn('Invalid saved theme');
        }
    }
    applyTheme(defaultTheme);
    themeToInputs(defaultTheme);
}

// Input preview handlers
if (bgInput) bgInput.addEventListener('input', () => applyTheme(readInputsToTheme()));
if (cardInput) cardInput.addEventListener('input', () => applyTheme(readInputsToTheme()));
if (accentInput) accentInput.addEventListener('input', () => applyTheme(readInputsToTheme()));
if (textInput) textInput.addEventListener('input', () => applyTheme(readInputsToTheme()));

if (saveThemeBtn) saveThemeBtn.addEventListener('click', () => { saveTheme(); alert('Theme saved'); });
if (resetThemeBtn) resetThemeBtn.addEventListener('click', () => { localStorage.removeItem('theme'); applyTheme(defaultTheme); themeToInputs(defaultTheme); });

// Load theme on init
loadTheme();

// Preset themes
const presets = {
    light: {
        bg: '#f4f6f8',
        card: '#ffffff',
        text: '#000000',
        accent: '#007bff'
    },
    dark: {
        bg: '#121212',
        card: '#1e1e1e',
        text: '#ffffff',
        accent: '#66b2ff'
    },
    solar: {
        bg: '#fdf6e3',
        card: '#eee8d5',
        text: '#586e75',
        accent: '#b58900'
    }
};

function applyPreset(name, save = false) {
    const p = presets[name];
    if (!p) return;
    try {
        applyTheme(p);
        themeToInputs(p);
        console.log('applyPreset:', name);
        logDebug('applyPreset: ' + name);
    } catch (e) { console.error('applyPreset error', e); }
    if (save) {
        localStorage.setItem('theme', JSON.stringify(p));
        localStorage.setItem('themePreset', name);
    }
}

// Wire preset buttons (if present)
const presetLightBtn = document.getElementById('presetLight');
const presetDarkBtn = document.getElementById('presetDark');
const presetSolarBtn = document.getElementById('presetSolar');
if (presetLightBtn) presetLightBtn.addEventListener('click', () => applyPreset('light'));
if (presetDarkBtn) presetDarkBtn.addEventListener('click', () => applyPreset('dark'));
if (presetSolarBtn) presetSolarBtn.addEventListener('click', () => applyPreset('solar'));

// Background image buttons
const bgNoneBtn = document.getElementById('bgNone');
const bgPic1Btn = document.getElementById('bgPic1');
const bgPic2Btn = document.getElementById('bgPic2');
const bgPic3Btn = document.getElementById('bgPic3');

// Example background images (public unsplash URLs)
const BG_IMAGES = {
    none: 'none',
    pic1: 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1600&q=60',
    pic2: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=60',
    pic3: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1600&q=60'
};

function setBackgroundImage(keyOrUrl) {
    const root = document.documentElement;
    let val = 'none';
    if (!keyOrUrl) keyOrUrl = 'none';
    // handle built-in presets
    if (BG_IMAGES[keyOrUrl]) {
        val = (BG_IMAGES[keyOrUrl] === 'none') ? 'none' : `url("${BG_IMAGES[keyOrUrl]}")`;
        localStorage.setItem('bgImageChoice', keyOrUrl);
        try { root.style.setProperty('--bg-image', val); } catch (e) {}
        updateBgActiveButtons(keyOrUrl);
        return;
    }

    // handle uploaded attachments stored in IndexedDB (saved as 'bg-attach-<id>')
    if (String(keyOrUrl).startsWith('bg-attach-')) {
        const id = Number(String(keyOrUrl).split('-').pop());
        if (!isNaN(id)) {
            getAttachmentBlob(id).then(blob => {
                if (!blob) return;
                // revoke any previous object URL for this id
                revokeBgObjectUrlForId(id);
                const objUrl = URL.createObjectURL(blob);
                try { root.style.setProperty('--bg-image', `url("${objUrl}")`); } catch(e){}
                // cache with timestamp
                _bgObjectUrlMap.set(id, { url: objUrl, lastUsed: Date.now() });
                localStorage.setItem('bgImageChoice', `bg-attach-${id}`);
                updateBgActiveButtons(`bg-attach-${id}`);
            }).catch(() => {});
        }
        return;
    }

    // handle direct URL
    if (/^https?:\/\//.test(keyOrUrl)) {
        val = `url("${keyOrUrl}")`;
        try { root.style.setProperty('--bg-image', val); } catch (e) {}
        localStorage.setItem('bgImageChoice', keyOrUrl);
        updateBgActiveButtons(keyOrUrl);
        return;
    }
}

if (bgNoneBtn) bgNoneBtn.addEventListener('click', () => setBackgroundImage('none'));
if (bgPic1Btn) bgPic1Btn.addEventListener('click', () => setBackgroundImage('pic1'));
if (bgPic2Btn) bgPic2Btn.addEventListener('click', () => setBackgroundImage('pic2'));
if (bgPic3Btn) bgPic3Btn.addEventListener('click', () => setBackgroundImage('pic3'));

// custom background URL controls
const bgCustomUrl = document.getElementById('bgCustomUrl');
const bgCustomSet = document.getElementById('bgCustomSet');
const bgCustomClear = document.getElementById('bgCustomClear');

if (bgCustomSet && bgCustomUrl) {
    bgCustomSet.addEventListener('click', () => {
        const url = (bgCustomUrl.value || '').trim();
        if (!url) return alert('Enter an image URL');
        setBackgroundImage(url);
        updateBgActiveButtons(url);
    });
}

if (bgCustomClear) {
    bgCustomClear.addEventListener('click', () => {
        localStorage.removeItem('bgImageChoice');
        setBackgroundImage('none');
        if (bgCustomUrl) bgCustomUrl.value = '';
    });
}

// Background upload handler (store image in IndexedDB and set as background)
const bgUpload = document.getElementById('bgUpload');
if (bgUpload) {
    bgUpload.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        // store in attachments DB and mark as background with a special key
        putAttachmentBlob(f, f.name, f.type).then(id => {
            // set as background using the attachment id
            setBackgroundImage('bg-attach-' + id);
            // clear the input
            e.target.value = '';
            // remember in bgUploads list for gallery
            try {
                const arr = JSON.parse(localStorage.getItem('bgUploads') || '[]');
                arr.unshift(id);
                localStorage.setItem('bgUploads', JSON.stringify(arr));
                listBackgroundGallery();
            } catch (e) {}
        }).catch(err => { console.error('bg upload failed', err); alert('Background upload failed'); });
    });
}

// On init, restore background choice
function loadBackgroundChoice() {
    const saved = localStorage.getItem('bgImageChoice');
    if (!saved) return;
    setBackgroundImage(saved);
}

// Map of attachment-id -> { url, lastUsed } for background blobs so we can revoke when needed
const _bgObjectUrlMap = new Map();

function revokeBgObjectUrlForId(id) {
    try {
        const existing = _bgObjectUrlMap.get(id);
        if (existing) {
            const url = existing.url || existing;
            try { URL.revokeObjectURL(url); } catch(e){}
            _bgObjectUrlMap.delete(id);
        }
    } catch (e) {}
}

// Periodic cleanup to avoid leaking too many object URLs
function cleanupBgObjectUrls() {
    try {
        const now = Date.now();
        const TTL = 10 * 60 * 1000; // 10 minutes
        const MAX_ENTRIES = 20;

        // Revoke entries older than TTL
        for (const [id, info] of Array.from(_bgObjectUrlMap.entries())) {
            if (!info || !info.lastUsed) continue;
            if ((now - info.lastUsed) > TTL) {
                revokeBgObjectUrlForId(id);
            }
        }

        // If still too many, revoke oldest until under MAX_ENTRIES
        if (_bgObjectUrlMap.size > MAX_ENTRIES) {
            const entries = Array.from(_bgObjectUrlMap.entries());
            entries.sort((a,b) => (a[1].lastUsed || 0) - (b[1].lastUsed || 0));
            const toRevoke = entries.slice(0, _bgObjectUrlMap.size - MAX_ENTRIES);
            toRevoke.forEach(([id]) => revokeBgObjectUrlForId(id));
        }
    } catch (e) { console.error('cleanupBgObjectUrls error', e); }
}

// run cleanup every 5 minutes
setInterval(cleanupBgObjectUrls, 5 * 60 * 1000);

// list gallery of uploaded backgrounds (ids saved in localStorage 'bgUploads')
async function listBackgroundGallery() {
    const listEl = document.getElementById('bgGalleryList');
    if (!listEl) return;
    listEl.innerHTML = '';
    const stored = JSON.parse(localStorage.getItem('bgUploads') || '[]');
    for (const id of stored) {
        try {
            const blob = await getAttachmentBlob(id);
            if (!blob) continue;
            const item = document.createElement('div');
            item.className = 'bg-gallery-item';
            const img = document.createElement('img');
            const objUrl = URL.createObjectURL(blob);
            // cache and revoke when replaced/deleted (store timestamp)
            revokeBgObjectUrlForId(id);
            _bgObjectUrlMap.set(id, { url: objUrl, lastUsed: Date.now() });
            img.src = objUrl;
            item.appendChild(img);
            const del = document.createElement('button');
            del.innerText = '×';
            del.title = 'Remove background';
            del.onclick = async () => {
                if (!confirm('Remove this uploaded background?')) return;
                try {
                    await deleteAttachment(id);
                } catch (e) {}
                // remove from stored list
                const arr = JSON.parse(localStorage.getItem('bgUploads') || '[]').filter(x => x !== id);
                localStorage.setItem('bgUploads', JSON.stringify(arr));
                // if currently selected, clear
                const current = localStorage.getItem('bgImageChoice');
                if (current === ('bg-attach-' + id)) {
                    localStorage.removeItem('bgImageChoice');
                    setBackgroundImage('none');
                }
                revokeBgObjectUrlForId(id);
                listBackgroundGallery();
            };
            item.appendChild(del);
            // clicking the thumbnail sets it as background
            item.onclick = () => setBackgroundImage('bg-attach-' + id);
            listEl.appendChild(item);
        } catch (e) { console.error('gallery load err', e); }
    }
}

function updateBgActiveButtons(savedChoice) {
    // clear all
    try {
        if (bgNoneBtn) bgNoneBtn.classList.remove('active');
        if (bgPic1Btn) bgPic1Btn.classList.remove('active');
        if (bgPic2Btn) bgPic2Btn.classList.remove('active');
        if (bgPic3Btn) bgPic3Btn.classList.remove('active');
    } catch(e){}

    if (!savedChoice) return;
    if (BG_IMAGES[savedChoice]) {
        if (savedChoice === 'none') { if (bgNoneBtn) bgNoneBtn.classList.add('active'); return; }
        if (savedChoice === 'pic1' && bgPic1Btn) bgPic1Btn.classList.add('active');
        if (savedChoice === 'pic2' && bgPic2Btn) bgPic2Btn.classList.add('active');
        if (savedChoice === 'pic3' && bgPic3Btn) bgPic3Btn.classList.add('active');
        return;
    }
    // if savedChoice is a URL, show it in the custom input (if present)
    if (bgCustomUrl && /^https?:\/\//.test(savedChoice)) {
        bgCustomUrl.value = savedChoice;
    }
}

loadBackgroundChoice();

// initialize gallery on load
listBackgroundGallery();

// Clear cached object URLs button
const bgClearCacheBtn = document.getElementById('bgClearCache');
if (bgClearCacheBtn) {
    bgClearCacheBtn.addEventListener('click', () => {
        let revoked = 0;
        try {
            for (const [id] of Array.from(_bgObjectUrlMap.entries())) {
                revokeBgObjectUrlForId(id);
                revoked++;
            }
        } catch (e) { console.error('clear cache error', e); }
        try { listBackgroundGallery(); } catch(e){}
        alert('Cleared ' + revoked + ' cached background object URL(s)');
    });
}

// Overlay controls: toggle and opacity
const bgOverlayToggle = document.getElementById('bgOverlayToggle');
const bgOverlayOpacity = document.getElementById('bgOverlayOpacity');

function applyOverlaySettings(enabled, opacityPercent) {
    const root = document.documentElement;
    const opacity = (Number(opacityPercent) || 35) / 100;
    try {
        root.style.setProperty('--bg-image-opacity', enabled ? opacity : 0);
    } catch (e) {}
}

// restore overlay state
function loadOverlayChoice() {
    const savedEnabled = localStorage.getItem('bgOverlayEnabled');
    const savedOpacity = localStorage.getItem('bgOverlayOpacity');
    const enabled = savedEnabled === '1' || savedEnabled === 'true';
    const opacity = savedOpacity !== null ? Number(savedOpacity) : 35;
    if (bgOverlayToggle) bgOverlayToggle.checked = !!enabled;
    if (bgOverlayOpacity) bgOverlayOpacity.value = opacity;
    applyOverlaySettings(enabled, opacity);
    try { setOverlayColorAuto(); } catch(e){}
}

if (bgOverlayToggle) bgOverlayToggle.addEventListener('change', (e) => {
    const en = !!e.target.checked;
    localStorage.setItem('bgOverlayEnabled', en ? '1' : '0');
    const op = bgOverlayOpacity ? bgOverlayOpacity.value : 35;
    applyOverlaySettings(en, op);
});

if (bgOverlayOpacity) bgOverlayOpacity.addEventListener('input', (e) => {
    const val = Number(e.target.value || 35);
    localStorage.setItem('bgOverlayOpacity', String(val));
    const en = bgOverlayToggle ? !!bgOverlayToggle.checked : true;
    applyOverlaySettings(en, val);
});

loadOverlayChoice();

// If a preset was selected earlier (and no custom theme saved), apply it
if (!localStorage.getItem('theme')) {
    const savedPreset = localStorage.getItem('themePreset');
    if (savedPreset && presets[savedPreset]) {
        applyPreset(savedPreset, false);
    }
}

// Init
render();

// Wire save button for add/edit
if (saveNoteBtn) saveNoteBtn.addEventListener('click', addNote);

// Wire folder filter change
if (filterFolderSelect) filterFolderSelect.addEventListener('change', () => render(searchInput.value));

// --- Web search helpers --------------------------------------------------
const webQueryInput = document.getElementById('webQuery');
const siteGoogleBtn = document.getElementById('siteGoogle');
const siteStackBtn = document.getElementById('siteStack');
const siteMDNBtn = document.getElementById('siteMDN');
const siteWikiBtn = document.getElementById('siteWiki');

// Attachments, checklist, reminders, export/import elements
const attachmentInput = document.getElementById('attachmentInput');
const attachmentList = document.getElementById('attachmentList');
const checkItemInput = document.getElementById('checkItemInput');
const addCheckItemBtn = document.getElementById('addCheckItem');
const checklistItems = document.getElementById('checklistItems');
const reminderInput = document.getElementById('reminder');
const exportAllBtn = document.getElementById('exportAll');
const exportMDBtn = document.getElementById('exportMD');
const importJsonInput = document.getElementById('importJson');

// Helper: render attachments for current editing note previews
function renderAttachmentPreviews(attachments = []) {
    if (!attachmentList) return;
    attachmentList.innerHTML = '';
    attachments.forEach((a, i) => {
        const item = document.createElement('div');
        item.className = 'attach-item';
        let thumb;
        if (a.type && a.type.startsWith('image/')) {
            thumb = document.createElement('img');
            thumb.src = a.data;
            thumb.className = 'attach-thumb';
        } else {
            thumb = document.createElement('div');
            thumb.className = 'attach-thumb';
            thumb.textContent = a.name || 'file';
            thumb.style.display = 'flex';
            thumb.style.alignItems = 'center';
            thumb.style.justifyContent = 'center';
        }
        const remove = document.createElement('button');
        remove.className = 'attach-remove';
        remove.innerHTML = '×';
        remove.onclick = () => {
            // remove from current editing attachments (held in a temp var)
            if (editingIndex === null) {
                // new note previews stored temporarily on window._newAttachments
                window._newAttachments = window._newAttachments || [];
                window._newAttachments.splice(i, 1);
                renderAttachmentPreviews(window._newAttachments);
            } else {
                notes[editingIndex].attachments = notes[editingIndex].attachments || [];
                notes[editingIndex].attachments.splice(i, 1);
                renderAttachmentPreviews(notes[editingIndex].attachments);
                save();
                render();
            }
        };
        item.appendChild(thumb);
        item.appendChild(remove);
        attachmentList.appendChild(item);
    });
}

// When uploading files, read as dataURL and attach to the new/editing note
if (attachmentInput) {
    attachmentInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            // store blob in IndexedDB and push metadata
            putAttachmentBlob(file, file.name, file.type).then(id => {
                const attach = { id, name: file.name, type: file.type };
                if (editingIndex === null) {
                    window._newAttachments = window._newAttachments || [];
                    window._newAttachments.push(attach);
                    renderAttachmentPreviews(window._newAttachments);
                } else {
                    notes[editingIndex].attachments = notes[editingIndex].attachments || [];
                    notes[editingIndex].attachments.push(attach);
                    renderAttachmentPreviews(notes[editingIndex].attachments);
                    save();
                    render();
                }
            }).catch(err => { console.error('attach store failed', err); });
        });
        // clear input
        e.target.value = '';
    });
}

// Checklist handlers (temporary list for new notes in window._newChecklist)
function renderChecklistPreview(items = []) {
    if (!checklistItems) return;
    checklistItems.innerHTML = '';
    items.forEach((it, i) => {
        const row = document.createElement('div');
        row.className = 'checklist-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!it.checked;
        cb.onchange = () => { items[i].checked = cb.checked; };
        const span = document.createElement('span');
        span.textContent = it.text;
        const rem = document.createElement('button');
        rem.textContent = '×';
        rem.onclick = () => { items.splice(i,1); renderChecklistPreview(items); };
        row.appendChild(cb);
        row.appendChild(span);
        row.appendChild(rem);
        checklistItems.appendChild(row);
    });
}

// Populate attachments, checklist and reminder UI when editing a note
async function populateExtensionsForNote(index) {
    const n = notes[index];
    if (!n) return;

    // Prepare attachments preview array (copy so we don't mutate stored objects)
    const at = (n.attachments || []).map(a => Object.assign({}, a));

    // For image attachments that only have an id, load blob and convert to dataURL
    at.forEach((a) => {
        if (a.id && !a.data && a.type && a.type.startsWith('image/')) {
            // async load and refresh preview when ready
            getAttachmentBlob(a.id).then(blob => {
                if (!blob) return;
                const r = new FileReader();
                r.onload = () => {
                    a.data = r.result;
                    renderAttachmentPreviews(at);
                };
                r.readAsDataURL(blob);
            }).catch(() => {});
        }
    });

    // Render current attachments (will update when images finish loading)
    renderAttachmentPreviews(at);


    // Checklist
    renderChecklistPreview(n.checklist || []);

    // Reminder
    if (reminderInput) reminderInput.value = n.reminder || '';

    // Ensure any temporary new-* state is cleared while editing
    window._newAttachments = null;
    window._newChecklist = null;
    window._newReminder = '';
}


if (addCheckItemBtn && checkItemInput) {
    addCheckItemBtn.addEventListener('click', () => {
        const text = checkItemInput.value.trim();
        if (!text) return;
        if (editingIndex === null) {
            window._newChecklist = window._newChecklist || [];
            window._newChecklist.push({ text, checked: false });
            renderChecklistPreview(window._newChecklist);
        } else {
            notes[editingIndex].checklist = notes[editingIndex].checklist || [];
            notes[editingIndex].checklist.push({ text, checked: false });
            renderChecklistPreview(notes[editingIndex].checklist);
            save();
            render();
        }
        checkItemInput.value = '';
    });
}

// Reminder handling: store datetime-local string in note.reminder; background check every minute
if (reminderInput) {
    reminderInput.addEventListener('change', () => {
        if (editingIndex === null) {
            window._newReminder = reminderInput.value;
        } else {
            notes[editingIndex].reminder = reminderInput.value;
            notes[editingIndex].reminded = false;
            save();
            render();
        }
    });
}

// Simple background reminder checker
setInterval(() => {
    const now = new Date();
    notes.forEach((n, i) => {
        if (n.reminder && !n.reminded) {
            const when = new Date(n.reminder);
            if (!isNaN(when) && when <= now) {
                // notify briefly
                try {
                    // show Notification if permitted
                    if (window.Notification && Notification.permission === 'granted') {
                        new Notification('Reminder', { body: n.title || 'Untitled' });
                    } else {
                        alert('Reminder: ' + (n.title || 'Untitled'));
                    }
                } catch (e) {}
                n.reminded = true;
                save();
                render();
            }
        }
    });
}, 60*1000);

// Export/Import handlers
function download(filename, text) {
    const blob = new Blob([text], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

if (exportAllBtn) exportAllBtn.addEventListener('click', () => {
    // export notes including attachment data URLs (may be large)
    (async function(){
        const out = JSON.parse(JSON.stringify(notes));
        for (let i=0;i<out.length;i++){
            const n = out[i];
            if (n.attachments && n.attachments.length){
                const arr = [];
                for (const a of n.attachments){
                    if (a.data) { arr.push(a); continue; }
                    if (a.id) {
                        try {
                            const blob = await getAttachmentBlob(a.id);
                            if (blob) {
                                const dataUrl = await new Promise((res) => {
                                    const r = new FileReader();
                                    r.onload = () => res(r.result);
                                    r.readAsDataURL(blob);
                                });
                                arr.push({ name: a.name, type: a.type, data: dataUrl });
                            }
                        } catch (e) { }
                    }
                }
                n.attachments = arr;
            }
        }
        const data = JSON.stringify(out, null, 2);
        download('notes-backup.json', data);
    })();
});

if (exportMDBtn) exportMDBtn.addEventListener('click', () => {
    // export currently edited note or first selected
    const n = (editingIndex !== null) ? notes[editingIndex] : notes[0];
    if (!n) return alert('No note to export');
    // simple HTML to markdown (very small conversion)
    const contentText = stripHtml(n.content).replace(/\u00A0/g, ' ');
    const checklistMd = (n.checklist || []).map(it => `- [${it.checked ? 'x' : ' '}] ${it.text}`).join('\n');
    const tagsLine = (n.tags || []).map(t => `#${t}`).join(' ');
    const md = `# ${n.title}\n\n${contentText}\n\n${checklistMd}\n\n${tagsLine}`;
    download(`${n.title.replace(/[^a-z0-9]/gi,'_') || 'note'}.md`, md);
});

if (importJsonInput) importJsonInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target.result);
            if (Array.isArray(imported)) {
                notes = imported.concat(notes);
                save();
                render();
                alert('Imported ' + imported.length + ' notes');
            } else {
                alert('Invalid import format');
            }
        } catch (err) { alert('Import failed: ' + err.message); }
    };
    r.readAsText(f);
    e.target.value = '';
});

// override existing editNote definition: find index and call populateExtensionsForNote
function editNote(index) {
    const n = notes[index];
    if (!n) return;
    document.getElementById('title').value = n.title;
    if (contentDiv) contentDiv.innerHTML = n.content;
    if (tagsInput) tagsInput.value = (n.tags || []).join(', ');
    if (folderSelect) folderSelect.value = n.folder || 'Inbox';
    document.getElementById('category').value = n.category || 'General';
    if (saveNoteBtn) saveNoteBtn.innerHTML = '<img src="assets/icons/add.svg" alt="add" class="icon"> Save Changes';
    editingIndex = index;
    populateExtensionsForNote(index);
}

// when adding a note, include temporary attachments/checklist/reminder
const _origAddNote = addNote;
function addNote() {
    // gather temp attachments/checklist/reminder if creating new
    const tempAttachments = window._newAttachments || [];
    const tempChecklist = window._newChecklist || [];
    const tempReminder = window._newReminder || '';
    // call original logic (which was replaced earlier) but we reimplement here
    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const content = (contentDiv && contentDiv.innerHTML.trim()) || '';
    const folder = (folderSelect && folderSelect.value) || 'Inbox';
    const tags = (tagsInput && tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)) || [];

    if (!title || !stripHtml(content).trim()) {
        alert("Title and content required");
        return;
    }

    const noteObj = {
        title,
        content,
        category,
        folder,
        tags,
        date: new Date().toLocaleString(),
        attachments: (editingIndex === null) ? tempAttachments : (notes[editingIndex].attachments || []),
        checklist: (editingIndex === null) ? tempChecklist : (notes[editingIndex].checklist || []),
        reminder: (editingIndex === null) ? tempReminder : (notes[editingIndex].reminder || '')
    };

    if (editingIndex === null) {
        notes.unshift(noteObj);
    } else {
        noteObj.date = notes[editingIndex].date;
        notes[editingIndex] = noteObj;
        editingIndex = null;
    }

    save();
    render();
    clearForm();
}

// ensure save button wired (in case file loaded earlier)
if (saveNoteBtn) saveNoteBtn.removeEventListener('click', _origAddNote);
if (saveNoteBtn) saveNoteBtn.addEventListener('click', addNote);

// Register service worker and request notification permission
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

// Request notification permission once (non-blocking)
if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission().then(() => {});
}

function getWebQuery() {
    const sel = window.getSelection().toString().trim();
    if (sel) return sel;
    return (webQueryInput && webQueryInput.value.trim()) || '';
}

function openSearch(url) {
    if (!url) return;
    window.open(url, '_blank');
}

if (siteGoogleBtn) siteGoogleBtn.addEventListener('click', () => {
    const q = encodeURIComponent(getWebQuery());
    if (!q) return alert('Enter or select text to search');
    openSearch(`https://www.google.com/search?q=${q}`);
});

if (siteStackBtn) siteStackBtn.addEventListener('click', () => {
    const q = encodeURIComponent(getWebQuery());
    if (!q) return alert('Enter or select text to search');
    openSearch(`https://stackoverflow.com/search?q=${q}`);
});

if (siteMDNBtn) siteMDNBtn.addEventListener('click', () => {
    const q = encodeURIComponent(getWebQuery());
    if (!q) return alert('Enter or select text to search');
    openSearch(`https://developer.mozilla.org/en-US/search?q=${q}`);
});

if (siteWikiBtn) siteWikiBtn.addEventListener('click', () => {
    const q = encodeURIComponent(getWebQuery());
    if (!q) return alert('Enter or select text to search');
    openSearch(`https://en.wikipedia.org/wiki/Special:Search?search=${q}`);
});

// Allow Enter in webQuery to trigger Google search
if (webQueryInput) {
    webQueryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const q = encodeURIComponent(getWebQuery());
            if (!q) return;
            openSearch(`https://www.google.com/search?q=${q}`);
        }
    });
}
