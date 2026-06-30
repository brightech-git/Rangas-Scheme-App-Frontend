// src/types/Account/PhoneDetails.ts

export interface PersonalInfo {
  personalId: string;
  pName: string;
  doorNo: string;
  address1: string;
  address2: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  mobile: string;
  mobile2: string;
  costId: string;
}

export interface SchemaSummaryTransBalance {
  amtrecd: string;
  bonusAmount: string;
  totalAmount: string;
  insPaid: string;
}

export interface SchemeSummary {
  schemeId: string;
  schemeName: string;
  schemeSName: string;
  instalment: string;
  amount: string | null;
  schemaSummaryTransBalance: SchemaSummaryTransBalance;
  fixedIns: string;
  weightLedger: string;
  totalWeight: string;
  lastWeight: string;
}

export interface SchemeClosedSummary {
  doClose: string;
  billNo: string;
  userName: string;
  empName: string;
  closeDate: string;
  closeCostId: string;
  closeCancelDate: string;
  closeCancelUser: string;
  closeEmpId: string;
  closedBy: string;
  closeType: string;
}

export interface PaymentHistory {
  receiptNo: string;
  amount: string;
  installment: string;
  updateTime: string;
  weight: string;
  chqBankCode: string | null;
  chq_CardNo: string;
  chqBranch: string;
  chqBank: string;
  chqRtnReason: string | null;
}

export interface PPData {
  regNo: number;
  groupCode: string;
  pName: string;
  maturityDate: string;
  joinDate: string;
  personalInfo: PersonalInfo;
  schemeSummary: SchemeSummary;
  schemeClosedSummary: SchemeClosedSummary;
  paymentHistoryList: PaymentHistory[];
  lastPaidDate: string;
  amount: string;
  totalAmount: number;
  totalAmountWithBonus: number;
  bonusAmount: number;
  bonusPercent: number;
  fromDays: number;
  toDays: number;
  totalDays: number;
  nextDueDate: string;
  remainingDueDates: string[];
  fulldays: number;
  allDays: number | null;
  remainingDays: number;
  pname: string;
}
