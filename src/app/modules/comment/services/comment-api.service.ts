import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import {
  Comment,
  CommentReactions,
  CreateCommentRequest,
  GifCategory,
  GifItem,
  ReactionType,
  UpdateCommentRequest,
} from '../entities/comment';

/** Panggilan HTTP mentah untuk komentar — publik, milik-sendiri, & admin. */
@Injectable({ providedIn: 'root' })
export class CommentApiService {
  private api = inject(ApiService);

  publicList(contentType: string, contentID: number): Observable<Comment[]> {
    return this.api.get('/public/comments', { contentType, contentID });
  }

  create(body: CreateCommentRequest): Observable<Comment> { return this.api.post('/comments', body); }
  update(id: number, body: UpdateCommentRequest): Observable<Comment> { return this.api.put(`/comments/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/comments/${id}`); }
  react(id: number, reactionType: ReactionType): Observable<CommentReactions> { return this.api.post(`/comments/${id}/react`, { reactionType }); }

  gifSearch(q: string, tab: 'gifs' | 'stickers'): Observable<GifItem[]> { return this.api.get('/comments/gif-search', { q, tab }); }
  gifCategories(): Observable<GifCategory[]> { return this.api.get('/comments/gif-categories'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Comment>> { return this.api.get('/comments', q); }
  cmsGet(id: number): Observable<Comment> { return this.api.get(`/comments/${id}`); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.post('/comments/bulk-delete', { ids }); }
}
