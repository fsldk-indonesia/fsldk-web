import { Goods } from '../../entities/goods';
import { GoodsCategory } from '../../entities/goods-category';

export interface GoodsIndexView {
  setGoods(goods: Goods[], count: number): void;
  setCategories(categories: GoodsCategory[]): void;
  onPublishToggleSuccess(): void;
  onFeaturedToggleSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
