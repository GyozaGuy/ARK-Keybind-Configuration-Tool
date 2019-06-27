const {app, BrowserWindow, ipcMain: ipc, protocol, shell} = require('electron');
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');
const joinPath = require('path').join;
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
    backgroudColor: '#0d1120',
    height,
    show: false,
    title: 'ARK Keybind Configuration Tool',
    webPreferences: {
      nodeIntegration: true,
      plugins: true
    },
    width
  });

  mainWindowState.manage(win);

  win.loadFile(`${__dirname}/src/index.html`);

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
      joinPath(__dirname, req.url.replace('es6://', '')),
      (_e, b) => cb({mimeType: 'text/javascript', data: b})
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

ipc.on('load-config', (event, configPath) => {
  // Try to find the directory containing "Input.ini"
  const defaultLocations = {
    linux: '',
    win32: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ARK\\ShooterGame\\Saved\\Config\\WindowsNoEditor\\Input.ini'
  };

  try {
    const data = fs.readFileSync(configPath || defaultLocations[process.platform], 'utf8');
    const actionMappingSectionStart = data.match(/(\[\/Script\/Engine\.InputSettings\])/gi)[0];
    const actionMappings = data.match(/(^ActionMappings.*$)/gmi);

    if (actionMappingSectionStart && actionMappings) {
      const actionMappingRegex = /ActionName="(\w+)",Key=(.*),bShift=(\w+),bCtrl=(\w+),bAlt=(\w+),bCmd=(\w+)/i;
      // Parse actionMappings and send to renderer
      event.returnValue = actionMappings.map(am => {
        const [, action, key, shift, ctrl, alt, cmd] = am.match(actionMappingRegex);
        return {
          action,
          key,
          shift: shift === 'True',
          ctrl: ctrl === 'True',
          alt: alt === 'True',
          cmd: cmd === 'True'
        };
      });
    } else {
      event.returnValue = new Error('No config found');
    }
  } catch (err) {
    event.returnValue = new Error('No config found');
  }
});
