import { ReactionType } from './entities/comment';

/** Keep in sync with fsldk-api modules/comment/comment_model.ReactionTypes. */
export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like', emoji: '👍', label: 'Suka' },
  { type: 'dislike', emoji: '👎', label: 'Tidak Suka' },
  { type: 'love', emoji: '❤️', label: 'Cinta' },
  { type: 'heart_eyes', emoji: '😍', label: 'Keren' },
  { type: 'laughing', emoji: '😂', label: 'Lucu' },
  { type: 'rage', emoji: '😡', label: 'Marah' },
  { type: 'slight_smile', emoji: '🙂', label: 'Senyum' },
];

/**
 * Keep in sync with fsldk-api modules/comment/comment_model.ValidContentTypes
 * — add an entry here whenever the backend whitelist grows.
 */
export const CONTENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Semua Tipe Konten' },
  { value: 'article', label: 'Artikel' },
  { value: 'news', label: 'Berita' },
  { value: 'event', label: 'Event' },
];
