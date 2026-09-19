import { useEffect, useState } from 'react';
import { memberService, KycStatusResponse } from '../../services/memberService';

export function useKycStatus(personalId: string | undefined) {
  const [data,    setData]    = useState<KycStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!personalId) return;
    setLoading(true);
    memberService.getKycStatus(personalId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [personalId]);

  const kycDone = data?.KYCUPDATION === 'Y';

  return { kycDone, kycData: data, kycLoading: loading };
}
