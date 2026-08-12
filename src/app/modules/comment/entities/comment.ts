/** Keep in sync with fsldk-api modules/comment/comment_model.ReactionTypes. */
export type ReactionType = 'like' | 'dislike' | 'love' | 'heart_eyes' | 'laughing' | 'rage' | 'slight_smile';

export type MediaType = 'image' | 'gif' | 'sticker';

export interface CommentAuthor {
  userID: number;
  name: string;
  photo?: string;
}

export interface CommentReactions {
  counts: Partial<Record<ReactionType, number>>;
  userTypes: ReactionType[];
}

export interface Comment {
  commentID: number;
  contentType: string;
  contentID: number;
  commentText: string;
  mediaURL?: string;
  mediaType?: MediaType;
  parentID: number | null;
  isOwner: boolean;
  createdDate: string;
  author: CommentAuthor;
  reactions: CommentReactions;
  replies: Comment[];
}

export interface CreateCommentRequest {
  contentType: string;
  contentID: number;
  parentID?: number | null;
  commentText?: string;
  mediaURL?: string;
  mediaType?: MediaType;
}

export interface UpdateCommentRequest {
  commentText?: string;
  mediaURL?: string;
  mediaType?: MediaType;
}

export interface GifItem {
  id: string;
  preview: string;
  url: string;
  title: string;
}

export interface GifCategory {
  name: string;
  slug: string;
}
