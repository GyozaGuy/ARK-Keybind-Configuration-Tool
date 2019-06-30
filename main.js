const {app, BrowserWindow, ipcMain: ipc, protocol, shell} = require('electron');
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');
const {dirname, join: joinPath} = require('path');
require('electron-reload')(__dirname);

protocol.registerStandardSchemes(['es6']);

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

ipc.on('backup-config', (_event, filename) => {
  backupConfig(filename);
});

ipc.on('load-config', (event, configPath) => {
  // Try to find the directory containing "Input.ini"
  const defaultLocations = {
    linux: '',
    win32: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ARK\\ShooterGame\\Saved\\Config\\WindowsNoEditor\\Input.ini'
  };

  try {
    const iniFile = configPath || defaultLocations[process.platform];
    const data = fs.readFileSync(iniFile, {encoding: 'utf8'});
    const actionMappingSectionStart = data.match(/(\[\/Script\/Engine\.InputSettings\])/i)[0];
    const actionMappings = data.match(/(^ActionMappings.*$)/gmi);

    if (actionMappingSectionStart && actionMappings) {
      // Backup file if a backup doesn't already exist
      const backupFilename = joinPath(dirname(iniFile), 'Input.ini.bak');

      if (!fs.existsSync(backupFilename)) {
        backupConfig(iniFile);
      }

      const actionMappingRegex = /ActionName="(\w+)",Key=(.*),bShift=(\w+),bCtrl=(\w+),bAlt=(\w+),bCmd=(\w+)/i;
      // Parse actionMappings and send to renderer
      event.returnValue = {
        actionMappings: actionMappings.map(am => {
          const [, action, key, shift, ctrl, alt, cmd] = am.match(actionMappingRegex);
          return {
            action,
            key,
            shift: shift === 'True',
            ctrl: ctrl === 'True',
            alt: alt === 'True',
            cmd: cmd === 'True'
          };
        }),
        filename: iniFile
      };
    } else {
      event.returnValue = new Error('No config found');
    }
  } catch (err) {
    event.returnValue = new Error('No config found');
  }
});

ipc.on('save-config', (event, {config, filename}) => {
  try {
    // Generate file contents
    const configString = config.reduce((acc, cur) => {
      const newEntry = `\nActionMappings=(ActionName="${cur.action}",Key=${cur.key},bShift=${cur.shift ? 'True' : 'False'},bCtrl=${cur.ctrl ? 'True' : 'False'},bAlt=${cur.alt ? 'True' : 'False'},bCmd=${cur.cmd ? 'True' : 'False'})`;
      return `${acc}${newEntry}`;
    }, '');

    // Get current file contents
    const currentConfig = fs.readFileSync(filename, {encoding: 'utf8'});

    // Replace file contents
    const newConfigLines = [];
    let foundConfigStart = false;

    currentConfig.split('\n').forEach(line => {
      if (!foundConfigStart) {
        newConfigLines.push(line);
      }

      if (/\[\/Script\/Engine\.InputSettings\]/i.test(line)) {
        foundConfigStart = true;
      }
    });

    const newConfig = `${newConfigLines.join('\n')}${configString}`;

    fs.writeFileSync(filename, newConfig, {encoding: 'utf8'});
    event.returnValue = 'success';
  } catch (err) {
    event.returnValue = 'error';
  }
});

function backupConfig(filename) {
  fs.copyFileSync(filename, joinPath(dirname(filename), `Input.ini.${Date.now()}bak`));
}
