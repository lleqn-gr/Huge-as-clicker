/* Muskelklicker – Windows-App
   Startet das Spiel aus den mitgelieferten Dateien (komplett offline).
   Updates: schaut beim Start bei GitHub nach und lädt neue Versionen im Hintergrund.
   Ist ein Update fertig, fragt das Spiel EINMAL: „Jetzt neu starten“ → Spiel speichert, schließt sich,
   installiert still und öffnet sich von allein wieder. „Später“ → wird beim Schließen still installiert.
   Ohne Internet passiert einfach nichts. */
const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let updater = null;          // electron-updater, sobald geladen
let ready = null;            // Version, die fertig heruntergeladen ist
let installing = false;      // läuft gerade der Neustart fürs Update?
let quitting = false;

/* Kleine Merkdatei: welche Version wurde schon angekündigt / installiert */
const stFile = () => path.join(app.getPath('userData'), 'update-state.json');
const readSt = () => { try { return JSON.parse(fs.readFileSync(stFile(), 'utf8')) || {}; } catch (e) { return {}; } };
const writeSt = o => { try { fs.writeFileSync(stFile(), JSON.stringify(o)); } catch (e) {} };

/* Nur ein Spiel gleichzeitig. Direkt nach einem Update kann die alte App noch ein paar
   Sekunden beim Beenden sein – dann kurz warten statt sich sofort wieder zu schließen. */
function getLock(tries, done) {
  if (app.requestSingleInstanceLock()) return done();
  if (tries <= 0) return app.quit();
  setTimeout(() => getLock(tries - 1, done), 800);
}
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 360, minHeight: 560,
    backgroundColor: '#ffd23f', title: 'Muskelklicker', show: false,
    icon: path.join(__dirname, 'app', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  /* Versionsnummer ans Spiel geben (wird oben rechts klein angezeigt) */
  win.loadFile(path.join(__dirname, 'app', 'index.html'), { query: { v: app.getVersion() } });
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
  /* Nach einem Update: kurze Bestätigung im Spiel statt einer erneuten Frage */
  win.webContents.on('did-finish-load', () => {
    const st = readSt();
    if (st.pending && st.pending === app.getVersion()) {
      writeSt({});
      setTimeout(() => toGame(`try{MK.UI.toast('Update ${app.getVersion()} installiert ✓','big')}catch(e){}`), 2500);
    }
  });
  win.on('closed', () => { win = null; });
}

const toGame = js => (win && !win.isDestroyed() ? win.webContents.executeJavaScript(js).catch(() => {}) : Promise.resolve());
/* Spielstand sichern – höchstens 1,5 Sekunden warten */
const saveGame = () => Promise.race([toGame('try{MK.save()}catch(e){}'), new Promise(r => setTimeout(r, 1500))]);

/* Update installieren. restart = Spiel danach von allein wieder öffnen */
function install(restart) {
  if (installing || !updater) return;
  installing = true;
  writeSt({ pending: ready });
  saveGame().then(() => {
    setImmediate(() => {
      app.removeAllListeners('window-all-closed');
      app.removeAllListeners('before-quit');
      BrowserWindow.getAllWindows().forEach(w => { w.removeAllListeners('close'); w.destroy(); });
      try { app.releaseSingleInstanceLock(); } catch (e) {}
      updater.quitAndInstall(true, restart); // still installieren (keine Fenster vom Installer)
    });
  });
}

function setupUpdates() {
  if (!app.isPackaged) return;
  try { updater = require('electron-updater').autoUpdater; } catch (e) { return; }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = false; // das Installieren beim Schließen machen wir selbst (sicherer, s. before-quit)
  updater.on('error', () => {}); /* kein Internet o. Ä. – Spiel läuft normal weiter */
  updater.on('update-downloaded', info => {
    const v = info && info.version;
    if (!v || ready === v) return; // pro Version nur einmal melden
    ready = v;
    if (!win) return;
    const st = readSt();
    if (st.asked === v) { // schon einmal gefragt (z. B. „Später“ gewählt) → nicht nochmal fragen, beim Schließen installieren
      toGame(`try{MK.UI.toast('Update ${v} wird beim Schließen installiert')}catch(e){}`);
      return;
    }
    writeSt(Object.assign(st, { asked: v }));
    dialog.showMessageBox(win, {
      type: 'info', title: 'Update bereit',
      message: 'Neue Version ' + v + ' ist da',
      detail: 'Das Spiel schließt sich kurz und öffnet sich von allein wieder. Dein Spielstand bleibt erhalten.\n„Später“: Das Update wird beim nächsten Schließen installiert.',
      buttons: ['Jetzt neu starten', 'Später'], defaultId: 0, cancelId: 1
    }).then(r => { if (r.response === 0) install(true); });
  });
  const check = () => { if (!ready && !installing) updater.checkForUpdates().catch(() => {}); };
  setTimeout(check, 4000);
  setInterval(check, 2 * 60 * 60 * 1000);
}

getLock(6, () => {
  app.whenReady().then(() => { createWindow(); setupUpdates(); });
  app.on('before-quit', e => {
    if (installing) return;
    if (ready && updater) { e.preventDefault(); install(false); return; } // Update beim Schließen still installieren
    if (!quitting && win && !win.isDestroyed()) { e.preventDefault(); quitting = true; saveGame().then(() => app.quit()); }
  });
  app.on('window-all-closed', () => app.quit());
});
