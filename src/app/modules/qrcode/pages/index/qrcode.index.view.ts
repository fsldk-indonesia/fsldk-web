import { QRCode } from '../../entities/qrcode';

export interface QrcodeIndexView {
  setQrcodes(items: QRCode[], count: number): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
  /** Simpan blob gambar QR sebagai file di sisi browser (unduhan). */
  saveBlob(blob: Blob, filename: string): void;
}
