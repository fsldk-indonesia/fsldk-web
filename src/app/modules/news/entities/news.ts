export interface News {
  newsID: number;
  newsTitle: string;
  newsSlug: string;
  newsExcerpt: string | null;
  newsContent: string;
  newsImage: string | null;
  categoryID: number;
  categoryName: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedDate: string | null;
  viewCount: number;
  authorName: string;
  createdDate: string;
}
