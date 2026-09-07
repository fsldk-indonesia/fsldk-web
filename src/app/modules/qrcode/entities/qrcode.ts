export interface QRCode {
  qrCodeID: number;
  label: string;
  /** URL tujuan yang di-encode LANGSUNG di dalam gambar QR. */
  destinationURL: string;
  foregroundColor: string; // #RRGGBB
  backgroundColor: string; // #RRGGBB
  centerIconURL: string;   // URL /uploads/... atau data URI PNG (kosong = tanpa ikon)
  centerIconKey: string;   // preset ikon aktif (fsldk/instagram/...) atau '' untuk kustom/none
  captionText: string;     // teks di bawah QR (kosong = tanpa caption)
  /** Endpoint publik yang mengembalikan gambar PNG QR (URL absolut). */
  imageURL: string;
  authorName: string;
  createdDate: string;
}
