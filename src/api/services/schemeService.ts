// src/api/services/schemeService.ts

import { callApi } from '../apiClient';
import { SCHEMES } from '../endpoints';
import { SchemesResponse } from '../../types/Scheme/Scheme';

export const schemeService = {
  getAll: () =>
    callApi<null, SchemesResponse>({
      method: 'get',
      url: SCHEMES.ALL,
    }),
};
