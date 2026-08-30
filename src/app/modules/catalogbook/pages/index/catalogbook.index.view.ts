import { CatalogBook } from '../../entities/catalog-book';
import { BookCategory } from '../../entities/book-category';

export interface CatalogBookIndexView {
  setBooks(books: CatalogBook[], count: number): void;
  setCategories(categories: BookCategory[]): void;
  onPublishToggleSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
