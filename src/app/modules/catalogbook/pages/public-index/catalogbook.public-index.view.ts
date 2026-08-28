import { CatalogBook } from '../../entities/catalog-book';
import { BookCategory } from '../../entities/book-category';
import { BookLanguage } from '../../entities/book-language';
import { BookAuthorType } from '../../entities/book-author-type';
import { BookAvailabilityType } from '../../entities/book-availability-type';

export interface CatalogBookPublicIndexView {
  setLoading(loading: boolean): void;
  setBooks(books: CatalogBook[], count: number): void;
  setCategories(categories: BookCategory[]): void;
  setLanguages(languages: BookLanguage[]): void;
  setAuthorTypes(types: BookAuthorType[]): void;
  setAvailabilityTypes(types: BookAvailabilityType[]): void;
}
