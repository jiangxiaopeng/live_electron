import * as obs from 'obs-studio-node';
import { v4 as uuid_v4 } from 'uuid';
import path from 'path';
import electron, { BrowserWindow} from 'electron';
import {
  displayInfo,
  getAuth,
  getCameraSource,
  initOBSError,
  setOBSSettings,
} from './obs_utils';
import { byOS, getOS, OS } from './operating_systems';
import { IInput, IScene, ISceneItem, ISettings } from 'obs-studio-node';
import { getDevices } from './obs_hardware';
import { kObsDisabled } from '../store';

let obsInitialized = false;
let scene: IScene | null = null;
let nodeWindowRendering: any;
let obsCameraInput: IInput | null = null;
let obsAudioInput: IInput | null = null;
let obsVideoOuput: IInput | null = null;
let desktopSceneItem: ISceneItem | null = null;
let obsVideoOuputSetting: ISettings | null = null;
let cameraSceneItem: ISceneItem | null = null;
// let obsCameraOuputSetting: ISettings | null = null;
let streamingUrl: string;
let isPushStreaming: boolean = false;

let previewWidth = 640;
let previewHeight = 360;
let outputWidth = 1280;

let isCameraPush: boolean = false;
let isDesktopPush: boolean = false;

if (getOS() === OS.Mac) {
  nodeWindowRendering = require('node-window-rendering');
}

export function initialize(url: string) {
  if (obsInitialized) {
    console.warn('OBS is already initialized, skipping initialization.');
    return;
  }
  streamingUrl = url;
  initOBS();
  configureOBS(streamingUrl);
  setupScene();
  setupSources();
  obsInitialized = true;
}

function initOBS() {
  obs.IPC.host(`slobs-${uuid_v4()}`);
  obs.NodeObs.SetWorkingDirectory(
    path.join(
      electron.app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
      'node_modules',
      'obs-studio-node'
    )
  );

  const initResult: number = obs.NodeObs.OBS_API_initAPI(
    'en-US',
    path.join(__dirname, '../../../obs-data'),
    '1.0.0'
  );

  if (initResult !== 0) {
    const errorMessage = initOBSError(initResult);
    console.error('errorMessage', errorMessage);
    shutdown();
    throw Error(errorMessage);
  }
}

//销毁obs
export function shutdown() {
  if (!obsInitialized) {
    return false;
  }
  if (isPushStreaming) {
    stopPushStream();
  }
  if (cameraSceneItem) {
    cameraSceneItem.remove();
    cameraSceneItem = null;
  }
  if (obsCameraInput) {
    obsCameraInput.release();
    obsCameraInput.remove();
    obsCameraInput = null;
  }
  if (obsAudioInput) {
    obsAudioInput.release();
    obsAudioInput.remove();
    obsAudioInput = null;
  }
  if (obsVideoOuput) {
    obsVideoOuput.release();
    obsVideoOuput.remove();
    obsVideoOuput = null;
  }
  if (desktopSceneItem) {
    desktopSceneItem.remove();
    desktopSceneItem = null;
  }
  if (scene) {
    scene.release();
    scene.remove();
    scene = null;
  }
  isDesktopPush = false;
  isCameraPush = false;
  // @ts-ignore
  obs.Global.setOutputSource(1, null);
  // @ts-ignore
  obs.Global.setOutputSource(3, null);

 
  destroyOBSCameraPreview();
  try {
    obs.NodeObs.InitShutdownSequence();
    obs.NodeObs.RemoveSourceCallback();
    obs.NodeObs.OBS_service_removeCallback();
    obs.NodeObs.IPC.disconnect();
    obsInitialized = false;
  } catch (e) {
    throw Error('Exception when shutting down OBS process' + e);
  }
  return true;
}

function configureOBS(url: string) {
  setOBSSettings('Output', 'Mode', 'Simple');
  setOBSSettings('Output', 'VBitrate', '3000'); // 10 Mbps
  setOBSSettings('Video', 'FPSCommon', '30');

  const { server = '' } = getAuth(url);
  const { key = '' } = getAuth(url);

  setOBSSettings('Stream', 'server', server);
  setOBSSettings('Stream', 'key', key);

  const { aspectRatio } = displayInfo();
  const outputHeight = Math.round(outputWidth / aspectRatio);
  setOBSSettings('Video', 'Base', `${outputWidth}x${outputHeight}`);
  setOBSSettings('Video', 'Output', `${outputWidth}x${outputHeight}`);
}

//桌面videooutput source
function getVideoOuput() {
  const { physicalWidth, physicalHeight } = displayInfo();
  let obsVideoOuput = obs.InputFactory.create(
    byOS({ [OS.Windows]: 'monitor_capture', [OS.Mac]: 'display_capture' }),
    'desktop-video'
  );
  obsVideoOuputSetting = obsVideoOuput.settings;
  obsVideoOuputSetting['width'] = physicalWidth;
  obsVideoOuputSetting['height'] = physicalHeight;
  obsVideoOuput.update(obsVideoOuputSetting);
  obsVideoOuput.save();
  return obsVideoOuput;
}

//移除桌面场景
export function removeDesktopScene() {
  if (desktopSceneItem) {
    desktopSceneItem.remove();
    isDesktopPush = false;
  }
  if (isCameraPush) {
    setCameraScene();
  }
}

//设置桌面场景
export function setupDesktopScene() {
  const { physicalWidth } = displayInfo();
  const videoScaleFactor = physicalWidth / outputWidth;
  if (!obsVideoOuput) {
    obsVideoOuput = getVideoOuput();
  }
  if (desktopSceneItem) {
    desktopSceneItem.remove();
  }
  if (!scene) {
    return;
  }
  desktopSceneItem = scene.add(obsVideoOuput);
  desktopSceneItem.scale = { x: 1.0 / videoScaleFactor, y: 1.0 / videoScaleFactor };
  isDesktopPush = true;
  if (isCameraPush == true && obsCameraInput) {
    if (cameraSceneItem) {
      cameraSceneItem.remove();
    }
    cameraSceneItem = scene.add(obsCameraInput);
    const videoScaleFactor = physicalWidth / outputWidth;
    const scale = 1/8 * videoScaleFactor
    cameraSceneItem.scale = { x: scale , y: scale };
    cameraSceneItem.position = {
      x: outputWidth - outputWidth/4,
      y: 0,
    };
    isCameraPush = true;
  }
}

//移除摄像头
export function removeCameraScene() {
  if (obsCameraInput) {
    obsCameraInput.release();
    obsCameraInput.remove();
    obsCameraInput = null;
  }
  if (cameraSceneItem) {
    cameraSceneItem.remove();
    isCameraPush = false;
  }
}

//设置摄像头
function setCameraScene() {
  if (!scene) {return;}
  if (!obsCameraInput) {
    const { dshowDevices } = getDevices();
    if (dshowDevices.length === 0) {
      console.log('No camera found!!');
      return;
    }
    const cameraDevice = dshowDevices[0];
    obsCameraInput = getCameraSource(cameraDevice.id);
  }
  if (cameraSceneItem) {
    cameraSceneItem.remove();
    cameraSceneItem = null;
  }
  cameraSceneItem = scene.add(obsCameraInput);
  const { physicalWidth } = displayInfo();
  const videoScaleFactor = physicalWidth / outputWidth;
  // console.log('isDesktopPush',isDesktopPush);
  if (isDesktopPush == false)  {
    if (getOS() == OS.Windows) {
      cameraSceneItem.scale = { x: 1.0 * videoScaleFactor , y: 1.0 * videoScaleFactor };
    }
  } else {
    const scale = 1/8 * videoScaleFactor
    cameraSceneItem.scale = { x: scale , y: scale };
    cameraSceneItem.position = {
      x: outputWidth - outputWidth/4,
      y: 0,
    };
  }
  isCameraPush = true;
  return obsCameraInput.name
}

function setupScene() {
  scene = obs.SceneFactory.create('desktop-scene');
  // setCameraScene();
}

export function switchAudioInputDevice(value: any) {
  obsAudioInput?.remove();
  if (value != kObsDisabled) {
    obsAudioInput = obs.InputFactory.create(
      byOS({
        [OS.Windows]: 'wasapi_input_capture',
        [OS.Mac]: 'coreaudio_input_capture',
      }),
      'mic-audio',
      { device_id: value }
    );
    obs.Global.setOutputSource(3, obsAudioInput);
  }
}

function setupSources() {
  if (!scene) {
    return;
  }
  obs.Global.setOutputSource(1, scene);
  const { devices } = getDevices();
  if (devices.length == 0) {
    return;
  }
  const audioDeviceID = devices[0].id;
  obsAudioInput = obs.InputFactory.create(
    byOS({
      [OS.Windows]: 'wasapi_input_capture',
      [OS.Mac]: 'coreaudio_input_capture',
    }),
    'mic-audio',
    { device_id: audioDeviceID }
  );
  obs.Global.setOutputSource(3, obsAudioInput);
}

//开始推流
export function startPushStream(url: string) {
  if (!obsInitialized) initialize(url);
  obs.NodeObs.OBS_service_startStreaming();
  isPushStreaming = true;
}

//停止推流
export function stopPushStream() {
  obs.NodeObs.OBS_service_stopStreaming(false);
  isPushStreaming = false;
}

const cameraSouceId = 'pxgj_cameraSouceId';

let cameraWindow: BrowserWindow | null = null;

function createCameraWindow(icon: string) {
  let cameraWindow = new BrowserWindow({
    width: previewWidth,
    height: previewHeight,
    resizable: false,
    alwaysOnTop: true,
    movable: true,
    icon: icon,
    title: 'live_electron',
    x: 0,
    y: 0,
    useContentSize:true,
    webPreferences: {
      nodeIntegration: true
    },
    hasShadow: false,
    autoHideMenuBar: true,
    closable: false,
  });
  cameraWindow.on('move',() => {
    // console.log(cameraWindow.getPosition());
    const x = cameraWindow.getPosition()[0]
    const y = cameraWindow.getPosition()[1]
    if (isDesktopPush == true) {
      const { physicalWidth } = displayInfo();
      const videoScaleFactor = physicalWidth / outputWidth;
      if (!cameraSceneItem) {
        return;
      }
      cameraSceneItem.position = {
        x: x/videoScaleFactor,
        y: y/videoScaleFactor,
      };
    }
  });
  return cameraWindow
}

let existingWindow = false
//销毁摄像头窗口
function destroyOBSCameraPreview() {
  // cameraWindow?.hide();
  if (obsCameraInput) {
    obsCameraInput.release();
    obsCameraInput.remove();
    obsCameraInput = null;
  }

  if (cameraWindow) {
    cameraWindow.closable = true;
    cameraWindow.close();
    cameraWindow = null;
  }

  if (getOS() === OS.Mac) {
    if (existingWindow) {
      nodeWindowRendering.destroyWindow(cameraSouceId);
      nodeWindowRendering.destroyIOSurface(cameraSouceId);
    }
  }
  obs.NodeObs.OBS_content_destroyDisplay(cameraSouceId);
}

//显示摄像头预览窗口
export function setupOBSCameraPreview(icon: string) {
  const { width } = displayInfo();
  if (!cameraWindow) {
    cameraWindow = createCameraWindow(icon);
    cameraWindow.setPosition(width-previewWidth,0);
  } else {
    cameraWindow.show();
  }

  setCameraScene();
  
  obs.NodeObs.OBS_content_createSourcePreviewDisplay(
    cameraWindow.getNativeWindowHandle(),
    scene?.name,
    cameraSouceId
  );
  obs.NodeObs.OBS_content_setShouldDrawUI(cameraSouceId, false);
  obs.NodeObs.OBS_content_setPaddingSize(cameraSouceId, 0);
  obs.NodeObs.OBS_content_setPaddingColor(cameraSouceId, 0, 0, 0, 0);

  resizePreview(cameraWindow);
}

function resizePreview(cameraWindow: BrowserWindow) {
  const { scaleFactor } = displayInfo();
  const x = 0;
  const y = 0;

  let scale = getOS() == OS.Mac ? 1 : scaleFactor;

  obs.NodeObs.OBS_content_resizeDisplay(
    cameraSouceId,
    previewWidth * scale,
    previewHeight * scale
  );

  if (getOS() === OS.Mac) {
    if (existingWindow) {
      nodeWindowRendering.destroyWindow(cameraSouceId);
      nodeWindowRendering.destroyIOSurface(cameraSouceId);
    }
    const surface = obs.NodeObs.OBS_content_createIOSurface(cameraSouceId);
    nodeWindowRendering.createWindow(
      cameraSouceId,
      cameraWindow.getNativeWindowHandle()
    );
    nodeWindowRendering.connectIOSurface(cameraSouceId, surface);
    nodeWindowRendering.moveWindow(cameraSouceId, x, y);
    existingWindow = true;
  } else {
    obs.NodeObs.OBS_content_moveDisplay(cameraSouceId, x * scale, y * scale);
  }
}

export function test() {

}
