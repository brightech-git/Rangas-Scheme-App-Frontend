// src/api/hooks/useSchemeSliders.ts

import { useEffect, useState } from 'react';
import { IMAGE_BASE_URL } from '@env';

import { schemeSliderService } from '../../services/homeBannerService';
import { SchemeSlider } from '../../../types/HomeBanner/HomeBanner';

export const useSchemeSliders = () => {
  const [sliders, setSliders] = useState<SchemeSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    schemeSliderService
      .getSliders()
      .then((res) => {
        res.sliders.forEach((slider) =>
          console.log(
            '[Scheme Slider URL]',
            getImageUrl(slider.image_path),
          ),
        );

        setSliders(res.sliders);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getImageUrl = (path: string) =>
    `${IMAGE_BASE_URL}${path}`;

  return {
    sliders,
    loading,
    error,
    getImageUrl,
  };
};