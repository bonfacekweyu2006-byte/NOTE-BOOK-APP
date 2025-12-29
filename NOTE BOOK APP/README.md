# Notebook Pro — Electron build

This workspace contains a single-page Notebook web app. The following files were added to run it as a desktop app via Electron.

Quick start (developer machine):

1. Install dependencies:

```bash
npm install
```

2. Run the app:

```bash
npm start
```

3. Build distributables (requires `electron-builder`):

```bash
npm run build
```

Notes:
- `main.js` is the Electron main process that loads `INDEX.HTML` from the repo root.
- A native application menu and a tray icon are created by `main.js`.
- A single-instance lock prevents multiple running instances; second instances focus the open window.
- There's an optional auto-update stub using `electron-updater` — it will run if `electron-updater` is installed and properly configured with a release server.
- The UI still uses the local `APP.JS`, `STYLE.CSS`, and assets — no bundling is required for development.
- If you see CSP or Node integration needs, adjust `webPreferences` in `main.js`. For security, `contextIsolation` is enabled.

Preferences & updates:
- The app adds a `Preferences` menu (or press `CmdOrCtrl+,`) which opens a small preferences window (`settings.html`) where overlay settings may be changed.
- The tray icon prefers `assets/icons/logo.png` if present; otherwise it falls back to `assets/icons/logo.svg`.
- When an update is downloaded (using `electron-updater`), a dialog will prompt the user to "Install and Restart" or "Later"; choosing install will call the updater to quit and install.

Configuring auto-updates (electron-updater):

- For GitHub releases: set `build.publish` in `package.json` to use GitHub and ensure the `repository` field is set, then create releases and upload assets. Example in `package.json`:

```json
"build": {
	"publish": [{ "provider": "github" }]
}
```

- For a custom update server: configure `publish` accordingly and host release artifacts and a latest.yml file.
- See the `electron-updater` docs for platform-specific details (code signing for macOS/Windows).

Security note: auto-updates require build configuration and signed packages for production; the app currently includes a safe stub that no-ops if `electron-updater` is not installed/configured.
