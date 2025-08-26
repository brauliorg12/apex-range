export interface MapRotationInfo {
  current: {
    map: string;
    remainingTimer: string;
  };
  next: {
    map: string;
    readableDate_start: string;
  };
}

export interface GlobalApiStatusData {
  mapRotation?: MapRotationInfo;
  predatorRP?: number | string;
}

export interface GlobalApiStatus {
  ok: boolean;
  lastChecked?: Date;
  data?: GlobalApiStatusData;
}

const globalApiStatus: GlobalApiStatus = {
  ok: false,
  lastChecked: undefined,
};

export function setGlobalApiStatus(ok: boolean, lastChecked?: Date) {
  globalApiStatus.ok = ok;
  if (lastChecked) {
    globalApiStatus.lastChecked = lastChecked;
  } else if (!ok) {
    globalApiStatus.lastChecked = new Date();
  }
}

export function getGlobalApiStatus(): GlobalApiStatus {
  return { ...globalApiStatus };
}
