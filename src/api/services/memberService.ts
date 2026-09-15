// src/api/services/memberService.ts

import { callApi } from '../apiClient';
import { MEMBER } from '../endpoints';
import { MemberSchemeGroup } from '../../types/Member/MemberScheme';
import { NMData } from '../../types/Member/NMData';

export const memberService = {
  getGroupsByScheme: (schemeId: number | string) =>
    callApi<null, MemberSchemeGroup[]>({
      method: 'get',
      url:    `${MEMBER.BY_SCHEME}?schemeId=${schemeId}`,
    }),

  /** Create a new member after a successful Razorpay payment */
  createMember: (data: NMData) => {
    console.log('[memberService] createMember payload:', JSON.stringify(data, null, 2));
    return callApi<NMData, Record<string, any>>({
      method: 'post',
      url:    MEMBER.CREATE,
      data,
    }).then((res) => {
      console.log('[memberService] createMember response:', JSON.stringify(res, null, 2));
      return res;
    });
  },
};
