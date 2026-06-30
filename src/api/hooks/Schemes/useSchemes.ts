// src/api/hooks/Schemes/useSchemes.ts

import { useEffect, useState, useCallback } from 'react';
import { IMAGE_BASE_URL } from '@env';

import { schemeService } from '../../services/schemeService';
import { ApiScheme } from '../../../types/Scheme/Scheme';

export const useSchemes = () => {
  const [schemes,  setSchemes]  = useState<ApiScheme[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchSchemes = useCallback(() => {
    setLoading(true);
    setError(null);
    schemeService
      .getAll()
      .then((res) => setSchemes(res.schemes ?? []))
      .catch((err) => setError(err.message ?? 'Failed to load schemes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSchemes(); }, [fetchSchemes]);

  /** Prepend IMAGE_BASE_URL to a relative image_path */
  const imageUrl = (path: string) =>
    path ? `${IMAGE_BASE_URL}${path}` : '';

  return { schemes, loading, error, refetch: fetchSchemes, imageUrl };
};
