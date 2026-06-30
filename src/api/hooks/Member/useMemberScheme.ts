// src/api/hooks/Member/useMemberScheme.ts

import { useEffect, useState, useCallback } from 'react';
import { memberService } from '../../services/memberService';
import { MemberSchemeGroup } from '../../../types/Member/MemberScheme';

export const useMemberScheme = (schemeId: number | string) => {
  const [groups,  setGroups]  = useState<MemberSchemeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberService.getGroupsByScheme(schemeId);
      setGroups(data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load scheme groups');
    } finally {
      setLoading(false);
    }
  }, [schemeId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { groups, loading, error, refetch: fetch };
};
