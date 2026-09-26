export interface FinanceFormatIndexView {
  onPublishToggleSuccess(wasActive: boolean): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
