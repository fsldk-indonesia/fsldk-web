import { GoodsCategory } from '../../entities/goods-category';

export interface GoodsCategoryIndexView {
  setCategories(categories: GoodsCategory[]): void;
  onToggleSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
