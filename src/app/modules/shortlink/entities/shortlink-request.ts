export type ShortLinkRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ShortLinkRequest {
  shortLinkRequestID: number;
  requesterName: string;
  requesterEmail: string;
  requesterWhatsapp: string;
  destinationURL: string;
  requestedKey?: string;
  note?: string;
  status: ShortLinkRequestStatus;
  shortLinkID?: number;
  shortKey?: string;
  shortURL?: string;
  rejectionReason?: string;
  reviewerName?: string;
  reviewedDate?: string;
  createdDate: string;
}
