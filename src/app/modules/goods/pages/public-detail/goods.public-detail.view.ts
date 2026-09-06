import { GoodsDetail } from '../../entities/goods';

export interface GoodsPublicDetailView {
  setLoading(loading: boolean): void;
  setGoods(goods: GoodsDetail | null): void;
}
