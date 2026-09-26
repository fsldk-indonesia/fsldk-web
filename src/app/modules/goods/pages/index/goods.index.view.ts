export interface GoodsIndexView {
  onPublishToggleSuccess(): void;
  onFeaturedToggleSuccess(): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
