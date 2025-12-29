const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');

let tray = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the local INDEX.HTML
  win.loadFile(path.join(__dirname, 'INDEX.HTML'));

  // Open devtools when in development (uncomment to enable)
  // win.webContents.openDevTools();

  // Build a simple native menu
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Preferences', accelerator: 'CmdOrCtrl+,', click: () => createSettingsWindow() },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'About Notebook Pro',
              message: 'Notebook Pro — Desktop',
              detail: 'A minimal notebook app packaged with Electron.'
            });
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Settings / Preferences window
let settingsWin = null;
function createSettingsWindow() {
  if (settingsWin) {
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 480,
    height: 320,
    resizable: false,
    parent: BrowserWindow.getAllWindows()[0] || undefined,
    modal: false,
    webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  });
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

function createTray() {
  try {
    // prefer a PNG icon if available (better cross-platform support); fall back to SVG
    let iconPath = path.join(__dirname, 'assets', 'icons', 'logo.png');
    const fs = require('fs');
    // If PNG missing but SVG exists, generate a PNG from the SVG at runtime
    if (!fs.existsSync(iconPath)) {
      const svgPath = path.join(__dirname, 'assets', 'icons', 'logo.svg');
      if (fs.existsSync(svgPath)) {
        try {
          const { nativeImage } = require('electron');
          const svgBuf = fs.readFileSync(svgPath);
          const img = nativeImage.createFromBuffer(svgBuf);
          const pngBuf = img.toPNG();
          // ensure directory exists
          try { fs.mkdirSync(path.dirname(iconPath), { recursive: true }); } catch (e) {}
          fs.writeFileSync(iconPath, pngBuf);
        } catch (e) {
          // generation failed, fall back to svg
          iconPath = svgPath;
        }
      } else {
        // no SVG either — fall back to a bundled default if available
        iconPath = svgPath; // will likely not exist, handled by Tray
      }
    }
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show', click: () => { const wins = BrowserWindow.getAllWindows(); if (wins && wins[0]) wins[0].show(); } },
      { label: 'Hide', click: () => { const wins = BrowserWindow.getAllWindows(); if (wins && wins[0]) wins[0].hide(); } },
      { type: 'separator' },
      { label: 'Quit', role: 'quit' }
    ]);
    tray.setToolTip('Notebook Pro');
    tray.setContextMenu(contextMenu);
  } catch (e) {
    console.warn('Tray not available:', e && e.message);
  }
}

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins && wins[0]) {
      if (wins[0].isMinimized()) wins[0].restore();
      wins[0].focus();
    }
  });

  app.whenReady().then(() => {
    // set AppUserModelID for Windows notifications and taskbar grouping
    try { app.setAppUserModelId('com.example.notebookpro'); } catch (e) {}
    createWindow();
    createTray();

    // Auto-update stub: try to use electron-updater if available
    try {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.checkForUpdatesAndNotify();
      autoUpdater.on('update-available', () => {
        console.log('Update available');
      });
      autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded');
        // ask user to install now
        const { dialog } = require('electron');
        const wins = BrowserWindow.getAllWindows();
        const parent = (wins && wins[0]) ? wins[0] : null;
        dialog.showMessageBox(parent, {
          type: 'info',
          buttons: ['Install and Restart', 'Later'],
          defaultId: 0,
          cancelId: 1,
          title: 'Update Ready',
          message: 'A new version was downloaded. Install and restart now?'
        }).then(res => {
          if (res.response === 0) {
            try { autoUpdater.quitAndInstall(); } catch (e) { console.error('quitAndInstall failed', e); }
          }
        }).catch(() => {});
      });
    } catch (e) {
      console.log('electron-updater not available or not configured (skipping auto-update)');
    }
  });

  // IPC handlers for auto-start
  const { ipcMain } = require('electron');
  ipcMain.handle('set-auto-start', async (evt, enabled) => {
    try {
      app.setLoginItemSettings({ openAtLogin: !!enabled });
      return { success: true };
    } catch (e) { return { success: false, error: e && e.message }; }
  });

  ipcMain.handle('get-auto-start', async () => {
    try {
      const settings = app.getLoginItemSettings();
      return { openAtLogin: !!settings.openAtLogin };
    } catch (e) { return { openAtLogin: false }; }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
