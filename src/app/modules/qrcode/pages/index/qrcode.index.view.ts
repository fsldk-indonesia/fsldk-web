export interface QrcodeIndexView {
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
  /** Simpan blob gambar QR sebagai file di sisi browser (unduhan). */
  saveBlob(blob: Blob, filename: string): void;
}
