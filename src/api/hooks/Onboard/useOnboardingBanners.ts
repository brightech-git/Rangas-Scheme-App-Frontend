// src/api/hooks/useOnboardingBanners.ts

import { useState, useEffect } from 'react';
import { onboardingService } from '../../services/onboardingService';
import { Banner } from '../../../types/onboarding';
import { API_BASE_URL, IMAGE_BASE_URL } from '@env';

export const useOnboardingBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onboardingService
      .getBanners()
      .then((res) => {
        res.banners.forEach((b) => console.log('[Onboarding Banner URL]', getImageUrl(b.image_path)));
        setBanners(res.banners);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getImageUrl = (path: string) => `${IMAGE_BASE_URL}${path}`;

  return { banners, loading, error, getImageUrl };
};
