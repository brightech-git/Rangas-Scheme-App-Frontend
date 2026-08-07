// src/utils/useAppVersion.ts

import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { API_BASE_URL } from '@env';
import { APP } from '../api/endpoints';

type AppConfig = {
  ID: number;
  VERSION: string;
  STORE_URL: string;
  IS_MAINTENANCE: boolean;
  MAINTENANCE_MSG: string;
  UPDATED_AT: string;
};

function parseVersion(v: string) {
  return v.split('.').map(Number);
}

function isNewer(latest: string, installed: string) {
  const l = parseVersion(latest);
  const i = parseVersion(installed);
  for (let x = 0; x < Math.max(l.length, i.length); x++) {
    if ((l[x] ?? 0) > (i[x] ?? 0)) return true;
    if ((l[x] ?? 0) < (i[x] ?? 0)) return false;
  }
  return false;
}

export function useAppVersion() {
  const installedVersion = Constants.expoConfig?.version ?? '0.0.0';

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}${APP.CONFIG}`)
      .then((res) => res.json())
      .then((data: AppConfig[]) => {
        const config = data?.[0];
        if (!config) return;

        setIsMaintenance(config.IS_MAINTENANCE);
        setMaintenanceMsg(config.MAINTENANCE_MSG);

        if (isNewer(config.VERSION, installedVersion)) {
          setLatestVersion(config.VERSION);
          setStoreUrl(config.STORE_URL);
          setUpdateAvailable(true);
        }
      })
      .catch(() => {
        // silently ignore — no alert on network failure
      });
  }, []);

  return { updateAvailable, installedVersion, latestVersion, storeUrl, isMaintenance, maintenanceMsg };
}
