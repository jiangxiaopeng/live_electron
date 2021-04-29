import * as obs from 'obs-studio-node';
import { v4 as uuid_v4 } from 'uuid';
import { getItem, kObsAudioDevice, kObsVideoDevice, setItem } from '../store';
import { byOS, OS } from './operating_systems';

export enum EDeviceType {
  audioInput = 'audioInput',
  audioOutput = 'audioOutput',
  videoInput = 'videoInput',
}
export interface IDevice {
  id: string;
  type: EDeviceType;
  description: string;
}

export function getDevices() {
  const devices: IDevice[] = [];
  const dshowDevices: IDevice[] = [];

  // Avoid initializing any devices by passing a device id that doesn't exist
  const obsAudioInput = obs.InputFactory.create(
    byOS({
      [OS.Windows]: 'wasapi_input_capture',
      [OS.Mac]: 'coreaudio_input_capture',
    }),
    uuid_v4(),
    {
      device_id: 'does_not_exist',
    }
  );
  // const obsAudioOutput = obs.InputFactory.create(
  //   byOS({
  //     [OS.Windows]: 'wasapi_output_capture',
  //     [OS.Mac]: 'coreaudio_output_capture',
  //   }),
  //   uuid_v4(),
  //   {
  //     device_id: 'does_not_exist',
  //   }
  // );

  (obsAudioInput.properties.get(
    'device_id'
  ) as obs.IListProperty).details.items.forEach(
    (item) => {
      if (item.name === 'NVIDIA Broadcast') {

      }
      if (item.value != 'default') {
      devices.push({
        id: item.value as string,
        description: item.name,
        type: EDeviceType.audioInput,
      });
    }
    }
  );

  // (obsAudioOutput.properties.get(
  //   'device_id'
  // ) as obs.IListProperty).details.items.forEach(
  //   (item) => {
  //     devices.push({
  //       id: item.value as string,
  //       description: item.name,
  //       type: EDeviceType.audioOutput,
  //     });
  //   }
  // );

  const obsVideoInput = byOS({
    [OS.Windows]: () =>
      obs.InputFactory.create('dshow_input', uuid_v4(), {
        audio_device_id: 'does_not_exist',
        video_device_id: 'does_not_exist',
      }),
    [OS.Mac]: () =>
      obs.InputFactory.create('av_capture_input', uuid_v4(), {
        device: 'does_not_exist',
      }),
  });

  (obsVideoInput.properties.get(
    byOS({ [OS.Windows]: 'video_device_id', [OS.Mac]: 'device' })
  ) as obs.IListProperty).details.items.forEach(
    (item) => {
      if (item.name === 'NVIDIA Broadcast') {
        // this.usageStatisticsService.recordFeatureUsage('NvidiaVirtualCam');
      }

      if (item.value && item.name != "") {
        dshowDevices.push({
          id: item.value as string,
          description: item.name,
          type: EDeviceType.videoInput,
        });
      }
    }
  );

  const audioDeviceIdProp = obsVideoInput.properties.get(
    'audio_device_id'
  ) as obs.IListProperty;
  // audioDeviceIdProp can be null if no devices exist or if on Mac
  if (audioDeviceIdProp) {
    audioDeviceIdProp.details.items.forEach(
      (item) => {
        dshowDevices.push({
          id: item.value as string,
          description: item.name,
          type: EDeviceType.audioInput,
        });
      }
    );
  }

  obsAudioInput.release();
  // obsAudioOutput.release();
  obsVideoInput.release();
  if (devices.length > 0 && getItem(kObsAudioDevice) == null) {
    setItem(kObsAudioDevice,devices[0].id);
  }
  if (dshowDevices.length > 0 && getItem(kObsVideoDevice) == null) {
    setItem(kObsVideoDevice,dshowDevices[0].description);
  }
  return { devices, dshowDevices };
}
