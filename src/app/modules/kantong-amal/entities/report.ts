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

/** Satu baris laporan debit/kredit global (item 6 revision-prompt-2.md) —
 * khusus Bisatopup by construction (donasi manual tidak pernah menyentuh
 * tr_wallet_ledger, lihat backend donation_service). */
export interface GlobalLedgerRow {
  ledgerID: number;
  campaignID: number;
  campaignTitle: string;
  entryType: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  referenceType: string;
  referenceID: number;
  createdDate: string;
}

/** Satu bucket distribusi untuk tab Analitik (item 7 revision-prompt-2.md). */
export interface AmountBandRow {
  bandLabel: string;
  count: number;
}

export interface AgeBandRow {
  bandLabel: string;
  count: number;
}

export interface AnalyticsResponse {
  donationAmountBands: AmountBandRow[];
  donorAgeBands: AgeBandRow[];
  campaignProgress: CampaignReportRow[];
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
  /** Donasi PAID dalam settlementMinutes menit sebelum snapshot ini dijalankan
   *  — mungkin belum settle penuh di wallet gateway, jadi selisih sebesar ini
   *  ditoleransi (tidak dianggap anomali). Setara "Settlement Pending" di
   *  ldksyahid-app. */
  settlementPendingAmount: number;
  settlementMinutes: number;
  hasAnomaly: boolean;
  gatewayError?: string;
  createdDate: string;
}
