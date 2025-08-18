type ApiStatus = {
  ok: boolean;
  lastChecked: Date | null;
};

const apiStatus: ApiStatus = {
  ok: false,
  lastChecked: null,
};

export function setApiStatus(ok: boolean) {
  apiStatus.ok = ok;
  apiStatus.lastChecked = new Date();
}

export function getApiStatus(): ApiStatus {
  return { ...apiStatus };
}
