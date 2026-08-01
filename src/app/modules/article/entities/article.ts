export interface Article {
  articleID: number;
  articleTitle: string;
  articleSlug: string;
  articleExcerpt: string | null;
  articleContent: string;
  articleImage: string | null;
  categoryID: number;
  categoryName: string;
  isPublished: boolean;
  publishedDate: string | null;
  authorName: string;
  createdDate: string;
}
