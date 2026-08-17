import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentApiService } from '../services/comment-api.service';
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

@Injectable({ providedIn: 'root' })
export class CommentRepository {
  private api = inject(CommentApiService);

  publicList(contentType: string, contentID: number): Observable<Comment[]> { return this.api.publicList(contentType, contentID); }
  create(body: CreateCommentRequest): Observable<Comment> { return this.api.create(body); }
  update(id: number, body: UpdateCommentRequest): Observable<Comment> { return this.api.update(id, body); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  react(id: number, reactionType: ReactionType): Observable<CommentReactions> { return this.api.react(id, reactionType); }

  gifSearch(q: string, tab: 'gifs' | 'stickers'): Observable<GifItem[]> { return this.api.gifSearch(q, tab); }
  gifCategories(): Observable<GifCategory[]> { return this.api.gifCategories(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Comment>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Comment> { return this.api.cmsGet(id); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.bulkDelete(ids); }
}
