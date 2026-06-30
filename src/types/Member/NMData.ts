// src/types/Member/NMData.ts
//
// Payload for POST /api/v1/member/create  (backend: NewMemberController -> NMData)
// Field names below MUST match the backend Java model property names exactly,
// otherwise Jackson silently drops them.

// ── backend: com.example.VTM.model.NewMember.NewMember ────────────
export interface NMNewMember {
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
  mobile2?:                 string;
  nomeni?:                  string;   // nominee name
  panno?:                   string;   // PAN number (backend field is "panno")
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
}

// ── backend: com.example.VTM.model.NewMember.CreateSchemeSummary ──
export interface NMCreateSchemeSummary {
  schemeId?:    string;
  groupCode?:   string;
  regNo?:       string;
  joinDate?:    string;   // yyyy-MM-dd HH:mm:ss
  updateTime?:  string;
  openingDate?: string;
  userId?:      string;
  totalIns?:    string;
}

// ── backend: com.example.VTM.model.SchemeCollectInsert ────────────
export interface NMSchemeCollectInsert {
  groupCode?:    string;
  regNo?:        string;
  rDate?:        string;   // yyyy-MM-dd (backend normalises to ...00:00:00)
  amount?:       string;
  modePay?:      string;
  accCode?:      string;
  installment?:  string;
  userID?:       string;
  SchemeId?:     number;
  chqBankCode?:  string;   // paymentMode
  chqCardNo?:    string;   // merchantTxnNo  -> razorpay_payment_id
  chqBranch?:    string;   // paymentSubInstType
  chkBank?:      string;
  chqRtnReason?: string;   // razorpay_order_id
}

// ── backend: com.example.VTM.model.NewMember.NMData ───────────────
export interface NMData {
  newMember?:           NMNewMember;
  createSchemeSummary?: NMCreateSchemeSummary;
  schemeCollectInsert?: NMSchemeCollectInsert;
  referralCode?:        string;
}
