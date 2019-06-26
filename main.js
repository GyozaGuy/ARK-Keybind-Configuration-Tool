const {app, BrowserWindow, protocol, shell} = require('electron');
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');
const pathJoin = require('path').join;
require('electron-reload')(__dirname);

protocol.registerStandardSchemes(['es6']);

let isQuitting = false;
let win;

function createWindow() {
  const mainWindowState = windowStateKeeper({
    defaultHeight: 700,
    defaultWidth: 1000
  });
  const {height, width} = mainWindowState;

  win = new BrowserWindow({
    height,
    show: false,
    title: 'Android Messages',
    webPreferences: {
      nodeIntegration: false,
      plugins: true
    },
    width
  });

  mainWindowState.manage(win);

  win.loadFile('index.html');

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', e => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    } else {
      win = null;
    }
  });

  // win.openDevTools();
}

const isSecondInstance = app.makeSingleInstance(() => {
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }

    win.show();
    win.focus();
  }
});

if (isSecondInstance) {
  app.quit();
}

app.on('activate', () => {
  if (!win) {
    createWindow();
  } else {
    win.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('ready', () => {
  // Add es6:// protocol for loading ES6 modules
  protocol.registerBufferProtocol('es6', (req, cb) => {
    fs.readFile(
      pathJoin(__dirname, req.url.replace('es6://', '')),
      (_e, b) => {cb({mimeType: 'text/javascript', data: b})}
    );
  });

  createWindow();

  const page = win.webContents;
  const debouncers = [];

  page.on('new-window', (e, url) => {
    e.preventDefault();

    if (!debouncers.includes(url)) {
      debouncers.push(url);
      shell.openExternal(url);

      setTimeout(() => {
        debouncers.splice(debouncers.indexOf(url), 1);
      }, 100);
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
