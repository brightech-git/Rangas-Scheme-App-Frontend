// src/api/services/companyService.ts

import { callApi } from '../apiClient';
import { COMPANY } from '../endpoints';
import { Company } from '../../types/Company/Company';

export const companyService = {
  /** GET /api/v1/company/all — list of company / branch details */
  getAll: () =>
    callApi<null, Company[]>({
      method: 'get',
      url:    COMPANY.ALL,
    }),
};
