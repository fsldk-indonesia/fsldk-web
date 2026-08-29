export interface BalanceReport {
  from: string;
  to: string;
  campaignID?: number;
  openingBalance: number;
  incoming: number;
  outgoing: number;
  refund: number;
  adjustment: number;
  fee: number;
  closingBalance: number;
  expectedClosing: number;
  isBalanced: boolean;
}

export interface CampaignReportRow {
  campaignID: number;
  title: string;
  status: string;
  targetAmount: number;
  collectedAmount: number;
  donorCount: number;
  transactionCount: number;
  startDate?: string;
  endDate?: string;
  createdDate: string;
}

export interface DonationReportRow {
  donationID: number;
  campaignTitle: string;
  donorName: string;
  isAnonymous: boolean;
  amount: number;
  adminFee: number;
  totalAmount: number;
  paymentStatus: string;
  gateway: string;
  createdDate: string;
}

export interface WithdrawalReportRow {
  withdrawalID: number;
  withdrawalRef: string;
  campaignTitle: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  beneficiaryBankCode: string;
  beneficiaryAccountNumber: string;
  requestedDate: string;
  approvedDate?: string;
  processingDate?: string;
  completedDate?: string;
}

export interface WithdrawalStatusFunnel {
  status: string;
  count: number;
}

export interface WithdrawalReportResult {
  items: WithdrawalReportRow[];
  statusFunnel: WithdrawalStatusFunnel[];
}

export interface ReconciliationSnapshot {
  snapshotID: number;
  snapshotDate: string;
  donationPaidCount: number;
  donationPaidAmount: number;
  ledgerDonationCreditAmount: number;
  withdrawalSuccessCount: number;
  withdrawalSuccessAmount: number;
  expectedBalance: number;
  gatewayWalletBalance: number;
  discrepancyAmount: number;
  hasAnomaly: boolean;
  gatewayError?: string;
  createdDate: string;
}
