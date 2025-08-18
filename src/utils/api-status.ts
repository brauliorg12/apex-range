type ApiStatus = {
  ok: boolean;
  lastChecked: Date | null;
};

const apiStatus: ApiStatus = {
  ok: false,
  lastChecked: null,
};

export function setApiStatus(ok: boolean, lastChecked?: Date) {
  apiStatus.ok = ok;
  if (lastChecked) {
    apiStatus.lastChecked = lastChecked;
  } else if (!ok) {
    apiStatus.lastChecked = new Date();
  }
}

export function getApiStatus(): ApiStatus {
  return { ...apiStatus };
}
