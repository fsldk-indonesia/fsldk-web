export interface QRCodeRequestIndexView {
  onActionSettled(id: number): void;
  onApproveSuccess(): void;
  setRejectSaving(saving: boolean): void;
  onRejectSuccess(): void;
}
