import { News } from '../../entities/news';
import { NewsCategory } from '../../entities/news-category';

export interface NewsPublicIndexView {
  setLoading(loading: boolean): void;
  setNews(news: News[], count: number): void;
  setCategories(categories: NewsCategory[]): void;
}
