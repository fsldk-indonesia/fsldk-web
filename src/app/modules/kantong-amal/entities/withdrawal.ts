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
  approvedDate?: string;
  completedDate?: string;
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
