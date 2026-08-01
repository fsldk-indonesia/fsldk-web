import { Article } from '../../entities/article';

export interface ArticlePublicDetailView {
  setLoading(loading: boolean): void;
  setArticle(article: Article | null): void;
}
