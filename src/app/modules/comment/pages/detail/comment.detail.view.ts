import { Comment } from '../../entities/comment';

export interface CommentDetailView {
  setLoading(loading: boolean): void;
  setComment(comment: Comment | null): void;
}
