// src/api/services/accountService.ts

import { callApi } from '../apiClient';
import { ACCOUNT } from '../endpoints';
import { PPData } from '../../types/Account/PhoneDetails';
import { AccountInsertData } from '../../types/Account/AccountInsert';

export const accountService = {
  getPhoneDetails: (phoneNo: string) =>
    callApi<null, PPData[]>({
      method: 'get',
      url: `${ACCOUNT.PHONE_DETAILS}?phoneNo=${phoneNo}`,
    }),

  /** Record a scheme installment payment (backend returns a plain string message) */
  insertEntry: (body: AccountInsertData) =>
    callApi<AccountInsertData, string>({
      method: 'post',
      url:    ACCOUNT.INSERT,
      data:   body,
    }),
};
