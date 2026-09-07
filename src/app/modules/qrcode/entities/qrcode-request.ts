export type QRCodeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface QRCodeRequest {
  qrCodeRequestID: number;
  requesterName: string;
  requesterEmail: string;
  requesterWhatsapp: string;
  destinationURL: string;
  foregroundColor: string;
  backgroundColor: string;
  centerIconURL: string;
  centerIconKey: string;
  captionText: string;
  note?: string;
  status: QRCodeRequestStatus;
  qrCodeID?: number;
  imageURL?: string; // terisi setelah approved
  rejectionReason?: string;
  reviewerName?: string;
  reviewedDate?: string;
  createdDate: string;
}
