import { GoodsCategory } from '../../entities/goods-category';
import { GoodsFormValue } from './goods.form.presenter';

export interface GoodsFormView {
  setCategories(categories: GoodsCategory[]): void;
  setForm(form: GoodsFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
