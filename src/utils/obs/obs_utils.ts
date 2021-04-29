import * as obs from 'obs-studio-node';
import { getItem, kObsDisabled, kObsWindowDevice, setItem } from '../store';
import { byOS, OS } from './operating_systems';

export function setOBSSettings(category: string, parameter: string, value: string) {
  let oldValue;
  // Getting settings container
  const settings = obs.NodeObs.OBS_settings_getSettings(category).data;
  settings.forEach((subCategory: any) => {
    subCategory.parameters.forEach((param: any) => {
      if (param.name === parameter) {
        oldValue = param.currentValue;
        param.currentValue = value;
      }
    });
  });

  // Saving updated settings container
  if (value != oldValue) {
    obs.NodeObs.OBS_settings_saveSettings(category, settings);
  }
}

export function displayInfo() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const { scaleFactor } = primaryDisplay;
  return {
    width,
    height,
    scaleFactor:    scaleFactor,
    aspectRatio:    width / height,
    physicalWidth:  width * scaleFactor,
    physicalHeight: height * scaleFactor,
  }
}

export function initOBSError(initResult: number) {
  if (initResult == -2) {
    return "DirectX could not be found on your system. Please install the latest version of DirectX for your machine here <https://www.microsoft.com/en-us/download/details.aspx?id=35?> and try again.";
  } else if (initResult == -5) {
    return "Failed to initialize OBS. Your video drivers may be out of date, or Streamlabs OBS may not be supported on your system.";
  } else {
    return `An unknown error #${initResult} was encountered while initializing OBS.`
  }
}

export function getAvailableValues(category: string, subcategory: string, parameter: string) {
  const categorySettings = obs.NodeObs.OBS_settings_getSettings(category).data;
  if (!categorySettings) {
    console.warn(`There is no category ${category} in OBS settings`);
    return [];
  }

  const subcategorySettings = categorySettings.find( (sub: any) => sub.nameSubCategory === subcategory);
  if (!subcategorySettings) {
    console.warn(`There is no subcategory ${subcategory} for OBS settings category ${category}`);
    return [];
  }

  const parameterSettings = subcategorySettings.parameters.find((param: any) => param.name === parameter);
  if (!parameterSettings) {
    console.warn(`There is no parameter ${parameter} for OBS settings category ${category}.${subcategory}`);
    return [];
  }

  return parameterSettings.values.map( (value: any) => Object.values(value)[0]);
}

export const getAuth = (authUrl: string) => {
  let urlArray = authUrl.split('?',2)
  let serverArray = Array.isArray(urlArray) ? urlArray[0].split('/') : []
  const serverLast = Array.isArray(serverArray) ? serverArray[serverArray.length - 1] : ''
  serverArray = serverArray.slice(0,serverArray.length - 1)
  const server = `${serverArray.join('/')}/`
  const key = `${serverLast}?${Array.isArray(urlArray) ? urlArray[1] : ''}`
  return { server,key }
}

export function getCameraSource(deviceId: any) {
  const obsCameraInput = obs.InputFactory.create(byOS({
    [OS.Windows]: 'dshow_input',
    [OS.Mac]: 'av_capture_input',
  }), 'camera-video', 
    byOS({
      [OS.Windows]: {video_device_id: deviceId},
      [OS.Mac]: {device: deviceId},
    })
  )
  return obsCameraInput;
}

export function getWindows() {
  const videoSource = obs.InputFactory.create('window_capture', 'window-source');
  let windows = (videoSource.properties.get('window') as obs.IListProperty).details.items;
  videoSource.release();
  if (windows.length > 0) {
    if (!getItem(kObsWindowDevice)) {
      setItem(kObsWindowDevice,kObsDisabled);
    }
  }
  return windows;
}