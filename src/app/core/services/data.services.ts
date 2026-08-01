import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Article, Category, Content, DashboardSummary, MenuItem, News, OrgMember, Pagination, Permission, Role, UserProfile, UserRow,
} from '../models/models';

/** Menu sidebar CMS (dinamis dari API, sesuai permission role). */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private api = inject(ApiService);
  getMenus(): Observable<MenuItem[]> { return this.api.get<MenuItem[]>('/me/menus'); }
}

/** Berita — publik & CMS. */
@Injectable({ providedIn: 'root' })
export class NewsService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<News>> { return this.api.get('/public/news', q); }
  publicDetail(slug: string): Observable<News> { return this.api.get(`/public/news/${slug}`); }
  featured(limit = 3): Observable<News[]> { return this.api.get('/public/news-featured', { limit }); }
  categories(): Observable<Category[]> { return this.api.get('/public/news-categories'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<News>> { return this.api.get('/news', q); }
  cmsGet(id: number): Observable<News> { return this.api.get(`/news/${id}`); }
  create(body: unknown): Observable<News> { return this.api.post('/news', body); }
  update(id: number, body: unknown): Observable<News> { return this.api.put(`/news/${id}`, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.patch(`/news/${id}/publish`, { isPublished }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/news/${id}`); }
}

/** Manajemen pengguna. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private api = inject(ApiService);
  list(q: Record<string, unknown>): Observable<Pagination<UserRow>> { return this.api.get('/users', q); }
  get(id: number): Observable<UserRow> { return this.api.get(`/users/${id}`); }
  create(body: unknown): Observable<UserRow> { return this.api.post('/users', body); }
  update(id: number, body: unknown): Observable<UserRow> { return this.api.put(`/users/${id}`, body); }
  setStatus(id: number, isActive: boolean): Observable<unknown> { return this.api.patch(`/users/${id}/status`, { isActive }); }
  resetPassword(id: number): Observable<{ temporaryPassword: string }> { return this.api.post(`/users/${id}/reset-password`); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/users/${id}`); }
}

/** Manajemen role & permission. */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private api = inject(ApiService);
  list(search = ''): Observable<Role[]> { return this.api.get('/roles', { search }); }
  get(id: number): Observable<Role> { return this.api.get(`/roles/${id}`); }
  create(body: unknown): Observable<Role> { return this.api.post('/roles', body); }
  update(id: number, body: unknown): Observable<Role> { return this.api.put(`/roles/${id}`, body); }
  setPermissions(id: number, permissionIDs: number[]): Observable<Role> { return this.api.put(`/roles/${id}/permissions`, { permissionIDs }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/roles/${id}`); }
  permissions(): Observable<Permission[]> { return this.api.get('/permissions'); }
}

/** Artikel — publik & CMS. */
@Injectable({ providedIn: 'root' })
export class ArticleService {
  private api = inject(ApiService);
  publicList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.get('/public/articles', q); }
  publicDetail(slug: string): Observable<Article> { return this.api.get(`/public/articles/${slug}`); }
  categories(): Observable<Category[]> { return this.api.get('/public/article-categories'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.get('/articles', q); }
  cmsGet(id: number): Observable<Article> { return this.api.get(`/articles/${id}`); }
  create(body: unknown): Observable<Article> { return this.api.post('/articles', body); }
  update(id: number, body: unknown): Observable<Article> { return this.api.put(`/articles/${id}`, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.patch(`/articles/${id}/publish`, { isPublished }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/articles/${id}`); }
}

/** Konten Landing Page & struktur organisasi. */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private api = inject(ApiService);
  // Publik
  profile(): Observable<Record<string, string>> { return this.api.get('/public/profile'); }
  orgStructure(): Observable<OrgMember[]> { return this.api.get('/public/organization-structure'); }
  // CMS
  list(): Observable<Content[]> { return this.api.get('/contents'); }
  update(key: string, body: { contentTitle: string; contentBody: string }): Observable<unknown> { return this.api.put(`/contents/${key}`, body); }
  cmsOrg(): Observable<OrgMember[]> { return this.api.get('/organization-structure'); }
  createOrg(body: unknown): Observable<unknown> { return this.api.post('/organization-structure', body); }
  updateOrg(id: number, body: unknown): Observable<unknown> { return this.api.put(`/organization-structure/${id}`, body); }
  removeOrg(id: number): Observable<unknown> { return this.api.delete(`/organization-structure/${id}`); }
}

/** Dashboard CMS. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);
  summary(): Observable<DashboardSummary> { return this.api.get('/dashboard/summary'); }
  recentNews(): Observable<{ newsID: number; newsTitle: string; isPublished: boolean }[]> { return this.api.get('/dashboard/recent-news'); }
}

export type { UserProfile };
