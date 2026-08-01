import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Content } from '../entities/content';
import { OrgMember } from '../entities/org-member';

/** Panggilan HTTP mentah untuk konten Landing Page & struktur organisasi. */
@Injectable({ providedIn: 'root' })
export class ContentApiService {
  private api = inject(ApiService);

  // Publik
  profile(): Observable<Record<string, string>> { return this.api.get('/public/profile'); }
  publicOrgStructure(): Observable<OrgMember[]> { return this.api.get('/public/organization-structure'); }

  // CMS
  list(): Observable<Content[]> { return this.api.get('/contents'); }
  update(key: string, body: { contentTitle: string; contentBody: string }): Observable<unknown> { return this.api.put(`/contents/${key}`, body); }
  cmsOrgStructure(): Observable<OrgMember[]> { return this.api.get('/organization-structure'); }
  createOrg(body: unknown): Observable<unknown> { return this.api.post('/organization-structure', body); }
  updateOrg(id: number, body: unknown): Observable<unknown> { return this.api.put(`/organization-structure/${id}`, body); }
  removeOrg(id: number): Observable<unknown> { return this.api.delete(`/organization-structure/${id}`); }
}
