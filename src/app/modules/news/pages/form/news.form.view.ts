import { NewsCategory } from '../../entities/news-category';
import { NewsFormValue } from './news.form.presenter';

export interface NewsFormView {
  setCategories(categories: NewsCategory[]): void;
  setForm(form: NewsFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
