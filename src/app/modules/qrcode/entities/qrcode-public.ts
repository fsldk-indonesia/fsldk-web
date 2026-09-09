/** Subset QR Code yang dikembalikan endpoint publik `/public/qrcodes/:id` —
 *  dipakai halaman detail/unduh publik (`/qr/:id`). */
export interface QRCodePublic {
  qrCodeID: number;
  label: string;
  destinationURL: string;
  captionText: string;
  imageURL: string;
  createdDate: string;
}
