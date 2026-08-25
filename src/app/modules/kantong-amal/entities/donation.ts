export type DonationStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'AMOUNT_MISMATCH';

export interface Donation {
  donationID: number;
  publicRef: string;
  campaignID: number;
  campaignTitle: string;
  campaignSlug: string;
  donorName: string;
  isAnonymous: boolean;
  message?: string;
  amount: number;
  adminFee: number;
  totalAmount: number;
  paymentStatus: DonationStatus;
  gateway: string;
  qrPayload?: string;
  paymentCode?: string;
  paymentLink?: string;
  expiredDate?: string;
  createdDate: string;
}

export interface DonationStatusResponse {
  paymentStatus: DonationStatus;
}

export interface PublicDonationItem {
  donorName: string;
  isAnonymous: boolean;
  amount: number;
  message?: string;
  createdDate: string;
}

export interface CreateDonationRequest {
  amount: number;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorAge?: string;
  donorDomicile?: string;
  donorOccupation?: string;
  isAnonymous: boolean;
  message?: string;
  idempotencyKey?: string;
}
