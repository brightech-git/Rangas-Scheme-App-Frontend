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
  createMember: (data: NMData) =>
    callApi<NMData, Record<string, any>>({
      method: 'post',
      url:    MEMBER.CREATE,
      data,
    }),
};
