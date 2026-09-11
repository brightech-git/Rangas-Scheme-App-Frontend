// src/types/Payment/Payment.ts

export interface PaymentSchemeDetails {
  schemeId:     number;
  groupCode:    string;
  regNo:        number;
  rDate:        string;   // 'yyyy-MM-dd HH:mm:ss'
  amount:       string;
  modePay:      string;   // 'O' = online
  accCode:      string;
  updateTime:   string;
  installment:  number;
  userID:       string;
  chqBankCode:  string;
  chqCardNo:    string;
  chqBranch:    string;
  chkBank:      string;
  chqRtnReason: string;
}

export interface PaymentNMNewMember {
  title:        string;
  initial:      string;
  pName:        string;
  sName:        string;
  doorNo:       string;
  address1:     string;
  address2:     string;
  area:         string;
  city:         string;
  state:        string;
  country:      string;
  pinCode:      string;
  mobile:       string;
  idProof:      string;
  idProofNo:    string;
  panNumber:    string;
  dob:          string;
  email:        string;
  upDateTime:   string;
  userId:       string;
  appVer:       string;
}

export interface PaymentNMCreateSchemeSummary {
  schemeId:     number;
  groupCode:    string;
  regNo:        number;
  joinDate:     string;
  upDateTime2:  string;
  openingDate:  string;
  userId2:      string;
}

export interface PaymentNMSchemeCollectInsert {
  amount:   number;
  modePay:  string;
  accCode:  string;
}

export interface PaymentNMData {
  newMember:            PaymentNMNewMember;
  createSchemeSummary:  PaymentNMCreateSchemeSummary;
  schemeCollectInsert:  PaymentNMSchemeCollectInsert;
}

export interface InitiatePaymentRequest {
  amount:         number;
  currency:       string;
  billingName:    string;
  billingEmail:   string;
  billingTel:     string;
  billingAddress: string;
  billingCity:    string;
  billingState:   string;
  billingZip:     string;
  billingCountry: string;
  regno:          number;
  groupcode:      string;
  newJoin:        boolean;
  schemeDetails:  PaymentSchemeDetails | null;
  nmData:         PaymentNMData | null;
}

export interface InitiatePaymentResponse {
  orderId:      string;
  initiateUrl:  string;
  accessCode:   string;
  encRequest:   string;
}

export interface PaymentStatusResponse {
  orderId:          string;
  trackingId?:      string;
  bankRefNo?:       string;
  orderStatus?:     string;   // 'SUCCESSFUL' | 'UNSUCCESSFUL'
  status?:          string;   // legacy fallback
  amount?:          number;
  currency?:        string;
  paymentMode?:     string;
  cardName?:        string | null;
  statusCode?:      string | null;
  statusMessage?:   string | null;
  failureMessage?:  string | null;
  transactionDate?: string | null;
  source?:          string;
  message?:         string;
}
