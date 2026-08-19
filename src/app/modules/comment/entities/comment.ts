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

/** Minimal reference to a mentioned user — {@link CommentAuthor} shape reused
 *  from the compose side (autocomplete picks) and the API response side. */
export interface MentionRef {
  userID: number;
  fullName: string;
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
  mentions: CommentAuthor[];
  replies: Comment[];
}

export interface CreateCommentRequest {
  contentType: string;
  contentID: number;
  parentID?: number | null;
  commentText?: string;
  mediaURL?: string;
  mediaType?: MediaType;
  mentionedUserIDs?: number[];
}

export interface UpdateCommentRequest {
  commentText?: string;
  mediaURL?: string;
  mediaType?: MediaType;
  mentionedUserIDs?: number[];
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
