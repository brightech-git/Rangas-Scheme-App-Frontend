// src/utils/useAppVersion.ts

import { useEffect, useState } from 'react';
import * as Application from 'expo-application';
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

const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=com.brightechsoftware.rangasthangamaligai`;

export function useAppVersion() {
  const installedVersion = Application.nativeApplicationVersion ?? '0.0.0';

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion,   setLatestVersion]   = useState('');
  const [storeUrl,        setStoreUrl]        = useState(PLAY_STORE_URL);
  const [isMaintenance,   setIsMaintenance]   = useState(false);
  const [maintenanceMsg,  setMaintenanceMsg]  = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}${APP.CONFIG}`)
      .then((res) => res.json())
      .then((data: AppConfig[]) => {
        const config = data?.[0];
        if (!config) return;
        setIsMaintenance(config.IS_MAINTENANCE);
        setMaintenanceMsg(config.MAINTENANCE_MSG);
        if (config.STORE_URL) setStoreUrl(config.STORE_URL);
        console.log('[useAppVersion] installed:', installedVersion, '| latest:', config.VERSION, '| update needed:', config.VERSION > installedVersion);
        if (config.VERSION > installedVersion) {
          setLatestVersion(config.VERSION);
          setUpdateAvailable(true);
        }
      })
      .catch(() => console.log('[useAppVersion] backend config fetch failed'));
  }, []);

  return { updateAvailable, installedVersion, latestVersion, storeUrl, isMaintenance, maintenanceMsg };
}
