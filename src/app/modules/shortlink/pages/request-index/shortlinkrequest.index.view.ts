export interface ShortLinkRequestIndexView {
  onActionSettled(id: number): void;
  onApproveSuccess(): void;
  setRejectSaving(saving: boolean): void;
  onRejectSuccess(): void;
}
