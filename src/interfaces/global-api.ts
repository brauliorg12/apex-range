interface MapRotationInfo {
  current: {
    map: string;
    remainingTimer: string;
  };
  next: {
    map: string;
    readableDate_start: string;
  };
}

interface GlobalApiStatusData {
  mapRotation?: MapRotationInfo;
  predatorRP?: number | string;
}

export interface GlobalApiStatus {
  ok: boolean;
  lastChecked?: Date;
  data?: GlobalApiStatusData;
}
