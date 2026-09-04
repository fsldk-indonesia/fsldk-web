import { GoodsCategoryFormValue } from './goods-category.form.presenter';

export interface GoodsCategoryFormView {
  setForm(form: GoodsCategoryFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
