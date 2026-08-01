export interface Content {
  contentID: number;
  contentKey: string;
  contentTitle: string | null;
  contentBody: string | null;
  contentType: string;
  sortOrder: number | null;
  isActive: boolean;
}
