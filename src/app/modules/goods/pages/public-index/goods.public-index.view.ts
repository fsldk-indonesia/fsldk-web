import { Goods } from '../../entities/goods';
import { GoodsCategory } from '../../entities/goods-category';

export interface GoodsPublicIndexView {
  setLoading(loading: boolean): void;
  setGoods(goods: Goods[], count: number): void;
  setCategories(categories: GoodsCategory[]): void;
}
