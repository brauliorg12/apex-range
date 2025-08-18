type GlobalApiStatus = {
  ok: boolean;
  lastChecked: Date | null;
};

const globalApiStatus: GlobalApiStatus = {
  ok: false,
  lastChecked: null,
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
