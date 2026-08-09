import { News } from '../../../news/entities/news';
import { Article } from '../../../article/entities/article';

export interface HomeIndexView {
  setLoading(loading: boolean): void;
  setNews(news: News[]): void;
  setArticles(articles: Article[]): void;
}
