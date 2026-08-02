import { News } from '../../../news/entities/news';

export interface HomeIndexView {
  setLoading(loading: boolean): void;
  setNews(news: News[]): void;
}
