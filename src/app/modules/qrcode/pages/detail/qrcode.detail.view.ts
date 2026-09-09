import { QRCodePublic } from '../../entities/qrcode-public';

export interface QrcodeDetailView {
  setQrcode(qr: QRCodePublic): void;
  setNotFound(): void;
  setDownloading(downloading: boolean): void;
  /** Simpan blob gambar QR sebagai file di sisi browser (unduhan). */
  saveBlob(blob: Blob, filename: string): void;
}
