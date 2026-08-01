import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContentApiService } from '../services/content-api.service';
import { Content } from '../entities/content';
import { OrgMember } from '../entities/org-member';

@Injectable({ providedIn: 'root' })
export class ContentRepository {
  private api = inject(ContentApiService);

  profile(): Observable<Record<string, string>> { return this.api.profile(); }
  publicOrgStructure(): Observable<OrgMember[]> { return this.api.publicOrgStructure(); }

  list(): Observable<Content[]> { return this.api.list(); }
  update(key: string, body: { contentTitle: string; contentBody: string }): Observable<unknown> { return this.api.update(key, body); }
  cmsOrgStructure(): Observable<OrgMember[]> { return this.api.cmsOrgStructure(); }
  createOrg(body: unknown): Observable<unknown> { return this.api.createOrg(body); }
  updateOrg(id: number, body: unknown): Observable<unknown> { return this.api.updateOrg(id, body); }
  removeOrg(id: number): Observable<unknown> { return this.api.removeOrg(id); }
}
