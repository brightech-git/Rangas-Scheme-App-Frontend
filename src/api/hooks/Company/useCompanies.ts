// src/api/hooks/Company/useCompanies.ts

import { useEffect, useState, useCallback } from 'react';
import { companyService } from '../../services/companyService';
import { Company } from '../../../types/Company/Company';

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getAll();
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => (a.DISPLAYORDER ?? 0) - (b.DISPLAYORDER ?? 0));
      setCompanies(list);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  return { companies, loading, error, refetch: fetchCompanies };
};
