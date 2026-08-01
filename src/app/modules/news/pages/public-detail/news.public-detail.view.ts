import { News } from '../../entities/news';

export interface NewsPublicDetailView {
  setLoading(loading: boolean): void;
  setNews(news: News | null): void;
}
