import Store from 'electron-store';

export const kAnchorId = 'kAnchorId';
export const kLiveId = 'kLiveId';
export const kAnchorName = 'kAnchorName';
export const kObsAudioDevice = "kObsAudioDevice";
export const kObsVideoDevice = "kObsVideoDevice";
export const kObsWindowDevice = "kObsWindowDevice";
export const kObsDisabled = "kObsDisabled";
export const kObsScreenShareValue= "kObsScreenShareValue";
export const kObsCacheAuthUrl = "kObsCacheAuthUrl";

const store = new Store();

export function getItem(key: string) {
    return store.get(key);
}

export function setItem(key: string,value: any) {
    store.set(key,value);
}

export function deleteItem(key: string) {
    store.delete(key);
}

