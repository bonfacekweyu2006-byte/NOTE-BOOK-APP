# Copilot instructions for Notebook Pro

This repository is a minimal single-page Notebook app (vanilla HTML/CSS/JS). The goal of this file is to give AI coding agents enough local context to be immediately productive.

Summary
- Architecture: Single-page app. UI is in `INDEX.HTML`, styles in `STYLE.CSS`, behaviour in `APP.JS`.
- Data flow: `notes` is an in-memory array persisted to `localStorage` under the key `notes`.
- No build system, packages, or tests are present. Run by opening `INDEX.HTML` in a browser.

Key patterns & conventions
- DOM-first code: `APP.JS` accesses elements by id (`notes`, `search`, `title`, `content`, `category`, `toggleTheme`). Modify elements directly.
- File naming: source files use uppercase filenames (`APP.JS`, `STYLE.CSS`, `INDEX.HTML`). Keep that casing when editing or linking.
- Persistence: updates call `save()` to write `localStorage.setItem('notes', JSON.stringify(notes))` and `render()` to refresh UI.
- UI update: `render(filter)` rebuilds `#notes` by filtering `notes` and creating DOM nodes. Avoid adding virtual DOM frameworks.
- Theme: toggling `document.body.classList.toggle('dark')` switches CSS variables in `STYLE.CSS`.

Practical examples (from the codebase)
- Add note: `addNote()` reads `#title`, `#content`, `#category`, `notes.unshift(...)`, then `save()` and `render()`.
- Edit note: `editNote(index)` uses `prompt()` to edit title/content and persists via `save()` + `render()`.
- Search: `#search` input listener calls `render(searchInput.value)` to filter in-place.

Developer workflows & debugging
- Run: open `INDEX.HTML` in a browser or use a local static server (e.g., VS Code Live Server). No npm or build steps.
- Inspect state: open browser devtools -> Console. `notes` is available only inside `APP.JS`; evaluate `JSON.parse(localStorage.getItem('notes'))` to inspect persistent data.
- Quick test: add/edit/delete notes via the UI and verify changes persist after reload.

When editing code
- Preserve the simple, DOM-manipulation style — prefer minimal, focused changes over adding libraries.
- If you change persistence (e.g., switching to a backend), update README and ensure fallback to `localStorage` for offline use.
- Keep element ids stable. If renaming an id, update every occurrence in `INDEX.HTML` and `APP.JS` together.

What not to do
- Do not assume a build toolchain, transpilation, or package manager.
- Do not introduce frameworks (React/Vue) without an explicit user request — this is intentionally minimal.

Files to inspect for context
- [INDEX.HTML](INDEX.HTML)
- [APP.JS](APP.JS)
- [STYLE.CSS](STYLE.CSS)

If anything here is unclear or you'd like the agent to follow a stricter convention (tests, formatter, build), please state it and I'll update this guidance.
