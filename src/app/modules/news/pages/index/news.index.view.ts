export interface NewsIndexView {
  onPublishToggleSuccess(wasPublished: boolean): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
