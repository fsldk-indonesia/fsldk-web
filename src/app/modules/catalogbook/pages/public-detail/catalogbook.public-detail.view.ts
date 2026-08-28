import { CatalogBook } from '../../entities/catalog-book';

export interface CatalogBookPublicDetailView {
  setLoading(loading: boolean): void;
  setBook(book: CatalogBook | null): void;
  setFavoriteCount(count: number): void;
}
