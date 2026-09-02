export type DonationStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'AMOUNT_MISMATCH';
export type DonationPaymentMethod = 'CASH' | 'QRIS' | 'EWALLET' | 'TRANSFER' | 'BANK_TRANSFER' | 'OTHER';

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
  paymentMethod?: DonationPaymentMethod;
  qrPayload?: string;
  paymentCode?: string;
  paymentLink?: string;
  expiredDate?: string;
  createdDate: string;
}

/** Detail donasi termasuk PII donor — hanya dari endpoint CMS get-by-id
 * (dipakai membuka form edit donasi manual), TIDAK PERNAH dari endpoint publik. */
export interface DonationAdminDetail extends Donation {
  donorEmail: string;
  donorPhone: string;
  donorAge?: string;
  donorDomicile?: string;
  donorOccupation?: string;
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

/** Body CRUD donasi manual/offline (item 1 revision-prompt-2.md) — donasi
 * yang tidak lewat Amdigipay/Bisatopup, dicatat admin CMS. */
export interface AdminCreateDonationRequest {
  campaignID: number;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAge?: string;
  donorDomicile?: string;
  donorOccupation?: string;
  isAnonymous: boolean;
  message?: string;
  amount: number;
  paymentMethod: DonationPaymentMethod;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
}

export interface AdminUpdateDonationRequest extends AdminCreateDonationRequest {}
