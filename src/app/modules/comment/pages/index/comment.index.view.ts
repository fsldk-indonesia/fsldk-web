import { Comment } from '../../entities/comment';

export interface CommentIndexView {
  setComments(comments: Comment[], count: number): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
}
