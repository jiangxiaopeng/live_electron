/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import {
  initialize,
  removeCameraScene,
  removeDesktopScene,
  setupDesktopScene,
  setupOBSCameraPreview,
  shutdown,
  startPushStream,
  stopPushStream,
  switchAudioInputDevice,
  test,
} from './utils/obs/obs_service';
import { getWindows } from './utils/obs/obs_utils';
import { getDevices } from './utils/obs/obs_hardware';
import {
  kObsAudioDevice,
  kObsDisabled,
  kObsScreenShareValue,
  kObsWindowDevice,
  setItem,
} from './utils/store';
import { getOS, OS } from './utils/obs/operating_systems';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
// let cameraWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

app.setAboutPanelOptions({
  iconPath: getAssetPath('icon.png'),
  applicationName: "live_electron", 
  applicationVersion: "版本：",
  version: "v1.0.0",
  copyright: "copy.com"
});

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1366,
    height: 768,
    minHeight: 768,
    resizable: false,
    icon: getAssetPath('icon.png'),
    autoHideMenuBar: getOS() == OS.Windows ? true : false,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    shutdown();
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);
app.setPath('userData', path.join(app.getPath('appData'), 'slobs-client'));
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// OBS
ipcMain.handle('obs-destroy', (_) => {
  shutdown();
});

let streamingUrl: string | null = null;
let isStreaming: boolean = false;
ipcMain.handle('obs-init', (_, url) => {
  streamingUrl = url;
  if (!streamingUrl) {
    return;
  }
  initialize(streamingUrl);
});

ipcMain.handle('obs-show-camerawindow', (_) => {
  setupOBSCameraPreview(getAssetPath('icon.png'));
});

ipcMain.handle('obs-input-devices', (_) => {
  const { devices, dshowDevices } = getDevices();
  mainWindow?.webContents.send(
    'obs-input-devices-reply',
    devices,
    dshowDevices
  );
});

//摄像头
ipcMain.handle('obs-open-camera-window', (_) => {
  setupOBSCameraPreview(getAssetPath('icon.png'));
});

ipcMain.handle('obs-close-camera-window', (_) => {
  removeCameraScene();
});

//麦克风
ipcMain.handle('obs-open-audio-input-device', (_, value) => {
  let deviceId = value;
  if (!deviceId) {
    const { devices } = getDevices();
    if (devices.length == 0) {
      return;
    }
    deviceId = devices[0].id;
  }
  switchAudioInputDevice(deviceId);
  setItem(kObsAudioDevice, deviceId);
});

ipcMain.handle('obs-close-audio-input-device', (_) => {
  switchAudioInputDevice(kObsDisabled);
  setItem(kObsAudioDevice, kObsDisabled);
});

ipcMain.handle('obs-capture-windows', (_) => {
  mainWindow?.webContents.send('obs-capture-windows-reply', getWindows());
});

ipcMain.handle('obs-open-desktop-streaming', (_) => {
  setupDesktopScene();
});

ipcMain.handle('obs-close-desktop-streaming', (_) => {
  removeDesktopScene();
});

//开始推流
ipcMain.handle('obs-start-streaming', (_) => {
  if (!streamingUrl) {
    return;
  }
  startPushStream(streamingUrl);
  setItem(kObsWindowDevice, kObsScreenShareValue);
  isStreaming = true;
});

//结束推流
ipcMain.handle('obs-stop-streaming', (_) => {
  stopPushStream();
  setItem(kObsWindowDevice, kObsDisabled);
  isStreaming = false;
  // swtichShareWindow(kObsScreenShareValue);
});

//推流窗口
ipcMain.handle('obs-switch-capture-window', (_, value) => {
  if (value == kObsDisabled) {
    stopPushStream();
    setItem(kObsWindowDevice, kObsDisabled);
    isStreaming = false;
  } else {
    // swtichShareWindow(value);
    setItem(kObsWindowDevice, value);
    if (isStreaming == false) {
      if (!streamingUrl) {
        return;
      }
      startPushStream(streamingUrl);
      isStreaming = true;
    }
  }
});

ipcMain.handle('obs-test', (_) => {
  test();
});

// ipcMain.handle('obs-switch-preview-show', (_,isShow) => {
//   if (cameraWindow) {
//     if (isShow.current == true) {
//       cameraWindow.show()
//     } else {
//       cameraWindow.hide()
//     }
//   }
// });
