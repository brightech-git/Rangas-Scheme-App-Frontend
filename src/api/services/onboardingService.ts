// src/api/services/onboardingService.ts

import { callApi } from '../apiClient';
import { ONBOARDING } from '../endpoints';
import { BannersResponse } from '../../types/onboarding';

export const onboardingService = {
  getBanners: () =>
    callApi<null, BannersResponse>({
      method: 'get',
      url: ONBOARDING.BANNERS,
    }),
};
