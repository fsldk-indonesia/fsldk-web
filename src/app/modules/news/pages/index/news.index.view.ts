import { News } from '../../entities/news';
import { NewsCategory } from '../../entities/news-category';

export interface NewsIndexView {
  setNews(news: News[], count: number): void;
  setCategories(categories: NewsCategory[]): void;
  onPublishToggleSuccess(wasPublished: boolean): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
