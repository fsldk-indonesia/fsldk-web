import { Article } from '../../entities/article';
import { ArticleCategory } from '../../entities/article-category';

export interface ArticlePublicIndexView {
  setLoading(loading: boolean): void;
  setArticles(articles: Article[]): void;
  setCategories(categories: ArticleCategory[]): void;
}
