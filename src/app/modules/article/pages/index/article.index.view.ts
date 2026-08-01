import { Article } from '../../entities/article';

export interface ArticleIndexView {
  setArticles(articles: Article[]): void;
  onPublishToggleSuccess(): void;
  onRemoveSuccess(): void;
}
