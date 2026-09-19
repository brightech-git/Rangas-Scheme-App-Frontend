// src/api/services/memberService.ts

import { callApi } from '../apiClient';
import { MEMBER, SOFT_CONTROL } from '../endpoints';
import { MemberSchemeGroup } from '../../types/Member/MemberScheme';
import { NMData } from '../../types/Member/NMData';

export interface KycStatusResponse {
  PERSONALID:   string;
  PNAME:        string;
  MOBILE:       string;
  KYCUPDATION:  string;
  UPDATETIME:   string;
}

export interface KycSoftControl {
  ctlId:   string;
  ctlName: string;
  ctlType: string;
  ctlText: string;
  colid:   number;
  Updated: string | null;
}

export const memberService = {
  getGroupsByScheme: (schemeId: number | string) =>
    callApi<null, MemberSchemeGroup[]>({
      method: 'get',
      url:    `${MEMBER.BY_SCHEME}?schemeId=${schemeId}`,
    }),

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

  getKycStatus: (personalId: string) =>
    callApi<null, KycStatusResponse>({
      method: 'get',
      url:    MEMBER.KYC_STATUS(personalId),
    }),

  getKycSoftControl: () =>
    callApi<null, KycSoftControl[]>({
      method: 'get',
      url:    SOFT_CONTROL.KYC_UPDATION,
    }),

  updateMemberDetails: (personalId: string, data: Record<string, any>) =>
    callApi<Record<string, any>, Record<string, any>>({
      method: 'put',
      url:    MEMBER.UPDATE_DETAILS(personalId),
      data,
    }),
};
