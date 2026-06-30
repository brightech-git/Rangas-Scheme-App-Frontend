// src/types/Account/AccountInsert.ts
//
// Body for POST /api/v1/account/insert  (backend: AccountController -> SchemeCollectInsert)
// Used to record a further scheme installment after a successful Razorpay payment.
// Field names match the backend Java model so Jackson binds them correctly.

export interface AccountInsertData {
  groupCode:    string;
  regNo:        number;
  rDate:        string;   // ISO yyyy-MM-dd (backend parses it as a LocalDate)
  amount:       number;   // rupees
  modePay:      number;   // 4 = online
  accCode:      string;   // "00001"
  updateTime:   string;
  installment:  number;
  weight:       number;
  sWeight:      number;
  userID:       number;   // fixed 999
  schemeId:     number;   // -> backend SchemeCollectInsert.SchemeId (JSON "schemeId")
  chqBankCode:  number;   // 4 = Razorpay
  chqCardNo:    string;   // razorpay_payment_id
  chqBranch:    string;   // "Online"
  chkBank:      string;   // "Razorpay"
  chqRtnReason: string;   // razorpay_order_id
}
