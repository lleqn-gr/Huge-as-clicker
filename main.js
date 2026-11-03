/* Muskelklicker – Windows-App
   Startet das Spiel aus den mitgelieferten Dateien (komplett offline).
   Updates: schaut beim Start bei GitHub nach, lädt neue Versionen im Hintergrund
   und installiert sie beim Neustart. Ohne Internet passiert einfach nichts. */
const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');

let win = null;
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 360, minHeight: 560,
    backgroundColor: '#ffd23f', title: 'Muskelklicker', show: false,
    icon: path.join(__dirname, 'app', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  /* Links nach außen im normalen Browser öffnen */
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  /* F11 = Vollbild, F5 = neu laden, F12 = Entwicklerwerkzeuge */
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (i.key === 'F5') { win.reload(); e.preventDefault(); }
    if (i.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  win.on('closed', () => { win = null; });
}

function setupUpdates() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', () => {}); /* kein Internet o. Ä. – Spiel läuft normal weiter */
  autoUpdater.on('update-downloaded', info => {
    if (!win) return;
    dialog.showMessageBox(win, {
      type: 'info', title: 'Update bereit',
      message: 'Neue Version ' + info.version + ' ist da',
      detail: 'Jetzt neu starten? Dein Spielstand bleibt erhalten. Sonst wird das Update beim nächsten Schließen installiert.',
      buttons: ['Jetzt neu starten', 'Später'], defaultId: 0, cancelId: 1
    }).then(r => { if (r.response === 0) { if (win) win.webContents.executeJavaScript('try{MK.save()}catch(e){}').finally(() => autoUpdater.quitAndInstall(true, true)); else autoUpdater.quitAndInstall(true, true); } });
  });
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 4000);
  setInterval(check, 2 * 60 * 60 * 1000);
}

app.whenReady().then(() => { createWindow(); setupUpdates(); });
app.on('before-quit', () => { if (win) win.webContents.executeJavaScript('try{MK.save()}catch(e){}').catch(() => {}); });
app.on('window-all-closed', () => app.quit());
