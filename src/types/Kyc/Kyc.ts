// src/types/Kyc/Kyc.ts
//
// KYC + nominee details collected via KycFormScreen before a member is
// allowed to pay an instalment / one-time payment. Field names mirror
// the backend NMNewMember model (see types/Member/NMData.ts) so the
// saved draft can be sent as-is inside nmData.newMember when needed.

export interface KycFormData {
  doorNo:     string;
  address1:   string;
  area:       string;
  city:       string;
  state:      string;
  country:    string;
  pinCode:    string;
  email:      string;

  nomeni:               string;
  nomineeMobile:        string;
  nomineeRelationship:  string;

  dob:              string;
  maritalStatus:    string;
  idProof:          string;
  idProofNo:        string;
  anniversaryDate:  string;

  aadhaarMasked:            string;
  nomineeMobileVerified:    boolean;
  nomineeAadhaarVerified:   boolean;
}

export const EMPTY_KYC_FORM: KycFormData = {
  doorNo: '', address1: '', area: '', city: '', state: '', country: 'India', pinCode: '',
  email: '',
  nomeni: '', nomineeMobile: '', nomineeRelationship: '',
  dob: '', maritalStatus: '', idProof: '', idProofNo: '', anniversaryDate: '',
  aadhaarMasked: '', nomineeMobileVerified: false, nomineeAadhaarVerified: false,
};

export const MARITAL_STATUS_OPTIONS = ['Single', 'Married'];

export const ID_PROOF_OPTIONS = ['Aadhaar', 'PAN'];

export const NOMINEE_RELATIONSHIP_OPTIONS = [
  'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Guardian', 'Other',
];
