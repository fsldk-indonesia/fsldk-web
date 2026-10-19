export type WithdrawalStatus =
  | 'REQUESTED' | 'SECURITY_CHECK' | 'PENDING_APPROVAL' | 'APPROVED'
  | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'CANCELLED' | 'REVERSED';

export interface Withdrawal {
  withdrawalID: number;
  withdrawalRef: string;
  campaignID: number;
  campaignTitle: string;
  amount: number;
  fee: number;
  netAmount: number;
  beneficiaryBankCode: string;
  beneficiaryAccountNumber: string;
  beneficiaryAccountHolder: string;
  status: WithdrawalStatus;
  rejectionReason?: string;
  /** Pesan asli BisaTopup saat gateway menolak disbursement langsung — kosong
   * bila kegagalan datang lewat callback async (webhook tidak pernah
   * membawa pesan). */
  gatewayMessage?: string;
  /** Raw JSON respons/callback gateway terakhir, ditampilkan sebagai "Raw
   * Callback Response" collapsible untuk kebutuhan debug/support. */
  gatewayResponseJSON?: string;
  approvedDate?: string;
  executedDate?: string;
  completedDate?: string;
  receiptUrl?: string;
  createdDate: string;
}

export interface CreateWithdrawalRequest {
  amount: number;
  beneficiaryBankCode: string;
  beneficiaryAccountNumber: string;
  idempotencyKey?: string;
}

export interface InquiryRequest {
  bankCode: string;
  accountNumber: string;
}

export interface InquiryResponse {
  accountHolder: string;
  fee: number;
}

export interface BankListItem {
  bankCode: string;
  name: string;
  fee: number;
  status: string;
}

export interface SecurityVerifyRequest {
  password: string;
  otpCode?: string;
}
