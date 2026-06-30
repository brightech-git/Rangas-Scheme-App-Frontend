// src/api/hooks/Account/useMySchemes.ts

import { useEffect, useState, useCallback } from 'react';
import { accountService } from '../../services/accountService';
import { AsyncStorageHelper } from '../../../utils/AsyncStorageHelper';
import { PPData } from '../../../types/Account/PhoneDetails';

export const useMySchemes = () => {
  const [mySchemes, setMySchemes] = useState<PPData[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchMySchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const phoneNo = await AsyncStorageHelper.getContactNumber();
      if (!phoneNo) {
        setMySchemes([]);
        return;
      }
      const data = await accountService.getPhoneDetails(phoneNo);
      setMySchemes(data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load your schemes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMySchemes(); }, [fetchMySchemes]);

  return { mySchemes, loading, error, refetch: fetchMySchemes };
};
