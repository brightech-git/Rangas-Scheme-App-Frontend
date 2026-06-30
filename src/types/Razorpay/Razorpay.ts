// src/types/Razorpay/Razorpay.ts

// ── Generic backend ApiResponse wrapper ──────────────────────────
export interface ApiResponse<T = unknown> {
  status:  'success' | 'error';
  code:    string;
  message: string;
  data?:   T;
}

// ── create-order REQUEST  (sent TO backend — all uppercase keys) ──
export interface CreateOrderRequest {
  AMOUNT:              number;   // in paise (₹1 = 100)
  CURRENCY:            string;   // 'INR'
  RECEIPT:             string;   // unique receipt string
  SCHEMEID?:           string;
  GROUPCODE:           string;
  INSTALLMENTNUMBER?:  number;
  REGNO:               string;
}

// ── create-order RESPONSE (received FROM backend) ─────────────────
export interface CreateOrderData {
  order_id:  string;
  key:       string;
  amount:    number;   // paise
  currency:  string;
  name?:     string;
  email?:    string;
  contact?:  string;
}

// ── verify-payment userDetails sub-DTOs ──────────────────────────

export interface NewMember {
  title?:                   string;
  initial?:                 string;
  pName?:                   string;
  sName?:                   string;
  dob?:                     string;   // dd/MM/yyyy
  email?:                   string;
  doorNo?:                  string;
  address1?:                string;
  address2?:                string;
  area?:                    string;
  city?:                    string;
  state?:                   string;
  country?:                 string;
  pinCode?:                 string;
  mobile?:                  string;
  idProof?:                 string;
  idProofNo?:               string;
  upDateTime?:              string;
  userId?:                  string;
  appVer?:                  string;
  needsms1?:                string;
  needsms2?:                string;
  needemail?:               string;
  mobile2?:                 string;
  smsSend?:                 string;
  phoneRes?:                string;
  fax?:                     string;
  phoneRes2?:               string;
  stdCode1?:                string;
  stdCode2?:                string;
  nomeni?:                  string;   // nominee name
  panno?:                   string;
  anniversaryDate?:         string;
  nomineeMobile?:           string;
  nomineeRelationship?:     string;
  nomAddr1?:                string;
  nomAddr2?:                string;
  nomCity?:                 string;
  nomState?:                string;
  nomPincode?:              string;
  nomCountry?:              string;
  aadhaarMasked?:           string;
  nomineeMobileVerified?:   boolean;
  nomineeAadhaarVerified?:  boolean;
  walletBalance?:           number;
}

export interface CreateSchemeSummary {
  sno?:           string;
  companyId?:     string;
  schemeId?:      string;
  groupCode?:     string;
  regNo?:         string;
  joinDate?:      string;   // yyyy-MM-dd
  updateTime?:    string;
  openingDate?:   string;
  iEmp?:          string;
  intro?:         string;
  iGroupCode?:    string;
  iRegNo?:        string;
  homeCollect?:   string;
  remark?:        string;
  signaturePath?: string;
  userId?:        string;
  costId?:        string;
  totalIns?:      string;
  totalQty?:      string;
  appVer?:        string;
  previlegeId?:   string;
}

export interface SchemeCollectInsert {
  groupCode?:    string;
  regNo?:        string;
  rDate?:        string;   // yyyy-MM-dd 00:00:00
  amount?:       string;
  modePay?:      string;
  accCode?:      string;
  updateTime?:   string;
  installment?:  string;
  weight?:       string;
  sWeight?:      string;
  userID?:       string;
  SchemeId?:     number;
  chqBankCode?:  string;   // paymentMode  e.g. "RAZORPAY"
  chqCardNo?:    string;   // merchantTxnNo — filled by hook with razorpay_payment_id
  chqBranch?:    string;   // paymentSubInstType
  chkBank?:      string;
  chqRtnReason?: string;
}

export interface UserDetails {
  newMember?:           NewMember;
  createSchemeSummary?: CreateSchemeSummary;
  schemeCollectInsert?: SchemeCollectInsert;
  referralCode?:        string;
}

// ── verify-payment REQUEST ────────────────────────────────────────
export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
  userDetails?:        UserDetails;
}

// ── verify-payment RESPONSE ───────────────────────────────────────
export interface VerifyPaymentData {
  verified:   boolean;
  paymentId:  string;
  orderId:    string;
  receipt?:   string;
}

// ── payment-failed REQUEST ────────────────────────────────────────
export interface PaymentFailedRequest {
  razorpay_order_id: string;
}

// ── Razorpay checkout success payload (from WebView) ─────────────
export interface RazorpaySuccessPayment {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
}

// ── Razorpay checkout error payload ───────────────────────────────
export interface RazorpayError {
  code:        string;
  description: string;
  source?:     string;
  step?:       string;
  reason?:     string;
  metadata?: {
    payment_id?: string;
    order_id?:   string;
  };
}
