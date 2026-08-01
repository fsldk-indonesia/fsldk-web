import { ArticleCategory } from '../../entities/article-category';
import { ArticleFormValue } from './article.form.presenter';

export interface ArticleFormView {
  setCategories(categories: ArticleCategory[]): void;
  setForm(form: ArticleFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
