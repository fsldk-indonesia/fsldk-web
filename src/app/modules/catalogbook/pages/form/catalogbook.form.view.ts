import { BookCategory } from '../../entities/book-category';
import { BookLanguage } from '../../entities/book-language';
import { BookAuthorType } from '../../entities/book-author-type';
import { BookAvailabilityType } from '../../entities/book-availability-type';
import { CatalogBookFormValue } from './catalogbook.form.presenter';

export interface CatalogBookFormView {
  setCategories(categories: BookCategory[]): void;
  setLanguages(languages: BookLanguage[]): void;
  setAuthorTypes(types: BookAuthorType[]): void;
  setAvailabilityTypes(types: BookAvailabilityType[]): void;
  setForm(form: CatalogBookFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
